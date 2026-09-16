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

    // Base town elevation plateau (Kacherippadi center)
    let baseHeight = 5.5;

    // 1. Melakkam & Govt Medical College Ridge (North-West)
    const distToMelakkam = Math.hypot(clampedX - (-260), clampedZ - (-170));
    if (distToMelakkam < 190) {
      const t = Math.cos((distToMelakkam / 190) * Math.PI * 0.5);
      baseHeight += t * 14.5;
    }

    // 2. Vettekkode Scenic Hills (East)
    const distToVettekkode = Math.hypot(clampedX - 310, clampedZ - 130);
    if (distToVettekkode < 180) {
      const t = Math.cos((distToVettekkode / 180) * Math.PI * 0.5);
      baseHeight += t * 18.0;
    }

    // 3. Court Hill Plateau (South-East Court Road)
    const distToCourt = Math.hypot(clampedX - 45, clampedZ - 165);
    if (distToCourt < 120) {
      const t = Math.cos((distToCourt / 120) * Math.PI * 0.5);
      baseHeight += t * 7.5;
    }

    // Rolling Malappuram landscape undulations
    const n1 = this.noise2D(clampedX * 0.004, clampedZ * 0.004) * 6.5;
    const n2 = this.noise2D(clampedX * 0.012, clampedZ * 0.012) * 2.5;
    let totalHeight = baseHeight + n1 + n2;

    // 4. Carve Cherupuzha River (Kadalundi tributary near Z = 310)
    const riverCenterZ = 310 + Math.sin(clampedX * 0.012) * 16;
    const distToRiver = Math.abs(clampedZ - riverCenterZ);
    const riverWidth = 38;

    if (distToRiver < riverWidth) {
      const riverDepth = Math.cos((distToRiver / riverWidth) * Math.PI * 0.5);
      totalHeight -= riverDepth * 6.8;
    }

    return Math.max(-2.5, totalHeight);
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

    // Malappuram color palette: Tropical greenery, red laterite soil, and riverbank sand
    const colorRiverBank = new THREE.Color(0xb8976b);   // River sand & silt
    const colorRedLaterite = new THREE.Color(0x99482c); // Classic Malabar laterite red earth
    const colorGrass = new THREE.Color(0x2d6a31);       // Lush tropical green
    const colorUrbanGround = new THREE.Color(0x476249);  // Mixed town ground
    const colorHilltop = new THREE.Color(0x5a7d36);      // Sunlit hilltop grass

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const vy = this.getHeight(vx, vz);
      pos.setY(i, vy);

      const c = new THREE.Color();
      if (vy < this.waterLevel + 0.6) {
        c.copy(colorRiverBank);
      } else if (vy > 14.0) {
        c.copy(colorHilltop);
      } else {
        // Blend between lush grass, town ground, and exposed red laterite
        const noiseVal = this.noise2D(vx * 0.03, vz * 0.03);
        if (noiseVal > 0.35) {
          c.copy(colorRedLaterite);
        } else if (Math.hypot(vx, vz) < 140) {
          c.copy(colorUrbanGround);
        } else {
          c.copy(colorGrass);
        }
      }

      // Natural tint variation
      const tint = (this.noise2D(vx * 0.06, vz * 0.06) + 1) * 0.06;
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
