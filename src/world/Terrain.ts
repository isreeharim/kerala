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

    // Base Manjeri town elevation (~82m ASL mapped to game units)
    let baseHeight = 5.5;

    // 1. Melakkam & Govt Medical College Ridge (North-West of junction)
    // Real coords: ~76.119°E, 11.127°N → game x≈-27, z≈-188
    // Spread ~200m radius in game space
    const distToMelakkam = Math.hypot(clampedX - (-27), clampedZ - (-188));
    if (distToMelakkam < 200) {
      const t = Math.cos((distToMelakkam / 200) * Math.PI * 0.5);
      baseHeight += t * 16.0; // ~12m above town = laterite ridgeline
    }

    // 2. Vettekkode Scenic Hills (East of Manjeri, along Court Road direction)
    // Real coords: ~76.128°E, 11.126°N → game x≈+265, z≈-160
    const distToVettekkode = Math.hypot(clampedX - 265, clampedZ - (-160));
    if (distToVettekkode < 200) {
      const t = Math.cos((distToVettekkode / 200) * Math.PI * 0.5);
      baseHeight += t * 21.0; // Highest point ~18m above town
    }

    // 3. Court Hill Plateau (South-East along Court Road)
    // Real coords: ~76.127°E, 11.121°N → game x≈+185, z≈-26
    const distToCourt = Math.hypot(clampedX - 185, clampedZ - (-26));
    if (distToCourt < 130) {
      const t = Math.cos((distToCourt / 130) * Math.PI * 0.5);
      baseHeight += t * 8.0;
    }

    // 4. Bypass north ridge (north side of NH766 bypass)
    // Bypass runs NW to SE diagonally across the north of the map
    const distToBypassRidge = Math.hypot(clampedX - (-180), clampedZ - (-220));
    if (distToBypassRidge < 150) {
      const t = Math.cos((distToBypassRidge / 150) * Math.PI * 0.5);
      baseHeight += t * 9.0;
    }

    // Rolling Malappuram landscape undulations (mild terrain)
    const n1 = this.noise2D(clampedX * 0.004, clampedZ * 0.004) * 5.5;
    const n2 = this.noise2D(clampedX * 0.011, clampedZ * 0.011) * 2.0;
    let totalHeight = baseHeight + n1 + n2;

    // 5. Carve Cherupuzha River Valley (southern Manjeri, z ~ +347m)
    // Real coords: ~lat 11.107°N → game z ≈ +(11.120-11.107)*111320*0.24 ≈ +347m
    const riverSinOffset = Math.sin(clampedX * 0.008) * 22 + Math.cos(clampedX * 0.004) * 12;
    const riverCenterZ = 347 + riverSinOffset;
    const distToRiver = Math.abs(clampedZ - riverCenterZ);
    const riverWidth = 42;

    if (distToRiver < riverWidth) {
      const riverDepth = Math.cos((distToRiver / riverWidth) * Math.PI * 0.5);
      totalHeight -= riverDepth * 8.5; // River valley depression
    }

    // 6. Iruvanjipuzha stream (secondary drainage, NE quadrant)
    const streamCenterX = clampedZ * 0.18 + 200; // diagonal stream path
    const distToStream = Math.abs(clampedX - streamCenterX);
    if (clampedZ < -100 && distToStream < 20) {
      const streamDepth = Math.cos((distToStream / 20) * Math.PI * 0.5);
      totalHeight -= streamDepth * 3.5;
    }

    // Flatten the area around Kacherippadi Junction (main town center)
    const distToCenter = Math.hypot(clampedX, clampedZ);
    if (distToCenter < 80) {
      const flatFactor = 1 - (distToCenter / 80);
      totalHeight = totalHeight * (1 - flatFactor * 0.6) + 5.5 * (flatFactor * 0.6);
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
