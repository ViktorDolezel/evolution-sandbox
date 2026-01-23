import { describe, it, expect } from 'vitest';
import { getDefaultConfig, getConfigValue } from '../../../src/config/defaults';

describe('Config defaults', () => {
  describe('getDefaultConfig', () => {
    it('returns a complete config object with all categories', () => {
      const config = getDefaultConfig();
      expect(config).toBeDefined();
      expect(config.world).toBeDefined();
      expect(config.vegetation).toBeDefined();
      expect(config.entities).toBeDefined();
      expect(config.derivedStats).toBeDefined();
      expect(config.movement).toBeDefined();
      expect(config.reproduction).toBeDefined();
      expect(config.evolution).toBeDefined();
      expect(config.corpse).toBeDefined();
      expect(config.performance).toBeDefined();
      expect(config.ui).toBeDefined();
    });

    it('returns a new object each call (not shared reference)', () => {
      const config1 = getDefaultConfig();
      const config2 = getDefaultConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('getConfigValue', () => {
    it('retrieves nested config value by category and key', () => {
      const config = getDefaultConfig();
      const worldWidth = getConfigValue(config, 'world', 'WORLD_WIDTH');
      expect(typeof worldWidth).toBe('number');
      expect(worldWidth).toBe(config.world.WORLD_WIDTH);
    });

    it('works for all config categories', () => {
      const config = getDefaultConfig();
      expect(getConfigValue(config, 'vegetation', 'VEGETATION_FOOD_VALUE')).toBe(config.vegetation.VEGETATION_FOOD_VALUE);
      expect(getConfigValue(config, 'entities', 'MAX_HUNGER')).toBe(config.entities.MAX_HUNGER);
      expect(getConfigValue(config, 'movement', 'MOVE_COST')).toBe(config.movement.MOVE_COST);
    });
  });
});
