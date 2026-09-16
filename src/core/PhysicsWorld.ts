import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export class PhysicsWorld {
  public world: RAPIER.World | null = null;
  public isReady: boolean = false;
  private onReadyCallbacks: (() => void)[] = [];

  constructor() {
    // RAPIER.init() will be called in init()
  }

  public async init(): Promise<void> {
    if (this.isReady) return;
    try {
      await RAPIER.init();
      const gravity = new RAPIER.Vector3(0, -9.81, 0);
      this.world = new RAPIER.World(gravity);
      this.isReady = true;
      console.log('Rapier3D physics initialized successfully');
      for (const cb of this.onReadyCallbacks) {
        cb();
      }
      this.onReadyCallbacks = [];
    } catch (err) {
      console.warn('Rapier3D init failed or running in fallback mode:', err);
    }
  }

  public onReady(cb: () => void): void {
    if (this.isReady) {
      cb();
    } else {
      this.onReadyCallbacks.push(cb);
    }
  }

  public step(delta: number): void {
    if (!this.world || !this.isReady) return;
    // Cap delta time to prevent physics instabilities
    this.world.timestep = Math.min(delta, 0.05);
    this.world.step();
  }

  public createTrimeshCollider(
    vertices: Float32Array,
    indices: Uint32Array
  ): RAPIER.Collider | null {
    if (!this.world || !this.isReady) return null;
    try {
      const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
      return this.world.createCollider(colliderDesc);
    } catch (e) {
      console.warn('Failed to create trimesh collider:', e);
      return null;
    }
  }

  public castRay(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxToi: number = 50
  ): { point: THREE.Vector3; normal: THREE.Vector3; hit: boolean } | null {
    if (!this.world || !this.isReady) return null;
    const ray = new RAPIER.Ray(
      new RAPIER.Vector3(origin.x, origin.y, origin.z),
      new RAPIER.Vector3(direction.x, direction.y, direction.z)
    );
    const hit = this.world.castRayAndGetNormal(ray, maxToi, true);
    if (hit) {
      const hitPoint = ray.pointAt(hit.timeOfImpact);
      return {
        point: new THREE.Vector3(hitPoint.x, hitPoint.y, hitPoint.z),
        normal: new THREE.Vector3(hit.normal.x, hit.normal.y, hit.normal.z),
        hit: true
      };
    }
    return null;
  }
}
