import type { Animal, Species, BaseAttributes, BehavioralAttributes, LifecycleAttributes, DerivedStats, DietFlags, AnimalState } from './types';
import type { Vector2 } from '../utils/vector';
import type { EntityId } from '../utils/id';
import type { SimulationConfig } from '../config/types';
import { DEER_BASE_ATTRIBUTES, DEER_BEHAVIORAL_ATTRIBUTES, DEER_LIFECYCLE_ATTRIBUTES, DEER_DIET } from '../species/deer';
import { WOLF_BASE_ATTRIBUTES, WOLF_BEHAVIORAL_ATTRIBUTES, WOLF_LIFECYCLE_ATTRIBUTES, WOLF_DIET } from '../species/wolf';
import { calculateAllDerivedStats } from '../genetics/derived';

export interface CreateAnimalOptions {
  species: Species;
  position: Vector2;
  baseAttributes?: Partial<BaseAttributes>;
  behavioralAttributes?: Partial<BehavioralAttributes>;
  lifecycleAttributes?: Partial<LifecycleAttributes>;
  parentIds?: [EntityId | null, EntityId | null];
  generation?: number;
  initialHunger?: number;
}

function getSpeciesDefaults(species: Species): {
  baseAttributes: BaseAttributes;
  behavioralAttributes: BehavioralAttributes;
  lifecycleAttributes: LifecycleAttributes;
  diet: DietFlags;
} {
  if (species === 'deer') {
    return {
      baseAttributes: { ...DEER_BASE_ATTRIBUTES },
      behavioralAttributes: { ...DEER_BEHAVIORAL_ATTRIBUTES },
      lifecycleAttributes: { ...DEER_LIFECYCLE_ATTRIBUTES },
      diet: { ...DEER_DIET },
    };
  } else {
    return {
      baseAttributes: { ...WOLF_BASE_ATTRIBUTES },
      behavioralAttributes: { ...WOLF_BEHAVIORAL_ATTRIBUTES },
      lifecycleAttributes: { ...WOLF_LIFECYCLE_ATTRIBUTES },
      diet: { ...WOLF_DIET },
    };
  }
}

export function createAnimal(
  options: CreateAnimalOptions,
  config: SimulationConfig,
  idGenerator: () => EntityId
): Animal {
  const defaults = getSpeciesDefaults(options.species);

  const baseAttributes: BaseAttributes = {
    ...defaults.baseAttributes,
    ...options.baseAttributes,
  };

  const behavioralAttributes: BehavioralAttributes = {
    ...defaults.behavioralAttributes,
    ...options.behavioralAttributes,
  };

  const lifecycleAttributes: LifecycleAttributes = {
    ...defaults.lifecycleAttributes,
    ...options.lifecycleAttributes,
  };

  const derivedStats = calculateAllDerivedStats(baseAttributes, config);

  const state: AnimalState = {
    position: { ...options.position },
    hunger: options.initialHunger ?? config.entities.INITIAL_HUNGER_SPAWN,
    age: 0,
    ticksSinceLastReproduction: config.reproduction.REPRODUCTION_COOLDOWN,
    isDead: false,
  };

  return {
    id: idGenerator(),
    species: options.species,
    diet: defaults.diet,
    baseAttributes,
    behavioralAttributes,
    lifecycleAttributes,
    derivedStats,
    state,
    parentIds: options.parentIds ?? [null, null],
    generation: options.generation ?? 0,
  };
}

export function calculateDerivedStats(
  baseAttributes: BaseAttributes,
  config: SimulationConfig
): DerivedStats {
  return calculateAllDerivedStats(baseAttributes, config);
}

export function isMature(animal: Animal): boolean {
  return animal.state.age >= animal.lifecycleAttributes.maturityAge;
}

export function isReproductionReady(animal: Animal, config: SimulationConfig): boolean {
  if (!isMature(animal)) {
    return false;
  }

  if (animal.state.ticksSinceLastReproduction < config.reproduction.REPRODUCTION_COOLDOWN) {
    return false;
  }

  // Required hunger: (REPRODUCTION_COST * litterSize + REPRODUCTION_SAFETY_BUFFER) * MAX_HUNGER
  const requiredHunger =
    (config.reproduction.REPRODUCTION_COST * animal.lifecycleAttributes.litterSize +
     config.reproduction.REPRODUCTION_SAFETY_BUFFER) *
    config.entities.MAX_HUNGER;

  if (animal.state.hunger < requiredHunger) {
    return false;
  }

  return true;
}

export function getFitness(animal: Animal): number {
  return animal.baseAttributes.strength +
         animal.baseAttributes.agility +
         animal.baseAttributes.endurance;
}

export function updateAnimalState(
  animal: Animal,
  updates: Partial<AnimalState>
): Animal {
  return {
    ...animal,
    state: {
      ...animal.state,
      ...updates,
    },
  };
}

export function applyHungerDecay(animal: Animal): Animal {
  const newHunger = Math.max(0, animal.state.hunger - animal.derivedStats.hungerDecayRate);
  return updateAnimalState(animal, { hunger: newHunger });
}

export function applyMovementCost(
  animal: Animal,
  distance: number,
  isFleeing: boolean,
  config: SimulationConfig
): Animal {
  let costPerUnit = config.movement.MOVE_COST;
  if (isFleeing) {
    costPerUnit += config.movement.FLEE_COST_BONUS;
  }
  const totalCost = costPerUnit * distance;
  const newHunger = Math.max(0, animal.state.hunger - totalCost);
  return updateAnimalState(animal, { hunger: newHunger });
}
