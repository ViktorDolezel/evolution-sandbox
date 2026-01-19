import { describe, it, expect, beforeEach } from 'vitest';
import {
  mutateValue,
  mutateBaseAttributes,
  mutateBehavioralAttributes,
  mutateLifecycleAttributes,
  ensureMaturityLessThanMaxAge,
} from '../../../src/genetics/mutation';
import { createSeededRandom } from '../../../src/core/SeededRandom';
import { BASE_ATTRIBUTE_BOUNDS, BEHAVIORAL_ATTRIBUTE_BOUNDS, LIFECYCLE_ATTRIBUTE_BOUNDS } from '../../../src/genetics/attributes';
import type { RandomGenerator } from '../../../src/core/SeededRandom';
import type { BaseAttributes, BehavioralAttributes, LifecycleAttributes } from '../../../src/entities/types';

describe('Mutation', () => {
  let rng: RandomGenerator;

  beforeEach(() => {
    rng = createSeededRandom(42);
  });

  describe('mutateValue', () => {
    it('produces values centered around original', () => {
      const originalValue = 10;
      const mutations: number[] = [];

      for (let i = 0; i < 1000; i++) {
        mutations.push(mutateValue(originalValue, 0.05, { min: 1, max: 20 }, rng));
      }

      const average = mutations.reduce((a, b) => a + b, 0) / mutations.length;
      expect(average).toBeGreaterThan(9);
      expect(average).toBeLessThan(11);
    });

    it('clamps to bounds', () => {
      // Mutation might try to exceed bounds
      for (let i = 0; i < 100; i++) {
        const mutated = mutateValue(1, 0.5, { min: 1, max: 20 }, rng);
        expect(mutated).toBeGreaterThanOrEqual(1);
        expect(mutated).toBeLessThanOrEqual(20);
      }
    });

    it('produces deterministic results with same seed', () => {
      const rng1 = createSeededRandom(42);
      const rng2 = createSeededRandom(42);

      const results1: number[] = [];
      const results2: number[] = [];

      for (let i = 0; i < 10; i++) {
        results1.push(mutateValue(10, 0.1, { min: 1, max: 20 }, rng1));
        results2.push(mutateValue(10, 0.1, { min: 1, max: 20 }, rng2));
      }

      expect(results1).toEqual(results2);
    });

    it('higher mutation rate produces more variance', () => {
      const lowMutationValues: number[] = [];
      const highMutationValues: number[] = [];

      const lowRng = createSeededRandom(42);
      const highRng = createSeededRandom(42);

      for (let i = 0; i < 1000; i++) {
        lowMutationValues.push(mutateValue(10, 0.01, { min: 1, max: 20 }, lowRng));
        highMutationValues.push(mutateValue(10, 0.2, { min: 1, max: 20 }, highRng));
      }

      const lowVariance = lowMutationValues.reduce((sum, v) => sum + Math.pow(v - 10, 2), 0) / 1000;
      const highVariance = highMutationValues.reduce((sum, v) => sum + Math.pow(v - 10, 2), 0) / 1000;

      expect(highVariance).toBeGreaterThan(lowVariance);
    });

    it('zero mutation rate returns original value', () => {
      const mutated = mutateValue(10, 0, { min: 1, max: 20 }, rng);
      expect(mutated).toBe(10);
    });
  });

  describe('mutateBaseAttributes', () => {
    it('mutates all base attributes', () => {
      const original: BaseAttributes = {
        strength: 10,
        agility: 10,
        endurance: 10,
        perception: 10,
        size: 1.0,
      };

      const mutated = mutateBaseAttributes(original, 0.1, rng);

      // At least one attribute should change (statistically very likely)
      const changed =
        mutated.strength !== original.strength ||
        mutated.agility !== original.agility ||
        mutated.endurance !== original.endurance ||
        mutated.perception !== original.perception ||
        mutated.size !== original.size;

      expect(changed).toBe(true);
    });

    it('respects bounds for all attributes', () => {
      const original: BaseAttributes = {
        strength: 1, // At minimum
        agility: 20, // At maximum
        endurance: 10,
        perception: 10,
        size: 0.3, // At minimum
      };

      for (let i = 0; i < 100; i++) {
        const mutated = mutateBaseAttributes(original, 0.2, rng);
        expect(mutated.strength).toBeGreaterThanOrEqual(1);
        expect(mutated.agility).toBeLessThanOrEqual(20);
        expect(mutated.size).toBeGreaterThanOrEqual(0.3);
        expect(mutated.size).toBeLessThanOrEqual(3.0);
      }
    });

    it('does not mutate original', () => {
      const original: BaseAttributes = {
        strength: 10,
        agility: 10,
        endurance: 10,
        perception: 10,
        size: 1.0,
      };
      const originalCopy = { ...original };

      mutateBaseAttributes(original, 0.1, rng);

      expect(original).toEqual(originalCopy);
    });
  });

  describe('mutateBehavioralAttributes', () => {
    it('mutates all behavioral attributes', () => {
      const original: BehavioralAttributes = {
        aggression: 0.5,
        flightInstinct: 0.5,
        foodPriorityThreshold: 0.5,
        reproductiveUrge: 0.5,
        carrionPreference: 0.5,
      };

      const mutated = mutateBehavioralAttributes(original, 0.1, rng);

      const changed =
        mutated.aggression !== original.aggression ||
        mutated.flightInstinct !== original.flightInstinct ||
        mutated.foodPriorityThreshold !== original.foodPriorityThreshold;

      expect(changed).toBe(true);
    });

    it('respects bounds (0-1 for most, 0.1-0.9 for thresholds)', () => {
      const original: BehavioralAttributes = {
        aggression: 0.0,
        flightInstinct: 1.0,
        foodPriorityThreshold: 0.1,
        reproductiveUrge: 0.9,
        carrionPreference: 0.0,
      };

      for (let i = 0; i < 100; i++) {
        const mutated = mutateBehavioralAttributes(original, 0.2, rng);
        expect(mutated.aggression).toBeGreaterThanOrEqual(0);
        expect(mutated.aggression).toBeLessThanOrEqual(1);
        expect(mutated.foodPriorityThreshold).toBeGreaterThanOrEqual(0.1);
        expect(mutated.foodPriorityThreshold).toBeLessThanOrEqual(0.9);
      }
    });
  });

  describe('mutateLifecycleAttributes', () => {
    it('mutates all lifecycle attributes', () => {
      const original: LifecycleAttributes = {
        maxAge: 800,
        maturityAge: 50,
        litterSize: 2,
      };

      const mutated = mutateLifecycleAttributes(original, 0.1, rng);

      const changed =
        mutated.maxAge !== original.maxAge ||
        mutated.maturityAge !== original.maturityAge ||
        mutated.litterSize !== original.litterSize;

      expect(changed).toBe(true);
    });

    it('respects bounds', () => {
      const original: LifecycleAttributes = {
        maxAge: 50, // At minimum
        maturityAge: 500, // At maximum
        litterSize: 1, // At minimum
      };

      for (let i = 0; i < 100; i++) {
        const mutated = mutateLifecycleAttributes(original, 0.2, rng);
        expect(mutated.maxAge).toBeGreaterThanOrEqual(50);
        expect(mutated.maxAge).toBeLessThanOrEqual(2000);
        expect(mutated.maturityAge).toBeGreaterThanOrEqual(10);
        expect(mutated.maturityAge).toBeLessThanOrEqual(500);
        expect(mutated.litterSize).toBeGreaterThanOrEqual(1);
        expect(mutated.litterSize).toBeLessThanOrEqual(4);
      }
    });

    it('rounds litterSize to integer', () => {
      for (let i = 0; i < 100; i++) {
        const mutated = mutateLifecycleAttributes(
          { maxAge: 800, maturityAge: 50, litterSize: 2 },
          0.1,
          rng
        );
        expect(Number.isInteger(mutated.litterSize)).toBe(true);
      }
    });
  });

  describe('ensureMaturityLessThanMaxAge', () => {
    it('returns unchanged if maturityAge < maxAge', () => {
      const attrs: LifecycleAttributes = {
        maxAge: 800,
        maturityAge: 50,
        litterSize: 2,
      };

      const result = ensureMaturityLessThanMaxAge(attrs);

      expect(result.maturityAge).toBe(50);
      expect(result.maxAge).toBe(800);
    });

    it('clamps maturityAge to maxAge - 1 if greater', () => {
      const attrs: LifecycleAttributes = {
        maxAge: 100,
        maturityAge: 150, // Greater than maxAge
        litterSize: 2,
      };

      const result = ensureMaturityLessThanMaxAge(attrs);

      expect(result.maturityAge).toBe(99); // maxAge - 1
      expect(result.maxAge).toBe(100);
    });

    it('clamps maturityAge to maxAge - 1 if equal', () => {
      const attrs: LifecycleAttributes = {
        maxAge: 100,
        maturityAge: 100, // Equal to maxAge
        litterSize: 2,
      };

      const result = ensureMaturityLessThanMaxAge(attrs);

      expect(result.maturityAge).toBe(99);
    });
  });
});
