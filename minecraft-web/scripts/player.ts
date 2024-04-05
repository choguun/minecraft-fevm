import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world';
import { blocks } from './blocks';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { filecoinCalibration } from 'viem/chains';
import { readContract } from '@wagmi/core';
import { createWalletClient, custom, parseEther, publicActions } from 'viem';

const CENTER_SCREEN = new THREE.Vector2();

export class Player extends THREE.Vector3 {
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  cameraHelper = new THREE.CameraHelper(this.camera);
  controls = new PointerLockControls(this.camera, document.body);

  height = 1.75;
  radius = 0.5;
  maxSpeed = 5;
  jumpSpeed = 10;
  heart = 5;
  onGround = false;
  velocity = new THREE.Vector3();
  #worldVelocity = new THREE.Vector3();
  input = new THREE.Vector3();

  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 3);
  selectedCoords: any = null;
  activeBlockId = blocks.empty.id;
  
  tool = {
    // Group that will contain the tool mesh
    container: new THREE.Group(),
    // Whether or not the tool is currently animating
    animate: false,
    // The time the animation was started
    animationStart: 0,
    // The rotation speed of the tool
    animationSpeed: 0.025,
    // Reference to the current animation
    animation: null
  }
  selectionHelper: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap>;
  boundsHelper: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap>;
  world: World;
  repeat: any;

  constructor(scene: THREE.Scene, world: World) {
    super();
    this.world = world;
    this.position.set(32, 64, 32);
    this.cameraHelper.visible = false;
    scene.add(this.camera);
    scene.add(this.cameraHelper);

    // Hide/show instructions based on pointer controls locking/unlocking
    this.controls.addEventListener('lock', function () {
      // console.log('locked');
      document.getElementById('overlay').style.visibility = 'hidden';
      document.getElementById('inventory').style.visibility = 'hidden';
    });

    this.controls.addEventListener('unlock', function () {
      // document.getElementById('overlay').style.visibility = 'visible';
      document.getElementById('inventory').style.visibility = 'visible';
    });


    // The tool is parented to the camera
    this.camera.add(this.tool.container);

    // Set raycaster to use layer 0 so it doesn't interact with water mesh on layer 1
    this.raycaster.layers.set(0);
    this.camera.layers.enable(1);

    // Wireframe mesh visualizing the player's bounding cylinder
    this.boundsHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({ wireframe: true })
    );
    this.boundsHelper.visible = false;
    scene.add(this.boundsHelper);

    // Helper used to highlight the currently active block
    const selectionMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
      color: 0xffffaa
    });
    const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
    scene.add(this.selectionHelper);

    // Add event listeners for keyboard/mouse events
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('mousedown', this.onMouseDown.bind(this));
  }

  /*
* Configure wagmi
*/
// 1. Get a project ID at https://cloud.walletconnect.com
 projectId = import.meta.env.VITE_PROJECT_ID;

// 2. Create wagmiConfig
 metadata = {
  name: 'Web3Modal',
  description: 'Web3Modal Example',
  url: 'https://web3modal.com', // origin must match your domain & subdomain.
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

chains = [filecoinCalibration] as const
  wagmiConfig = defaultWagmiConfig({
  chains: this.chains,
  projectId: this.projectId,
  metadata: this.metadata,
  // ...wagmiOptions // Optional - Override createConfig parameters
});

// 3. Create modal
modal = createWeb3Modal({
  wagmiConfig: this.wagmiConfig,
  projectId: this.projectId,
  enableAnalytics: false, // Optional - defaults to your Cloud configuration
  enableOnramp: false // Optional - false as default
});

/*
* Configure wagmi
*/


  setPosition = (x: number, y: number, z: number) => {
    this.position.set(x, y, z);
  }
  
  /**
   * Updates the state of the player
   * @param {World} world 
   */
  update = (world: World) => {
    this.updateBoundsHelper();
    this.updateRaycaster(world);

    if (this.tool.animate) {
      this.updateToolAnimation();
    }
  }

  /**
   * Updates the raycaster used for block selection
   * @param {World} world 
   */
  updateRaycaster = (world: THREE.Object3D<THREE.Object3DEventMap>) => {
    this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);
    const intersections = this.raycaster.intersectObject(world, true);
  
    if (intersections.length > 0) {
      const intersection = intersections[0];

      // Get the chunk associated with the selected block
      const chunk = intersection.object.parent;

      // Get the transformation matrix for the selected block
      const blockMatrix = new THREE.Matrix4();
      intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);

      // Set the selected coordinates to the origin of the chunk,
      // then apply the transformation matrix of the block to get
      // the block coordinates
      this.selectedCoords = chunk.position.clone();
      this.selectedCoords.applyMatrix4(blockMatrix);

      if (this.activeBlockId !== blocks.empty.id) {
        // If we are adding a block, move it 1 block over in the direction
        // of where the ray intersected the cube
        this.selectedCoords.add(intersection.normal);
      }

      this.selectionHelper.position.copy(this.selectedCoords);
      this.selectionHelper.visible = true;
    } else {
      this.selectedCoords = null;
      this.selectionHelper.visible = false;
    }
  }

  /**
   * Updates the state of the player based on the current user inputs
   * @param {Number} dt 
   */
  applyInputs = (dt: number) => {
    if (this.controls.isLocked === true) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);
      this.position.y += this.velocity.y * dt;

      if (this.position.y < 0) {
        this.position.y = 0;
        this.velocity.y = 0;
      }
    }
    
    document.getElementById('info-player-position')!.innerHTML = this.toString();
  }

  /**
   * Updates the position of the player's bounding cylinder helper
   */
  updateBoundsHelper = () => {
    this.boundsHelper.position.copy(this.camera.position);
    this.boundsHelper.position.y -= this.height / 2;
  }

  /**
   * Set the tool object the player is holding
   * @param {THREE.Mesh} tool 
   */
  setTool = (tool: THREE.Object3D<THREE.Object3DEventMap>) => {
    this.tool.container.clear();
    this.tool.container.add(tool);
    this.tool.container.receiveShadow = true;
    this.tool.container.castShadow = true;
  
    this.tool.container.position.set(0.6, -0.3, -0.5);
    this.tool.container.scale.set(0.5, 0.5, 0.5);
    this.tool.container.rotation.z = Math.PI / 2;
    this.tool.container.rotation.y = Math.PI + 0.2;
  }

  /**
   * Animates the tool rotation
   */
  updateToolAnimation = () => {
    if (this.tool.container.children.length > 0) {
      const t = this.tool.animationSpeed * (performance.now() - this.tool.animationStart);
      this.tool.container.children[0].rotation.y = 0.5 * Math.sin(t);
    }
  }

  /**
   * Returns the current world position of the player
   * @returns {THREE.Vector3}
   */
  get position() {
    return this.camera.position;
  }

  /**
   * Returns the velocity of the player in world coordinates
   * @returns {THREE.Vector3}
   */
  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
    return this.#worldVelocity;
  }

  /**
   * Applies a change in velocity 'dv' that is specified in the world frame
   * @param {THREE.Vector3} dv 
   */
  applyWorldDeltaVelocity = (dv: any) => {
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  /**
   * Event handler for 'keyup' event
   * @param {KeyboardEvent} event 
   */
  onKeyUp = (event: { code: any; }) => {
    switch (event.code) {
      case 'KeyW':
        this.input.z = 0;
        break;
      case 'KeyA':
        this.input.x = 0;
        break;
      case 'KeyS':
        this.input.z = 0;
        break;
      case 'KeyD':
        this.input.x = 0;
        break;
    }
  }

  client = createWalletClient({
    chain: filecoinCalibration,
    transport
  : custom(window.ethereum!)
  }).extend(publicActions);

  /**
   * Event handler for 'keyup' event
   * @param {KeyboardEvent} event 
   */
  onKeyDown = async (event: { code: any; key: any; }) => {
    const modalState = this.modal.getState();

    if (!this.controls.isLocked && modalState.selectedNetworkId !== undefined && typeof modalState.selectedNetworkId !== undefined) {
      this.controls.lock();
    } else if(modalState.selectedNetworkId === undefined || typeof modalState.selectedNetworkId === undefined) {
      alert('Please connect wallet.');
    }

    switch (event.code) {
      case 'Digit0':
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
      // case 'Digit7':
      // case 'Digit8':
        // Update the selected toolbar icon
        document.getElementById(`toolbar-${this.activeBlockId}`)?.classList.remove('selected');
        document.getElementById(`toolbar-${event.key}`)?.classList.add('selected');

        this.activeBlockId = Number(event.key);

        // Update the pickaxe visibility
        this.tool.container.visible = (this.activeBlockId === 0);

        break;
      case 'KeyW':
        this.input.z = this.maxSpeed;
        break;
      case 'KeyA':
        this.input.x = -this.maxSpeed;
        break;
      case 'KeyS':
        this.input.z = -this.maxSpeed;
        break;
      case 'KeyD':
        this.input.x = this.maxSpeed;
        break;
      case 'KeyR':
        if (this.repeat) break;
        this.position.y = 32;
        this.velocity.set(0, 0, 0);
        break;
      case 'Space':
        if (this.onGround) {
          this.velocity.y += this.jumpSpeed;
        }
        break;
      case 'KeyI':
        if(this.controls.isLocked) {
          this.controls.unlock();
        } else {
          this.controls.lock();
        }
        break;
    }
  }

  /**
   * Event handler for 'mousedown'' event
   * @param {MouseEvent} event 
   */
  onMouseDown = () => {
    if (this.controls.isLocked) {
      // Is a block selected?
      if (this.selectedCoords) {
        // If active block is an empty block, then we are in delete mode
        if (this.activeBlockId === blocks.empty.id) {
          this.world.removeBlock(
            this.selectedCoords.x,
            this.selectedCoords.y,
            this.selectedCoords.z
          );
        } else {
          this.world.addBlock(
            this.selectedCoords.x,
            this.selectedCoords.y,
            this.selectedCoords.z,
            this.activeBlockId
          );
        }

        // If the tool isn't currently animating, trigger the animation
        if (!this.tool.animate) {
          this.tool.animate = true;
          this.tool.animationStart = performance.now();

          // Clear the existing timeout so it doesn't cancel our new animation
          clearTimeout(this.tool.animation);

          // Stop the animation after 1.5 cycles
          this.tool.animation = setTimeout(() => {
            this.tool.animate = false;
          }, 3 * Math.PI / this.tool.animationSpeed);
        }
      }
    }
  }

  /**
   * Returns player position in a readable string form
   * @returns {string}
   */
  toString = () => {
    let str = '';
    // str += `X: ${this.position.x.toFixed(3)} `;
    // str += `Y: ${this.position.y.toFixed(3)} `;
    // str += `Z: ${this.position.z.toFixed(3)}`;
    return str;
  }
}