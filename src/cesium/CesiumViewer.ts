import * as Cesium from 'cesium';
import { MANJERI_CENTER, degreesToCartesian } from '../utils/coordinates';

export class CesiumViewerManager {
  public viewer: Cesium.Viewer;
  private container: HTMLElement;

  constructor(container: HTMLElement | string) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) {
      throw new Error(`Cesium container element not found`);
    }
    this.container = el;

    // Initialize Cesium viewer with game-optimized settings (no unnecessary default widgets)
    this.viewer = new Cesium.Viewer(this.container, {
      animation: false,
      timeline: false,
      geocoder: false,
      homeButton: false,
      baseLayerPicker: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      shouldAnimate: true,
      requestRenderMode: false, // continuous render for 60 FPS real-time game
      maximumRenderTimeChange: Infinity
    });

    this.configureScene();
  }

  private configureScene(): void {
    const { scene } = this.viewer;

    // Enable terrain/tile depth testing so characters and objects don't clip through ground
    scene.globe.depthTestAgainstTerrain = true;

    // Enable atmospheric lighting and HDR
    scene.highDynamicRange = true;
    scene.globe.enableLighting = true;

    // Enhance sky atmosphere and fog
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true;
    }
    scene.fog.enabled = true;
    scene.fog.density = 0.0002;

    // Set initial camera directly over central Manjeri (no nationwide zoom-out)
    const initialPosition = degreesToCartesian(
      MANJERI_CENTER.longitude,
      MANJERI_CENTER.latitude,
      MANJERI_CENTER.height + 400 // view from 400m above town looking down
    );

    this.viewer.camera.setView({
      destination: initialPosition,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-65), // angled bird's eye view
        roll: 0.0
      }
    });
  }

  /**
   * Samples the ground elevation (height in meters) at a given Cartographic coordinate
   * using the loaded 3D Tileset or Globe terrain.
   */
  public async sampleHeightAt(longitude: number, latitude: number): Promise<number> {
    const cartographic = Cesium.Cartographic.fromDegrees(longitude, latitude);

    try {
      // 1. Try clampToHeightMostDetailed across loaded 3D Tiles
      const cartesian = Cesium.Cartographic.toCartesian(cartographic);
      const clamped = this.viewer.scene.clampToHeight(cartesian);
      if (clamped) {
        const clampedCarto = Cesium.Cartographic.fromCartesian(clamped);
        if (clampedCarto && clampedCarto.height > 1) {
          return clampedCarto.height;
        }
      }
    } catch {
      // fallback to globe or default
    }

    // 2. Fallback to globe height
    const globeHeight = this.viewer.scene.globe.getHeight(cartographic);
    if (typeof globeHeight === 'number' && globeHeight > 0) {
      return globeHeight;
    }

    return MANJERI_CENTER.height;
  }

  /**
   * Sets whether default Cesium mouse camera navigation is enabled.
   * Disabled during third-person gameplay so our player camera has full control.
   */
  public setGameControlsMode(isGameplay: boolean): void {
    const controller = this.viewer.scene.screenSpaceCameraController;
    controller.enableRotate = !isGameplay;
    controller.enableTranslate = !isGameplay;
    controller.enableZoom = !isGameplay;
    controller.enableTilt = !isGameplay;
    controller.enableLook = !isGameplay;
  }

  public destroy(): void {
    if (!this.viewer.isDestroyed()) {
      this.viewer.destroy();
    }
  }
}
