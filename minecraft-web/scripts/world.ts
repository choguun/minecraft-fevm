import * as THREE from 'three';
import { WorldChunk } from './worldChunk';
import { Player } from './player';
import { DataStore } from './dataStore';
import lighthouse from '@lighthouse-web3/sdk';
import land from '../asset/land.json';
import { createWalletClient, custom, parseEther, publicActions } from 'viem';
import { filecoinCalibration } from 'viem/chains';
import { readContract, getAccount, watchAccount } from '@wagmi/core';
import { config } from './config';
import axios from 'axios';
import { LandAbi } from '../abi/LandAbi';
import { WorldAbi } from '../abi/WorldAbi';
import { TokenAbi } from '../abi/TokenAbi';

export class World extends THREE.Group {
  /**
   * The number of chunks to render around the player.
   * When this is set to 0, the chunk the player is on
   * is the only one that is rendered. If it is set to 1,
   * the adjacent chunks are rendered; if set to 2, the
   * chunks adjacent to those are rendered, and so on.
   */
  drawDistance = 3;

  /**
   * If true, chunks are loaded asynchronously.
   */
  asyncLoading = true;

  /**
   * Width and height of a single chunk of terrain
   */
  chunkSize = {
    width: 32,
    height: 24
  }

  /**
   * Parameters for terrain generation
   */
  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.2,
      offset: 0.25,
      waterHeight: 5
    },
    trees: {
      frequency: 0.04,
      trunkHeight: {
        min: 6,
        max: 8
      },
      canopy: {
        size: {
          min: 2,
          max: 4,
        },
        density: 0.5
      }
    },
    clouds: {
      density: 0.3,
      scale: 30
    }
  }
  
  /**
   * Used for persisting changes to the world
   */
  dataStore = new DataStore();
  seed: number;

  constructor(seed = 0) {
    super();
    this.seed = seed;

    document.addEventListener('keydown', (ev) => {
      switch (ev.code) {
        case 'F1':
          this.save();
          break;
        case 'F2':
          this.load();
          break;
      }
    });
  }

  player: Player | null = null;
  
  LandAddress = import.meta.env.VITE_LAND_CONTRACT_ADDRESS;
  WorldAddress = import.meta.env.VITE_WORLD_CONTRACT_ADDRESS;
  TokenAddress = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;

  client = createWalletClient({
    chain: filecoinCalibration,
    transport
  : custom(window.ethereum!)
  }).extend(publicActions);

  addPlayer = (_player: Player) => {
    this.player = _player;
  }

  /**
   * Clears existing world data and regenerates everything
   * @param {Player} player 
   */
  regenerate = (playerPosition = new THREE.Vector3()) => {
    this.player?.setPosition(32, 64, 32);
    this.children.forEach((obj) => {
      obj.disposeChildren();
    });
    this.clear();
    this.update(playerPosition);
  }

  /**
   * Updates the visible portions of the world based on the
   * current player position
   * @param {THREE.Vector3} playerPosition
   */
  update = (playerPosition: THREE.Vector3) => {
    const visibleChunks = this.getVisibleChunks(playerPosition);
    const chunksToAdd = this.getChunksToAdd(visibleChunks);
    this.removeUnusedChunks(visibleChunks);
    
    for (const chunk of chunksToAdd) {
      this.generateChunk(chunk.x, chunk.z);
    }
  }

  /**
   * Returns an array containing the coordinates of the chunks that 
   * are current visible to the player
   * @param {THREE.Vector3} playerPosition 
   * @returns {{ x: number, z: number}[]}
   */
  getVisibleChunks = (playerPosition: { x: any; z: any; }) => {
    // Get the coordinates of the chunk the player is currently in
    const coords = this.worldToChunkCoords(playerPosition.x, 0, playerPosition.z);
    
    const visibleChunks = [];
    for (let x = coords.chunk.x - this.drawDistance; x <= coords.chunk.x + this.drawDistance; x++) {
      for (let z = coords.chunk.z - this.drawDistance; z <= coords.chunk.z + this.drawDistance; z++) {
        visibleChunks.push({ x, z });
      }
    }

    return visibleChunks;
  }

  /**
   * Returns an array containing the coordinates of the chunks that 
   * are not yet loaded and need to be added to the scene
   * @param {{ x: number, z: number}[]} visibleChunks 
   * @returns {{ x: number, z: number}[]}
   */
  getChunksToAdd = (visibleChunks: any[]) => {
    // Filter down visible chunks, removing ones that already exist
    return visibleChunks.filter((chunkToAdd) => {
      const chunkExists = this.children
        .map((obj) => obj.userData)
        .find(({ x, z }) => {
          return chunkToAdd.x === x && chunkToAdd.z === z;
        });

      return !chunkExists;
    })
  }

  /**
   * Removes current loaded chunks that are no longer visible to the player
   * @param {{ x: number, z: number}[]} visibleChunks 
   */
  removeUnusedChunks = (visibleChunks: any[]) => {
    // Filter current chunks, getting ones that don't exist in visible chunks
    const chunksToRemove = this.children.filter((obj) => {
      const { x, z } = obj.userData;
      const chunkExists = visibleChunks.find((visibleChunk) => {
          return visibleChunk.x === x && visibleChunk.z === z;
        });

      return !chunkExists;
    })

    for (const chunk of chunksToRemove) {
      chunk.disposeChildren();
      this.remove(chunk);
      //console.log(`Removed chunk at X: ${chunk.userData.x} Z: ${chunk.userData.z}`);
    }
  }

  /**
   * Generates the chunk at the (x,z) coordinates
   * @param {number} x 
   * @param {number} z
   */
  generateChunk = (x: number, z: number) => {
    const chunk = new WorldChunk(this.chunkSize, this.params, this.dataStore);
    chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
    chunk.userData = { x, z };

    if (this.asyncLoading) {
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
    } else {
      chunk.generate();
    }

    this.add(chunk);
    //console.log(`Creating chunk at X: ${x} Z: ${z}`);
  }

  /**
   * Gets the block data at (x, y, z)
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @returns {{id: number, instanceId: number} | null}
   */
  getBlock = (x: number, y: number, z: number) => {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk && chunk.loaded) {
      return chunk.getBlock(coords.block.x, y, coords.block.z);
    } else {
      return null;
    }
  }

  /**
   * Adds a new block at (x,y,z)
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @param {number} blockId 
   */
  addBlock = (x: number, y: number, z: number, blockId: number) => {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    
    if (chunk) {
      chunk.addBlock(coords.block.x, coords.block.y, coords.block.z, blockId);

      // Hide any blocks that may be totally obscured
      this.hideBlockIfNeeded(x - 1, y, z);
      this.hideBlockIfNeeded(x + 1, y, z);
      this.hideBlockIfNeeded(x, y - 1, z);
      this.hideBlockIfNeeded(x, y + 1, z);
      this.hideBlockIfNeeded(x, y, z - 1);
      this.hideBlockIfNeeded(x, y, z + 1);
    }
  }
  
  /**
   * Removes the block at (x, y, z) and sets it to empty
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  removeBlock = (x: number, y: number, z: number) => {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
  
    // Don't allow removing the first layer of blocks
    if (coords.block.y === 0) return;

    if (chunk) {
      chunk.removeBlock(coords.block.x, coords.block.y, coords.block.z);

      // Reveal any adjacent blocks that may have been exposed after the block at (x,y,z) was removed
      this.revealBlock(x - 1, y, z);
      this.revealBlock(x + 1, y, z);
      this.revealBlock(x, y - 1, z);
      this.revealBlock(x, y + 1, z);
      this.revealBlock(x, y, z - 1);
      this.revealBlock(x, y, z + 1);
    }
  }

  /**
   * Reveals the block at (x,y,z) by adding a new mesh instance
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  revealBlock = (x: number, y: number, z: number) => {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      chunk.addBlockInstance(coords.block.x, coords.block.y, coords.block.z);
    }
  }

  /**
   * Hides the block at (x,y,z) by removing the  new mesh instance
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  hideBlockIfNeeded = (x: number, y: number, z: number) => {
    const coords = this.worldToChunkCoords(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);
    
    // Remove the block instance if it is totally obscured
    if (chunk && chunk.isBlockObscured(coords.block.x, coords.block.y, coords.block.z)) {
      chunk.deleteBlockInstance(coords.block.x, coords.block.y, coords.block.z);
    }
  }

  /**
   * Returns the chunk and world coordinates of the block at (x,y,z)\
   *  - `chunk` is the coordinates of the chunk containing the block
   *  - `block` is the world coordinates of the block
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @returns {{
   *  chunk: { x: number, z: number},
   *  block: { x: number, y: number, z: number}
   * }}
   */
  worldToChunkCoords = (x: number, y: number, z: number) => {
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width),
    };

    const blockCoords = {
      x: x - this.chunkSize.width * chunkCoords.x,
      y,
      z: z - this.chunkSize.width * chunkCoords.z
    }

    return {
      chunk: chunkCoords,
      block: blockCoords
    };
  }
 
  /**
   * Returns the WorldChunk object the contains the specified coordinates
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {WorldChunk | null}
   */
  getChunk = (chunkX: number, chunkZ: number) => {
    return this.children.find((chunk) => {
      return chunk.userData.x === chunkX && 
             chunk.userData.z === chunkZ;
    });
  }

  /**
   * Saves the world data to local storage
   */
  save = async () => {
    document.querySelector("#body")?.dispatchEvent(new CustomEvent('notify'));
    try {
      const [address] = await this.client.getAddresses();
      const apiKey = import.meta.env.VITE_LIGHTHOUSE_APIKEY;

      const result1 = await readContract(config, {
        abi: LandAbi,
        address: this.LandAddress,
        functionName: 'tokenOfOwnerByIndex',
        args: [address, BigInt(0)]
      });

      land.minecraft_params = this.params;
      land.minecraft_data = this.dataStore.data;
      const jsonString = JSON.stringify(land);
      const response = await lighthouse.uploadText(jsonString, apiKey, result1.toString());

      const { request } = await this.client.simulateContract({
        account: address,
        address: this.WorldAddress,
        abi: WorldAbi,
        functionName: 'saveUserData',
        args: [result1, `https://gateway.lighthouse.storage/ipfs/${response.data.Hash}`]
      });
      const txn = await this.client.writeContract(request);
  
      const result2 = await this.client.waitForTransactionReceipt({ hash: txn })
      if (result2.status === "success") {
          alert('Game saved successfully.');
      }

      // localStorage.setItem('minecraft_params', JSON.stringify(this.params));
      // localStorage.setItem('minecraft_data', JSON.stringify(this.dataStore.data));
      document.getElementById('status').innerText = "Game Saved";
      setTimeout(() => document.getElementById('status').innerText = "", 3000);
    } catch (error) {
      console.error(error);
      alert(error);
    } finally {
      document.querySelector("#body")?.dispatchEvent(new CustomEvent('notify'));
    }
  }

  /**
   * Loads the game from disk
   */
  load = async () => {
    document.querySelector("#body")?.dispatchEvent(new CustomEvent('notify'));
    try {
      const [address] = await this.client.getAddresses();

      const result1 = await readContract(config, {
        abi: LandAbi,
        address: this.LandAddress,
        functionName: 'tokenOfOwnerByIndex',
        args: [address, BigInt(0)]
      });

      const result2 = await readContract(config, {
        abi: LandAbi,
        address: this.LandAddress,
        functionName: 'tokenURI',
        args: [result1]
      });

      const result3 = await axios.get(result2);
      const jsonData = result3.data;

      this.params = jsonData.minecraft_params;
      this.dataStore.data = jsonData.minecraft_data;
      document.getElementById('status').innerText = "Game Loaded";
      setTimeout(() => document.getElementById('status').innerText = "", 3000);
      this.regenerate();
    } catch(error) {
      console.error(error);
      alert(error);
    } finally {
      document.querySelector("#body")?.dispatchEvent(new CustomEvent('notify'));
    }
  }
}