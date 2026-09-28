import * as Cesium from 'cesium';

export class PlayerModel {
  public position: Cesium.Cartesian3;
  public heading: number = 0; // radians clockwise from North
  private viewer: Cesium.Viewer;

  // Cached positions updated each frame
  private torsoPos: Cesium.Cartesian3 = new Cesium.Cartesian3();
  private vestPos: Cesium.Cartesian3 = new Cesium.Cartesian3();
  private headPos: Cesium.Cartesian3 = new Cesium.Cartesian3();
  private capPos: Cesium.Cartesian3 = new Cesium.Cartesian3();
  private leftLegPos: Cesium.Cartesian3 = new Cesium.Cartesian3();
  private rightLegPos: Cesium.Cartesian3 = new Cesium.Cartesian3();
  private leftArmPos: Cesium.Cartesian3 = new Cesium.Cartesian3();
  private rightArmPos: Cesium.Cartesian3 = new Cesium.Cartesian3();
  private groundPos: Cesium.Cartesian3 = new Cesium.Cartesian3();
  private orientation: Cesium.Quaternion = new Cesium.Quaternion();

  private entities: Cesium.Entity[] = [];
  private animTimer: number = 0;

  constructor(viewer: Cesium.Viewer, initialPosition: Cesium.Cartesian3) {
    this.viewer = viewer;
    this.position = initialPosition.clone();
    this.groundPos = initialPosition.clone();

    // 1. Ground Indicator Ring (shows exact position on terrain)
    const ring = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(() => this.groundPos, false),
      ellipse: {
        semiMinorAxis: 0.7,
        semiMajorAxis: 0.7,
        material: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.65),
        outline: true,
        outlineColor: Cesium.Color.WHITE
      }
    });
    this.entities.push(ring);

    // 2. Torso (Sky Blue Shirt)
    const torso = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(() => this.torsoPos, false),
      orientation: new Cesium.CallbackProperty(() => this.orientation, false),
      box: {
        dimensions: new Cesium.Cartesian3(0.5, 0.28, 0.65),
        material: Cesium.Color.fromCssColorString('#0284c7'),
        shadows: Cesium.ShadowMode.ENABLED
      }
    });
    this.entities.push(torso);

    // 3. Vest (Brown Leather)
    const vest = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(() => this.vestPos, false),
      orientation: new Cesium.CallbackProperty(() => this.orientation, false),
      box: {
        dimensions: new Cesium.Cartesian3(0.54, 0.32, 0.55),
        material: Cesium.Color.fromCssColorString('#78350f'),
        shadows: Cesium.ShadowMode.ENABLED
      }
    });
    this.entities.push(vest);

    // 4. Head
    const head = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(() => this.headPos, false),
      ellipsoid: {
        radii: new Cesium.Cartesian3(0.18, 0.18, 0.2),
        material: Cesium.Color.fromCssColorString('#d97706'),
        shadows: Cesium.ShadowMode.ENABLED
      }
    });
    this.entities.push(head);

    // 5. Explorer Cap
    const cap = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(() => this.capPos, false),
      orientation: new Cesium.CallbackProperty(() => this.orientation, false),
      box: {
        dimensions: new Cesium.Cartesian3(0.24, 0.26, 0.08),
        material: Cesium.Color.fromCssColorString('#15803d'),
        shadows: Cesium.ShadowMode.ENABLED
      }
    });
    this.entities.push(cap);

    // 6. Left Leg
    const leftLeg = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(() => this.leftLegPos, false),
      orientation: new Cesium.CallbackProperty(() => this.orientation, false),
      box: {
        dimensions: new Cesium.Cartesian3(0.18, 0.2, 0.68),
        material: Cesium.Color.fromCssColorString('#1e293b'),
        shadows: Cesium.ShadowMode.ENABLED
      }
    });
    this.entities.push(leftLeg);

    // 7. Right Leg
    const rightLeg = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(() => this.rightLegPos, false),
      orientation: new Cesium.CallbackProperty(() => this.orientation, false),
      box: {
        dimensions: new Cesium.Cartesian3(0.18, 0.2, 0.68),
        material: Cesium.Color.fromCssColorString('#1e293b'),
        shadows: Cesium.ShadowMode.ENABLED
      }
    });
    this.entities.push(rightLeg);

    // 8. Left Arm
    const leftArm = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(() => this.leftArmPos, false),
      orientation: new Cesium.CallbackProperty(() => this.orientation, false),
      box: {
        dimensions: new Cesium.Cartesian3(0.14, 0.16, 0.58),
        material: Cesium.Color.fromCssColorString('#0284c7'),
        shadows: Cesium.ShadowMode.ENABLED
      }
    });
    this.entities.push(leftArm);

    // 9. Right Arm
    const rightArm = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(() => this.rightArmPos, false),
      orientation: new Cesium.CallbackProperty(() => this.orientation, false),
      box: {
        dimensions: new Cesium.Cartesian3(0.14, 0.16, 0.58),
        material: Cesium.Color.fromCssColorString('#0284c7'),
        shadows: Cesium.ShadowMode.ENABLED
      }
    });
    this.entities.push(rightArm);

    // 10. Player Nameplate
    const nameplate = this.viewer.entities.add({
      position: new Cesium.CallbackPositionProperty(() => this.headPos, false),
      label: {
        text: '🚶 Manjeri Explorer',
        font: 'bold 13px Outfit, sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -32),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    this.entities.push(nameplate);

    this.updateTransform(0, false, false);
  }

  private computeOffsetPosition(
    rootPosition: Cesium.Cartesian3,
    headingRad: number,
    offsetX: number,
    offsetY: number,
    offsetZ: number
  ): Cesium.Cartesian3 {
    const cos = Math.cos(headingRad);
    const sin = Math.sin(headingRad);

    const worldEast = offsetX * cos + offsetY * sin;
    const worldNorth = -offsetX * sin + offsetY * cos;

    const enuTransform = Cesium.Transforms.eastNorthUpToFixedFrame(rootPosition);
    const localVec = new Cesium.Cartesian4(worldEast, worldNorth, offsetZ, 1.0);
    const worldPos4 = Cesium.Matrix4.multiplyByVector(enuTransform, localVec, new Cesium.Cartesian4());

    return new Cesium.Cartesian3(worldPos4.x, worldPos4.y, worldPos4.z);
  }

  public updateTransform(delta: number, isMoving: boolean, isSprinting: boolean): void {
    if (isMoving) {
      this.animTimer += delta * (isSprinting ? 14 : 9);
    } else {
      this.animTimer = 0;
    }

    const swing = isMoving ? Math.sin(this.animTimer) * (isSprinting ? 0.35 : 0.22) : 0;
    const hpr = new Cesium.HeadingPitchRoll(this.heading, 0, 0);
    this.orientation = Cesium.Transforms.headingPitchRollQuaternion(this.position, hpr);

    this.groundPos = this.computeOffsetPosition(this.position, this.heading, 0, 0, 0.05);
    this.torsoPos = this.computeOffsetPosition(this.position, this.heading, 0, 0, 1.05);
    this.vestPos = this.computeOffsetPosition(this.position, this.heading, 0, 0, 1.03);
    this.headPos = this.computeOffsetPosition(this.position, this.heading, 0, 0, 1.55);
    this.capPos = this.computeOffsetPosition(this.position, this.heading, 0, 0.04, 1.66);

    const leftLegOffset = swing;
    const rightLegOffset = -swing;
    this.leftLegPos = this.computeOffsetPosition(this.position, this.heading, -0.16, leftLegOffset, 0.45);
    this.rightLegPos = this.computeOffsetPosition(this.position, this.heading, 0.16, rightLegOffset, 0.45);

    const armSwing = -swing * 0.8;
    this.leftArmPos = this.computeOffsetPosition(this.position, this.heading, -0.34, armSwing, 1.0);
    this.rightArmPos = this.computeOffsetPosition(this.position, this.heading, 0.34, -armSwing, 1.0);
  }

  public setPosition(newPosition: Cesium.Cartesian3): void {
    this.position = newPosition.clone();
  }

  public destroy(): void {
    this.entities.forEach((e) => this.viewer.entities.remove(e));
    this.entities = [];
  }
}
