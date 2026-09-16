import * as THREE from 'three';
import { Terrain } from '../world/Terrain';
import { RoadSystem } from '../world/RoadSystem';
import { Vehicle, VehicleInput } from './Vehicle';
import { BuildingCollider, resolveBuildingCollision } from '../world/ObstacleCollider';

export class Car extends Vehicle {
  private bodyGroup: THREE.Group = new THREE.Group();
  private frontLeftWheelGroup: THREE.Group = new THREE.Group();
  private frontRightWheelGroup: THREE.Group = new THREE.Group();
  private rearLeftWheel: THREE.Mesh;
  private rearRightWheel: THREE.Mesh;
  private frontLeftWheel: THREE.Mesh;
  private frontRightWheel: THREE.Mesh;

  private headlights: THREE.SpotLight[] = [];
  private headlightMeshes: THREE.Mesh[] = [];

  constructor(
    terrain: Terrain,
    roadSystem: RoadSystem,
    initialPos?: THREE.Vector3,
    buildingColliders: BuildingCollider[] = []
  ) {
    super(terrain, roadSystem, initialPos, buildingColliders);

    this.maxSpeed = 32; // ~115 km/h
    this.acceleration = 16;
    this.brakeForce = 28;
    this.friction = 4.5;
    this.turnSpeed = 2.0;

    // Build the Classic 4-Wheeler Model (inspired by vintage Indian cruisers)
    const paintMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      metalness: 0.15
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf3f4f6,
      metalness: 0.95,
      roughness: 0.1
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.75
    });

    // 1. Lower Chassis & Main Body
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.75, 4.4), paintMat);
    lowerBody.position.set(0, 0.65, 0);
    lowerBody.castShadow = true;
    this.bodyGroup.add(lowerBody);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 1.4), paintMat);
    hood.position.set(0, 0.85, 1.25);
    hood.castShadow = true;
    this.bodyGroup.add(hood);

    const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 1.1), paintMat);
    trunk.position.set(0, 0.82, -1.45);
    trunk.castShadow = true;
    this.bodyGroup.add(trunk);

    // 2. Cabin & Roof
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 2.1), glassMat);
    cabin.position.set(0, 1.35, -0.1);
    cabin.castShadow = true;
    this.bodyGroup.add(cabin);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.1, 2.05), paintMat);
    roof.position.set(0, 1.75, -0.1);
    roof.castShadow = true;
    this.bodyGroup.add(roof);

    // 3. Chrome Grille & Bumpers
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.1), chromeMat);
    grille.position.set(0, 0.65, 2.22);
    this.bodyGroup.add(grille);

    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.2), chromeMat);
    frontBumper.position.set(0, 0.38, 2.25);
    frontBumper.castShadow = true;
    this.bodyGroup.add(frontBumper);

    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.2), chromeMat);
    rearBumper.position.set(0, 0.38, -2.25);
    rearBumper.castShadow = true;
    this.bodyGroup.add(rearBumper);

    // 4. Headlights
    const lampGlassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef08a,
      emissiveIntensity: 0.95
    });

    for (let hx of [-0.7, 0.7]) {
      const lampRim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), chromeMat);
      lampRim.rotation.x = Math.PI / 2;
      lampRim.position.set(hx, 0.72, 2.2);
      this.bodyGroup.add(lampRim);

      const lampLens = new THREE.Mesh(new THREE.CircleGeometry(0.14, 12), lampGlassMat);
      lampLens.position.set(hx, 0.72, 2.25);
      this.headlightMeshes.push(lampLens);
      this.bodyGroup.add(lampLens);

      const spot = new THREE.SpotLight(0xfffbeb, 6, 50, Math.PI / 6, 0.3, 1.3);
      spot.position.set(hx, 0.72, 2.3);
      const targetObj = new THREE.Object3D();
      targetObj.position.set(hx, 0.2, 20);
      this.bodyGroup.add(targetObj);
      spot.target = targetObj;
      this.bodyGroup.add(spot);
      this.headlights.push(spot);
    }

    // Tail lights
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.8 });
    for (let rx of [-0.75, 0.75]) {
      const tailLamp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.05), tailMat);
      tailLamp.position.set(rx, 0.75, -2.22);
      this.bodyGroup.add(tailLamp);
    }

    // 5. Wheels
    const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.24, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const hubcapGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.26, 12);
    hubcapGeo.rotateZ(Math.PI / 2);

    const createWheel = () => {
      const w = new THREE.Mesh(tireGeo, darkMat);
      w.castShadow = true;
      const hub = new THREE.Mesh(hubcapGeo, chromeMat);
      w.add(hub);
      return w;
    };

    const trackWidth = 1.02;
    const wheelbase = 1.35;

    this.frontLeftWheelGroup.position.set(-trackWidth, 0.38, wheelbase);
    this.frontLeftWheel = createWheel();
    this.frontLeftWheelGroup.add(this.frontLeftWheel);
    this.bodyGroup.add(this.frontLeftWheelGroup);

    this.frontRightWheelGroup.position.set(trackWidth, 0.38, wheelbase);
    this.frontRightWheel = createWheel();
    this.frontRightWheelGroup.add(this.frontRightWheel);
    this.bodyGroup.add(this.frontRightWheelGroup);

    this.rearLeftWheel = createWheel();
    this.rearLeftWheel.position.set(-trackWidth, 0.38, -wheelbase);
    this.bodyGroup.add(this.rearLeftWheel);

    this.rearRightWheel = createWheel();
    this.rearRightWheel.position.set(trackWidth, 0.38, -wheelbase);
    this.bodyGroup.add(this.rearRightWheel);

    this.group.add(this.bodyGroup);
    this.snapToGround();
  }

  public toggleHeadlights(): void {
    this.headlightsOn = !this.headlightsOn;
    for (let light of this.headlights) {
      light.intensity = this.headlightsOn ? 6 : 0;
    }
    for (let mesh of this.headlightMeshes) {
      (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = this.headlightsOn ? 0.95 : 0.0;
    }
  }

  public update(delta: number, input: VehicleInput): void {
    const accel = input.sprint ? this.acceleration * 1.3 : this.acceleration;

    if (input.forward) {
      this.speed += accel * delta;
      if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
    } else if (input.backward) {
      if (this.speed > 0) {
        this.speed -= this.brakeForce * delta;
        if (this.speed < 0) this.speed = 0;
      } else {
        this.speed -= (accel * 0.45) * delta;
        if (this.speed < -5) this.speed = -5;
      }
    } else {
      if (this.speed > 0) {
        this.speed -= this.friction * delta;
        if (this.speed < 0) this.speed = 0;
      } else if (this.speed < 0) {
        this.speed += this.friction * delta;
        if (this.speed > 0) this.speed = 0;
      }
    }

    if (input.jump) {
      if (this.speed > 0) {
        this.speed -= this.brakeForce * 2.0 * delta;
        if (this.speed < 0) this.speed = 0;
      }
    }

    const isMoving = Math.abs(this.speed) > 0.3;
    const steerDir = input.left ? 1 : input.right ? -1 : 0;

    if (isMoving) {
      const speedFactor = Math.min(1, Math.abs(this.speed) / 12);
      const yawDelta = steerDir * this.turnSpeed * speedFactor * delta * (this.speed >= 0 ? 1 : -1);
      this.rotation.y += yawDelta;

      const targetSteer = steerDir * 0.42;
      this.steerAngle += (targetSteer - this.steerAngle) * 9 * delta;

      const targetRoll = -steerDir * Math.min(0.08, (this.speed / this.maxSpeed) * 0.1);
      this.bodyGroup.rotation.z += (targetRoll - this.bodyGroup.rotation.z) * 6 * delta;
    } else {
      this.steerAngle += (0 - this.steerAngle) * 8 * delta;
      this.bodyGroup.rotation.z += (0 - this.bodyGroup.rotation.z) * 6 * delta;
    }

    this.frontLeftWheelGroup.rotation.y = this.steerAngle;
    this.frontRightWheelGroup.rotation.y = this.steerAngle;

    const forwardVec = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(0, this.rotation.y, 0));
    this.position.addScaledVector(forwardVec, this.speed * delta);

    // Prevent car from going through buildings
    if (this.buildingColliders.length > 0) {
      const hit = resolveBuildingCollision(this.position, 2.0, this.buildingColliders);
      if (hit && Math.abs(this.speed) > 1) {
        this.speed = Math.max(-2, this.speed * -0.25); // bounce and stop
      }
    }

    const wheelSpin = (this.speed * delta) / 0.38;
    this.frontLeftWheel.rotation.x += wheelSpin;
    this.frontRightWheel.rotation.x += wheelSpin;
    this.rearLeftWheel.rotation.x += wheelSpin;
    this.rearRightWheel.rotation.x += wheelSpin;

    this.snapToGround();
  }

  public snapToGround(): void {
    const roadY = this.roadSystem.getRoadElevation(this.position.x, this.position.z);
    const groundY = roadY !== null ? roadY : this.terrain.getHeight(this.position.x, this.position.z);

    this.position.y = groundY;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotation.y;

    const normal = this.terrain.getNormalAt(this.position.x, this.position.z);
    if (roadY === null) {
      const forwardVec = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(0, this.rotation.y, 0));
      const slopePitch = Math.asin(normal.dot(forwardVec));
      this.group.rotation.x = -slopePitch * 0.6;
    } else {
      this.group.rotation.x = 0;
    }
  }

  public resetOrientation(): void {
    this.speed = 0;
    this.steerAngle = 0;
    this.bodyGroup.rotation.z = 0;
    this.snapToGround();
  }

  public getSpeedKmH(): number {
    return Math.round(this.speed * 3.6);
  }
}
