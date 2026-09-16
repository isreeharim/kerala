import * as THREE from 'three';
import { Terrain } from './Terrain';
import { MapDataLoader, RoadProperties, LocalPoint2D } from './MapDataLoader';
import { PhysicsWorld } from '../core/PhysicsWorld';

export interface RoadSegment {
  properties: RoadProperties;
  curve: THREE.CatmullRomCurve3;
  width: number;
  sampledPoints: THREE.Vector3[];
}

export class RoadSystem {
  public group: THREE.Group = new THREE.Group();
  public segments: RoadSegment[] = [];
  public sampledPoints: THREE.Vector3[] = [];
  public roadWidth: number = 7.5;
  private terrain: Terrain;

  constructor(terrain: Terrain, physicsWorld?: PhysicsWorld) {
    this.terrain = terrain;

    this.buildFromOSMData(physicsWorld);
  }

  private getWidthForType(type: RoadProperties['type']): number {
    switch (type) {
      case 'Highway':
        return 10.0;
      case 'MainRoad':
        return 7.5;
      case 'VillageRoad':
        return 5.5;
      case 'HillRoad':
        return 6.0;
      default:
        return 7.0;
    }
  }

  private buildFromOSMData(physicsWorld?: PhysicsWorld): void {
    const rawRoads = MapDataLoader.loadRoads();

    // Aggregate all road vertices and indices for Rapier physics collider
    const allVertices: number[] = [];
    const allIndices: number[] = [];
    let vertexOffset = 0;

    for (const rawRoad of rawRoads) {
      const width = this.getWidthForType(rawRoad.properties.type);
      const isBridge = !!rawRoad.properties.bridge;

      // Map 2D points to 3D with elevation
      const points3D: THREE.Vector3[] = rawRoad.points.map((pt) => {
        let y = this.terrain.getHeight(pt.x, pt.z) + 0.15;
        if (isBridge) {
          // Bridge deck elevation over canal
          y = 3.5;
        }
        return new THREE.Vector3(pt.x, y, pt.z);
      });

      if (points3D.length < 2) continue;

      const curve = new THREE.CatmullRomCurve3(points3D);
      curve.tension = 0.45;

      const numSteps = Math.max(30, points3D.length * 25);
      const sampled = curve.getPoints(numSteps);
      this.sampledPoints.push(...sampled);

      const segment: RoadSegment = {
        properties: rawRoad.properties,
        curve,
        width,
        sampledPoints: sampled
      };
      this.segments.push(segment);

      // Build 3D mesh for this road segment
      const geometry = new THREE.BufferGeometry();
      const positions: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];
      const halfWidth = width / 2;

      for (let i = 0; i <= numSteps; i++) {
        const t = i / numSteps;
        const point = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const left = point.clone().addScaledVector(normal, -halfWidth);
        const right = point.clone().addScaledVector(normal, halfWidth);

        if (!isBridge) {
          left.y = this.terrain.getHeight(left.x, left.z) + 0.14;
          right.y = this.terrain.getHeight(right.x, right.z) + 0.14;
        }

        positions.push(left.x, left.y, left.z);
        positions.push(right.x, right.y, right.z);

        uvs.push(0, t * 80);
        uvs.push(1, t * 80);

        if (i < numSteps) {
          const base = i * 2;
          indices.push(base, base + 1, base + 2);
          indices.push(base + 1, base + 3, base + 2);
        }
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      // Collect for Rapier collision
      for (let p = 0; p < positions.length; p++) {
        allVertices.push(positions[p]);
      }
      for (let idx of indices) {
        allIndices.push(idx + vertexOffset);
      }
      vertexOffset += positions.length / 3;

      // Material based on road type
      const asphaltColor = rawRoad.properties.type === 'HillRoad' ? 0x222629 : 0x292d30;
      const roadMat = new THREE.MeshStandardMaterial({
        color: asphaltColor,
        roughness: 0.8,
        metalness: 0.1
      });

      const roadMesh = new THREE.Mesh(geometry, roadMat);
      roadMesh.receiveShadow = true;
      this.group.add(roadMesh);

      // Add markings for main roads and highways
      this.buildMarkings(curve, numSteps);
    }

    // Create Rapier collision mesh for entire road network when physics engine is ready
    if (physicsWorld && allVertices.length > 0) {
      physicsWorld.onReady(() => {
        const vArr = new Float32Array(allVertices);
        const iArr = new Uint32Array(allIndices);
        physicsWorld.createTrimeshCollider(vArr, iArr);
      });
    }
  }

  private buildMarkings(curve: THREE.CatmullRomCurve3, numSteps: number): void {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const indices: number[] = [];
    const halfMarkWidth = 0.12;
    let markIndex = 0;

    for (let i = 0; i < numSteps; i++) {
      if (i % 5 > 2) continue; // Dashed lines pattern

      const t1 = i / numSteps;
      const t2 = (i + 0.65) / numSteps;

      const p1 = curve.getPointAt(t1);
      const p2 = curve.getPointAt(t2);

      const tangent1 = curve.getTangentAt(t1);
      const normal1 = new THREE.Vector3(-tangent1.z, 0, tangent1.x).normalize();

      const tangent2 = curve.getTangentAt(t2);
      const normal2 = new THREE.Vector3(-tangent2.z, 0, tangent2.x).normalize();

      const yOffset = 0.04;
      const v0 = p1.clone().addScaledVector(normal1, -halfMarkWidth);
      const v1 = p1.clone().addScaledVector(normal1, halfMarkWidth);
      const v2 = p2.clone().addScaledVector(normal2, -halfMarkWidth);
      const v3 = p2.clone().addScaledVector(normal2, halfMarkWidth);

      positions.push(v0.x, v0.y + yOffset, v0.z);
      positions.push(v1.x, v1.y + yOffset, v1.z);
      positions.push(v2.x, v2.y + yOffset, v2.z);
      positions.push(v3.x, v3.y + yOffset, v3.z);

      const base = markIndex * 4;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
      markIndex++;
    }

    if (positions.length === 0) return;

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const lineMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.1
    });

    const lineMesh = new THREE.Mesh(geometry, lineMat);
    this.group.add(lineMesh);
  }

  public getRoadElevation(x: number, z: number): number | null {
    // Check if on the backwater canal bridge (Z: 228 to 332, |X| < 6)
    if (z >= 228 && z <= 332 && Math.abs(x) < 6.0) {
      if (z > 305) {
        // Ramp up from South
        const progress = (332 - z) / 27;
        return 2.2 + progress * 1.3;
      } else if (z < 255) {
        // Ramp down to North
        const progress = (z - 228) / 27;
        return 2.2 + progress * 1.3;
      } else {
        return 3.5; // Central flat bridge deck
      }
    }

    // Fast check for road vicinity across all sampled segments
    let closestDistSq = Infinity;
    let closestY = 0;
    let matchingHalfWidth = 4.0;

    for (const segment of this.segments) {
      const halfWidth = segment.width * 0.55;
      for (let i = 0; i < segment.sampledPoints.length; i += 2) {
        const pt = segment.sampledPoints[i];
        const dx = pt.x - x;
        const dz = pt.z - z;
        const distSq = dx * dx + dz * dz;

        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closestY = pt.y;
          matchingHalfWidth = halfWidth;
        }
      }
    }

    if (closestDistSq < matchingHalfWidth * matchingHalfWidth) {
      return closestY;
    }

    return null;
  }
}
