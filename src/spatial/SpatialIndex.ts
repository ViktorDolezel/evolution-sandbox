import type { Vector2 } from '../utils/vector';
import type { EntityId } from '../utils/id';
import { distance } from '../utils/vector';

export interface SpatialEntity {
  id: EntityId;
  position: Vector2;
  size: number;
}

export interface SpatialIndex<T extends SpatialEntity> {
  insert(entity: T): void;
  remove(id: EntityId): void;
  update(entity: T): void;
  queryRadius(center: Vector2, radius: number): T[];
  queryRect(minX: number, minY: number, maxX: number, maxY: number): T[];
  getNearest(position: Vector2, maxDistance?: number): T | null;
  getNearestN(position: Vector2, n: number, maxDistance?: number): T[];
  clear(): void;
  getAll(): T[];
  size(): number;
}

export function createSpatialIndex<T extends SpatialEntity>(
  bucketSize: number,
  worldWidth: number,
  worldHeight: number
): SpatialIndex<T> {
  const cols = Math.ceil(worldWidth / bucketSize);
  const rows = Math.ceil(worldHeight / bucketSize);

  // Grid of buckets, each bucket is a Map of id -> entity
  const buckets: Map<EntityId, T>[][] = [];
  for (let y = 0; y < rows; y++) {
    buckets[y] = [];
    for (let x = 0; x < cols; x++) {
      buckets[y][x] = new Map();
    }
  }

  // Track which bucket each entity is in
  const entityBuckets = new Map<EntityId, { x: number; y: number }>();
  // Store all entities for quick access
  const allEntities = new Map<EntityId, T>();

  function getBucketCoords(position: Vector2): { x: number; y: number } {
    const x = Math.floor(position.x / bucketSize);
    const y = Math.floor(position.y / bucketSize);
    return {
      x: Math.max(0, Math.min(cols - 1, x)),
      y: Math.max(0, Math.min(rows - 1, y)),
    };
  }

  function getBucket(position: Vector2): Map<EntityId, T> {
    const { x, y } = getBucketCoords(position);
    return buckets[y][x];
  }

  return {
    insert(entity: T): void {
      const { x, y } = getBucketCoords(entity.position);
      buckets[y][x].set(entity.id, entity);
      entityBuckets.set(entity.id, { x, y });
      allEntities.set(entity.id, entity);
    },

    remove(id: EntityId): void {
      const coords = entityBuckets.get(id);
      if (coords) {
        buckets[coords.y][coords.x].delete(id);
        entityBuckets.delete(id);
        allEntities.delete(id);
      }
    },

    update(entity: T): void {
      this.remove(entity.id);
      this.insert(entity);
    },

    queryRadius(center: Vector2, radius: number): T[] {
      const result: T[] = [];

      // Determine which buckets to check
      const minBucketX = Math.max(0, Math.floor((center.x - radius) / bucketSize));
      const maxBucketX = Math.min(cols - 1, Math.floor((center.x + radius) / bucketSize));
      const minBucketY = Math.max(0, Math.floor((center.y - radius) / bucketSize));
      const maxBucketY = Math.min(rows - 1, Math.floor((center.y + radius) / bucketSize));

      for (let by = minBucketY; by <= maxBucketY; by++) {
        for (let bx = minBucketX; bx <= maxBucketX; bx++) {
          const bucket = buckets[by][bx];
          for (const entity of bucket.values()) {
            // Distance from center to entity edge (considering size as entity radius)
            const dist = distance(center, entity.position) - entity.size;
            if (dist <= radius) {
              result.push(entity);
            }
          }
        }
      }

      return result;
    },

    queryRect(minX: number, minY: number, maxX: number, maxY: number): T[] {
      const result: T[] = [];

      const minBucketX = Math.max(0, Math.floor(minX / bucketSize));
      const maxBucketX = Math.min(cols - 1, Math.floor(maxX / bucketSize));
      const minBucketY = Math.max(0, Math.floor(minY / bucketSize));
      const maxBucketY = Math.min(rows - 1, Math.floor(maxY / bucketSize));

      for (let by = minBucketY; by <= maxBucketY; by++) {
        for (let bx = minBucketX; bx <= maxBucketX; bx++) {
          const bucket = buckets[by][bx];
          for (const entity of bucket.values()) {
            const pos = entity.position;
            if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
              result.push(entity);
            }
          }
        }
      }

      return result;
    },

    getNearest(position: Vector2, maxDistance?: number): T | null {
      let nearest: T | null = null;
      let nearestDist = maxDistance ?? Infinity;

      for (const entity of allEntities.values()) {
        const dist = distance(position, entity.position);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = entity;
        }
      }

      return nearest;
    },

    getNearestN(position: Vector2, n: number, maxDistance?: number): T[] {
      const withDist: Array<{ entity: T; dist: number }> = [];

      for (const entity of allEntities.values()) {
        const dist = distance(position, entity.position);
        if (maxDistance === undefined || dist <= maxDistance) {
          withDist.push({ entity, dist });
        }
      }

      withDist.sort((a, b) => a.dist - b.dist);

      return withDist.slice(0, n).map((w) => w.entity);
    },

    clear(): void {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          buckets[y][x].clear();
        }
      }
      entityBuckets.clear();
      allEntities.clear();
    },

    getAll(): T[] {
      return Array.from(allEntities.values());
    },

    size(): number {
      return allEntities.size;
    },
  };
}
