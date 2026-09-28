import * as Cesium from 'cesium';
import { CesiumViewerManager } from '../cesium/CesiumViewer';
import { GeoLibreBasemapManager, BasemapType } from '../geolibre/GeoLibreBasemap';
import { loadGooglePhotorealistic3DTileset, hasGoogleMapsApiKey } from '../cesium/GoogleTileset';
import { PlayerController } from '../player/PlayerController';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { InputManager } from './InputManager';
import { MANJERI_CENTER, degreesToCartesian } from '../utils/coordinates';

export type GameStatus = 'INITIALIZING' | 'LOADING_TILES' | 'SPAWNING_PLAYER' | 'READY' | 'ERROR';

export interface GameEngineCallbacks {
  onStatusChange?: (status: GameStatus, message?: string) => void;
  onError?: (error: Error) => void;
  onPlayerStats?: (stats: {
    speedKmH: number;
    lat: number;
    lon: number;
    alt: number;
    headingDeg: number;
    activeBasemap: BasemapType;
  }) => void;
  onBasemapChange?: (basemap: BasemapType) => void;
}

export class GameEngine {
  public status: GameStatus = 'INITIALIZING';
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  private viewerManager!: CesiumViewerManager;
  private basemapManager!: GeoLibreBasemapManager;
  private input!: InputManager;
  private player!: PlayerController;
  private cameraController!: ThirdPersonCamera;
  private tileset: Cesium.Cesium3DTileset | null = null;

  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
  }

  public async start(): Promise<void> {
    try {
      this.updateStatus('INITIALIZING', 'Initializing Cesium 3D Globe...');

      // 1. Initialize Cesium Viewer & GeoLibre Basemap Manager
      this.viewerManager = new CesiumViewerManager(this.container);
      this.basemapManager = new GeoLibreBasemapManager(this.viewerManager.viewer);

      // 2. Load Google Photorealistic 3D Tiles if key is present, or fallback seamlessly to GeoLibre
      if (hasGoogleMapsApiKey()) {
        try {
          this.updateStatus('LOADING_TILES', 'Connecting to Google Photorealistic 3D Tiles...');
          this.tileset = await loadGooglePhotorealistic3DTileset();
          this.viewerManager.viewer.scene.primitives.add(this.tileset);
          this.basemapManager.setGoogleTileset(this.tileset);
          await this.basemapManager.switchBasemap('google-3d');
        } catch (tilesError) {
          console.warn('Google 3D Tiles unavailable, activating GeoLibre Keyless Satellite...', tilesError);
          await this.basemapManager.switchBasemap('esri-satellite');
        }
      } else {
        this.updateStatus('LOADING_TILES', 'Activating GeoLibre Keyless Satellite Imagery...');
        await this.basemapManager.switchBasemap('esri-satellite');
      }

      // 3. Position view and spawn player at Manjeri, Kerala (11.12° N, 76.12° E)
      this.updateStatus('SPAWNING_PLAYER', 'Locating ground level in Manjeri...');

      // Sample ground elevation at central Manjeri
      const initialHeight = await this.viewerManager.sampleHeightAt(
        MANJERI_CENTER.longitude,
        MANJERI_CENTER.latitude
      );

      // 4. Initialize Player & Camera
      this.player = new PlayerController(
        this.viewerManager.viewer,
        MANJERI_CENTER.longitude,
        MANJERI_CENTER.latitude,
        initialHeight + 1.0 // spawn slightly above ground
      );

      this.cameraController = new ThirdPersonCamera(this.viewerManager.viewer);
      this.cameraController.distance = 6.0;

      // 5. Initialize Input
      this.input = new InputManager(this.container);

      // Disable default Cesium camera navigation in favor of our third-person gameplay camera
      this.viewerManager.setGameControlsMode(true);

      // 6. Frame player immediately with third-person camera
      this.cameraController.update(this.player.cartesianPosition, 1.0);

      this.updateStatus('READY', 'Explore Manjeri, Kerala');

      // 7. Start Main 60 FPS Game Loop
      this.isRunning = true;
      this.lastTime = performance.now();
      this.loop = this.loop.bind(this);
      this.animationFrameId = requestAnimationFrame(this.loop);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.updateStatus('ERROR', error.message);
      this.callbacks.onError?.(error);
    }
  }

  private async performIntroFlight(): Promise<void> {
    const targetPos = degreesToCartesian(
      MANJERI_CENTER.longitude,
      MANJERI_CENTER.latitude,
      MANJERI_CENTER.height + 15.0
    );

    return new Promise((resolve) => {
      this.viewerManager.viewer.camera.flyTo({
        destination: targetPos,
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-20),
          roll: 0.0
        },
        duration: 2.0,
        complete: () => {
          resolve();
        }
      });
    });
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    const delta = Math.min((currentTime - this.lastTime) / 1000.0, 0.08); // cap max delta to prevent spikes
    this.lastTime = currentTime;

    // 1. Process mouse and zoom input for third-person camera
    const { deltaX, deltaY } = this.input.consumeMouseDelta();
    const zoomDelta = this.input.consumeZoomDelta();
    this.cameraController.handleInput(deltaX, deltaY, zoomDelta);

    // 2. Update player position & animation relative to camera view azimuth
    this.player.update(delta, this.input.state, this.cameraController.yaw);

    // 3. Update third-person follow camera
    this.cameraController.update(this.player.cartesianPosition, delta);

    // 4. Emit stats for HUD and Minimap
    if (this.callbacks.onPlayerStats) {
      this.callbacks.onPlayerStats({
        speedKmH: this.player.getSpeedKmH(),
        lat: this.player.latitude,
        lon: this.player.longitude,
        alt: this.player.height,
        headingDeg: (this.player.heading * 180) / Math.PI,
        activeBasemap: this.basemapManager?.getCurrentBasemap() ?? 'esri-satellite'
      });
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public async switchBasemap(type: BasemapType): Promise<void> {
    if (!this.basemapManager) return;

    if (type === 'google-3d' && !this.tileset) {
      if (hasGoogleMapsApiKey()) {
        try {
          this.tileset = await loadGooglePhotorealistic3DTileset();
          this.viewerManager.viewer.scene.primitives.add(this.tileset);
          this.basemapManager.setGoogleTileset(this.tileset);
        } catch (err) {
          console.error('Failed to load Google 3D tiles on demand:', err);
          throw err;
        }
      } else {
        throw new Error('Google Maps Platform API key is required for Google 3D Tiles.');
      }
    }

    await this.basemapManager.switchBasemap(type);
    this.callbacks.onBasemapChange?.(type);
  }

  public getCurrentBasemap(): BasemapType {
    return this.basemapManager?.getCurrentBasemap() ?? 'esri-satellite';
  }

  public requestPointerLock(): void {
    this.input?.requestPointerLock();
  }

  public teleportTo(longitude: number, latitude: number): void {
    if (!this.player) return;
    this.player.setLocation(longitude, latitude);
  }

  private updateStatus(status: GameStatus, message?: string): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status, message);
  }

  public destroy(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.input?.destroy();
    this.player?.destroy();
    this.viewerManager?.destroy();
  }
}
