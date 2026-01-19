import type { Animal, BaseAttributes, BehavioralAttributes, LifecycleAttributes } from '../entities/types';
import type { SimulationConfig } from '../config/types';
import type { RandomGenerator } from '../core/SeededRandom';
import { mutateBaseAttributes, mutateBehavioralAttributes, mutateLifecycleAttributes, ensureMaturityLessThanMaxAge } from './mutation';

/**
 * Asexual reproduction: offspring inherit directly from single parent.
 * Attributes are copied (not averaged) and then mutation is applied.
 */

export function inheritBaseAttributes(parent: BaseAttributes): BaseAttributes {
  return {
    strength: parent.strength,
    agility: parent.agility,
    endurance: parent.endurance,
    perception: parent.perception,
    size: parent.size,
  };
}

export function inheritBehavioralAttributes(parent: BehavioralAttributes): BehavioralAttributes {
  return {
    aggression: parent.aggression,
    flightInstinct: parent.flightInstinct,
    foodPriorityThreshold: parent.foodPriorityThreshold,
    reproductiveUrge: parent.reproductiveUrge,
    carrionPreference: parent.carrionPreference,
  };
}

export function inheritLifecycleAttributes(parent: LifecycleAttributes): LifecycleAttributes {
  return {
    maxAge: parent.maxAge,
    maturityAge: parent.maturityAge,
    litterSize: parent.litterSize,
  };
}

export function createOffspringAttributes(
  parent: Animal,
  rng: RandomGenerator,
  config: SimulationConfig
): {
  baseAttributes: BaseAttributes;
  behavioralAttributes: BehavioralAttributes;
  lifecycleAttributes: LifecycleAttributes;
} {
  // Inherit base attributes from single parent
  let baseAttributes = inheritBaseAttributes(parent.baseAttributes);

  // Inherit behavioral attributes from single parent
  let behavioralAttributes = inheritBehavioralAttributes(parent.behavioralAttributes);

  // Inherit lifecycle attributes from single parent
  let lifecycleAttributes = inheritLifecycleAttributes(parent.lifecycleAttributes);

  // Apply mutations
  baseAttributes = mutateBaseAttributes(baseAttributes, config.evolution.BASE_MUTATION_RATE, rng);
  behavioralAttributes = mutateBehavioralAttributes(behavioralAttributes, config.evolution.BEHAVIORAL_MUTATION_RATE, rng);
  lifecycleAttributes = mutateLifecycleAttributes(lifecycleAttributes, config.evolution.LIFECYCLE_MUTATION_RATE, rng);

  // Ensure maturity < maxAge
  lifecycleAttributes = ensureMaturityLessThanMaxAge(lifecycleAttributes);

  return {
    baseAttributes,
    behavioralAttributes,
    lifecycleAttributes,
  };
}
