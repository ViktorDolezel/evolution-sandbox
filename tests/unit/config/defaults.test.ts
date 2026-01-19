import { describe, it, expect } from 'vitest';
import { getDefaultConfig, getConfigValue } from '../../../src/config/defaults';

describe('Config defaults', () => {
  describe('getDefaultConfig', () => {
    it('returns a complete config object', () => {
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

    describe('world config', () => {
      it('has correct WORLD_WIDTH default', () => {
        const config = getDefaultConfig();
        expect(config.world.WORLD_WIDTH).toBe(500);
      });

      it('has correct WORLD_HEIGHT default', () => {
        const config = getDefaultConfig();
        expect(config.world.WORLD_HEIGHT).toBe(400);
      });

      it('has correct VEGETATION_TILE_SIZE default', () => {
        const config = getDefaultConfig();
        expect(config.world.VEGETATION_TILE_SIZE).toBe(5);
      });

      it('has correct TICK_RATE default', () => {
        const config = getDefaultConfig();
        expect(config.world.TICK_RATE).toBe(10);
      });

      it('has correct INITIAL_DEER_COUNT default', () => {
        const config = getDefaultConfig();
        expect(config.world.INITIAL_DEER_COUNT).toBe(200);
      });

      it('has correct INITIAL_WOLF_COUNT default', () => {
        const config = getDefaultConfig();
        expect(config.world.INITIAL_WOLF_COUNT).toBe(200);
      });

      it('has correct INITIAL_SPAWN_MIN_DISTANCE default', () => {
        const config = getDefaultConfig();
        expect(config.world.INITIAL_SPAWN_MIN_DISTANCE).toBe(50);
      });
    });

    describe('vegetation config', () => {
      it('has correct INITIAL_VEGETATION_DENSITY default', () => {
        const config = getDefaultConfig();
        expect(config.vegetation.INITIAL_VEGETATION_DENSITY).toBe(0.3);
      });

      it('has correct VEGETATION_SPREAD_RATE default', () => {
        const config = getDefaultConfig();
        expect(config.vegetation.VEGETATION_SPREAD_RATE).toBe(0.005);
      });

      it('has correct VEGETATION_FOOD_VALUE default', () => {
        const config = getDefaultConfig();
        expect(config.vegetation.VEGETATION_FOOD_VALUE).toBe(5);
      });
    });

    describe('entities config', () => {
      it('has correct MAX_HUNGER default', () => {
        const config = getDefaultConfig();
        expect(config.entities.MAX_HUNGER).toBe(100);
      });

      it('has correct INITIAL_HUNGER_SPAWN default', () => {
        const config = getDefaultConfig();
        expect(config.entities.INITIAL_HUNGER_SPAWN).toBe(80);
      });

      it('has correct INITIAL_HUNGER_OFFSPRING default', () => {
        const config = getDefaultConfig();
        expect(config.entities.INITIAL_HUNGER_OFFSPRING).toBe(70);
      });
    });

    describe('derivedStats config', () => {
      it('has correct SPEED_MULTIPLIER default', () => {
        const config = getDefaultConfig();
        expect(config.derivedStats.SPEED_MULTIPLIER).toBe(2.0);
      });

      it('has correct PERCEPTION_MULTIPLIER default', () => {
        const config = getDefaultConfig();
        expect(config.derivedStats.PERCEPTION_MULTIPLIER).toBe(5.0);
      });

      it('has correct BASE_DECAY default', () => {
        const config = getDefaultConfig();
        expect(config.derivedStats.BASE_DECAY).toBe(0.5);
      });
    });

    describe('movement config', () => {
      it('has correct MOVE_COST default', () => {
        const config = getDefaultConfig();
        expect(config.movement.MOVE_COST).toBe(0.05);
      });

      it('has correct FLEE_COST_BONUS default', () => {
        const config = getDefaultConfig();
        expect(config.movement.FLEE_COST_BONUS).toBe(0.03);
      });
    });

    describe('reproduction config', () => {
      it('has correct REPRODUCTION_COST default', () => {
        const config = getDefaultConfig();
        expect(config.reproduction.REPRODUCTION_COST).toBe(0.15);
      });

      it('has correct REPRODUCTION_SAFETY_BUFFER default', () => {
        const config = getDefaultConfig();
        expect(config.reproduction.REPRODUCTION_SAFETY_BUFFER).toBe(0.2);
      });

      it('has correct REPRODUCTION_COOLDOWN default', () => {
        const config = getDefaultConfig();
        expect(config.reproduction.REPRODUCTION_COOLDOWN).toBe(10);
      });

      it('has correct OFFSPRING_SPAWN_OFFSET_MAX default', () => {
        const config = getDefaultConfig();
        expect(config.reproduction.OFFSPRING_SPAWN_OFFSET_MAX).toBe(2.0);
      });
    });

    describe('evolution config', () => {
      it('has correct BASE_MUTATION_RATE default', () => {
        const config = getDefaultConfig();
        expect(config.evolution.BASE_MUTATION_RATE).toBe(0.05);
      });

      it('has correct BEHAVIORAL_MUTATION_RATE default', () => {
        const config = getDefaultConfig();
        expect(config.evolution.BEHAVIORAL_MUTATION_RATE).toBe(0.10);
      });

      it('has correct LIFECYCLE_MUTATION_RATE default', () => {
        const config = getDefaultConfig();
        expect(config.evolution.LIFECYCLE_MUTATION_RATE).toBe(0.05);
      });
    });

    describe('corpse config', () => {
      it('has correct CORPSE_DECAY_TICKS default', () => {
        const config = getDefaultConfig();
        expect(config.corpse.CORPSE_DECAY_TICKS).toBe(100);
      });

      it('has correct CORPSE_FOOD_MULTIPLIER default', () => {
        const config = getDefaultConfig();
        expect(config.corpse.CORPSE_FOOD_MULTIPLIER).toBe(50);
      });
    });

    describe('performance config', () => {
      it('has correct MAX_ENTITIES default', () => {
        const config = getDefaultConfig();
        expect(config.performance.MAX_ENTITIES).toBe(5000);
      });

      it('has correct ENTITY_WARNING_THRESHOLD default', () => {
        const config = getDefaultConfig();
        expect(config.performance.ENTITY_WARNING_THRESHOLD).toBe(1000);
      });

      it('has correct SPATIAL_INDEX_BUCKET_SIZE default', () => {
        const config = getDefaultConfig();
        expect(config.performance.SPATIAL_INDEX_BUCKET_SIZE).toBe(100);
      });
    });

    describe('ui config', () => {
      it('has correct MIN_ZOOM default', () => {
        const config = getDefaultConfig();
        expect(config.ui.MIN_ZOOM).toBe(0.25);
      });

      it('has correct MAX_ZOOM default', () => {
        const config = getDefaultConfig();
        expect(config.ui.MAX_ZOOM).toBe(4.0);
      });

      it('has correct SIDEBAR_WIDTH default', () => {
        const config = getDefaultConfig();
        expect(config.ui.SIDEBAR_WIDTH).toBe(300);
      });

      it('has correct MAX_ACTION_LOG_HISTORY default', () => {
        const config = getDefaultConfig();
        expect(config.ui.MAX_ACTION_LOG_HISTORY).toBe(100);
      });

      it('has correct MIN_ACCEPTABLE_FPS default', () => {
        const config = getDefaultConfig();
        expect(config.ui.MIN_ACCEPTABLE_FPS).toBe(30);
      });
    });
  });

  describe('getConfigValue', () => {
    it('retrieves nested config value', () => {
      const config = getDefaultConfig();
      expect(getConfigValue(config, 'world', 'WORLD_WIDTH')).toBe(500);
    });

    it('works for all config categories', () => {
      const config = getDefaultConfig();
      expect(getConfigValue(config, 'vegetation', 'VEGETATION_FOOD_VALUE')).toBe(5);
      expect(getConfigValue(config, 'entities', 'MAX_HUNGER')).toBe(100);
    });
  });
});
