import type { SimulationConfig, ConfigPreset } from './types';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function getPresetConfig(preset: ConfigPreset): DeepPartial<SimulationConfig> {
  switch (preset) {
    case 'balanced':
      return {};

    case 'fastEvolution':
      return {
        evolution: {
          BEHAVIORAL_MUTATION_RATE: 0.20,
          LIFECYCLE_MUTATION_RATE: 0.10,
        },
        reproduction: {
          REPRODUCTION_COOLDOWN: 50,
        },
        world: {
          TICK_RATE: 20,
        },
      };

    case 'harshWorld':
      return {
        derivedStats: {
          BASE_DECAY: 1.0,
        },
        vegetation: {
          VEGETATION_SPREAD_RATE: 0.025,
          INITIAL_VEGETATION_DENSITY: 0.2,
        },
        corpse: {
          CORPSE_DECAY_TICKS: 50,
        },
      };

    case 'peaceful':
      return {
        derivedStats: {
          BASE_DECAY: 0.2,
        },
        vegetation: {
          VEGETATION_SPREAD_RATE: 0.1,
        },
        world: {
          INITIAL_WOLF_COUNT: 0,
        },
        reproduction: {
          REPRODUCTION_COOLDOWN: 50,
        },
      };

    default:
      return {};
  }
}

export function applyPreset(baseConfig: SimulationConfig, preset: ConfigPreset): SimulationConfig {
  const presetConfig = getPresetConfig(preset);
  return deepMerge(baseConfig, presetConfig);
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
