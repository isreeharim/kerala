import * as THREE from 'three';
import { Terrain } from './Terrain';
import { MapDataLoader } from './MapDataLoader';

export class KeralaAssets {
  public group: THREE.Group = new THREE.Group();
  private terrain: Terrain;

  constructor(terrain: Terrain) {
    this.terrain = terrain;

    this.createBridge();
    this.createOSMBuildings();
    this.createUtilityPoles();
    this.createSignboards();
  }

  // Load buildings based on OpenStreetMap building footprints
  private createOSMBuildings(): void {
    const osmBuildings = MapDataLoader.loadBuildings();

    for (const bldg of osmBuildings) {
      const { x, z } = bldg.position;
      const category = bldg.properties.category;

      switch (category) {
        case 'Thattukada':
          this.createThattukada(x, z);
          break;
        case 'BusShelter':
          this.createBusStop(x, z);
          break;
        case 'Tharavadu':
          this.createTharavaduHouse(x, z, Math.random() * 0.5 - 0.25);
          break;
        case 'BanyanPlatform':
          this.createBanyanPlatform(x, z);
          break;
        case 'Houseboat':
          this.createHouseboat(x, z);
          break;
        case 'Viewpoint':
          this.createViewpointShelter(x, z);
          break;
      }
    }
  }

  // 1. Backwater Bridge across the canal
  private createBridge(): void {
    const bridgeGroup = new THREE.Group();
    const bridgeZ = 280;
    const bridgeLength = 96;
    const bridgeWidth = 8.5;
    const bridgeHeight = 3.5;

    // Bridge piers into water
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x5a554a, roughness: 0.9 });
    for (let pz of [bridgeZ - 30, bridgeZ - 10, bridgeZ + 10, bridgeZ + 30]) {
      for (let px of [-bridgeWidth / 2, bridgeWidth / 2]) {
        const pillarGeo = new THREE.CylinderGeometry(0.7, 0.8, 6, 8);
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(px, 1.0, pz);
        pillar.castShadow = true;
        bridgeGroup.add(pillar);
      }
    }

    // Bridge railings
    const railMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.7 });
    const postGeo = new THREE.BoxGeometry(0.3, 1.0, 0.3);
    const barGeo = new THREE.BoxGeometry(0.2, 0.15, bridgeLength);

    for (let side of [-bridgeWidth / 2 + 0.2, bridgeWidth / 2 - 0.2]) {
      const bar = new THREE.Mesh(barGeo, railMat);
      bar.position.set(side, bridgeHeight + 0.85, bridgeZ);
      bar.castShadow = true;
      bridgeGroup.add(bar);

      for (let z = bridgeZ - bridgeLength / 2; z <= bridgeZ + bridgeLength / 2; z += 4) {
        const post = new THREE.Mesh(postGeo, railMat);
        post.position.set(side, bridgeHeight + 0.45, z);
        post.castShadow = true;
        bridgeGroup.add(post);
      }
    }

    // Bridge streetlights
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.8 });

    for (let pz of [bridgeZ - 25, bridgeZ, bridgeZ + 25]) {
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 4, 8);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(bridgeWidth / 2 - 0.2, bridgeHeight + 2, pz);

      const lampGeo = new THREE.SphereGeometry(0.35, 8, 8);
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(bridgeWidth / 2 - 0.5, bridgeHeight + 3.8, pz);

      bridgeGroup.add(pole);
      bridgeGroup.add(lamp);
    }

    this.group.add(bridgeGroup);
  }

  // 2. Kerala Houseboat (Kettuvallam)
  private createHouseboat(x: number, z: number): void {
    const boat = new THREE.Group();
    const boatY = this.terrain.waterLevel;

    const hullMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.85 });
    const hullGeo = new THREE.BoxGeometry(4.5, 1.4, 18);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.5;
    hull.castShadow = true;
    boat.add(hull);

    // Thatched bamboo canopy
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x855b32, roughness: 0.95 });
    const roofGeo = new THREE.CylinderGeometry(2.4, 2.4, 13, 16, 1, false, 0, Math.PI);
    roofGeo.rotateZ(-Math.PI / 2);
    roofGeo.rotateY(Math.PI / 2);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 2.2, -1);
    roof.castShadow = true;
    boat.add(roof);

    // Deck
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x6e4726 });
    const deckGeo = new THREE.BoxGeometry(4.0, 0.2, 4);
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 1.25, 6.5);
    boat.add(deck);

    boat.position.set(x, boatY, z);
    boat.rotation.y = 0.35;
    this.group.add(boat);
  }

  // 3. Thattukada (Kerala Tea Stall)
  private createThattukada(x: number, z: number): void {
    const thattukada = new THREE.Group();
    const y = this.terrain.getHeight(x, z);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3c24 });
    const counterGeo = new THREE.BoxGeometry(4.2, 1.1, 2.4);
    const counter = new THREE.Mesh(counterGeo, woodMat);
    counter.position.set(0, 0.55, 0);
    counter.castShadow = true;
    thattukada.add(counter);

    // Poles
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    for (let px of [-1.9, 1.9]) {
      for (let pz of [-1.0, 1.0]) {
        const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(px, 1.4, pz);
        thattukada.add(pole);
      }
    }

    // Blue tin roof
    const sheetMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 });
    const roofGeo = new THREE.BoxGeometry(4.8, 0.1, 3.2);
    const roof = new THREE.Mesh(roofGeo, sheetMat);
    roof.position.set(0, 2.7, 0);
    roof.rotation.x = 0.08;
    roof.castShadow = true;
    thattukada.add(roof);

    // Glass Snack Display Cabinet
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, roughness: 0.1 });
    const glassBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.9), glassMat);
    glassBox.position.set(-0.9, 1.45, 0.3);
    thattukada.add(glassBox);

    // Snacks inside
    const snackMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
    for (let s = -0.5; s <= 0.5; s += 0.35) {
      const snackGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
      snackGeo.rotateZ(Math.PI / 2);
      const snack = new THREE.Mesh(snackGeo, snackMat);
      snack.position.set(-0.9 + s, 1.25, 0.3);
      thattukada.add(snack);
    }

    // Stainless steel Chai Kettle
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
    const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.7, 12), steelMat);
    kettle.position.set(1.1, 1.45, 0.2);
    thattukada.add(kettle);

    // Warm hanging bulb
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfbbf24, emissiveIntensity: 1 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), bulbMat);
    bulb.position.set(0, 2.4, 0);
    thattukada.add(bulb);

    const stallLight = new THREE.PointLight(0xfbbf24, 1.6, 14);
    stallLight.position.set(0, 2.3, 0);
    thattukada.add(stallLight);

    // Bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 0.6), woodMat);
    bench.position.set(0, 0.25, 2.2);
    bench.castShadow = true;
    thattukada.add(bench);

    thattukada.position.set(x, y, z);
    this.group.add(thattukada);
  }

  // 4. KSRTC Bus Stop
  private createBusStop(x: number, z: number): void {
    const busStop = new THREE.Group();
    const y = this.terrain.getHeight(x, z);

    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.9 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.6, 0.2), concreteMat);
    backWall.position.set(0, 1.3, -1.0);
    busStop.add(backWall);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.2, 2.4), concreteMat);
    roof.position.set(0, 2.7, 0);
    roof.castShadow = true;
    busStop.add(roof);

    for (let px of [-2.4, 2.4]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.6, 2.2), concreteMat);
      pillar.position.set(px, 1.3, 0);
      busStop.add(pillar);
    }

    const bench = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.45, 0.5), concreteMat);
    bench.position.set(0, 0.25, -0.6);
    busStop.add(bench);

    const signMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.5, 0.05), signMat);
    sign.position.set(0, 2.4, 1.15);
    busStop.add(sign);

    busStop.position.set(x, y, z);
    busStop.rotation.y = Math.PI * 0.9;
    this.group.add(busStop);
  }

  // 5. Traditional Kerala Tharavadu House
  private createTharavaduHouse(x: number, z: number, rotationY: number): void {
    const house = new THREE.Group();
    const y = this.terrain.getHeight(x, z);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf9fafb, roughness: 0.8 });
    const walls = new THREE.Mesh(new THREE.BoxGeometry(10, 3.2, 8), wallMat);
    walls.position.set(0, 1.6, 0);
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);

    // Terracotta roof
    const tileMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85 });
    const roofGeo = new THREE.ConeGeometry(8.5, 3.8, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, tileMat);
    roof.position.set(0, 5.0, 0);
    roof.scale.set(1.1, 1, 0.9);
    roof.castShadow = true;
    house.add(roof);

    // Wooden pillars
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
    for (let px of [-4.2, -1.4, 1.4, 4.2]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.8, 8), woodMat);
      col.position.set(px, 1.4, 4.4);
      col.castShadow = true;
      house.add(col);
    }

    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.25, 2.0), tileMat);
    porchRoof.position.set(0, 2.9, 4.6);
    porchRoof.rotation.x = 0.15;
    porchRoof.castShadow = true;
    house.add(porchRoof);

    const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.3, 0.1), woodMat);
    door.position.set(0, 1.15, 4.05);
    house.add(door);

    house.position.set(x, y, z);
    house.rotation.y = rotationY;
    this.group.add(house);
  }

  // 6. Sacred Banyan Tree Platform (Aalthara)
  private createBanyanPlatform(x: number, z: number): void {
    const group = new THREE.Group();
    const y = this.terrain.getHeight(x, z);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9 });
    const base1 = new THREE.Mesh(new THREE.CylinderGeometry(5.0, 5.2, 0.6, 12), stoneMat);
    base1.position.y = 0.3;
    base1.castShadow = true;
    group.add(base1);

    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.7, 0.6, 12), stoneMat);
    base2.position.y = 0.9;
    base2.castShadow = true;
    group.add(base2);

    const barkMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.0, 7, 10), barkMat);
    trunk.position.y = 4.4;
    trunk.castShadow = true;
    group.add(trunk);

    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x22543d, roughness: 0.7 });
    for (let ox of [-2.5, 0, 2.5]) {
      for (let oz of [-2.5, 0, 2.5]) {
        const leafDome = new THREE.Mesh(new THREE.SphereGeometry(3.2 + Math.random() * 0.8, 8, 8), leavesMat);
        leafDome.position.set(ox, 7.5 + Math.random() * 1.5, oz);
        leafDome.castShadow = true;
        group.add(leafDome);
      }
    }

    group.position.set(x, y, z);
    this.group.add(group);
  }

  // 7. Mountain Viewpoint Shelter
  private createViewpointShelter(x: number, z: number): void {
    const shelter = new THREE.Group();
    const y = this.terrain.getHeight(x, z);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3f2e24 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x78716c });

    // Raised stone platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(7, 0.6, 7), stoneMat);
    platform.position.y = 0.3;
    shelter.add(platform);

    // Pillars
    for (let px of [-3, 3]) {
      for (let pz of [-3, 3]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8), woodMat);
        pillar.position.set(px, 1.9, pz);
        shelter.add(pillar);
      }
    }

    // Conical thatched roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5, 2.2, 8), woodMat);
    roof.position.set(0, 4.4, 0);
    roof.castShadow = true;
    shelter.add(roof);

    shelter.position.set(x, y, z);
    this.group.add(shelter);
  }

  // 8. Utility Poles along Roadside
  private createUtilityPoles(): void {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const crossMat = new THREE.MeshStandardMaterial({ color: 0x334155 });

    const poleCoords = [
      { x: 12, z: 380 },
      { x: 8, z: 340 },
      { x: 8, z: 230 },
      { x: 14, z: 170 },
      { x: -8, z: 110 },
      { x: -28, z: 50 },
      { x: -12, z: -10 },
      { x: 28, z: -60 },
      { x: 75, z: -110 }
    ];

    for (const pt of poleCoords) {
      const y = this.terrain.getHeight(pt.x, pt.z);
      const poleGroup = new THREE.Group();

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 7, 8), poleMat);
      pole.position.y = 3.5;
      pole.castShadow = true;
      poleGroup.add(pole);

      const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.1), crossMat);
      crossbar.position.y = 6.6;
      poleGroup.add(crossbar);

      poleGroup.position.set(pt.x, y, pt.z);
      this.group.add(poleGroup);
    }
  }

  // 9. Milestone & Signboards
  private createSignboards(): void {
    const signs = [
      { text: 'ALAPPUZHA 0 KM', x: 12, z: 340, rot: 0 },
      { text: 'VILLAGE JUNCTION', x: 2, z: 40, rot: 0.2 },
      { text: 'MUNNAR GHAT ROAD (HAIRPIN)', x: 60, z: -85, rot: -0.4 },
      { text: 'TOP STATION MUNNAR (ALT 1880M)', x: -45, z: -420, rot: 0.6 }
    ];

    const postMat = new THREE.MeshStandardMaterial({ color: 0x4b5563 });
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x15803d });

    for (let s of signs) {
      const signGroup = new THREE.Group();
      const y = this.terrain.getHeight(s.x, s.z);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), postMat);
      post.position.y = 1.2;
      signGroup.add(post);

      const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.1), boardMat);
      board.position.y = 2.0;
      board.castShadow = true;
      signGroup.add(board);

      signGroup.position.set(s.x, y, s.z);
      signGroup.rotation.y = s.rot;
      this.group.add(signGroup);
    }
  }
}
