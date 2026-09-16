import * as THREE from 'three';

export interface StreamableChunk {
  coordKey: string;
  cx: number;
  cz: number;
  objects: THREE.Object3D[];
  active: boolean;
}

export class WorldStreamer {
  public chunkSize: number = 160;
  public activeRadiusChunks: number = 2; // Keeps 5x5 chunk grid active (~800m range)
  private chunks: Map<string, StreamableChunk> = new Map();
  private lastChunkX: number = Infinity;
  private lastChunkZ: number = Infinity;

  constructor(chunkSize: number = 160) {
    this.chunkSize = chunkSize;
  }

  public getChunkCoord(worldVal: number): number {
    return Math.floor(worldVal / this.chunkSize);
  }

  private getKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  public registerObject(obj: THREE.Object3D): void {
    // Do not chunk-cull global instanced meshes or landmarks marked persistent
    if (obj instanceof THREE.InstancedMesh || obj.userData.persistent) {
      return;
    }

    const cx = this.getChunkCoord(obj.position.x);
    const cz = this.getChunkCoord(obj.position.z);
    const key = this.getKey(cx, cz);

    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = {
        coordKey: key,
        cx,
        cz,
        objects: [],
        active: true
      };
      this.chunks.set(key, chunk);
    }
    chunk.objects.push(obj);
  }

  public update(playerPosition: THREE.Vector3): void {
    const currentChunkX = this.getChunkCoord(playerPosition.x);
    const currentChunkZ = this.getChunkCoord(playerPosition.z);

    // Only update streaming when player enters a different chunk
    if (currentChunkX === this.lastChunkX && currentChunkZ === this.lastChunkZ) {
      return;
    }

    this.lastChunkX = currentChunkX;
    this.lastChunkZ = currentChunkZ;

    for (const [_, chunk] of this.chunks) {
      const distChunks = Math.max(
        Math.abs(chunk.cx - currentChunkX),
        Math.abs(chunk.cz - currentChunkZ)
      );

      const shouldBeActive = distChunks <= this.activeRadiusChunks;

      if (chunk.active !== shouldBeActive) {
        chunk.active = shouldBeActive;
        for (const obj of chunk.objects) {
          obj.visible = shouldBeActive;
        }
      }
    }
  }
}
