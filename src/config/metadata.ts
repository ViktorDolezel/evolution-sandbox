export interface ConfigPropertyMetadata {
  label: string;
  description: string;
  isLiveChangeable: boolean;
  step: number;
  precision: number;
  unit?: string;
}

export interface ConfigCategoryMetadata {
  label: string;
  description: string;
  properties: Record<string, ConfigPropertyMetadata>;
}

export const CONFIG_METADATA: Record<string, ConfigCategoryMetadata> = {
  world: {
    label: 'World',
    description: 'World size and initial population settings',
    properties: {
      WORLD_WIDTH: {
        label: 'World Width',
        description: 'Width of the simulation world in pixels',
        isLiveChangeable: false,
        step: 100,
        precision: 0,
        unit: 'px',
      },
      WORLD_HEIGHT: {
        label: 'World Height',
        description: 'Height of the simulation world in pixels',
        isLiveChangeable: false,
        step: 100,
        precision: 0,
        unit: 'px',
      },
      VEGETATION_TILE_SIZE: {
        label: 'Vegetation Tile Size',
        description: 'Size of each vegetation grid cell',
        isLiveChangeable: false,
        step: 1,
        precision: 0,
        unit: 'px',
      },
      TICK_RATE: {
        label: 'Tick Rate',
        description: 'Base simulation ticks per second',
        isLiveChangeable: true,
        step: 1,
        precision: 0,
        unit: 'tps',
      },
      INITIAL_DEER_COUNT: {
        label: 'Initial Deer',
        description: 'Number of deer spawned at simulation start',
        isLiveChangeable: false,
        step: 1,
        precision: 0,
      },
      INITIAL_WOLF_COUNT: {
        label: 'Initial Wolves',
        description: 'Number of wolves spawned at simulation start',
        isLiveChangeable: false,
        step: 1,
        precision: 0,
      },
      INITIAL_SPAWN_MIN_DISTANCE: {
        label: 'Spawn Min Distance',
        description: 'Minimum distance between spawned entities at start',
        isLiveChangeable: false,
        step: 5,
        precision: 0,
        unit: 'px',
      },
    },
  },
  vegetation: {
    label: 'Vegetation',
    description: 'Plant growth and food value settings',
    properties: {
      INITIAL_VEGETATION_DENSITY: {
        label: 'Initial Density',
        description: 'Starting vegetation coverage (0-1)',
        isLiveChangeable: false,
        step: 0.05,
        precision: 2,
      },
      VEGETATION_SPREAD_RATE: {
        label: 'Spread Rate',
        description: 'Probability of vegetation spreading each tick',
        isLiveChangeable: true,
        step: 0.01,
        precision: 2,
      },
      VEGETATION_FOOD_VALUE: {
        label: 'Food Value',
        description: 'Hunger restored when eating vegetation',
        isLiveChangeable: true,
        step: 1,
        precision: 0,
      },
    },
  },
  entities: {
    label: 'Entities',
    description: 'Animal hunger and spawning settings',
    properties: {
      MAX_HUNGER: {
        label: 'Max Hunger',
        description: 'Maximum hunger value for animals',
        isLiveChangeable: true,
        step: 10,
        precision: 0,
      },
      INITIAL_HUNGER_SPAWN: {
        label: 'Initial Hunger (Spawn)',
        description: 'Starting hunger for initially spawned animals',
        isLiveChangeable: false,
        step: 5,
        precision: 0,
      },
      INITIAL_HUNGER_OFFSPRING: {
        label: 'Initial Hunger (Offspring)',
        description: 'Starting hunger for newborn animals',
        isLiveChangeable: false,
        step: 5,
        precision: 0,
      },
    },
  },
  derivedStats: {
    label: 'Derived Stats',
    description: 'Multipliers for calculating animal stats from attributes',
    properties: {
      SPEED_MULTIPLIER: {
        label: 'Speed Multiplier',
        description: 'Multiplier for calculating movement speed from agility',
        isLiveChangeable: false,
        step: 0.5,
        precision: 1,
      },
      PERCEPTION_MULTIPLIER: {
        label: 'Perception Multiplier',
        description: 'Multiplier for calculating alert range from perception',
        isLiveChangeable: false,
        step: 1,
        precision: 1,
      },
      BASE_DECAY: {
        label: 'Base Hunger Decay',
        description: 'Base hunger decay rate per tick',
        isLiveChangeable: false,
        step: 0.1,
        precision: 1,
      },
    },
  },
  movement: {
    label: 'Movement',
    description: 'Movement cost settings',
    properties: {
      MOVE_COST: {
        label: 'Move Cost',
        description: 'Hunger cost per unit of movement',
        isLiveChangeable: true,
        step: 0.01,
        precision: 2,
      },
      FLEE_COST_BONUS: {
        label: 'Flee Cost Bonus',
        description: 'Additional hunger cost when fleeing',
        isLiveChangeable: true,
        step: 0.01,
        precision: 2,
      },
    },
  },
  reproduction: {
    label: 'Reproduction',
    description: 'Breeding and offspring settings',
    properties: {
      REPRODUCTION_COST: {
        label: 'Reproduction Cost',
        description: 'Fraction of max hunger consumed when reproducing',
        isLiveChangeable: true,
        step: 0.05,
        precision: 2,
      },
      REPRODUCTION_SAFETY_BUFFER: {
        label: 'Safety Buffer',
        description: 'Minimum hunger ratio required above reproduction cost',
        isLiveChangeable: true,
        step: 0.05,
        precision: 2,
      },
      REPRODUCTION_COOLDOWN: {
        label: 'Cooldown',
        description: 'Minimum ticks between reproductions',
        isLiveChangeable: true,
        step: 10,
        precision: 0,
        unit: 'ticks',
      },
      OFFSPRING_SPAWN_OFFSET_MAX: {
        label: 'Offspring Spawn Offset',
        description: 'Maximum distance offspring spawn from parent',
        isLiveChangeable: true,
        step: 0.5,
        precision: 1,
        unit: 'px',
      },
    },
  },
  evolution: {
    label: 'Evolution',
    description: 'Mutation rate settings',
    properties: {
      BASE_MUTATION_RATE: {
        label: 'Base Mutation Rate',
        description: 'Mutation rate for physical attributes',
        isLiveChangeable: true,
        step: 0.01,
        precision: 2,
      },
      BEHAVIORAL_MUTATION_RATE: {
        label: 'Behavioral Mutation Rate',
        description: 'Mutation rate for behavioral attributes',
        isLiveChangeable: true,
        step: 0.01,
        precision: 2,
      },
      LIFECYCLE_MUTATION_RATE: {
        label: 'Lifecycle Mutation Rate',
        description: 'Mutation rate for lifecycle attributes',
        isLiveChangeable: true,
        step: 0.01,
        precision: 2,
      },
    },
  },
  corpse: {
    label: 'Corpses',
    description: 'Dead animal decay settings',
    properties: {
      CORPSE_DECAY_TICKS: {
        label: 'Decay Time',
        description: 'Ticks until corpse disappears',
        isLiveChangeable: true,
        step: 10,
        precision: 0,
        unit: 'ticks',
      },
      CORPSE_FOOD_MULTIPLIER: {
        label: 'Food Multiplier',
        description: 'Multiplier for corpse food value based on animal size',
        isLiveChangeable: true,
        step: 5,
        precision: 0,
      },
    },
  },
  performance: {
    label: 'Performance',
    description: 'Performance and limit settings',
    properties: {
      MAX_ENTITIES: {
        label: 'Max Entities',
        description: 'Maximum number of entities allowed',
        isLiveChangeable: false,
        step: 100,
        precision: 0,
      },
      ENTITY_WARNING_THRESHOLD: {
        label: 'Warning Threshold',
        description: 'Entity count that triggers performance warning',
        isLiveChangeable: false,
        step: 100,
        precision: 0,
      },
      SPATIAL_INDEX_BUCKET_SIZE: {
        label: 'Spatial Bucket Size',
        description: 'Size of spatial index buckets for proximity queries',
        isLiveChangeable: false,
        step: 10,
        precision: 0,
        unit: 'px',
      },
    },
  },
  ui: {
    label: 'UI',
    description: 'User interface settings',
    properties: {
      MIN_ZOOM: {
        label: 'Min Zoom',
        description: 'Minimum camera zoom level',
        isLiveChangeable: false,
        step: 0.05,
        precision: 2,
      },
      MAX_ZOOM: {
        label: 'Max Zoom',
        description: 'Maximum camera zoom level',
        isLiveChangeable: false,
        step: 0.5,
        precision: 1,
      },
      SIDEBAR_WIDTH: {
        label: 'Sidebar Width',
        description: 'Width of the sidebar panel',
        isLiveChangeable: false,
        step: 10,
        precision: 0,
        unit: 'px',
      },
      MAX_ACTION_LOG_HISTORY: {
        label: 'Action Log History',
        description: 'Maximum actions to display in action log',
        isLiveChangeable: false,
        step: 10,
        precision: 0,
      },
      MIN_ACCEPTABLE_FPS: {
        label: 'Min Acceptable FPS',
        description: 'Minimum FPS before performance warning',
        isLiveChangeable: false,
        step: 5,
        precision: 0,
        unit: 'fps',
      },
    },
  },
};

export function getLiveChangeableProperties(): Set<string> {
  const result = new Set<string>();
  for (const [category, meta] of Object.entries(CONFIG_METADATA)) {
    for (const [key, propMeta] of Object.entries(meta.properties)) {
      if (propMeta.isLiveChangeable) {
        result.add(`${category}.${key}`);
      }
    }
  }
  return result;
}
