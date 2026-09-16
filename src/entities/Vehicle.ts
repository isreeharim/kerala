import * as THREE from 'three';
import { Terrain } from '../world/Terrain';
import { RoadSystem } from '../world/RoadSystem';
import { BuildingCollider } from '../world/ObstacleCollider';

export interface VehicleInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
}

export abstract class Vehicle {
  public group: THREE.Group = new THREE.Group();
  public position: THREE.Vector3 = new THREE.Vector3();
  public rotation: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  public speed: number = 0;
  public maxSpeed: number = 28;
  public acceleration: number = 18;
  public brakeForce: number = 26;
  public friction: number = 4;
  public turnSpeed: number = 2.4;
  public steerAngle: number = 0;
  public headlightsOn: boolean = true;
  public buildingColliders: BuildingCollider[] = [];

  protected terrain: Terrain;
  protected roadSystem: RoadSystem;

  constructor(
    terrain: Terrain,
    roadSystem: RoadSystem,
    initialPos?: THREE.Vector3,
    buildingColliders: BuildingCollider[] = []
  ) {
    this.terrain = terrain;
    this.roadSystem = roadSystem;
    this.buildingColliders = buildingColliders;
    if (initialPos) {
      this.position.copy(initialPos);
    }
  }

  public abstract update(delta: number, input: VehicleInput): void;
  public abstract toggleHeadlights(): void;
  public abstract snapToGround(): void;
  public abstract resetOrientation(): void;
  public abstract getSpeedKmH(): number;
}
