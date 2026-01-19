import { describe, it, expect } from 'vitest';
import { createSeededRandom, generateRandomSeed } from '../../../src/core/SeededRandom';

describe('SeededRandom', () => {
  describe('createSeededRandom', () => {
    it('creates a random generator with the given seed', () => {
      const rng = createSeededRandom(12345);
      expect(rng.getSeed()).toBe(12345);
    });

    it('produces deterministic sequences with same seed', () => {
      const rng1 = createSeededRandom(42);
      const rng2 = createSeededRandom(42);

      const seq1 = [rng1.next(), rng1.next(), rng1.next()];
      const seq2 = [rng2.next(), rng2.next(), rng2.next()];

      expect(seq1).toEqual(seq2);
    });

    it('produces different sequences with different seeds', () => {
      const rng1 = createSeededRandom(42);
      const rng2 = createSeededRandom(43);

      const val1 = rng1.next();
      const val2 = rng2.next();

      expect(val1).not.toBe(val2);
    });
  });

  describe('next', () => {
    it('returns values in range [0, 1)', () => {
      const rng = createSeededRandom(12345);

      for (let i = 0; i < 1000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('produces a uniform distribution', () => {
      const rng = createSeededRandom(42);
      const buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

      for (let i = 0; i < 10000; i++) {
        const value = rng.next();
        const bucket = Math.floor(value * 10);
        buckets[bucket]++;
      }

      // Each bucket should have roughly 1000 values (10%)
      for (const count of buckets) {
        expect(count).toBeGreaterThan(800);
        expect(count).toBeLessThan(1200);
      }
    });
  });

  describe('nextInt', () => {
    it('returns integers in range [min, max]', () => {
      const rng = createSeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(5, 10);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThanOrEqual(10);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('handles single value range', () => {
      const rng = createSeededRandom(42);
      expect(rng.nextInt(5, 5)).toBe(5);
    });

    it('handles negative ranges', () => {
      const rng = createSeededRandom(42);

      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(-10, -5);
        expect(value).toBeGreaterThanOrEqual(-10);
        expect(value).toBeLessThanOrEqual(-5);
      }
    });
  });

  describe('nextFloat', () => {
    it('returns floats in range [min, max)', () => {
      const rng = createSeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.nextFloat(5.0, 10.0);
        expect(value).toBeGreaterThanOrEqual(5.0);
        expect(value).toBeLessThan(10.0);
      }
    });

    it('handles negative ranges', () => {
      const rng = createSeededRandom(42);

      for (let i = 0; i < 100; i++) {
        const value = rng.nextFloat(-10.0, -5.0);
        expect(value).toBeGreaterThanOrEqual(-10.0);
        expect(value).toBeLessThan(-5.0);
      }
    });
  });

  describe('nextBoolean', () => {
    it('returns true or false', () => {
      const rng = createSeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.nextBoolean();
        expect(typeof value).toBe('boolean');
      }
    });

    it('respects probability parameter', () => {
      const rng = createSeededRandom(42);
      let trueCount = 0;

      for (let i = 0; i < 10000; i++) {
        if (rng.nextBoolean(0.7)) {
          trueCount++;
        }
      }

      // With 70% probability, expect roughly 7000 trues
      expect(trueCount).toBeGreaterThan(6500);
      expect(trueCount).toBeLessThan(7500);
    });

    it('returns true with probability 1', () => {
      const rng = createSeededRandom(42);
      for (let i = 0; i < 100; i++) {
        expect(rng.nextBoolean(1)).toBe(true);
      }
    });

    it('returns false with probability 0', () => {
      const rng = createSeededRandom(42);
      for (let i = 0; i < 100; i++) {
        expect(rng.nextBoolean(0)).toBe(false);
      }
    });
  });

  describe('nextNormal', () => {
    it('produces values centered around mean', () => {
      const rng = createSeededRandom(42);
      let sum = 0;
      const count = 10000;

      for (let i = 0; i < count; i++) {
        sum += rng.nextNormal(100, 10);
      }

      const average = sum / count;
      expect(average).toBeGreaterThan(95);
      expect(average).toBeLessThan(105);
    });

    it('produces values with specified standard deviation', () => {
      const rng = createSeededRandom(42);
      const values: number[] = [];
      const mean = 50;
      const stdDev = 5;
      const count = 10000;

      for (let i = 0; i < count; i++) {
        values.push(rng.nextNormal(mean, stdDev));
      }

      // Calculate actual standard deviation
      const avg = values.reduce((a, b) => a + b, 0) / count;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / count;
      const actualStdDev = Math.sqrt(variance);

      // Should be close to target stdDev
      expect(actualStdDev).toBeGreaterThan(stdDev * 0.9);
      expect(actualStdDev).toBeLessThan(stdDev * 1.1);
    });

    it('uses default mean of 0 and stdDev of 1', () => {
      const rng = createSeededRandom(42);
      let sum = 0;
      const count = 10000;

      for (let i = 0; i < count; i++) {
        sum += rng.nextNormal();
      }

      const average = sum / count;
      expect(average).toBeGreaterThan(-0.1);
      expect(average).toBeLessThan(0.1);
    });
  });

  describe('clone', () => {
    it('creates independent copy that produces same sequence from that point', () => {
      const rng1 = createSeededRandom(42);

      // Advance rng1 some steps
      rng1.next();
      rng1.next();

      // Clone at this point
      const rng2 = rng1.clone();

      // Both should produce same values from here
      expect(rng1.next()).toBe(rng2.next());
      expect(rng1.next()).toBe(rng2.next());
      expect(rng1.next()).toBe(rng2.next());
    });

    it('clone is independent (advancing one does not affect other)', () => {
      const rng1 = createSeededRandom(42);
      const rng2 = rng1.clone();

      // Advance rng1 many times
      for (let i = 0; i < 100; i++) {
        rng1.next();
      }

      // rng2 should still produce initial sequence
      const rng3 = createSeededRandom(42);
      expect(rng2.next()).toBe(rng3.next());
    });
  });

  describe('generateRandomSeed', () => {
    it('returns a positive integer', () => {
      const seed = generateRandomSeed();
      expect(seed).toBeGreaterThan(0);
      expect(Number.isInteger(seed)).toBe(true);
    });

    it('produces different seeds on subsequent calls (non-deterministic)', () => {
      const seeds = new Set<number>();
      for (let i = 0; i < 100; i++) {
        seeds.add(generateRandomSeed());
      }
      // Should have many unique seeds (allowing for some collisions)
      expect(seeds.size).toBeGreaterThan(90);
    });
  });

  describe('reproducibility', () => {
    it('full simulation sequence is reproducible', () => {
      const runSimulation = (seed: number) => {
        const rng = createSeededRandom(seed);
        const results: number[] = [];

        // Simulate some operations
        for (let i = 0; i < 100; i++) {
          results.push(rng.next());
          results.push(rng.nextInt(0, 100));
          results.push(rng.nextFloat(-1, 1));
          results.push(rng.nextBoolean(0.5) ? 1 : 0);
          results.push(rng.nextNormal(0, 1));
        }

        return results;
      };

      const seed = 12345;
      const run1 = runSimulation(seed);
      const run2 = runSimulation(seed);

      expect(run1).toEqual(run2);
    });
  });
});
