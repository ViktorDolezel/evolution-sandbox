import { describe, it, expect } from 'vitest';
import {
  BASE_ATTRIBUTE_BOUNDS,
  BEHAVIORAL_ATTRIBUTE_BOUNDS,
  LIFECYCLE_ATTRIBUTE_BOUNDS,
  clampAttribute,
} from '../../../src/genetics/attributes';

describe('Attribute bounds', () => {
  describe('BASE_ATTRIBUTE_BOUNDS', () => {
    it('has strength bounds (1-20)', () => {
      expect(BASE_ATTRIBUTE_BOUNDS.strength).toEqual({ min: 1, max: 20 });
    });

    it('has agility bounds (1-20)', () => {
      expect(BASE_ATTRIBUTE_BOUNDS.agility).toEqual({ min: 1, max: 20 });
    });

    it('has endurance bounds (1-20)', () => {
      expect(BASE_ATTRIBUTE_BOUNDS.endurance).toEqual({ min: 1, max: 20 });
    });

    it('has perception bounds (1-20)', () => {
      expect(BASE_ATTRIBUTE_BOUNDS.perception).toEqual({ min: 1, max: 20 });
    });

    it('has size bounds (0.3-3.0)', () => {
      expect(BASE_ATTRIBUTE_BOUNDS.size).toEqual({ min: 0.3, max: 3.0 });
    });
  });

  describe('BEHAVIORAL_ATTRIBUTE_BOUNDS', () => {
    it('has aggression bounds (0-1)', () => {
      expect(BEHAVIORAL_ATTRIBUTE_BOUNDS.aggression).toEqual({ min: 0.0, max: 1.0 });
    });

    it('has flightInstinct bounds (0-1)', () => {
      expect(BEHAVIORAL_ATTRIBUTE_BOUNDS.flightInstinct).toEqual({ min: 0.0, max: 1.0 });
    });

    it('has foodPriorityThreshold bounds (0.1-0.9)', () => {
      expect(BEHAVIORAL_ATTRIBUTE_BOUNDS.foodPriorityThreshold).toEqual({ min: 0.1, max: 0.9 });
    });

    it('has reproductiveUrge bounds (0.1-0.9)', () => {
      expect(BEHAVIORAL_ATTRIBUTE_BOUNDS.reproductiveUrge).toEqual({ min: 0.1, max: 0.9 });
    });

    it('has carrionPreference bounds (0-1)', () => {
      expect(BEHAVIORAL_ATTRIBUTE_BOUNDS.carrionPreference).toEqual({ min: 0.0, max: 1.0 });
    });
  });

  describe('LIFECYCLE_ATTRIBUTE_BOUNDS', () => {
    it('has maxAge bounds (50-2000)', () => {
      expect(LIFECYCLE_ATTRIBUTE_BOUNDS.maxAge).toEqual({ min: 50, max: 2000 });
    });

    it('has maturityAge bounds (10-500)', () => {
      expect(LIFECYCLE_ATTRIBUTE_BOUNDS.maturityAge).toEqual({ min: 10, max: 500 });
    });

    it('has litterSize bounds (1-4)', () => {
      expect(LIFECYCLE_ATTRIBUTE_BOUNDS.litterSize).toEqual({ min: 1, max: 4 });
    });
  });

  describe('clampAttribute', () => {
    it('returns value when within bounds', () => {
      expect(clampAttribute(10, { min: 1, max: 20 })).toBe(10);
    });

    it('returns min when below bounds', () => {
      expect(clampAttribute(-5, { min: 1, max: 20 })).toBe(1);
    });

    it('returns max when above bounds', () => {
      expect(clampAttribute(25, { min: 1, max: 20 })).toBe(20);
    });

    it('handles decimal bounds', () => {
      expect(clampAttribute(0.1, { min: 0.3, max: 3.0 })).toBe(0.3);
      expect(clampAttribute(5.0, { min: 0.3, max: 3.0 })).toBe(3.0);
    });
  });
});
