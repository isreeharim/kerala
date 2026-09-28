import * as Cesium from 'cesium';

export class ThirdPersonCamera {
  public yaw: number = 0; // horizontal angle in radians (0 = looking North)
  public pitch: number = Cesium.Math.toRadians(20); // vertical angle (radians above horizon)
  public distance: number = 6.5; // distance from character in meters
  public minDistance: number = 2.0;
  public maxDistance: number = 25.0;

  private viewer: Cesium.Viewer;
  private currentCameraPos: Cesium.Cartesian3 = new Cesium.Cartesian3();
  private hasInitialized: boolean = false;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  /**
   * Updates camera rotation and zoom from user input deltas.
   */
  public handleInput(deltaX: number, deltaY: number, zoomDelta: number): void {
    const mouseSensitivity = 0.0035;
    this.yaw += deltaX * mouseSensitivity;

    // Pitch: limit between -10 degrees (looking slightly up) and +75 degrees (overhead)
    const minPitch = Cesium.Math.toRadians(-10);
    const maxPitch = Cesium.Math.toRadians(75);
    this.pitch -= deltaY * mouseSensitivity;
    this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));

    // Zoom
    if (zoomDelta !== 0) {
      const zoomStep = 1.2;
      this.distance += zoomDelta * zoomStep;
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    }
  }

  /**
   * Calculates the world position of the camera behind the player
   * using the local East-North-Up coordinate system at the player's location.
   */
  public update(playerCartesian: Cesium.Cartesian3, delta: number): void {
    // Height of look-at target (character chest height ~1.3m above ground)
    const targetHeightOffset = 1.3;

    // Local camera offset relative to player:
    // Yaw = 0 means camera is South of player, looking North (+Y in ENU)
    // Distance * cos(pitch) is the ground-plane projection
    const groundRadius = this.distance * Math.cos(this.pitch);
    const localEast = -groundRadius * Math.sin(this.yaw);
    const localNorth = -groundRadius * Math.cos(this.yaw);
    const localUp = this.distance * Math.sin(this.pitch) + targetHeightOffset;

    // Transform local ENU offset to global Cartesian3
    const enuTransform = Cesium.Transforms.eastNorthUpToFixedFrame(playerCartesian);
    const localVec = new Cesium.Cartesian4(localEast, localNorth, localUp, 1.0);
    const targetCamPos4 = Cesium.Matrix4.multiplyByVector(enuTransform, localVec, new Cesium.Cartesian4());
    const targetCamPos = new Cesium.Cartesian3(targetCamPos4.x, targetCamPos4.y, targetCamPos4.z);

    // Smooth camera lag/lerp for fluid cinematic motion
    if (!this.hasInitialized) {
      this.currentCameraPos = targetCamPos.clone();
      this.hasInitialized = true;
    } else {
      const lerpSpeed = Math.min(1.0, 14.0 * delta);
      Cesium.Cartesian3.lerp(this.currentCameraPos, targetCamPos, lerpSpeed, this.currentCameraPos);
    }

    // Target point to look at (character chest)
    const targetLocalVec = new Cesium.Cartesian4(0, 0, targetHeightOffset, 1.0);
    const lookTarget4 = Cesium.Matrix4.multiplyByVector(enuTransform, targetLocalVec, new Cesium.Cartesian4());
    const lookTarget = new Cesium.Cartesian3(lookTarget4.x, lookTarget4.y, lookTarget4.z);

    // Compute direction vector from camera to character
    const direction = Cesium.Cartesian3.subtract(lookTarget, this.currentCameraPos, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(direction, direction);

    // Up vector from local ENU
    const upVec = new Cesium.Cartesian4(0, 0, 1, 0);
    const worldUp4 = Cesium.Matrix4.multiplyByVector(enuTransform, upVec, new Cesium.Cartesian4());
    const up = new Cesium.Cartesian3(worldUp4.x, worldUp4.y, worldUp4.z);
    Cesium.Cartesian3.normalize(up, up);

    // Apply to Cesium camera using setView so the view matrix actually updates
    this.viewer.camera.setView({
      destination: this.currentCameraPos,
      orientation: {
        direction: direction,
        up: up
      }
    });
  }
}
