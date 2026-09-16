import * as THREE from 'three';
import { Terrain } from './Terrain';

export class Vegetation {
  public group: THREE.Group = new THREE.Group();
  private terrain: Terrain;

  constructor(terrain: Terrain) {
    this.terrain = terrain;

    this.createCoconutPalms();
    this.createTeaPlantations();
    this.createBananaPlants();
  }

  // 1. Iconic Kerala Coconut Palm Trees
  private createCoconutPalms(): void {
    // Single palm template
    const palmTemplate = new THREE.Group();

    // Curved Trunk
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x544332,
      roughness: 0.9,
    });
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.3, 3, 0.2),
      new THREE.Vector3(0.8, 6, 0.6),
      new THREE.Vector3(0.6, 9, 0.8)
    ]);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 8, 0.28, 7, false);
    const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
    trunkMesh.castShadow = true;
    palmTemplate.add(trunkMesh);

    // Crown / Palm Fronds
    const frondMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a36,
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    const numFronds = 8;
    for (let i = 0; i < numFronds; i++) {
      const angle = (i / numFronds) * Math.PI * 2;
      const frondGeo = new THREE.BufferGeometry();
      const w = 0.55;
      const len = 3.8;

      // Curved arching frond blade
      const positions = [
        0, 0, 0,
        -w, -0.4, len * 0.45,
        w, -0.4, len * 0.45,
        0, -1.3, len
      ];
      const indices = [0, 1, 2, 1, 3, 2];

      frondGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      frondGeo.setIndex(indices);
      frondGeo.computeVertexNormals();

      const frondMesh = new THREE.Mesh(frondGeo, frondMat);
      frondMesh.position.set(0.6, 9.0, 0.8);
      frondMesh.rotation.y = angle;
      frondMesh.rotation.x = 0.2;
      frondMesh.castShadow = true;
      palmTemplate.add(frondMesh);
    }

    // Coconut cluster
    const nutMat = new THREE.MeshStandardMaterial({ color: 0x4a5d23, roughness: 0.7 });
    const nutGeo = new THREE.SphereGeometry(0.22, 6, 6);
    for (let j = 0; j < 4; j++) {
      const nut = new THREE.Mesh(nutGeo, nutMat);
      nut.position.set(
        0.6 + Math.cos(j * 1.5) * 0.35,
        8.8,
        0.8 + Math.sin(j * 1.5) * 0.35
      );
      palmTemplate.add(nut);
    }

    // Distribute Coconut Palms (Dense in Backwaters & Village, sparse in high hills)
    const palmPositions: { x: number; z: number; scale: number; rot: number }[] = [];
    const count = 180;

    for (let i = 0; i < count; i++) {
      // Concentrate in Z > -60 (Backwaters and village)
      const x = (Math.random() - 0.5) * 650;
      const z = -60 + Math.random() * 460;

      // Avoid road center
      if (Math.abs(x) < 8 && z > 200 && z < 350) continue;

      const y = this.terrain.getHeight(x, z);
      // Skip if underwater
      if (y < this.terrain.waterLevel + 0.3) continue;

      palmPositions.push({
        x,
        z,
        scale: 0.8 + Math.random() * 0.45,
        rot: Math.random() * Math.PI * 2
      });
    }

    // Clone templates to group
    for (let p of palmPositions) {
      const palm = palmTemplate.clone();
      const y = this.terrain.getHeight(p.x, p.z);
      palm.position.set(p.x, y, p.z);
      palm.scale.setScalar(p.scale);
      palm.rotation.y = p.rot;
      this.group.add(palm);
    }
  }

  // 2. Munnar Tea Estate Bushes (Contoured rounded bushes)
  private createTeaPlantations(): void {
    const teaBushGeo = new THREE.SphereGeometry(1.3, 7, 7);
    teaBushGeo.scale(1.2, 0.65, 1.2);

    const teaMat = new THREE.MeshStandardMaterial({
      color: 0x1f5c22, // Vibrant Munnar tea green
      roughness: 0.85,
    });

    // Create 450 tea bushes clustered in northern hills (Z < -100)
    const instancedTea = new THREE.InstancedMesh(teaBushGeo, teaMat, 450);
    instancedTea.castShadow = true;
    instancedTea.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    // Plant along stepped contours
    for (let row = 0; row < 15; row++) {
      const zBase = -120 - row * 22;
      for (let col = 0; col < 30; col++) {
        if (idx >= 450) break;
        const x = -280 + col * 19 + Math.sin(row) * 12;
        const z = zBase + Math.cos(col) * 6;

        // Don't place on roads
        const roadDist = Math.hypot(x - 50, z - (-200));
        if (roadDist < 15) continue;

        const y = this.terrain.getHeight(x, z);
        if (y < 8) continue; // Only on hills

        dummy.position.set(x, y + 0.4, z);
        dummy.scale.set(
          0.9 + Math.random() * 0.4,
          0.8 + Math.random() * 0.3,
          0.9 + Math.random() * 0.4
        );
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.updateMatrix();

        instancedTea.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }

    instancedTea.instanceMatrix.needsUpdate = true;
    this.group.add(instancedTea);
  }

  // 3. Banana Plants (Vazha)
  private createBananaPlants(): void {
    const bananaPlant = new THREE.Group();
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    for (let k = 0; k < 6; k++) {
      const leafGeo = new THREE.PlaneGeometry(0.8, 2.2);
      leafGeo.rotateX(Math.PI / 3);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 1.0;
      leaf.rotation.y = (k / 6) * Math.PI * 2;
      bananaPlant.add(leaf);
    }

    // Stem
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x86efac });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.4, 6), stemMat);
    stem.position.y = 0.7;
    bananaPlant.add(stem);

    // Place 35 banana plants around village compounds
    for (let i = 0; i < 35; i++) {
      const x = -100 + Math.random() * 180;
      const z = -40 + Math.random() * 120;
      const y = this.terrain.getHeight(x, z);
      if (y < this.terrain.waterLevel + 0.5) continue;

      const plant = bananaPlant.clone();
      plant.position.set(x, y, z);
      plant.scale.setScalar(0.9 + Math.random() * 0.4);
      this.group.add(plant);
    }
  }
}
