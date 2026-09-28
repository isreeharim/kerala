import * as Cesium from 'cesium';
import { PlayerModel } from './PlayerModel';
import { InputState } from '../game/InputManager';
import { degreesToCartesian, cartesianToDegrees, MANJERI_CENTER } from '../utils/coordinates';

export class PlayerController {
  public longitude: number = MANJERI_CENTER.longitude;
  public latitude: number = MANJERI_CENTER.latitude;
  public height: number = MANJERI_CENTER.height;
  public cartesianPosition: Cesium.Cartesian3;

  public model: PlayerModel;

  // Speeds in meters per second
  public walkSpeed: number = 4.8;
  public runSpeed: number = 9.5;
  private currentSpeed: number = 0;

  public get heading(): number {
    return this.model?.heading ?? 0;
  }

  // Jump and vertical physics
  public isGrounded: boolean = true;
  private verticalVelocity: number = 0;
  private gravity: number = 22.0;
  private jumpForce: number = 7.5;
  private groundHeight: number = MANJERI_CENTER.height;

  // Horizontal velocity vector (East, North)
  private velocityEast: number = 0;
  private velocityNorth: number = 0;

  private viewer: Cesium.Viewer;

  constructor(viewer: Cesium.Viewer, initialLon?: number, initialLat?: number, initialHeight?: number) {
    this.viewer = viewer;
    this.longitude = initialLon ?? MANJERI_CENTER.longitude;
    this.latitude = initialLat ?? MANJERI_CENTER.latitude;
    this.height = initialHeight ?? MANJERI_CENTER.height;
    this.groundHeight = this.height;

    this.cartesianPosition = degreesToCartesian(this.longitude, this.latitude, this.height);
    this.model = new PlayerModel(this.viewer, this.cartesianPosition);
  }

  public update(delta: number, input: InputState, cameraYaw: number): void {
    // 1. Calculate desired movement direction relative to camera yaw
    let moveForward = 0;
    let moveRight = 0;

    if (input.forward) moveForward += 1;
    if (input.backward) moveForward -= 1;
    if (input.left) moveRight -= 1;
    if (input.right) moveRight += 1;

    const isInputActive = moveForward !== 0 || moveRight !== 0;
    const targetSpeed = input.sprint ? this.runSpeed : this.walkSpeed;

    if (isInputActive) {
      // Local input angle relative to camera view
      const inputAngle = Math.atan2(moveRight, moveForward);
      // World heading angle clockwise from North:
      const moveHeading = cameraYaw + inputAngle;

      // Target velocity components in meters/second
      const targetVelEast = Math.sin(moveHeading) * targetSpeed;
      const targetVelNorth = Math.cos(moveHeading) * targetSpeed;

      // Smooth acceleration
      const accel = 14.0 * delta;
      this.velocityEast += (targetVelEast - this.velocityEast) * Math.min(1.0, accel);
      this.velocityNorth += (targetVelNorth - this.velocityNorth) * Math.min(1.0, accel);

      // Smoothly rotate character model to face movement direction
      let headingDiff = moveHeading - this.model.heading;
      while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;
      while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
      this.model.heading += headingDiff * Math.min(1.0, 12.0 * delta);
    } else {
      // Smooth deceleration / friction
      const decel = 12.0 * delta;
      this.velocityEast += (0 - this.velocityEast) * Math.min(1.0, decel);
      this.velocityNorth += (0 - this.velocityNorth) * Math.min(1.0, decel);
    }

    this.currentSpeed = Math.hypot(this.velocityEast, this.velocityNorth);
    const isMoving = this.currentSpeed > 0.3;

    // 2. Advance geographic coordinates based on velocity
    if (this.currentSpeed > 0.05) {
      const latRad = Cesium.Math.toRadians(this.latitude);
      const metersPerDegreeLat = 111320.0;
      const metersPerDegreeLon = 111320.0 * Math.cos(latRad);

      this.latitude += (this.velocityNorth * delta) / metersPerDegreeLat;
      this.longitude += (this.velocityEast * delta) / metersPerDegreeLon;
    }

    // 3. Jump and Gravity
    if (this.isGrounded) {
      if (input.jump) {
        this.verticalVelocity = this.jumpForce;
        this.isGrounded = false;
      } else {
        this.verticalVelocity = 0;
        this.height = this.groundHeight;
      }
    } else {
      this.verticalVelocity -= this.gravity * delta;
      this.height += this.verticalVelocity * delta;

      if (this.height <= this.groundHeight) {
        this.height = this.groundHeight;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    // 4. Update Cartesian world position and model
    this.cartesianPosition = degreesToCartesian(this.longitude, this.latitude, this.height);
    this.model.setPosition(this.cartesianPosition);
    this.model.updateTransform(delta, isMoving, input.sprint);

    // 5. Asynchronously sample 3D tile ground elevation
    this.sampleGroundElevation();
  }

  /**
   * Samples elevation from the loaded Google Photorealistic 3D Tiles or Globe.
   */
  private sampleGroundElevation(): void {
    try {
      const clamped = this.viewer.scene.clampToHeight(this.cartesianPosition);
      if (clamped) {
        const carto = Cesium.Cartographic.fromCartesian(clamped);
        if (carto && carto.height > 0) {
          // Smooth ground height adaptation to prevent jerky stairs
          const targetGround = carto.height;
          if (Math.abs(targetGround - this.groundHeight) < 15.0) {
            this.groundHeight += (targetGround - this.groundHeight) * 0.25;
          } else {
            this.groundHeight = targetGround;
          }
        }
      }
    } catch {}
  }

  public setLocation(longitude: number, latitude: number, height?: number): void {
    this.longitude = longitude;
    this.latitude = latitude;
    if (typeof height === 'number') {
      this.height = height;
      this.groundHeight = height;
    }
    this.cartesianPosition = degreesToCartesian(this.longitude, this.latitude, this.height);
    this.model.setPosition(this.cartesianPosition);
    this.model.updateTransform(0, false, false);
  }

  public getSpeedKmH(): number {
    return Math.round(this.currentSpeed * 3.6);
  }

  public destroy(): void {
    this.model.destroy();
  }
}
