import * as THREE from 'three';
import Alpine from 'alpinejs';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { World } from './world';
import { Player } from './player';
import { Physics } from './physics';
import { setupUI } from './ui';
import { ModelLoader } from './modelLoader';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { filecoinCalibration } from 'viem/chains';
import { readContract } from '@wagmi/core';
import { createWalletClient, custom, parseEther, publicActions } from 'viem';
import { config } from './config';
import { LandAbi } from '../abi/LandAbi';
import { WorldAbi } from '../abi/WorldAbi';
import { TokenAbi } from '../abi/TokenAbi';

declare global {
  interface Window {
    Alpine: any;
    modelOpen: any;
    NFTBalance: () => Promise<any>;
    fetchTokenBalance: () => Promise<any>;
    mintLand: () => Promise<void>;
    openWallet: () => void;
    checkConnectedWallet: () => any;
    fetchLandId: () => Promise<any>;
  }
}

// Create an Intl.NumberFormat formatter with desired options
const tokenFormatter = new Intl.NumberFormat('en-US', {
  style: 'decimal', // Format as a number
  minimumFractionDigits: 2, // Minimum number of decimal places (always show two)
  maximumFractionDigits: 2, // Maximum number of decimal places (limit to two)
  useGrouping: true, // Use grouping separators (thousands separator)
});

/*
* Configure wagmi
*/
// 1. Get a project ID at https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_PROJECT_ID;
const LandAddress = import.meta.env.VITE_LAND_CONTRACT_ADDRESS;
const WorldAddress = import.meta.env.VITE_WORLD_CONTRACT_ADDRESS;
const TokenAddress = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;

// 2. Create wagmiConfig
const metadata = {
  name: 'Web3Modal',
  description: 'Web3Modal Example',
  url: 'https://web3modal.com', // origin must match your domain & subdomain.
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [filecoinCalibration] as const
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  // ...wagmiOptions // Optional - Override createConfig parameters
});

// 3. Create modal
const modal =  createWeb3Modal({
  wagmiConfig: wagmiConfig,
  projectId,
  enableAnalytics: false, // Optional - defaults to your Cloud configuration
  enableOnramp: false // Optional - false as default
});

/*
* Configure wagmi
*/

/*
* Alpine.js setup
*/
window.Alpine = Alpine;

const client = createWalletClient({
  chain: filecoinCalibration,
  transport
: custom(window.ethereum!)
}).extend(publicActions);

window.modelOpen = false;

window.NFTBalance = async (): Promise<any> => {
  try {
    const [address] = await client.getAddresses();
    const result = await readContract(config, {
        abi: LandAbi,
        address: LandAddress,
        functionName: 'balanceOf',
        args: [address]
    });
    return result > 0 ? false : true;
  } catch (error) {
    console.error(error);
  }
}

window.fetchTokenBalance = async (): Promise<any> => {
  document.dispatchEvent(new CustomEvent('loadModal:open'));
  try {
    const [address] = await client.getAddresses();
    const result = await readContract(config, {
        abi: TokenAbi,
        address: TokenAddress,
        functionName: 'balanceOf',
        args: [address]
    });

    // Format the number
    const formattedNumber = tokenFormatter.format(result);

    return formattedNumber;
  } catch (error) {
    console.error(error);
  }
}

window.fetchLandId = async (): Promise<any> => {
  try {
    const [address] = await client.getAddresses();
    const result = await readContract(config, {
        abi: LandAbi,
        address: LandAddress,
        functionName: 'tokenOfOwnerByIndex',
        args: [address, BigInt(0)]
    });
    return result;
  } catch (error) {
    console.error(error);
  }

}

window.mintLand = async () => {
  try {
    const [address] = await client.getAddresses();
    const { request } = await client.simulateContract({
      account: address,
      address: LandAddress,
      abi: LandAbi,
      functionName: 'mint',
      args: ["https://gateway.lighthouse.storage/ipfs/QmRBg7KpJ6eK6d7wMsSL9jDWnrkgt86A6Fq7ZotVHNUhUf"],
      value: parseEther('0.01')
    });
    const txn = await client.writeContract(request);

    const result = await client.waitForTransactionReceipt({ hash: txn })
    if (result.status === "success") {
        window.modelOpen = false;
        alert('Land minted successfully.');
        window.location.reload();
    }
  } catch (error) {
    console.error(error);
    alert(error);
  }
}

window.checkConnectedWallet = async () => {
  const modalState = modal.getState();
  let connected = false;
  if(modalState.selectedNetworkId === undefined || typeof modalState.selectedNetworkId === undefined) {
    connected = true;
  }

  return connected;
}

Alpine.start();
/*
* Alpine.js setup
*/


/*
* Three.js setup
*/
// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight-50);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Camera setup
const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
orbitCamera.position.set(-32, 32, 32);
orbitCamera.layers.enable(1);

const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(32, 0, 32);
controls.update();

// Scene setup
const scene = new THREE.Scene();
const physics = new Physics(scene);
const world = new World();
const player = new Player(scene, world);
scene.add(world);
world.addPlayer(player);

new ModelLoader((models: any) => {
  player.setTool(models.pickaxe);
});

const sun = new THREE.DirectionalLight();
sun.intensity = 1.5;
sun.position.set(50, 50, 50);
sun.castShadow = true;

// Set the size of the sun's shadow box
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 200;
sun.shadow.bias = -0.0001;
sun.shadow.mapSize = new THREE.Vector2(2048, 2048);
scene.add(sun);
scene.add(sun.target);

const ambient = new THREE.AmbientLight();
ambient.intensity = 0.2;
scene.add(ambient);

scene.fog = new THREE.Fog(0x80a0e0, 50, 100);

// Events
window.addEventListener('resize', () => {
  // Resize camera aspect ratio and renderer size to the new window size
  orbitCamera.aspect = window.innerWidth / window.innerHeight;
  orbitCamera.updateProjectionMatrix();
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// UI Setup
const stats = new Stats();
// document.body.appendChild(stats.dom);

// Render loop
let previousTime = performance.now();
const animate = () => {
  requestAnimationFrame(animate);

  const currentTime = performance.now();
  const dt = (currentTime - previousTime) / 1000;

  // Position the sun relative to the player. Need to adjust both the
  // position and target of the sun to keep the same sun angle
  sun.position.copy(player.camera.position);
  sun.position.sub(new THREE.Vector3(-50, -50, -50));
  sun.target.position.copy(player.camera.position);

  // Only update physics when player controls are locked
  if (player.controls.isLocked) {
    physics.update(dt, player, world);
    player.update(world);
  }

  world.update(player.position);
  renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera);
  stats.update();

  previousTime = currentTime;
}

setupUI(world, player, physics, scene);
animate();
/*
* Three.js setup
*/

/*
* function
*/