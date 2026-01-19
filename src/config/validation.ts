import type { SimulationConfig } from './types';
import { getDefaultConfig } from './defaults';

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  clampedConfig: SimulationConfig;
}

interface ConfigRange {
  min: number;
  max: number;
}

const CONFIG_RANGES: Record<string, Record<string, ConfigRange>> = {
  world: {
    WORLD_WIDTH: { min: 500, max: 5000 },
    WORLD_HEIGHT: { min: 400, max: 4000 },
    VEGETATION_TILE_SIZE: { min: 2, max: 20 },
    TICK_RATE: { min: 1, max: 60 },
    INITIAL_DEER_COUNT: { min: 1, max: 100 },
    INITIAL_WOLF_COUNT: { min: 0, max: 50 },
    INITIAL_SPAWN_MIN_DISTANCE: { min: 10, max: 200 },
  },
  vegetation: {
    INITIAL_VEGETATION_DENSITY: { min: 0.1, max: 0.9 },
    VEGETATION_SPREAD_RATE: { min: 0.01, max: 0.2 },
    VEGETATION_FOOD_VALUE: { min: 5, max: 50 },
  },
  entities: {
    MAX_HUNGER: { min: 50, max: 200 },
    INITIAL_HUNGER_SPAWN: { min: 50, max: 100 },
    INITIAL_HUNGER_OFFSPRING: { min: 40, max: 90 },
  },
  derivedStats: {
    SPEED_MULTIPLIER: { min: 0.5, max: 10.0 },
    PERCEPTION_MULTIPLIER: { min: 1.0, max: 20.0 },
    BASE_DECAY: { min: 0.1, max: 2.0 },
  },
  movement: {
    MOVE_COST: { min: 0.01, max: 0.2 },
    FLEE_COST_BONUS: { min: 0.01, max: 0.1 },
  },
  reproduction: {
    REPRODUCTION_COST: { min: 0.05, max: 0.5 },
    REPRODUCTION_SAFETY_BUFFER: { min: 0.1, max: 0.5 },
    REPRODUCTION_COOLDOWN: { min: 20, max: 500 },
    OFFSPRING_SPAWN_OFFSET_MAX: { min: 0.5, max: 10.0 },
  },
  evolution: {
    BASE_MUTATION_RATE: { min: 0.0, max: 0.3 },
    BEHAVIORAL_MUTATION_RATE: { min: 0.0, max: 0.5 },
    LIFECYCLE_MUTATION_RATE: { min: 0.0, max: 0.3 },
  },
  corpse: {
    CORPSE_DECAY_TICKS: { min: 20, max: 500 },
    CORPSE_FOOD_MULTIPLIER: { min: 10, max: 200 },
  },
  performance: {
    MAX_ENTITIES: { min: 500, max: 10000 },
    ENTITY_WARNING_THRESHOLD: { min: 100, max: 5000 },
    SPATIAL_INDEX_BUCKET_SIZE: { min: 20, max: 500 },
  },
  ui: {
    MIN_ZOOM: { min: 0.1, max: 1.0 },
    MAX_ZOOM: { min: 1.0, max: 10.0 },
    SIDEBAR_WIDTH: { min: 200, max: 500 },
    MAX_ACTION_LOG_HISTORY: { min: 20, max: 500 },
    MIN_ACCEPTABLE_FPS: { min: 15, max: 60 },
  },
};

export function clampConfigValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function validateConfig(config: SimulationConfig): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const clampedConfig = JSON.parse(JSON.stringify(config)) as SimulationConfig;

  // Validate and clamp each category
  for (const [category, ranges] of Object.entries(CONFIG_RANGES)) {
    const categoryConfig = clampedConfig[category as keyof SimulationConfig] as Record<string, number>;

    for (const [key, range] of Object.entries(ranges)) {
      const value = categoryConfig[key];
      if (value < range.min || value > range.max) {
        const clamped = clampConfigValue(value, range.min, range.max);
        warnings.push(
          `${category}.${key} value ${value} clamped to ${clamped} (range: ${range.min}-${range.max})`
        );
        categoryConfig[key] = clamped;
      }
    }
  }

  // Check reproduction cost + safety buffer
  const totalReproductionCost =
    clampedConfig.reproduction.REPRODUCTION_COST +
    clampedConfig.reproduction.REPRODUCTION_SAFETY_BUFFER;
  if (totalReproductionCost > 0.95) {
    warnings.push(
      `REPRODUCTION_COST + REPRODUCTION_SAFETY_BUFFER exceeds 0.95, clamping proportionally`
    );
    const scale = 0.95 / totalReproductionCost;
    clampedConfig.reproduction.REPRODUCTION_COST *= scale;
    clampedConfig.reproduction.REPRODUCTION_SAFETY_BUFFER *= scale;
  }

  // Check initial populations vs MAX_ENTITIES
  const totalInitial =
    clampedConfig.world.INITIAL_DEER_COUNT + clampedConfig.world.INITIAL_WOLF_COUNT;
  if (totalInitial > clampedConfig.performance.MAX_ENTITIES) {
    warnings.push(
      `Initial population (${totalInitial}) exceeds MAX_ENTITIES (${clampedConfig.performance.MAX_ENTITIES})`
    );
  }

  // Check SPATIAL_INDEX_BUCKET_SIZE vs max alertRange
  const maxAlertRange = 20 * clampedConfig.derivedStats.PERCEPTION_MULTIPLIER; // max perception * multiplier
  if (clampedConfig.performance.SPATIAL_INDEX_BUCKET_SIZE < maxAlertRange) {
    warnings.push(
      `SPATIAL_INDEX_BUCKET_SIZE (${clampedConfig.performance.SPATIAL_INDEX_BUCKET_SIZE}) is smaller than max alertRange (${maxAlertRange})`
    );
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    clampedConfig,
  };
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function mergeWithDefaults(partial: DeepPartial<SimulationConfig>): SimulationConfig {
  const defaults = getDefaultConfig();
  return deepMerge(defaults, partial);
}

function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key as keyof typeof source];
      const targetValue = target[key as keyof T];

      if (
        sourceValue !== undefined &&
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        typeof targetValue === 'object' &&
        targetValue !== null
      ) {
        (result as Record<string, unknown>)[key] = deepMerge(
          targetValue as object,
          sourceValue as DeepPartial<object>
        );
      } else if (sourceValue !== undefined) {
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }

  return result;
}
