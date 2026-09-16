import * as THREE from 'three';
import { Terrain } from '../world/Terrain';
import { RoadSystem } from '../world/RoadSystem';
import { BuildingCollider, resolveBuildingCollision } from '../world/ObstacleCollider';

export class Character {
  public group: THREE.Group = new THREE.Group();
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 10);
  public rotation: THREE.Euler = new THREE.Euler(0, Math.PI, 0, 'YXZ');

  // Locomotion parameters
  public walkSpeed: number = 4.5;
  public sprintSpeed: number = 8.5;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded: boolean = true;
  private verticalVelocity: number = 0;
  private gravity: number = 22;
  private jumpPower: number = 7.5;

  // Visual Limbs for Procedural Animation
  private leftLeg: THREE.Group = new THREE.Group();
  private rightLeg: THREE.Group = new THREE.Group();
  private leftArm: THREE.Group = new THREE.Group();
  private rightArm: THREE.Group = new THREE.Group();
  private torso: THREE.Mesh;
  private head: THREE.Group = new THREE.Group();

  private animTimer: number = 0;
  private terrain: Terrain;
  private roadSystem: RoadSystem;
  public buildingColliders: BuildingCollider[] = [];

  constructor(terrain: Terrain, roadSystem: RoadSystem, buildingColliders: BuildingCollider[] = []) {
    this.terrain = terrain;
    this.roadSystem = roadSystem;
    this.buildingColliders = buildingColliders;

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc68642, roughness: 0.8 }); // Indian skin tone
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 }); // Cyan explorer shirt
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }); // Explorer leather vest
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }); // Cargo pants
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x3f2e24, roughness: 0.9 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 }); // Green cap

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.65, 0.28);
    this.torso = new THREE.Mesh(torsoGeo, shirtMat);
    this.torso.position.y = 1.05;
    this.torso.castShadow = true;

    // Explorer Vest Layer
    const vestGeo = new THREE.BoxGeometry(0.54, 0.55, 0.32);
    const vest = new THREE.Mesh(vestGeo, vestMat);
    vest.position.y = -0.02;
    this.torso.add(vest);
    this.group.add(this.torso);

    // 2. Head & Cap
    this.head.position.set(0, 1.55, 0);
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), skinMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Cap
    const capDome = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    capDome.position.y = 0.05;
    this.head.add(capDome);

    const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.16), capMat);
    capVisor.position.set(0, 0.06, 0.18);
    this.head.add(capVisor);
    this.group.add(this.head);

    // 3. Legs
    const createLeg = (isLeft: boolean) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(isLeft ? -0.16 : 0.16, 0.75, 0);

      // Thigh & Pants
      const legGeo = new THREE.BoxGeometry(0.18, 0.45, 0.2);
      const legMesh = new THREE.Mesh(legGeo, pantsMat);
      legMesh.position.y = -0.22;
      legMesh.castShadow = true;
      legPivot.add(legMesh);

      // Calf & Boot
      const calfGeo = new THREE.BoxGeometry(0.16, 0.4, 0.18);
      const calfMesh = new THREE.Mesh(calfGeo, pantsMat);
      calfMesh.position.y = -0.55;
      legPivot.add(calfMesh);

      const bootGeo = new THREE.BoxGeometry(0.18, 0.15, 0.28);
      const boot = new THREE.Mesh(bootGeo, bootMat);
      boot.position.set(0, -0.72, 0.04);
      boot.castShadow = true;
      legPivot.add(boot);

      return legPivot;
    };

    this.leftLeg = createLeg(true);
    this.rightLeg = createLeg(false);
    this.group.add(this.leftLeg);
    this.group.add(this.rightLeg);

    // 4. Arms
    const createArm = (isLeft: boolean) => {
      const armPivot = new THREE.Group();
      armPivot.position.set(isLeft ? -0.34 : 0.34, 1.3, 0);

      const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.35, 0.14), shirtMat);
      upperArm.position.y = -0.16;
      upperArm.castShadow = true;
      armPivot.add(upperArm);

      const foreArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.12), skinMat);
      foreArm.position.y = -0.44;
      foreArm.castShadow = true;
      armPivot.add(foreArm);

      return armPivot;
    };

    this.leftArm = createArm(true);
    this.rightArm = createArm(false);
    this.group.add(this.leftArm);
    this.group.add(this.rightArm);

    this.snapToGround();
  }

  public update(
    delta: number,
    input: { forward: boolean; backward: boolean; left: boolean; right: boolean; sprint: boolean; jump: boolean },
    cameraYaw: number
  ): void {
    // Determine move direction relative to camera angle
    let moveZ = 0;
    let moveX = 0;

    if (input.forward) moveZ -= 1;
    if (input.backward) moveZ += 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;
    const currentSpeed = input.sprint ? this.sprintSpeed : this.walkSpeed;

    if (isMoving) {
      const inputAngle = Math.atan2(moveX, moveZ);
      const targetAngle = cameraYaw + inputAngle;

      // Smoothly rotate character towards movement direction
      let diff = targetAngle - this.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotation.y += diff * 12 * delta;

      // Move in target direction
      const forwardVec = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.rotation.y, 0));
      this.velocity.copy(forwardVec).multiplyScalar(currentSpeed);
      this.position.addScaledVector(this.velocity, delta);

      // Prevent character from going through buildings
      if (this.buildingColliders.length > 0) {
        resolveBuildingCollision(this.position, 0.6, this.buildingColliders);
      }

      // Walk cycle animation
      this.animTimer += delta * (input.sprint ? 14 : 9);
      const legAngle = Math.sin(this.animTimer) * (input.sprint ? 0.75 : 0.45);
      const armAngle = -Math.sin(this.animTimer) * (input.sprint ? 0.65 : 0.4);

      this.leftLeg.rotation.x = legAngle;
      this.rightLeg.rotation.x = -legAngle;
      this.leftArm.rotation.x = armAngle;
      this.rightArm.rotation.x = -armAngle;
      this.torso.position.y = 1.05 + Math.abs(Math.sin(this.animTimer * 2)) * 0.05;
    } else {
      // Idle animation
      this.animTimer += delta * 2;
      this.leftLeg.rotation.x *= 0.8;
      this.rightLeg.rotation.x *= 0.8;
      this.leftArm.rotation.x *= 0.8;
      this.rightArm.rotation.x *= 0.8;
      this.torso.position.y = 1.05 + Math.sin(this.animTimer) * 0.02;
    }

    // Jump & Gravity
    const groundY = this.getGroundHeight(this.position.x, this.position.z);

    if (this.isGrounded) {
      if (input.jump) {
        this.verticalVelocity = this.jumpPower;
        this.isGrounded = false;
      } else {
        this.verticalVelocity = 0;
        this.position.y = groundY;
      }
    } else {
      this.verticalVelocity -= this.gravity * delta;
      this.position.y += this.verticalVelocity * delta;

      if (this.position.y <= groundY) {
        this.position.y = groundY;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotation.y;
  }

  public setDrivingPose(isDriving: boolean, isBike: boolean = false): void {
    if (isDriving) {
      if (isBike) {
        // Seated on motorcycle with hands forward on handlebars
        this.group.visible = true;
        this.torso.position.y = 0.85;
        this.head.position.set(0, 1.35, 0.05);

        this.leftLeg.position.set(-0.18, 0.65, 0);
        this.rightLeg.position.set(0.18, 0.65, 0);
        this.leftLeg.rotation.x = 0.9;
        this.rightLeg.rotation.x = 0.9;

        this.leftArm.position.set(-0.32, 1.15, 0);
        this.rightArm.position.set(0.32, 1.15, 0);
        this.leftArm.rotation.x = -0.9;
        this.rightArm.rotation.x = -0.9;
      } else {
        // Inside car (hide or seat)
        this.group.visible = false;
      }
    } else {
      this.group.visible = true;
      // Reset limbs
      this.torso.position.y = 1.05;
      this.head.position.set(0, 1.55, 0);
      this.leftLeg.position.set(-0.16, 0.75, 0);
      this.rightLeg.position.set(0.16, 0.75, 0);
      this.leftLeg.rotation.set(0, 0, 0);
      this.rightLeg.rotation.set(0, 0, 0);
      this.leftArm.position.set(-0.34, 1.3, 0);
      this.rightArm.position.set(0.34, 1.3, 0);
      this.leftArm.rotation.set(0, 0, 0);
      this.rightArm.rotation.set(0, 0, 0);
    }
  }

  public getGroundHeight(x: number, z: number): number {
    const bridgeY = this.roadSystem.getRoadElevation(x, z);
    if (bridgeY !== null) return bridgeY;
    return this.terrain.getHeight(x, z);
  }

  public snapToGround(): void {
    this.position.y = this.getGroundHeight(this.position.x, this.position.z);
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotation.y;
  }

  public getSpeedKmH(): number {
    return Math.round(this.velocity.length() * 3.6);
  }
}
