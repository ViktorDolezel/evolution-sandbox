export interface WorldConfig {
  WORLD_WIDTH: number;
  WORLD_HEIGHT: number;
  VEGETATION_TILE_SIZE: number;
  TICK_RATE: number;
  INITIAL_DEER_COUNT: number;
  INITIAL_WOLF_COUNT: number;
  INITIAL_SPAWN_MIN_DISTANCE: number;
}

export interface VegetationConfig {
  INITIAL_VEGETATION_DENSITY: number;
  VEGETATION_SPREAD_RATE: number;
  VEGETATION_FOOD_VALUE: number;
}

export interface EntityConfig {
  MAX_HUNGER: number;
  INITIAL_HUNGER_SPAWN: number;
  INITIAL_HUNGER_OFFSPRING: number;
}

export interface DerivedStatsConfig {
  SPEED_MULTIPLIER: number;
  PERCEPTION_MULTIPLIER: number;
  BASE_DECAY: number;
}

export interface MovementConfig {
  MOVE_COST: number;
  FLEE_COST_BONUS: number;
}

export interface ReproductionConfig {
  REPRODUCTION_COST: number;
  REPRODUCTION_SAFETY_BUFFER: number;
  REPRODUCTION_COOLDOWN: number;
  OFFSPRING_SPAWN_OFFSET_MAX: number;
}

export interface EvolutionConfig {
  BASE_MUTATION_RATE: number;
  BEHAVIORAL_MUTATION_RATE: number;
  LIFECYCLE_MUTATION_RATE: number;
}

export interface CorpseConfig {
  CORPSE_DECAY_TICKS: number;
  CORPSE_FOOD_MULTIPLIER: number;
}

export interface PerformanceConfig {
  MAX_ENTITIES: number;
  ENTITY_WARNING_THRESHOLD: number;
  SPATIAL_INDEX_BUCKET_SIZE: number;
}

export interface UIConfig {
  MIN_ZOOM: number;
  MAX_ZOOM: number;
  SIDEBAR_WIDTH: number;
  MAX_ACTION_LOG_HISTORY: number;
  MIN_ACCEPTABLE_FPS: number;
}

export interface SimulationConfig {
  world: WorldConfig;
  vegetation: VegetationConfig;
  entities: EntityConfig;
  derivedStats: DerivedStatsConfig;
  movement: MovementConfig;
  reproduction: ReproductionConfig;
  evolution: EvolutionConfig;
  corpse: CorpseConfig;
  performance: PerformanceConfig;
  ui: UIConfig;
}

export type ConfigPreset = 'balanced' | 'fastEvolution' | 'harshWorld' | 'peaceful';
