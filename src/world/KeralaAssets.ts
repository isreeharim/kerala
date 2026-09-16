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
        case 'CourtComplex':
          this.createCourtComplex(x, z);
          break;
        case 'Hospital':
          this.createMedicalCollege(x, z);
          break;
        case 'BusTerminal':
          this.createBusTerminal(x, z);
          break;
        case 'OldBusStand':
          this.createOldBusStand(x, z);
          break;
        case 'Mosque':
          this.createJumaMasjid(x, z);
          break;
        case 'Temple':
          this.createTemple(x, z);
          break;
        case 'Commercial':
          this.createCommercialBlock(x, z);
          break;
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

  // 1. Cherupuzha River Bridge (Anakkayam Road)
  private createBridge(): void {
    const bridgeGroup = new THREE.Group();
    const bridgeZ = 310;
    const bridgeLength = 80;
    const bridgeWidth = 8.5;
    const bridgeHeight = 3.2;

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

  // 9. District & Sessions Court Complex
  private createCourtComplex(x: number, z: number): void {
    const y = this.terrain.getHeight(x, z);
    const group = new THREE.Group();

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.75 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });

    // Base plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(34, 1.2, 22), plinthMat);
    plinth.position.y = 0.6;
    group.add(plinth);

    // Main 2-story building block
    const mainBlock = new THREE.Mesh(new THREE.BoxGeometry(30, 7.5, 18), wallMat);
    mainBlock.position.y = 1.2 + 3.75;
    mainBlock.castShadow = true;
    mainBlock.receiveShadow = true;
    group.add(mainBlock);

    // Classical Front Portico with pillars
    for (let px of [-6, -2.4, 2.4, 6]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 6.5, 12), pillarMat);
      col.position.set(px, 1.2 + 3.25, 10.5);
      col.castShadow = true;
      group.add(col);
    }

    // Pediment triangular roof over portico
    const pediment = new THREE.Mesh(new THREE.ConeGeometry(8, 2.5, 4), roofMat);
    pediment.position.set(0, 1.2 + 7.5 + 1.25, 10.5);
    pediment.rotation.y = Math.PI / 4;
    pediment.castShadow = true;
    group.add(pediment);

    // Main hipped tiled roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(24, 4.2, 4), roofMat);
    roof.position.set(0, 1.2 + 7.5 + 2.1, 0);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.4, 1, 0.9);
    roof.castShadow = true;
    group.add(roof);

    // Court name board
    const board = new THREE.Mesh(new THREE.BoxGeometry(10, 1.0, 0.2), boardMat);
    board.position.set(0, 1.2 + 6.8, 10.6);
    group.add(board);

    // Flagpole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 9, 8), pillarMat);
    pole.position.set(0, 4.5, 13);
    group.add(pole);

    group.position.set(x, y, z);
    this.group.add(group);
  }

  // 10. Govt. Medical College Hospital (Melakkam)
  private createMedicalCollege(x: number, z: number): void {
    const y = this.terrain.getHeight(x, z);
    const group = new THREE.Group();

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.3 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
    const emergencyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });

    // 3-story Hospital Main Block
    const mainHospital = new THREE.Mesh(new THREE.BoxGeometry(38, 11, 24), wallMat);
    mainHospital.position.y = 5.5;
    mainHospital.castShadow = true;
    mainHospital.receiveShadow = true;
    group.add(mainHospital);

    // Hospital Window Bands
    for (let floor = 1; floor <= 3; floor++) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(34, 1.2, 24.3), glassMat);
      band.position.y = floor * 3.2 - 0.4;
      group.add(band);
    }

    // Emergency Casualty Canopy
    const erCanopy = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 8), emergencyMat);
    erCanopy.position.set(0, 4.0, 15);
    erCanopy.castShadow = true;
    group.add(erCanopy);

    for (let cx of [-6, 6]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 8), wallMat);
      pillar.position.set(cx, 2, 18);
      group.add(pillar);
    }

    // Red Cross emblem
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.2, 0.2), redMat);
    crossV.position.set(0, 9.2, 12.15);
    group.add(crossV);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 0.2), redMat);
    crossH.position.set(0, 9.2, 12.15);
    group.add(crossH);

    group.position.set(x, y, z);
    this.group.add(group);
  }

  // 11. Indira Gandhi Bus Terminal (New Bus Stand)
  private createBusTerminal(x: number, z: number): void {
    const y = this.terrain.getHeight(x, z);
    const group = new THREE.Group();

    const tarmacMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 });
    const busYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.6 });
    const busGreenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

    // Terminal concrete platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(42, 0.6, 26), tarmacMat);
    platform.position.y = 0.3;
    group.add(platform);

    // Terminal passenger concourse canopy
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(36, 0.4, 18), canopyMat);
    canopy.position.set(0, 5.5, 0);
    canopy.castShadow = true;
    group.add(canopy);

    for (let px of [-16, 0, 16]) {
      for (let pz of [-7, 7]) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 5.5, 8), steelMat);
        col.position.set(px, 2.75, pz);
        col.castShadow = true;
        group.add(col);
      }
    }

    // Parked KSRTC Buses
    const createKSRTCBus = (offsetX: number) => {
      const bus = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.2, 10.5), busYellowMat);
      body.position.y = 1.9;
      body.castShadow = true;
      bus.add(body);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.7, 10.55), busGreenMat);
      stripe.position.y = 1.5;
      bus.add(stripe);
      bus.position.set(offsetX, 0.6, 4);
      return bus;
    };

    group.add(createKSRTCBus(-10));
    group.add(createKSRTCBus(6));

    group.position.set(x, y, z);
    this.group.add(group);
  }

  // 12. Old Bus Stand & Municipal Market
  private createOldBusStand(x: number, z: number): void {
    const y = this.terrain.getHeight(x, z);
    const group = new THREE.Group();

    const shopWallMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 });
    const shutterMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });

    const baseBlock = new THREE.Mesh(new THREE.BoxGeometry(24, 7, 14), shopWallMat);
    baseBlock.position.y = 3.5;
    baseBlock.castShadow = true;
    group.add(baseBlock);

    for (let sx of [-8, -4, 0, 4, 8]) {
      const shutter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.5, 0.2), shutterMat);
      shutter.position.set(sx, 1.25, 7.1);
      group.add(shutter);
    }

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(25, 0.3, 3), roofMat);
    canopy.position.set(0, 3.2, 8);
    canopy.rotation.x = 0.2;
    group.add(canopy);

    group.position.set(x, y, z);
    this.group.add(group);
  }

  // 13. Historic Manjeri Town Juma Masjid
  private createJumaMasjid(x: number, z: number): void {
    const y = this.terrain.getHeight(x, z);
    const group = new THREE.Group();

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.3, metalness: 0.2 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 });

    const hall = new THREE.Mesh(new THREE.BoxGeometry(18, 7.5, 15), whiteMat);
    hall.position.y = 3.75;
    hall.castShadow = true;
    group.add(hall);

    // Central Emerald Dome
    const dome = new THREE.Mesh(new THREE.SphereGeometry(4.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), domeMat);
    dome.position.y = 7.5;
    dome.castShadow = true;
    group.add(dome);

    const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 1.8, 8), goldMat);
    finial.position.y = 12.2;
    group.add(finial);

    // 2 Minarets
    for (let mx of [-8.5, 8.5]) {
      const minaret = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 15, 12), whiteMat);
      minaret.position.set(mx, 7.5, 7.5);
      minaret.castShadow = true;
      group.add(minaret);

      const mDome = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), domeMat);
      mDome.position.set(mx, 15, 7.5);
      group.add(mDome);
    }

    group.position.set(x, y, z);
    this.group.add(group);
  }

  // 14. Karnakkaparambu Temple
  private createTemple(x: number, z: number): void {
    const y = this.terrain.getHeight(x, z);
    const group = new THREE.Group();

    const graniteMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.9 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.75 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 });

    const wall = new THREE.Mesh(new THREE.BoxGeometry(20, 2.2, 20), graniteMat);
    wall.position.y = 1.1;
    group.add(wall);

    const sreekovil = new THREE.Mesh(new THREE.BoxGeometry(8, 4.5, 8), wallMat);
    sreekovil.position.y = 2.25;
    sreekovil.castShadow = true;
    group.add(sreekovil);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(7.5, 4.5, 4), roofMat);
    roof.position.y = 4.5 + 2.25;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    const stupa = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.4, 1.4, 8), brassMat);
    stupa.position.y = 9.2;
    group.add(stupa);

    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 4.5, 8), brassMat);
    lamp.position.set(0, 2.25, 12);
    lamp.castShadow = true;
    group.add(lamp);

    group.position.set(x, y, z);
    this.group.add(group);
  }

  // 15. Commercial High-Street Block
  private createCommercialBlock(x: number, z: number): void {
    const y = this.terrain.getHeight(x, z);
    const group = new THREE.Group();

    const colors = [0xe2e8f0, 0xfef3c7, 0xdcfce7, 0xfce7f3];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const wallMat = new THREE.MeshStandardMaterial({ color: randomColor, roughness: 0.7 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 });
    const signMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 });

    const building = new THREE.Mesh(new THREE.BoxGeometry(16, 7.5, 12), wallMat);
    building.position.y = 3.75;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(14, 2.8, 0.2), glassMat);
    glass.position.set(0, 1.6, 6.1);
    group.add(glass);

    const sign = new THREE.Mesh(new THREE.BoxGeometry(12, 1.6, 0.2), signMat);
    sign.position.set(0, 6.8, 6.15);
    group.add(sign);

    group.position.set(x, y, z);
    this.group.add(group);
  }

  // 16. Milestone & Signboards
  private createSignboards(): void {
    const signs = [
      { text: 'KACHERIPPADI JUNCTION • MANJERI', x: 10, z: -10, rot: 0 },
      { text: 'CALICUT / KOZHIKODE 48 KM (SH 28)', x: -60, z: -40, rot: -0.4 },
      { text: 'NILAMBUR 24 KM', x: 50, z: -45, rot: 0.5 },
      { text: 'PANDIKKAD 16 KM', x: 70, z: 12, rot: 0 },
      { text: 'MALAPPURAM 12 KM (SH 71)', x: -30, z: 65, rot: 0.2 },
      { text: 'GOVT MEDICAL COLLEGE HOSPITAL ->', x: -110, z: -40, rot: -0.8 },
      { text: 'DISTRICT & SESSIONS COURT ->', x: 25, z: 50, rot: 0.3 },
      { text: 'VETTEKKODE HILL VIEWPOINT (ALT 78M)', x: 280, z: 100, rot: -0.5 }
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
