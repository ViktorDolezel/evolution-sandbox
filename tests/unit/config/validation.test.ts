import { describe, it, expect } from 'vitest';
import { validateConfig, clampConfigValue, mergeWithDefaults } from '../../../src/config/validation';
import { getDefaultConfig } from '../../../src/config/defaults';

describe('Config validation', () => {
  describe('clampConfigValue', () => {
    it('returns value when within range', () => {
      expect(clampConfigValue(5, 0, 10)).toBe(5);
    });

    it('clamps to min when below range', () => {
      expect(clampConfigValue(-5, 0, 10)).toBe(0);
    });

    it('clamps to max when above range', () => {
      expect(clampConfigValue(15, 0, 10)).toBe(10);
    });
  });

  describe('validateConfig', () => {
    it('returns valid for default config', () => {
      const config = getDefaultConfig();
      const result = validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('clamps out-of-range values and adds warning', () => {
      const config = getDefaultConfig();
      config.world.WORLD_WIDTH = 10000; // Above max 5000

      const result = validateConfig(config);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.clampedConfig.world.WORLD_WIDTH).toBe(5000);
    });

    it('validates WORLD_WIDTH range (500-5000)', () => {
      const config = getDefaultConfig();
      config.world.WORLD_WIDTH = 100;

      const result = validateConfig(config);
      expect(result.clampedConfig.world.WORLD_WIDTH).toBe(500);
    });

    it('validates TICK_RATE range (1-60)', () => {
      const config = getDefaultConfig();
      config.world.TICK_RATE = 100;

      const result = validateConfig(config);
      expect(result.clampedConfig.world.TICK_RATE).toBe(60);
    });

    it('validates INITIAL_VEGETATION_DENSITY range (0.1-0.9)', () => {
      const config = getDefaultConfig();
      config.vegetation.INITIAL_VEGETATION_DENSITY = 1.5;

      const result = validateConfig(config);
      expect(result.clampedConfig.vegetation.INITIAL_VEGETATION_DENSITY).toBe(0.9);
    });

    it('validates REPRODUCTION_COST + SAFETY_BUFFER <= 1.0', () => {
      const config = getDefaultConfig();
      config.reproduction.REPRODUCTION_COST = 0.8;
      config.reproduction.REPRODUCTION_SAFETY_BUFFER = 0.5;

      const result = validateConfig(config);
      expect(result.warnings.length).toBeGreaterThan(0);
      // Total should be clamped to 0.95
      const total = result.clampedConfig.reproduction.REPRODUCTION_COST +
        result.clampedConfig.reproduction.REPRODUCTION_SAFETY_BUFFER;
      expect(total).toBeLessThanOrEqual(0.95);
    });

    it('warns when initial populations exceed MAX_ENTITIES', () => {
      const config = getDefaultConfig();
      config.world.INITIAL_DEER_COUNT = 1500;
      config.world.INITIAL_WOLF_COUNT = 1500;
      config.performance.MAX_ENTITIES = 2000;

      const result = validateConfig(config);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('warns when SPATIAL_INDEX_BUCKET_SIZE is too small', () => {
      const config = getDefaultConfig();
      config.performance.SPATIAL_INDEX_BUCKET_SIZE = 10;
      // With perception max 20 * multiplier 5.0 = 100 alertRange

      const result = validateConfig(config);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('mergeWithDefaults', () => {
    it('returns full config when given empty partial', () => {
      const result = mergeWithDefaults({});
      const defaults = getDefaultConfig();

      expect(result.world.WORLD_WIDTH).toBe(defaults.world.WORLD_WIDTH);
      expect(result.entities.MAX_HUNGER).toBe(defaults.entities.MAX_HUNGER);
    });

    it('overrides specific values while keeping defaults', () => {
      const defaults = getDefaultConfig();
      const result = mergeWithDefaults({
        world: { WORLD_WIDTH: 2000 } as any,
      });

      expect(result.world.WORLD_WIDTH).toBe(2000);
      expect(result.world.WORLD_HEIGHT).toBe(defaults.world.WORLD_HEIGHT);
    });

    it('handles deeply nested partial configs', () => {
      const defaults = getDefaultConfig();
      const result = mergeWithDefaults({
        evolution: { BASE_MUTATION_RATE: 0.1 } as any,
        vegetation: { VEGETATION_FOOD_VALUE: 30 } as any,
      });

      expect(result.evolution.BASE_MUTATION_RATE).toBe(0.1);
      expect(result.evolution.BEHAVIORAL_MUTATION_RATE).toBe(defaults.evolution.BEHAVIORAL_MUTATION_RATE);
      expect(result.vegetation.VEGETATION_FOOD_VALUE).toBe(30);
    });
  });
});
