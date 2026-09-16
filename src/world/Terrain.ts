import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { PhysicsWorld } from '../core/PhysicsWorld';
import { MapDataLoader } from './MapDataLoader';

export class Terrain {
  public mesh: THREE.Mesh;
  public geometry: THREE.PlaneGeometry;
  private noise2D = createNoise2D();
  public readonly size: number = 950;
  public readonly segments: number = 190;
  public readonly waterLevel: number = 1.2;

  constructor(physicsWorld?: PhysicsWorld) {
    this.geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.segments,
      this.segments
    );
    this.geometry.rotateX(-Math.PI / 2);

    this.applyHeightAndColor();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: false
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;

    // Create Rapier physics collider when physics engine is ready
    if (physicsWorld) {
      physicsWorld.onReady(() => {
        this.createPhysicsCollider(physicsWorld);
      });
    }
  }

  public getHeight(x: number, z: number): number {
    const clampedX = Math.max(-this.size / 2, Math.min(this.size / 2, x));
    const clampedZ = Math.max(-this.size / 2, Math.min(this.size / 2, z));

    // Continuous real Kerala elevation profile:
    // South (Z > 120): Alappuzha Coastal Backwaters (0.5m - 3.5m)
    // Central (Z between -80 and 120): Heritage Village rolling plains (4m - 16m)
    // North (Z < -80): Munnar Western Ghats Mountain Slopes (18m - 85m)
    let baseHeight = 0;
    if (clampedZ > 120) {
      baseHeight = 2.0;
    } else if (clampedZ > -80) {
      const t = (120 - clampedZ) / 200;
      baseHeight = 2.0 + t * 12.0;
    } else {
      // Steeper climb into the Western Ghats
      const t = (-80 - clampedZ) / 390;
      baseHeight = 14.0 + Math.pow(t, 1.25) * 55.0;
    }

    // Mountain noise & stepped tea hill contouring
    const n1 = this.noise2D(clampedX * 0.003, clampedZ * 0.003) * 14;
    const n2 = this.noise2D(clampedX * 0.009, clampedZ * 0.009) * 5;
    const n3 = this.noise2D(clampedX * 0.025, clampedZ * 0.025) * 1.8;

    const hillFactor = Math.max(0, (-clampedZ + 60) / 420);
    let totalHeight = baseHeight + (n1 + n2 + n3) * (0.35 + hillFactor * 0.75);

    // Carve Backwater Canal (derived from OSM waterway path near Z = 280)
    const canalCenterZ = 280 + Math.sin(clampedX * 0.015) * 35;
    const distToCanal = Math.abs(clampedZ - canalCenterZ);
    const canalWidth = 42;

    if (distToCanal < canalWidth) {
      const canalDepth = Math.cos((distToCanal / canalWidth) * Math.PI * 0.5);
      totalHeight -= canalDepth * 5.6;
    }

    return Math.max(-3.5, totalHeight);
  }

  public getNormalAt(x: number, z: number): THREE.Vector3 {
    const eps = 1.0;
    const hL = this.getHeight(x - eps, z);
    const hR = this.getHeight(x + eps, z);
    const hD = this.getHeight(x, z - eps);
    const hU = this.getHeight(x, z + eps);

    const normal = new THREE.Vector3(hL - hR, 2 * eps, hD - hU);
    normal.normalize();
    return normal;
  }

  private applyHeightAndColor(): void {
    const pos = this.geometry.attributes.position;
    const colors: number[] = [];

    // Kerala color palette
    const colorWaterBank = new THREE.Color(0x7c734b); // Alluvial canal silt
    const colorLowGrass = new THREE.Color(0x2f6429);  // Lush coastal palm greenery
    const colorVillageField = new THREE.Color(0x3e7935); // Paddy grass
    const colorTeaPlantation = new THREE.Color(0x1e541c); // Deep emerald Munnar tea bushes
    const colorHillRock = new THREE.Color(0x4b5848); // Mountain rock

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const vy = this.getHeight(vx, vz);
      pos.setY(i, vy);

      const c = new THREE.Color();
      if (vy < this.waterLevel + 0.4) {
        c.copy(colorWaterBank);
      } else if (vz > 110) {
        const blend = Math.min(1, Math.max(0, (vy - this.waterLevel) / 3.5));
        c.lerpColors(colorWaterBank, colorLowGrass, blend);
      } else if (vz > -80) {
        c.copy(colorVillageField);
      } else if (vy > 38) {
        c.lerpColors(colorTeaPlantation, colorHillRock, (vy - 38) / 30);
      } else {
        c.copy(colorTeaPlantation);
      }

      // Natural noise variation
      const tint = (this.noise2D(vx * 0.05, vz * 0.05) + 1) * 0.08;
      c.r = Math.min(1, Math.max(0, c.r + tint));
      c.g = Math.min(1, Math.max(0, c.g + tint));
      c.b = Math.min(1, Math.max(0, c.b + tint));

      colors.push(c.r, c.g, c.b);
    }

    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.geometry.computeVertexNormals();
  }

  private createPhysicsCollider(physicsWorld: PhysicsWorld): void {
    const posAttr = this.geometry.attributes.position;
    const vertices = new Float32Array(posAttr.array);

    // Create index array if not present
    let indices: Uint32Array;
    if (this.geometry.index) {
      indices = new Uint32Array(this.geometry.index.array);
    } else {
      indices = new Uint32Array((this.segments * this.segments) * 6);
      let ptr = 0;
      const ncols = this.segments + 1;
      for (let r = 0; r < this.segments; r++) {
        for (let c = 0; c < this.segments; c++) {
          const a = r * ncols + c;
          const b = r * ncols + (c + 1);
          const c_idx = (r + 1) * ncols + c;
          const d = (r + 1) * ncols + (c + 1);

          indices[ptr++] = a;
          indices[ptr++] = c_idx;
          indices[ptr++] = b;

          indices[ptr++] = b;
          indices[ptr++] = c_idx;
          indices[ptr++] = d;
        }
      }
    }

    physicsWorld.createTrimeshCollider(vertices, indices);
  }
}
