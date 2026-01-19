import { describe, it, expect, beforeEach } from 'vitest';
import { createVegetationGrid, initializeVegetation, type VegetationGrid } from '../../../src/spatial/VegetationGrid';
import { createSeededRandom } from '../../../src/core/SeededRandom';
import type { RandomGenerator } from '../../../src/core/SeededRandom';

describe('VegetationGrid', () => {
  let grid: VegetationGrid;
  let rng: RandomGenerator;

  beforeEach(() => {
    grid = createVegetationGrid(1000, 800, 5);
    rng = createSeededRandom(42);
  });

  describe('createVegetationGrid', () => {
    it('creates grid with correct dimensions', () => {
      // 1000/5 = 200 columns, 800/5 = 160 rows
      const g = createVegetationGrid(1000, 800, 5);
      expect(g.isValidGridPosition(199, 159)).toBe(true);
      expect(g.isValidGridPosition(200, 160)).toBe(false);
    });

    it('handles different tile sizes', () => {
      const g = createVegetationGrid(1000, 800, 10);
      // 1000/10 = 100 columns, 800/10 = 80 rows
      expect(g.isValidGridPosition(99, 79)).toBe(true);
      expect(g.isValidGridPosition(100, 80)).toBe(false);
    });
  });

  describe('has', () => {
    it('returns false for empty grid position', () => {
      expect(grid.has(0, 0)).toBe(false);
    });

    it('returns true after setting position', () => {
      grid.set(5, 5, true);
      expect(grid.has(5, 5)).toBe(true);
    });

    it('returns false for out of bounds position', () => {
      expect(grid.has(-1, 0)).toBe(false);
      expect(grid.has(1000, 1000)).toBe(false);
    });
  });

  describe('set', () => {
    it('adds vegetation to position', () => {
      grid.set(10, 10, true);
      expect(grid.has(10, 10)).toBe(true);
    });

    it('removes vegetation when set to false', () => {
      grid.set(10, 10, true);
      grid.set(10, 10, false);
      expect(grid.has(10, 10)).toBe(false);
    });

    it('increments count when adding', () => {
      expect(grid.getCount()).toBe(0);
      grid.set(10, 10, true);
      expect(grid.getCount()).toBe(1);
    });

    it('does not increment count for duplicate add', () => {
      grid.set(10, 10, true);
      grid.set(10, 10, true);
      expect(grid.getCount()).toBe(1);
    });

    it('ignores out of bounds positions', () => {
      grid.set(-1, 0, true);
      grid.set(1000, 1000, true);
      expect(grid.getCount()).toBe(0);
    });
  });

  describe('remove', () => {
    it('removes vegetation from position', () => {
      grid.set(10, 10, true);
      grid.remove(10, 10);
      expect(grid.has(10, 10)).toBe(false);
    });

    it('decrements count when removing', () => {
      grid.set(10, 10, true);
      grid.remove(10, 10);
      expect(grid.getCount()).toBe(0);
    });

    it('handles removing from empty position', () => {
      expect(() => grid.remove(10, 10)).not.toThrow();
    });
  });

  describe('getCount', () => {
    it('returns total vegetation count', () => {
      grid.set(0, 0, true);
      grid.set(1, 1, true);
      grid.set(2, 2, true);

      expect(grid.getCount()).toBe(3);
    });
  });

  describe('getAllPositions', () => {
    it('returns all vegetation positions', () => {
      grid.set(0, 0, true);
      grid.set(5, 10, true);
      grid.set(10, 5, true);

      const positions = grid.getAllPositions();

      expect(positions).toHaveLength(3);
      expect(positions).toContainEqual({ x: 0, y: 0 });
      expect(positions).toContainEqual({ x: 5, y: 10 });
      expect(positions).toContainEqual({ x: 10, y: 5 });
    });

    it('returns empty array for empty grid', () => {
      expect(grid.getAllPositions()).toHaveLength(0);
    });
  });

  describe('worldToGrid', () => {
    it('converts world coordinates to grid coordinates', () => {
      const result = grid.worldToGrid(27, 13);
      expect(result).toEqual({ x: 5, y: 2 }); // floor(27/5), floor(13/5)
    });

    it('handles origin', () => {
      const result = grid.worldToGrid(0, 0);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('handles exact tile boundaries', () => {
      const result = grid.worldToGrid(25, 15);
      expect(result).toEqual({ x: 5, y: 3 });
    });
  });

  describe('gridToWorld', () => {
    it('converts grid coordinates to world coordinates (center of tile)', () => {
      const result = grid.gridToWorld(5, 3);
      // Center of tile at grid (5,3) with tileSize 5: (5*5 + 2.5, 3*5 + 2.5)
      expect(result.x).toBeCloseTo(27.5);
      expect(result.y).toBeCloseTo(17.5);
    });
  });

  describe('isValidGridPosition', () => {
    it('returns true for valid positions', () => {
      expect(grid.isValidGridPosition(0, 0)).toBe(true);
      expect(grid.isValidGridPosition(100, 100)).toBe(true);
    });

    it('returns false for negative positions', () => {
      expect(grid.isValidGridPosition(-1, 0)).toBe(false);
      expect(grid.isValidGridPosition(0, -1)).toBe(false);
    });

    it('returns false for out of bounds positions', () => {
      // Grid is 200x160 (1000/5 x 800/5)
      expect(grid.isValidGridPosition(200, 0)).toBe(false);
      expect(grid.isValidGridPosition(0, 160)).toBe(false);
    });
  });

  describe('getNeighbors', () => {
    it('returns orthogonal neighbors for center position', () => {
      const neighbors = grid.getNeighbors(10, 10);

      expect(neighbors).toHaveLength(4);
      expect(neighbors).toContainEqual({ x: 9, y: 10 }); // left
      expect(neighbors).toContainEqual({ x: 11, y: 10 }); // right
      expect(neighbors).toContainEqual({ x: 10, y: 9 }); // up
      expect(neighbors).toContainEqual({ x: 10, y: 11 }); // down
    });

    it('excludes invalid neighbors at edge', () => {
      const neighbors = grid.getNeighbors(0, 0);

      expect(neighbors).toHaveLength(2);
      expect(neighbors).toContainEqual({ x: 1, y: 0 }); // right
      expect(neighbors).toContainEqual({ x: 0, y: 1 }); // down
    });

    it('excludes invalid neighbors at corner', () => {
      // Grid is 200x160
      const neighbors = grid.getNeighbors(199, 159);

      expect(neighbors).toHaveLength(2);
      expect(neighbors).toContainEqual({ x: 198, y: 159 }); // left
      expect(neighbors).toContainEqual({ x: 199, y: 158 }); // up
    });
  });

  describe('spread', () => {
    it('spreads vegetation to neighboring tiles', () => {
      // Place vegetation at center
      grid.set(100, 80, true);
      const initialCount = grid.getCount();

      // Run spread with 100% rate to ensure spreading
      const highRateRng = {
        ...rng,
        next: () => 0, // Always less than any spread rate > 0
      };

      grid.spread(highRateRng, 1.0);

      // Should have spread to at least one neighbor
      expect(grid.getCount()).toBeGreaterThan(initialCount);
    });

    it('does not spread with 0% rate', () => {
      grid.set(100, 80, true);
      const initialCount = grid.getCount();

      grid.spread(rng, 0);

      expect(grid.getCount()).toBe(initialCount);
    });

    it('spreads to orthogonal neighbors only', () => {
      grid.set(100, 80, true);

      // Use RNG that always succeeds
      const alwaysSucceed = createSeededRandom(42);
      alwaysSucceed.next = () => 0;

      grid.spread(alwaysSucceed, 1.0);

      // Check that at least one orthogonal neighbor has vegetation
      const hasOrthogonal =
        grid.has(99, 80) || grid.has(101, 80) || grid.has(100, 79) || grid.has(100, 81);
      const hasDiagonal = grid.has(99, 79) || grid.has(101, 79) || grid.has(99, 81) || grid.has(101, 81);

      expect(hasOrthogonal).toBe(true);
      // Diagonal neighbors should not be filled by spread
      expect(hasDiagonal).toBe(false);
    });

    it('is deterministic with same RNG seed', () => {
      grid.set(50, 50, true);
      grid.set(100, 100, true);

      const rng1 = createSeededRandom(42);
      const rng2 = createSeededRandom(42);

      const grid1 = createVegetationGrid(1000, 800, 5);
      grid1.set(50, 50, true);
      grid1.set(100, 100, true);

      const grid2 = createVegetationGrid(1000, 800, 5);
      grid2.set(50, 50, true);
      grid2.set(100, 100, true);

      grid1.spread(rng1, 0.5);
      grid2.spread(rng2, 0.5);

      expect(grid1.getCount()).toBe(grid2.getCount());
      expect(grid1.getAllPositions()).toEqual(grid2.getAllPositions());
    });
  });

  describe('clear', () => {
    it('removes all vegetation', () => {
      grid.set(0, 0, true);
      grid.set(10, 10, true);
      grid.set(20, 20, true);

      grid.clear();

      expect(grid.getCount()).toBe(0);
      expect(grid.getAllPositions()).toHaveLength(0);
    });
  });

  describe('initializeVegetation', () => {
    it('fills grid based on density', () => {
      initializeVegetation(grid, 0.4, rng);

      // With 200x160 = 32000 tiles and 40% density, expect ~12800 tiles
      const count = grid.getCount();
      expect(count).toBeGreaterThan(10000);
      expect(count).toBeLessThan(15000);
    });

    it('is deterministic with same RNG seed', () => {
      const grid1 = createVegetationGrid(1000, 800, 5);
      const grid2 = createVegetationGrid(1000, 800, 5);

      const rng1 = createSeededRandom(42);
      const rng2 = createSeededRandom(42);

      initializeVegetation(grid1, 0.4, rng1);
      initializeVegetation(grid2, 0.4, rng2);

      expect(grid1.getCount()).toBe(grid2.getCount());
    });

    it('handles 0% density', () => {
      initializeVegetation(grid, 0, rng);
      expect(grid.getCount()).toBe(0);
    });

    it('handles 100% density', () => {
      const smallGrid = createVegetationGrid(50, 40, 5);
      initializeVegetation(smallGrid, 1.0, rng);
      // 10x8 = 80 tiles
      expect(smallGrid.getCount()).toBe(80);
    });
  });
});
