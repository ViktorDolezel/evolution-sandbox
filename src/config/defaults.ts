import type { SimulationConfig } from './types';

export function getDefaultConfig(): SimulationConfig {
  return {
    world: {
      WORLD_WIDTH: 1000,
      WORLD_HEIGHT: 800,
      VEGETATION_TILE_SIZE: 5,
      TICK_RATE: 10,
      INITIAL_DEER_COUNT: 20,
      INITIAL_WOLF_COUNT: 5,
      INITIAL_SPAWN_MIN_DISTANCE: 50,
    },
    vegetation: {
      INITIAL_VEGETATION_DENSITY: 0.4,
      VEGETATION_SPREAD_RATE: 0.05,
      VEGETATION_FOOD_VALUE: 20,
    },
    entities: {
      MAX_HUNGER: 100,
      INITIAL_HUNGER_SPAWN: 80,
      INITIAL_HUNGER_OFFSPRING: 70,
    },
    derivedStats: {
      SPEED_MULTIPLIER: 2.0,
      PERCEPTION_MULTIPLIER: 5.0,
      BASE_DECAY: 0.5,
    },
    movement: {
      MOVE_COST: 0.05,
      FLEE_COST_BONUS: 0.03,
    },
    reproduction: {
      REPRODUCTION_COST: 0.15,
      REPRODUCTION_SAFETY_BUFFER: 0.2,
      REPRODUCTION_COOLDOWN: 100,
      OFFSPRING_SPAWN_OFFSET_MAX: 2.0,
    },
    evolution: {
      BASE_MUTATION_RATE: 0.05,
      BEHAVIORAL_MUTATION_RATE: 0.10,
      LIFECYCLE_MUTATION_RATE: 0.05,
    },
    corpse: {
      CORPSE_DECAY_TICKS: 100,
      CORPSE_FOOD_MULTIPLIER: 50,
    },
    performance: {
      MAX_ENTITIES: 2000,
      ENTITY_WARNING_THRESHOLD: 1000,
      SPATIAL_INDEX_BUCKET_SIZE: 100,
    },
    ui: {
      MIN_ZOOM: 0.25,
      MAX_ZOOM: 4.0,
      SIDEBAR_WIDTH: 300,
      MAX_ACTION_LOG_HISTORY: 100,
      MIN_ACCEPTABLE_FPS: 30,
    },
  };
}

export function getConfigValue<K extends keyof SimulationConfig>(
  config: SimulationConfig,
  category: K,
  key: keyof SimulationConfig[K]
): number {
  return config[category][key] as number;
}
