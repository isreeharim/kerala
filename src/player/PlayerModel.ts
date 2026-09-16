import * as Cesium from 'cesium';

export class PlayerModel {
  public position: Cesium.Cartesian3;
  public heading: number = 0; // radians clockwise from North
  private viewer: Cesium.Viewer;

  private torsoEntity: Cesium.Entity;
  private vestEntity: Cesium.Entity;
  private headEntity: Cesium.Entity;
  private capEntity: Cesium.Entity;
  private leftLegEntity: Cesium.Entity;
  private rightLegEntity: Cesium.Entity;
  private leftArmEntity: Cesium.Entity;
  private rightArmEntity: Cesium.Entity;

  private animTimer: number = 0;

  constructor(viewer: Cesium.Viewer, initialPosition: Cesium.Cartesian3) {
    this.viewer = viewer;
    this.position = initialPosition.clone();

    // 1. Torso (Explorer Blue Shirt)
    this.torsoEntity = this.viewer.entities.add({
      position: this.position,
      box: {
        dimensions: new Cesium.Cartesian3(0.5, 0.28, 0.65),
        material: Cesium.Color.fromCssColorString('#0284c7'), // Sky blue explorer shirt
        shadows: Cesium.ShadowMode.ENABLED
      }
    });

    // 2. Leather Explorer Vest
    this.vestEntity = this.viewer.entities.add({
      position: this.position,
      box: {
        dimensions: new Cesium.Cartesian3(0.54, 0.32, 0.55),
        material: Cesium.Color.fromCssColorString('#78350f'), // Brown leather vest
        shadows: Cesium.ShadowMode.ENABLED
      }
    });

    // 3. Head (Skin Tone)
    this.headEntity = this.viewer.entities.add({
      position: this.position,
      ellipsoid: {
        radii: new Cesium.Cartesian3(0.18, 0.18, 0.2),
        material: Cesium.Color.fromCssColorString('#c68642'), // Indian skin tone
        shadows: Cesium.ShadowMode.ENABLED
      }
    });

    // 4. Explorer Cap
    this.capEntity = this.viewer.entities.add({
      position: this.position,
      box: {
        dimensions: new Cesium.Cartesian3(0.24, 0.26, 0.08),
        material: Cesium.Color.fromCssColorString('#15803d'), // Green Kerala jungle cap
        shadows: Cesium.ShadowMode.ENABLED
      }
    });

    // 5. Left Leg (Pants)
    this.leftLegEntity = this.viewer.entities.add({
      position: this.position,
      box: {
        dimensions: new Cesium.Cartesian3(0.18, 0.2, 0.68),
        material: Cesium.Color.fromCssColorString('#1e293b'), // Slate cargo pants
        shadows: Cesium.ShadowMode.ENABLED
      }
    });

    // 6. Right Leg (Pants)
    this.rightLegEntity = this.viewer.entities.add({
      position: this.position,
      box: {
        dimensions: new Cesium.Cartesian3(0.18, 0.2, 0.68),
        material: Cesium.Color.fromCssColorString('#1e293b'),
        shadows: Cesium.ShadowMode.ENABLED
      }
    });

    // 7. Left Arm
    this.leftArmEntity = this.viewer.entities.add({
      position: this.position,
      box: {
        dimensions: new Cesium.Cartesian3(0.14, 0.16, 0.58),
        material: Cesium.Color.fromCssColorString('#0284c7'),
        shadows: Cesium.ShadowMode.ENABLED
      }
    });

    // 8. Right Arm
    this.rightArmEntity = this.viewer.entities.add({
      position: this.position,
      box: {
        dimensions: new Cesium.Cartesian3(0.14, 0.16, 0.58),
        material: Cesium.Color.fromCssColorString('#0284c7'),
        shadows: Cesium.ShadowMode.ENABLED
      }
    });

    this.updateTransform(0, false, false);
  }

  /**
   * Helper that converts East-North-Up local coordinates relative to the player
   * into a world Cartesian3.
   * offsetX: Right/Left
   * offsetY: Forward/Backward
   * offsetZ: Up/Down
   */
  private computeOffsetPosition(
    rootPosition: Cesium.Cartesian3,
    headingRad: number,
    offsetX: number,
    offsetY: number,
    offsetZ: number
  ): Cesium.Cartesian3 {
    // In Cesium ENU frame: X = East, Y = North, Z = Up
    // Heading is clockwise from North (+Y):
    // Forward direction = (sin(heading), cos(heading))
    // Right direction   = (cos(heading), -sin(heading))
    const cos = Math.cos(headingRad);
    const sin = Math.sin(headingRad);

    const worldEast = offsetX * cos + offsetY * sin;
    const worldNorth = -offsetX * sin + offsetY * cos;

    const enuTransform = Cesium.Transforms.eastNorthUpToFixedFrame(rootPosition);
    const localVec = new Cesium.Cartesian4(worldEast, worldNorth, offsetZ, 1.0);
    const worldPos4 = Cesium.Matrix4.multiplyByVector(enuTransform, localVec, new Cesium.Cartesian4());

    return new Cesium.Cartesian3(worldPos4.x, worldPos4.y, worldPos4.z);
  }

  /**
   * Updates position, orientation, and limb procedural swing animation.
   */
  public updateTransform(delta: number, isMoving: boolean, isSprinting: boolean): void {
    if (isMoving) {
      this.animTimer += delta * (isSprinting ? 14 : 9);
    } else {
      this.animTimer = 0;
    }

    const swing = isMoving ? Math.sin(this.animTimer) * (isSprinting ? 0.35 : 0.22) : 0;
    const hpr = new Cesium.HeadingPitchRoll(this.heading, 0, 0);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(this.position, hpr);

    // 1. Torso: at +1.05m height
    const torsoPos = this.computeOffsetPosition(this.position, this.heading, 0, 0, 1.05);
    this.torsoEntity.position = new Cesium.ConstantPositionProperty(torsoPos);
    this.torsoEntity.orientation = new Cesium.ConstantProperty(orientation);

    // 2. Vest: slight offset over torso
    const vestPos = this.computeOffsetPosition(this.position, this.heading, 0, 0, 1.03);
    this.vestEntity.position = new Cesium.ConstantPositionProperty(vestPos);
    this.vestEntity.orientation = new Cesium.ConstantProperty(orientation);

    // 3. Head: at +1.55m height
    const headPos = this.computeOffsetPosition(this.position, this.heading, 0, 0, 1.55);
    this.headEntity.position = new Cesium.ConstantPositionProperty(headPos);
    this.headEntity.orientation = new Cesium.ConstantProperty(orientation);

    // 4. Cap: at +1.65m height
    const capPos = this.computeOffsetPosition(this.position, this.heading, 0, 0.04, 1.66);
    this.capEntity.position = new Cesium.ConstantPositionProperty(capPos);
    this.capEntity.orientation = new Cesium.ConstantProperty(orientation);

    // 5 & 6. Legs: swing along forward/backward axis (+/- Y in local space)
    const leftLegOffset = swing;
    const rightLegOffset = -swing;
    const leftLegPos = this.computeOffsetPosition(this.position, this.heading, -0.16, leftLegOffset, 0.45);
    const rightLegPos = this.computeOffsetPosition(this.position, this.heading, 0.16, rightLegOffset, 0.45);
    this.leftLegEntity.position = new Cesium.ConstantPositionProperty(leftLegPos);
    this.leftLegEntity.orientation = new Cesium.ConstantProperty(orientation);
    this.rightLegEntity.position = new Cesium.ConstantPositionProperty(rightLegPos);
    this.rightLegEntity.orientation = new Cesium.ConstantProperty(orientation);

    // 7 & 8. Arms: swing opposite to legs
    const leftArmOffset = -swing * 0.8;
    const rightArmOffset = swing * 0.8;
    const leftArmPos = this.computeOffsetPosition(this.position, this.heading, -0.34, leftArmOffset, 1.0);
    const rightArmPos = this.computeOffsetPosition(this.position, this.heading, 0.34, rightArmOffset, 1.0);
    this.leftArmEntity.position = new Cesium.ConstantPositionProperty(leftArmPos);
    this.leftArmEntity.orientation = new Cesium.ConstantProperty(orientation);
    this.rightArmEntity.position = new Cesium.ConstantPositionProperty(rightArmPos);
    this.rightArmEntity.orientation = new Cesium.ConstantProperty(orientation);
  }

  public setPosition(newPosition: Cesium.Cartesian3): void {
    this.position = newPosition.clone();
  }

  public destroy(): void {
    this.viewer.entities.remove(this.torsoEntity);
    this.viewer.entities.remove(this.vestEntity);
    this.viewer.entities.remove(this.headEntity);
    this.viewer.entities.remove(this.capEntity);
    this.viewer.entities.remove(this.leftLegEntity);
    this.viewer.entities.remove(this.rightLegEntity);
    this.viewer.entities.remove(this.leftArmEntity);
    this.viewer.entities.remove(this.rightArmEntity);
  }
}
