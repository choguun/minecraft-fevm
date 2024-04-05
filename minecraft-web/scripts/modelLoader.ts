import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ModelLoader {
  loader = new GLTFLoader();

  models = {
    pickaxe: undefined
  };

  constructor(onLoad: any) {
    this.loader.load('./models/pickaxe.glb', (model: any) => {
      const mesh = model.scene;
      this.models.pickaxe = mesh;
      onLoad(this.models);
    });
  }
}