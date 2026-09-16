import * as THREE from 'three';
import { InputManager } from './core/InputManager';
import { PhysicsWorld } from './core/PhysicsWorld';
import { CameraController, PlayerMode } from './core/CameraController';
import { SoundFX } from './audio/SoundFX';
import { Terrain } from './world/Terrain';
import { Water } from './world/Water';
import { RoadSystem } from './world/RoadSystem';
import { KeralaAssets } from './world/KeralaAssets';
import { Vegetation } from './world/Vegetation';
import { WorldStreamer } from './world/WorldStreamer';
import { Character } from './entities/Character';
import { Bike } from './entities/Bike';
import { Car } from './entities/Car';
import { HUD } from './ui/HUD';
import { MiniMap } from './ui/MiniMap';
import { TouchControls } from './core/TouchControls';

class KeralaHorizonsGame {
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private input: InputManager;
  private touchControls: TouchControls;
  private sound: SoundFX;
  private physics: PhysicsWorld;
  private cameraController: CameraController;
  private streamer: WorldStreamer;
  private hud: HUD;
  private minimap: MiniMap;

  private terrain: Terrain;
  private water: Water;
  private roadSystem: RoadSystem;
  private keralaAssets: KeralaAssets;
  private vegetation: Vegetation;

  private character: Character;
  private bike: Bike;
  private car: Car;

  private playerMode: PlayerMode = 'ON_FOOT';
  private clock: THREE.Clock = new THREE.Clock();

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    // 1. Scene & Tropical Kerala Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa5d6b4);
    this.scene.fog = new THREE.FogExp2(0xa5d6b4, 0.0035);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.2,
      1400
    );

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    // 4. Tropical Lighting
    const hemiLight = new THREE.HemisphereLight(0xfff7ed, 0x22543d, 0.72);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff0d4, 1.45);
    sunLight.position.set(120, 200, 150);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -160;
    sunLight.shadow.camera.right = 160;
    sunLight.shadow.camera.top = 160;
    sunLight.shadow.camera.bottom = -160;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // 5. Physics World (Rapier3D)
    this.physics = new PhysicsWorld();
    this.physics.init();

    // 6. Geographic Open World Environment
    this.terrain = new Terrain(this.physics);
    this.scene.add(this.terrain.mesh);

    this.water = new Water(this.terrain.size, this.terrain.waterLevel);
    this.scene.add(this.water.mesh);

    this.roadSystem = new RoadSystem(this.terrain, this.physics);
    this.scene.add(this.roadSystem.group);

    this.keralaAssets = new KeralaAssets(this.terrain, this.physics);
    this.scene.add(this.keralaAssets.group);

    this.vegetation = new Vegetation(this.terrain);
    this.scene.add(this.vegetation.group);

    // 7. World Streamer for Performance (60 FPS Chunking)
    this.streamer = new WorldStreamer(160);
    this.keralaAssets.group.children.forEach((child) => this.streamer.registerObject(child));
    this.vegetation.group.children.forEach((child) => this.streamer.registerObject(child));

    // 8. Entities (Player, Bike, Car) with building collision
    this.character = new Character(this.terrain, this.roadSystem, this.keralaAssets.buildingColliders);
    this.scene.add(this.character.group);

    this.bike = new Bike(this.terrain, this.roadSystem, new THREE.Vector3(6, 0, 12), this.keralaAssets.buildingColliders);
    this.scene.add(this.bike.group);

    this.car = new Car(this.terrain, this.roadSystem, new THREE.Vector3(-8, 0, 14), this.keralaAssets.buildingColliders);
    this.scene.add(this.car.group);

    // 9. Controllers & UI
    this.input = new InputManager(this.canvas);
    this.touchControls = new TouchControls(this.input);
    this.sound = new SoundFX();
    this.cameraController = new CameraController(this.camera, this.terrain);
    this.hud = new HUD();
    this.minimap = new MiniMap('minimap-canvas');

    // Adapt pixel ratio for battery & performance on mobile
    const maxPR = this.input.isTouchDevice ? 1.5 : 2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPR));

    this.setupFastTravel();
    this.setupMuteUI();
    this.setupEvents();
    this.setupStartButton();

    // Start Master Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  private setupFastTravel(): void {
    this.hud.onFastTravelCallback = (tx: number, tz: number) => {
      let targetX = Math.max(-440, Math.min(440, tx));
      let targetZ = Math.max(-440, Math.min(440, tz));

      // If fast traveling near Cherupuzha river water, snap safely to bridge deck
      // Cherupuzha river is at z≈347 in game space (real lat 11.107°N projected)
      if (targetZ >= 310 && targetZ <= 380 && Math.abs(targetX) < 30) {
        targetX = -21;
        targetZ = 347;
      }

      if (this.playerMode === 'BIKE') {
        this.bike.position.set(targetX, 0, targetZ);
        this.bike.speed = 0;
        this.bike.resetOrientation();
        this.character.group.position.copy(this.bike.position);
      } else if (this.playerMode === 'CAR') {
        this.car.position.set(targetX, 0, targetZ);
        this.car.speed = 0;
        this.car.resetOrientation();
      } else {
        this.character.position.set(targetX, 0, targetZ);
        this.character.velocity.set(0, 0, 0);
        this.character.snapToGround();
      }
    };
  }

  private setupMuteUI(): void {
    const btn = document.getElementById('btn-toggle-sound');
    btn?.addEventListener('click', () => {
      const isMuted = this.sound.toggleMute();
      this.updateMuteUI(isMuted);
    });
  }

  private updateMuteUI(isMuted: boolean): void {
    const icon = document.getElementById('sound-icon');
    const text = document.getElementById('sound-text');
    if (icon && text) {
      if (isMuted) {
        icon.textContent = '🔇';
        text.textContent = 'Sound OFF [N]';
      } else {
        icon.textContent = '🔊';
        text.textContent = 'Sound ON [N]';
      }
    }
  }

  private setupStartButton(): void {
    const modal = document.getElementById('start-modal');
    const btn = document.getElementById('btn-start');

    const beginGame = (e?: Event) => {
      e?.preventDefault();
      this.sound.init();
      modal?.classList.add('hidden');
      try {
        this.canvas.requestPointerLock?.();
      } catch (_) {}
    };

    btn?.addEventListener('click', beginGame);
    btn?.addEventListener('touchend', beginGame);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) beginGame(e);
    });
    modal?.addEventListener('touchend', (e) => {
      if (e.target === modal) beginGame(e);
    });
  }

  private setupEvents(): void {
    const checkOrientation = () => {
      const hint = document.getElementById('orientation-hint');
      if (hint && this.touchControls.isMobileDevice) {
        if (window.innerHeight > window.innerWidth) {
          hint.classList.add('visible');
        } else {
          hint.classList.remove('visible');
        }
      }
    };

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      checkOrientation();
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(checkOrientation, 250);
    });

    document.getElementById('btn-close-hint')?.addEventListener('click', () => {
      document.getElementById('orientation-hint')?.classList.remove('visible');
    });

    setTimeout(checkOrientation, 800);
  }

  private handleVehicleMounting(): void {
    const interact = this.input.consumeInteract();
    let canMount = false;
    let mountType: 'BIKE' | 'CAR' | null = null;

    if (this.playerMode === 'ON_FOOT') {
      const distToBike = this.character.position.distanceTo(this.bike.position);
      const distToCar = this.character.position.distanceTo(this.car.position);

      if (distToBike < 3.2) {
        canMount = true;
        mountType = 'BIKE';
        this.hud.showInteractionPrompt(true, 'Press F / Tap RIDE to Drive Motorcycle');
        if (interact) {
          this.playerMode = 'BIKE';
          this.sound.playDoorThud();
          this.sound.startBikeEngine();
          this.character.setDrivingPose(true, true);
          this.character.group.position.copy(this.bike.position);
          this.hud.showInteractionPrompt(false);
        }
      } else if (distToCar < 3.8) {
        canMount = true;
        mountType = 'CAR';
        this.hud.showInteractionPrompt(true, 'Press F / Tap DRIVE to Drive Car');
        if (interact) {
          this.playerMode = 'CAR';
          this.sound.playDoorThud();
          this.sound.startCarEngine();
          this.character.setDrivingPose(true, false);
          this.hud.showInteractionPrompt(false);
        }
      } else {
        this.hud.showInteractionPrompt(false);
      }
    } else {
      canMount = true;
      mountType = this.playerMode;
      this.hud.showInteractionPrompt(true, 'Press F / Tap DISMOUNT to Exit');

      if (interact) {
        if (this.playerMode === 'BIKE') {
          this.sound.stopBikeEngine();
          this.sound.playDoorThud();
          const dismountOffset = new THREE.Vector3(1.6, 0, 0).applyEuler(new THREE.Euler(0, this.bike.rotation.y, 0));
          this.character.position.copy(this.bike.position).add(dismountOffset);
          this.character.setDrivingPose(false);
          this.character.snapToGround();
        } else if (this.playerMode === 'CAR') {
          this.sound.stopCarEngine();
          this.sound.playDoorThud();
          const dismountOffset = new THREE.Vector3(-1.8, 0, 0).applyEuler(new THREE.Euler(0, this.car.rotation.y, 0));
          this.character.position.copy(this.car.position).add(dismountOffset);
          this.character.setDrivingPose(false);
          this.character.snapToGround();
        }

        this.playerMode = 'ON_FOOT';
        this.hud.showInteractionPrompt(false);
      }
    }

    this.touchControls.updateUI(this.playerMode, canMount, mountType);
  }

  private checkWorldBoundariesAndWater(activePos: THREE.Vector3): void {
    activePos.x = Math.max(-450, Math.min(450, activePos.x));
    activePos.z = Math.max(-450, Math.min(450, activePos.z));

    // Cherupuzha River Water Safety
    // River valley at z≈347 (from real OSM lat 11.107°N → game z ≈ +347m)
    if (activePos.y < 0.5 && activePos.z >= 305 && activePos.z <= 390) {
      activePos.set(-21, 4.5, 347);
      if (this.playerMode === 'BIKE') {
        this.bike.resetOrientation();
      } else if (this.playerMode === 'CAR') {
        this.car.resetOrientation();
      } else {
        this.character.snapToGround();
      }
    }
  }

  private animate(): void {
    requestAnimationFrame(this.animate);


    const delta = Math.min(this.clock.getDelta(), 0.08);
    const time = this.clock.getElapsedTime();

    // 1. Step Rapier Physics World
    this.physics.step(delta);

    // 2. Water Ripples
    this.water.update(time);

    // 3. Map Toggle (Key M)
    if (this.input.consumeMap()) {
      this.hud.toggleWorldMap();
    }

    // 4. Sound Mute Toggle (Key N)
    if (this.input.consumeMute()) {
      const isMuted = this.sound.toggleMute();
      this.updateMuteUI(isMuted);
    }

    // 5. Vehicle Mounting
    if (!this.hud.isMapOpen) {
      this.handleVehicleMounting();
    }

    // 6. Vehicle Lights & Horn & Reset
    if (this.input.consumeHeadlight()) {
      if (this.playerMode === 'BIKE') this.bike.toggleHeadlights();
      if (this.playerMode === 'CAR') this.car.toggleHeadlights();
    }

    if (this.input.hornPressed) {
      if (this.playerMode === 'BIKE') this.sound.playHorn(false);
      if (this.playerMode === 'CAR') this.sound.playHorn(true);
      this.input.hornPressed = false;
    }

    if (this.input.consumeReset()) {
      if (this.playerMode === 'BIKE') this.bike.resetOrientation();
      if (this.playerMode === 'CAR') this.car.resetOrientation();
    }

    // 7. Update Active Controller (freeze input if map modal is open!)
    const effectiveInput = this.hud.isMapOpen
      ? {
          forward: false,
          backward: false,
          left: false,
          right: false,
          sprint: false,
          jump: false
        }
      : this.input;

    let currentSpeedKmH = 0;
    let activePos = this.character.position;
    let activeHeading = this.character.rotation.y;

    if (this.playerMode === 'ON_FOOT') {
      this.character.update(delta, effectiveInput, this.cameraController.yaw);
      currentSpeedKmH = this.character.getSpeedKmH();
      activePos = this.character.position;
      activeHeading = this.character.rotation.y;
    } else if (this.playerMode === 'BIKE') {
      this.bike.update(delta, effectiveInput);
      currentSpeedKmH = this.bike.getSpeedKmH();
      activePos = this.bike.position;
      activeHeading = this.bike.rotation.y;

      this.character.group.position.copy(this.bike.position);
      this.character.group.rotation.copy(this.bike.group.rotation);

      this.sound.updateBikeEngine(currentSpeedKmH, effectiveInput.forward);
    } else if (this.playerMode === 'CAR') {
      this.car.update(delta, effectiveInput);
      currentSpeedKmH = this.car.getSpeedKmH();
      activePos = this.car.position;
      activeHeading = this.car.rotation.y;

      this.sound.updateCarEngine(currentSpeedKmH, effectiveInput.forward);
    }

    this.checkWorldBoundariesAndWater(activePos);

    // 8. World Streaming Update (Chunk LOD based on position)
    this.streamer.update(activePos);

    // 9. Camera Controller Update
    if (!this.hud.isMapOpen) {
      const mouseDelta = this.input.getAndResetMouseDelta();
      this.cameraController.handleMouseDelta(mouseDelta.x, mouseDelta.y);
    }
    if (this.input.consumeCameraSwitch()) {
      this.cameraController.cycleViewMode();
    }
    this.cameraController.update(activePos, activeHeading, this.playerMode, currentSpeedKmH);

    // 10. UI Updates (Speedometer, Minimap, World Map, Region Toast)
    this.hud.updateSpeedometer(currentSpeedKmH, this.playerMode);
    this.minimap.render(activePos, activeHeading, this.bike, this.car, this.roadSystem, this.hud.landmarks);
    this.hud.renderWorldMap(activePos, activeHeading, this.bike, this.car, this.roadSystem);
    this.hud.checkRegion(activePos.x, activePos.z);

    // 11. Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Start Game on load
window.addEventListener('DOMContentLoaded', () => {
  new KeralaHorizonsGame();
});
