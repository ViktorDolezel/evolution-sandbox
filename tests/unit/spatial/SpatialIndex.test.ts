import { describe, it, expect, beforeEach } from 'vitest';
import { createSpatialIndex, type SpatialIndex, type SpatialEntity } from '../../../src/spatial/SpatialIndex';

interface TestEntity extends SpatialEntity {
  name: string;
}

describe('SpatialIndex', () => {
  let index: SpatialIndex<TestEntity>;

  beforeEach(() => {
    index = createSpatialIndex<TestEntity>(100, 1000, 800);
  });

  const createEntity = (id: string, x: number, y: number, size = 1): TestEntity => ({
    id,
    position: { x, y },
    size,
    name: `Entity ${id}`,
  });

  describe('insert', () => {
    it('adds entity to index', () => {
      const entity = createEntity('1', 100, 100);
      index.insert(entity);

      expect(index.size()).toBe(1);
    });

    it('can insert multiple entities', () => {
      index.insert(createEntity('1', 100, 100));
      index.insert(createEntity('2', 200, 200));
      index.insert(createEntity('3', 300, 300));

      expect(index.size()).toBe(3);
    });
  });

  describe('remove', () => {
    it('removes entity from index', () => {
      const entity = createEntity('1', 100, 100);
      index.insert(entity);
      index.remove('1');

      expect(index.size()).toBe(0);
    });

    it('handles removing non-existent entity', () => {
      expect(() => index.remove('nonexistent')).not.toThrow();
    });

    it('only removes specified entity', () => {
      index.insert(createEntity('1', 100, 100));
      index.insert(createEntity('2', 200, 200));
      index.remove('1');

      expect(index.size()).toBe(1);
      expect(index.queryRadius({ x: 200, y: 200 }, 10)).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates entity position in index', () => {
      const entity = createEntity('1', 100, 100);
      index.insert(entity);

      const updatedEntity = { ...entity, position: { x: 500, y: 500 } };
      index.update(updatedEntity);

      // Should not find at old position
      expect(index.queryRadius({ x: 100, y: 100 }, 10)).toHaveLength(0);
      // Should find at new position
      expect(index.queryRadius({ x: 500, y: 500 }, 10)).toHaveLength(1);
    });
  });

  describe('queryRadius', () => {
    it('finds entities within radius', () => {
      index.insert(createEntity('1', 100, 100));
      index.insert(createEntity('2', 110, 110));
      index.insert(createEntity('3', 500, 500));

      const nearby = index.queryRadius({ x: 100, y: 100 }, 50);

      expect(nearby).toHaveLength(2);
      expect(nearby.map((e) => e.id)).toContain('1');
      expect(nearby.map((e) => e.id)).toContain('2');
    });

    it('returns empty array when no entities in range', () => {
      index.insert(createEntity('1', 100, 100));

      const nearby = index.queryRadius({ x: 500, y: 500 }, 50);

      expect(nearby).toHaveLength(0);
    });

    it('handles large radius', () => {
      index.insert(createEntity('1', 100, 100));
      index.insert(createEntity('2', 900, 700));

      const nearby = index.queryRadius({ x: 500, y: 400 }, 1000);

      expect(nearby).toHaveLength(2);
    });

    it('considers entity size in distance calculation', () => {
      // Entity with size 50 at position 100
      index.insert(createEntity('1', 100, 100, 50));

      // Query at 140 with radius 0 - without size, should not find
      // But with size 50, the entity edge extends to 150
      const nearby = index.queryRadius({ x: 140, y: 100 }, 10);

      expect(nearby).toHaveLength(1);
    });
  });

  describe('queryRect', () => {
    it('finds entities within rectangle', () => {
      index.insert(createEntity('1', 50, 50));
      index.insert(createEntity('2', 150, 150));
      index.insert(createEntity('3', 500, 500));

      const inRect = index.queryRect(0, 0, 200, 200);

      expect(inRect).toHaveLength(2);
    });

    it('handles entities at edges', () => {
      index.insert(createEntity('1', 100, 100));

      const inRect = index.queryRect(100, 100, 200, 200);

      expect(inRect).toHaveLength(1);
    });
  });

  describe('getNearest', () => {
    it('returns closest entity', () => {
      index.insert(createEntity('1', 100, 100));
      index.insert(createEntity('2', 200, 100));
      index.insert(createEntity('3', 500, 500));

      const nearest = index.getNearest({ x: 110, y: 100 });

      expect(nearest?.id).toBe('1');
    });

    it('returns null when index is empty', () => {
      const nearest = index.getNearest({ x: 100, y: 100 });

      expect(nearest).toBeNull();
    });

    it('respects maxDistance parameter', () => {
      index.insert(createEntity('1', 100, 100));

      const nearestInRange = index.getNearest({ x: 110, y: 100 }, 50);
      const nearestOutOfRange = index.getNearest({ x: 110, y: 100 }, 5);

      expect(nearestInRange).not.toBeNull();
      expect(nearestOutOfRange).toBeNull();
    });
  });

  describe('getNearestN', () => {
    it('returns n closest entities sorted by distance', () => {
      index.insert(createEntity('1', 100, 100));
      index.insert(createEntity('2', 120, 100));
      index.insert(createEntity('3', 150, 100));
      index.insert(createEntity('4', 500, 500));

      const nearest = index.getNearestN({ x: 100, y: 100 }, 3);

      expect(nearest).toHaveLength(3);
      expect(nearest[0].id).toBe('1');
      expect(nearest[1].id).toBe('2');
      expect(nearest[2].id).toBe('3');
    });

    it('returns all entities if n > count', () => {
      index.insert(createEntity('1', 100, 100));
      index.insert(createEntity('2', 200, 200));

      const nearest = index.getNearestN({ x: 100, y: 100 }, 10);

      expect(nearest).toHaveLength(2);
    });

    it('respects maxDistance parameter', () => {
      index.insert(createEntity('1', 100, 100));
      index.insert(createEntity('2', 200, 100));
      index.insert(createEntity('3', 500, 500));

      const nearest = index.getNearestN({ x: 100, y: 100 }, 10, 150);

      expect(nearest).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('removes all entities', () => {
      index.insert(createEntity('1', 100, 100));
      index.insert(createEntity('2', 200, 200));
      index.clear();

      expect(index.size()).toBe(0);
      expect(index.getAll()).toHaveLength(0);
    });
  });

  describe('getAll', () => {
    it('returns all entities', () => {
      const e1 = createEntity('1', 100, 100);
      const e2 = createEntity('2', 200, 200);

      index.insert(e1);
      index.insert(e2);

      const all = index.getAll();

      expect(all).toHaveLength(2);
      expect(all).toContain(e1);
      expect(all).toContain(e2);
    });
  });

  describe('performance', () => {
    it('handles many entities efficiently', () => {
      // Insert 1000 entities
      for (let i = 0; i < 1000; i++) {
        index.insert(createEntity(`${i}`, Math.random() * 1000, Math.random() * 800));
      }

      expect(index.size()).toBe(1000);

      // Query should still work
      const start = performance.now();
      index.queryRadius({ x: 500, y: 400 }, 100);
      const elapsed = performance.now() - start;

      // Should complete quickly (< 50ms)
      expect(elapsed).toBeLessThan(50);
    });
  });
});
