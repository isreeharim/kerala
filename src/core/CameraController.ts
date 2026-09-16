import * as THREE from 'three';
import { Terrain } from '../world/Terrain';

export type CameraViewMode = 'CLOSE' | 'FAR' | 'FIRST_PERSON';
export type PlayerMode = 'ON_FOOT' | 'BIKE' | 'CAR';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public viewMode: CameraViewMode = 'CLOSE';
  public yaw: number = Math.PI;
  public pitch: number = 0.25;

  private terrain: Terrain;

  constructor(camera: THREE.PerspectiveCamera, terrain: Terrain) {
    this.camera = camera;
    this.terrain = terrain;
  }

  public cycleViewMode(): void {
    if (this.viewMode === 'CLOSE') this.viewMode = 'FAR';
    else if (this.viewMode === 'FAR') this.viewMode = 'FIRST_PERSON';
    else this.viewMode = 'CLOSE';
  }

  public handleMouseDelta(deltaX: number, deltaY: number): void {
    this.yaw -= deltaX * 0.003;
    this.pitch = Math.max(-0.25, Math.min(0.95, this.pitch + deltaY * 0.003));
  }

  public update(
    anchorPos: THREE.Vector3,
    anchorYaw: number,
    playerMode: PlayerMode,
    currentSpeedKmH: number = 0
  ): void {
    // Determine base distance and height based on mode & speed
    let baseDistance = 4.8;
    let baseHeight = 1.6;

    if (playerMode === 'BIKE') {
      baseDistance = 4.2;
      baseHeight = 1.4;
    } else if (playerMode === 'CAR') {
      // Dynamic zoom-out proportional to speed
      const speedZoom = Math.min(3.5, (currentSpeedKmH / 100) * 3.5);
      baseDistance = 6.2 + speedZoom;
      baseHeight = 1.9;
    }

    if (this.viewMode === 'FAR') {
      baseDistance *= 1.6;
      baseHeight *= 1.4;
    } else if (this.viewMode === 'FIRST_PERSON') {
      baseDistance = 0.35;
      baseHeight = 0.35;
    }

    // Offset camera behind target based on yaw and pitch
    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * baseDistance,
      baseHeight + Math.sin(this.pitch) * baseDistance * 0.6,
      Math.cos(this.yaw) * baseDistance
    );

    const desiredCamPos = anchorPos.clone().add(offset);

    // Prevent camera clipping through terrain
    const minCamY = this.terrain.getHeight(desiredCamPos.x, desiredCamPos.z) + 0.85;
    if (desiredCamPos.y < minCamY) {
      desiredCamPos.y = minCamY;
    }

    // Smooth spring-arm interpolation
    const lerpFactor = playerMode === 'ON_FOOT' ? 0.16 : 0.12;
    this.camera.position.lerp(desiredCamPos, lerpFactor);

    // Look slightly above target
    const lookTarget = anchorPos.clone().add(new THREE.Vector3(0, 0.45, 0));
    this.camera.lookAt(lookTarget);
  }
}
