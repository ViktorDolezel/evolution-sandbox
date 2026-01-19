import { describe, it, expect } from 'vitest';
import {
  inheritBaseAttributes,
  inheritBehavioralAttributes,
  inheritLifecycleAttributes,
} from '../../../src/genetics/inheritance';
import type { BaseAttributes, BehavioralAttributes, LifecycleAttributes } from '../../../src/entities/types';

describe('Inheritance (Asexual - Single Parent)', () => {
  describe('inheritBaseAttributes', () => {
    it('copies all base attributes from single parent', () => {
      const parent: BaseAttributes = {
        strength: 10,
        agility: 12,
        endurance: 8,
        perception: 14,
        size: 1.0,
      };

      const offspring = inheritBaseAttributes(parent);

      expect(offspring.strength).toBe(10);
      expect(offspring.agility).toBe(12);
      expect(offspring.endurance).toBe(8);
      expect(offspring.perception).toBe(14);
      expect(offspring.size).toBe(1.0);
    });

    it('creates a new object (not reference)', () => {
      const parent: BaseAttributes = {
        strength: 10,
        agility: 12,
        endurance: 8,
        perception: 14,
        size: 1.0,
      };

      const offspring = inheritBaseAttributes(parent);

      expect(offspring).not.toBe(parent);
      expect(offspring).toEqual(parent);
    });
  });

  describe('inheritBehavioralAttributes', () => {
    it('copies all behavioral attributes from single parent', () => {
      const parent: BehavioralAttributes = {
        aggression: 0.2,
        flightInstinct: 0.8,
        foodPriorityThreshold: 0.4,
        reproductiveUrge: 0.5,
        carrionPreference: 0.3,
      };

      const offspring = inheritBehavioralAttributes(parent);

      expect(offspring.aggression).toBeCloseTo(0.2);
      expect(offspring.flightInstinct).toBeCloseTo(0.8);
      expect(offspring.foodPriorityThreshold).toBeCloseTo(0.4);
      expect(offspring.reproductiveUrge).toBeCloseTo(0.5);
      expect(offspring.carrionPreference).toBeCloseTo(0.3);
    });

    it('creates a new object (not reference)', () => {
      const parent: BehavioralAttributes = {
        aggression: 0.2,
        flightInstinct: 0.8,
        foodPriorityThreshold: 0.4,
        reproductiveUrge: 0.5,
        carrionPreference: 0.3,
      };

      const offspring = inheritBehavioralAttributes(parent);

      expect(offspring).not.toBe(parent);
      expect(offspring).toEqual(parent);
    });
  });

  describe('inheritLifecycleAttributes', () => {
    it('copies all lifecycle attributes from single parent', () => {
      const parent: LifecycleAttributes = {
        maxAge: 800,
        maturityAge: 50,
        litterSize: 2,
      };

      const offspring = inheritLifecycleAttributes(parent);

      expect(offspring.maxAge).toBe(800);
      expect(offspring.maturityAge).toBe(50);
      expect(offspring.litterSize).toBe(2);
    });

    it('creates a new object (not reference)', () => {
      const parent: LifecycleAttributes = {
        maxAge: 800,
        maturityAge: 50,
        litterSize: 2,
      };

      const offspring = inheritLifecycleAttributes(parent);

      expect(offspring).not.toBe(parent);
      expect(offspring).toEqual(parent);
    });
  });
});
