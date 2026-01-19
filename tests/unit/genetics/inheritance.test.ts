import { describe, it, expect } from 'vitest';
import {
  inheritAttribute,
  inheritBaseAttributes,
  inheritBehavioralAttributes,
  inheritLifecycleAttributes,
} from '../../../src/genetics/inheritance';
import type { BaseAttributes, BehavioralAttributes, LifecycleAttributes } from '../../../src/entities/types';

describe('Inheritance', () => {
  describe('inheritAttribute', () => {
    it('returns mean of two parent values', () => {
      expect(inheritAttribute(10, 20)).toBe(15);
    });

    it('handles equal values', () => {
      expect(inheritAttribute(10, 10)).toBe(10);
    });

    it('handles decimal values', () => {
      expect(inheritAttribute(5.5, 6.5)).toBe(6);
    });

    it('order does not matter', () => {
      expect(inheritAttribute(5, 15)).toBe(inheritAttribute(15, 5));
    });
  });

  describe('inheritBaseAttributes', () => {
    it('inherits all base attributes as mean', () => {
      const parent1: BaseAttributes = {
        strength: 10,
        agility: 12,
        endurance: 8,
        perception: 14,
        size: 1.0,
      };
      const parent2: BaseAttributes = {
        strength: 14,
        agility: 8,
        endurance: 12,
        perception: 10,
        size: 1.4,
      };

      const offspring = inheritBaseAttributes(parent1, parent2);

      expect(offspring.strength).toBe(12); // (10+14)/2
      expect(offspring.agility).toBe(10); // (12+8)/2
      expect(offspring.endurance).toBe(10); // (8+12)/2
      expect(offspring.perception).toBe(12); // (14+10)/2
      expect(offspring.size).toBe(1.2); // (1.0+1.4)/2
    });
  });

  describe('inheritBehavioralAttributes', () => {
    it('inherits all behavioral attributes as mean', () => {
      const parent1: BehavioralAttributes = {
        aggression: 0.2,
        flightInstinct: 0.8,
        foodPriorityThreshold: 0.4,
        reproductiveUrge: 0.5,
        carrionPreference: 0.0,
      };
      const parent2: BehavioralAttributes = {
        aggression: 0.6,
        flightInstinct: 0.4,
        foodPriorityThreshold: 0.6,
        reproductiveUrge: 0.7,
        carrionPreference: 0.4,
      };

      const offspring = inheritBehavioralAttributes(parent1, parent2);

      expect(offspring.aggression).toBeCloseTo(0.4);
      expect(offspring.flightInstinct).toBeCloseTo(0.6);
      expect(offspring.foodPriorityThreshold).toBeCloseTo(0.5);
      expect(offspring.reproductiveUrge).toBeCloseTo(0.6);
      expect(offspring.carrionPreference).toBeCloseTo(0.2);
    });
  });

  describe('inheritLifecycleAttributes', () => {
    it('inherits all lifecycle attributes as mean', () => {
      const parent1: LifecycleAttributes = {
        maxAge: 800,
        maturityAge: 50,
        litterSize: 1,
      };
      const parent2: LifecycleAttributes = {
        maxAge: 1000,
        maturityAge: 70,
        litterSize: 3,
      };

      const offspring = inheritLifecycleAttributes(parent1, parent2);

      expect(offspring.maxAge).toBe(900); // (800+1000)/2
      expect(offspring.maturityAge).toBe(60); // (50+70)/2
      expect(offspring.litterSize).toBe(2); // (1+3)/2
    });
  });
});
