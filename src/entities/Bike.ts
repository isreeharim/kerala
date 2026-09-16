import * as THREE from 'three';
import { Terrain } from '../world/Terrain';
import { RoadSystem } from '../world/RoadSystem';
import { Vehicle, VehicleInput } from './Vehicle';
import { BuildingCollider, resolveBuildingCollision } from '../world/ObstacleCollider';

export class Bike extends Vehicle {
  public leanAngle: number = 0;

  private frontForkGroup: THREE.Group = new THREE.Group();
  private frontWheel: THREE.Mesh;
  private rearWheel: THREE.Mesh;
  private headlight: THREE.SpotLight;
  private headlightMesh: THREE.Mesh;

  constructor(
    terrain: Terrain,
    roadSystem: RoadSystem,
    initialPos?: THREE.Vector3,
    buildingColliders: BuildingCollider[] = []
  ) {
    super(terrain, roadSystem, initialPos, buildingColliders);

    this.maxSpeed = 28; // ~100 km/h
    this.acceleration = 18;
    this.brakeForce = 26;
    this.friction = 4;
    this.turnSpeed = 2.4;

    // Build the 3D Classic Motorcycle Model (inspired by vintage Indian motorbikes)
    const bikeGeomGroup = new THREE.Group();

    // 1. Frame & Engine Block
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1f2421, metalness: 0.8, roughness: 0.3 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, metalness: 0.95, roughness: 0.1 });
    const paintMat = new THREE.MeshStandardMaterial({ color: 0x14532d, metalness: 0.4, roughness: 0.2 });

    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.7), darkMetalMat);
    engine.position.set(0, 0.5, 0);
    engine.castShadow = true;
    bikeGeomGroup.add(engine);

    // Engine cooling fins
    for (let f = -0.2; f <= 0.2; f += 0.08) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.02, 0.65), chromeMat);
      fin.position.set(0, 0.5 + f, 0);
      bikeGeomGroup.add(fin);
    }

    // 2. Teardrop Fuel Tank
    const tankGeo = new THREE.SphereGeometry(0.38, 12, 8);
    tankGeo.scale(0.8, 0.7, 1.4);
    const tank = new THREE.Mesh(tankGeo, paintMat);
    tank.position.set(0, 0.88, 0.25);
    tank.castShadow = true;
    bikeGeomGroup.add(tank);

    const badgeGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.65, 8);
    badgeGeo.rotateZ(Math.PI / 2);
    const badge = new THREE.Mesh(badgeGeo, chromeMat);
    badge.position.set(0, 0.88, 0.25);
    bikeGeomGroup.add(badge);

    // 3. Saddle Seats
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x271e1b, roughness: 0.9 });
    const riderSeat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.48), leatherMat);
    riderSeat.position.set(0, 0.82, -0.3);
    riderSeat.castShadow = true;
    bikeGeomGroup.add(riderSeat);

    const pillionSeat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.42), leatherMat);
    pillionSeat.position.set(0, 0.88, -0.75);
    pillionSeat.castShadow = true;
    bikeGeomGroup.add(pillionSeat);

    // 4. Chrome Swept Exhaust
    const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.6, 12);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhaust = new THREE.Mesh(exhaustGeo, chromeMat);
    exhaust.position.set(0.24, 0.32, -0.4);
    exhaust.castShadow = true;
    bikeGeomGroup.add(exhaust);

    // 5. Rear Wheel & Mudguard
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const tireGeo = new THREE.TorusGeometry(0.38, 0.09, 8, 20);

    this.rearWheel = new THREE.Mesh(tireGeo, wheelMat);
    this.rearWheel.position.set(0, 0.42, -0.85);
    this.rearWheel.castShadow = true;

    const rearRim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 12), chromeMat);
    rearRim.rotation.z = Math.PI / 2;
    this.rearWheel.add(rearRim);
    bikeGeomGroup.add(this.rearWheel);

    const rearFenderGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.22, 12, 1, true, 0, Math.PI);
    rearFenderGeo.rotateZ(Math.PI / 2);
    rearFenderGeo.rotateY(Math.PI / 2);
    const rearFender = new THREE.Mesh(rearFenderGeo, paintMat);
    rearFender.position.set(0, 0.42, -0.85);
    rearFender.castShadow = true;
    bikeGeomGroup.add(rearFender);

    // 6. Front Fork & Handlebars (Steerable)
    this.frontForkGroup.position.set(0, 0.42, 0.85);

    this.frontWheel = new THREE.Mesh(tireGeo, wheelMat);
    this.frontWheel.castShadow = true;
    const frontRim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 12), chromeMat);
    frontRim.rotation.z = Math.PI / 2;
    this.frontWheel.add(frontRim);
    this.frontForkGroup.add(this.frontWheel);

    for (let side of [-0.14, 0.14]) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 8), chromeMat);
      tube.position.set(side, 0.35, -0.08);
      tube.rotation.x = -0.3;
      tube.castShadow = true;
      this.frontForkGroup.add(tube);
    }

    const handleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.85, 8);
    handleGeo.rotateZ(Math.PI / 2);
    const handlebars = new THREE.Mesh(handleGeo, chromeMat);
    handlebars.position.set(0, 0.72, -0.15);
    handlebars.castShadow = true;
    this.frontForkGroup.add(handlebars);

    for (let gx of [-0.4, 0.4]) {
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.14, 8), leatherMat);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(gx, 0.72, -0.15);
      this.frontForkGroup.add(grip);
    }

    const lampCasing = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), chromeMat);
    lampCasing.scale.set(1, 1, 0.8);
    lampCasing.position.set(0, 0.65, 0.08);
    this.frontForkGroup.add(lampCasing);

    const glassMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 0.9 });
    this.headlightMesh = new THREE.Mesh(new THREE.CircleGeometry(0.14, 12), glassMat);
    this.headlightMesh.position.set(0, 0.65, 0.22);
    this.frontForkGroup.add(this.headlightMesh);

    this.headlight = new THREE.SpotLight(0xfffaed, 8, 45, Math.PI / 5, 0.4, 1.2);
    this.headlight.position.set(0, 0.65, 0.25);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(0, 0.3, 15);
    this.frontForkGroup.add(targetObj);
    this.headlight.target = targetObj;
    this.frontForkGroup.add(this.headlight);

    bikeGeomGroup.add(this.frontForkGroup);
    this.group.add(bikeGeomGroup);

    this.snapToGround();
  }

  public toggleHeadlights(): void {
    this.headlightsOn = !this.headlightsOn;
    this.headlight.intensity = this.headlightsOn ? 8 : 0;
    (this.headlightMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = this.headlightsOn ? 0.9 : 0.0;
  }

  public update(delta: number, input: VehicleInput): void {
    const accel = input.sprint ? this.acceleration * 1.35 : this.acceleration;

    if (input.forward) {
      this.speed += accel * delta;
      if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
    } else if (input.backward) {
      if (this.speed > 0) {
        this.speed -= this.brakeForce * delta;
        if (this.speed < 0) this.speed = 0;
      } else {
        this.speed -= (accel * 0.4) * delta;
        if (this.speed < -4) this.speed = -4;
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
        this.speed -= this.brakeForce * 1.8 * delta;
        if (this.speed < 0) this.speed = 0;
      }
    }

    const isMoving = Math.abs(this.speed) > 0.3;
    const steerDir = input.left ? 1 : input.right ? -1 : 0;

    if (isMoving) {
      const speedFactor = Math.min(1, Math.abs(this.speed) / 10);
      const yawDelta = steerDir * this.turnSpeed * speedFactor * delta * (this.speed >= 0 ? 1 : -1);
      this.rotation.y += yawDelta;

      const targetSteer = steerDir * 0.45;
      this.steerAngle += (targetSteer - this.steerAngle) * 10 * delta;

      const targetLean = -steerDir * Math.min(0.48, (this.speed / this.maxSpeed) * 0.6);
      this.leanAngle += (targetLean - this.leanAngle) * 8 * delta;
    } else {
      this.steerAngle += (0 - this.steerAngle) * 8 * delta;
      this.leanAngle += (0 - this.leanAngle) * 8 * delta;
    }

    this.frontForkGroup.rotation.y = this.steerAngle;
    this.group.rotation.z = this.leanAngle;

    const forwardVec = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(0, this.rotation.y, 0));
    this.position.addScaledVector(forwardVec, this.speed * delta);

    // Prevent bike from going through buildings
    if (this.buildingColliders.length > 0) {
      const hit = resolveBuildingCollision(this.position, 1.2, this.buildingColliders);
      if (hit && Math.abs(this.speed) > 1) {
        this.speed = Math.max(-2, this.speed * -0.2); // slight rebound and stop
      }
    }

    const wheelSpin = (this.speed * delta) / 0.38;
    this.frontWheel.rotation.x += wheelSpin;
    this.rearWheel.rotation.x += wheelSpin;

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
      this.group.rotation.x = -slopePitch * 0.5;
    } else {
      this.group.rotation.x = 0;
    }
  }

  public resetOrientation(): void {
    this.speed = 0;
    this.leanAngle = 0;
    this.steerAngle = 0;
    this.snapToGround();
  }

  public getSpeedKmH(): number {
    return Math.round(this.speed * 3.6);
  }
}
