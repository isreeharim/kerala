export interface BuildingCollider {
  x: number;
  z: number;
  halfW: number;
  halfD: number;
  rotationY: number;
  name?: string;
}

/**
 * Resolves 2D (X, Z) collision between a circular entity (character, bike, car)
 * and an array of oriented rectangular building bounding boxes.
 *
 * Pushes the entity cleanly outside the building boundary while enabling smooth
 * sliding along walls.
 *
 * @param pos The position object { x, z } to modify in-place if collision occurs
 * @param radius The collision radius of the entity in meters (e.g. 0.5 for character, 1.2 for bike, 2.0 for car)
 * @param colliders Array of building colliders
 * @returns true if collision occurred and position was adjusted
 */
export function resolveBuildingCollision(
  pos: { x: number; z: number },
  radius: number,
  colliders: BuildingCollider[]
): boolean {
  let collided = false;

  // Up to 3 iterations to handle corners between multiple adjoining boxes
  for (let iter = 0; iter < 3; iter++) {
    let anyInIter = false;

    for (let i = 0; i < colliders.length; i++) {
      const b = colliders[i];
      const dx = pos.x - b.x;
      const dz = pos.z - b.z;

      // Fast broadphase bounding circle reject
      const maxDim = Math.max(b.halfW, b.halfD) + radius;
      if (Math.abs(dx) > maxDim || Math.abs(dz) > maxDim) {
        continue;
      }

      // Transform into building local coordinate space (rotate by -rotationY)
      const cos = Math.cos(-b.rotationY);
      const sin = Math.sin(-b.rotationY);
      const lx = dx * cos - dz * sin;
      const lz = dx * sin + dz * cos;

      // Clamped point on local box [-halfW, halfW] x [-halfD, halfD]
      const clampedX = Math.max(-b.halfW, Math.min(b.halfW, lx));
      const clampedZ = Math.max(-b.halfD, Math.min(b.halfD, lz));

      const diffX = lx - clampedX;
      const diffZ = lz - clampedZ;
      const distSq = diffX * diffX + diffZ * diffZ;

      if (distSq < radius * radius) {
        collided = true;
        anyInIter = true;
        let pushLX = 0;
        let pushLZ = 0;

        if (distSq > 0.0001) {
          // Entity overlaps edge or corner
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          pushLX = (diffX / dist) * overlap;
          pushLZ = (diffZ / dist) * overlap;
        } else {
          // Center is inside box - push out through nearest side
          const toMinX = lx - (-b.halfW);
          const toMaxX = b.halfW - lx;
          const toMinZ = lz - (-b.halfD);
          const toMaxZ = b.halfD - lz;
          const minVal = Math.min(toMinX, toMaxX, toMinZ, toMaxZ);

          if (minVal === toMinX) pushLX = -(toMinX + radius);
          else if (minVal === toMaxX) pushLX = toMaxX + radius;
          else if (minVal === toMinZ) pushLZ = -(toMinZ + radius);
          else pushLZ = toMaxZ + radius;
        }

        // Transform push vector back to world space (rotate by +rotationY)
        const worldPushX = pushLX * Math.cos(b.rotationY) - pushLZ * Math.sin(b.rotationY);
        const worldPushZ = pushLX * Math.sin(b.rotationY) + pushLZ * Math.cos(b.rotationY);

        pos.x += worldPushX;
        pos.z += worldPushZ;
      }
    }

    if (!anyInIter) break;
  }

  return collided;
}
