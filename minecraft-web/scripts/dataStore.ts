export class DataStore {
  data: any;
  constructor() {
    this.data = {};
  }

  clear = () => {
    this.data = {};
  }

  contains = (chunkX: any, chunkZ: any, blockX: any, blockY: any, blockZ: any) => {
    const key = this.#getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    return this.data[key] !== undefined;
  }

  get = (chunkX: any, chunkZ: any, blockX: any, blockY: any, blockZ: any) => {
    const key = this.#getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    const blockId = this.data[key];
    // console.log(`getting value ${blockId} at key ${key}`);
    return blockId;
  }

  set = (chunkX: any, chunkZ: any, blockX: any, blockY: any, blockZ: any, blockId: any) => {
    const key = this.#getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    this.data[key] = blockId;
    // console.log(`setting key ${key} to ${blockId}`)
  }

  #getKey = (chunkX: any, chunkZ: any, blockX: any, blockY: any, blockZ: any): string => {
    return `${chunkX},${chunkZ},${blockX},${blockY},${blockZ}`;
  }
}