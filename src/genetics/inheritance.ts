import type { Animal, BaseAttributes, BehavioralAttributes, LifecycleAttributes } from '../entities/types';
import type { SimulationConfig } from '../config/types';
import type { RandomGenerator } from '../core/SeededRandom';
import { mutateBaseAttributes, mutateBehavioralAttributes, mutateLifecycleAttributes, ensureMaturityLessThanMaxAge } from './mutation';

export function inheritAttribute(parent1Value: number, parent2Value: number): number {
  return (parent1Value + parent2Value) / 2;
}

export function inheritBaseAttributes(
  parent1: BaseAttributes,
  parent2: BaseAttributes
): BaseAttributes {
  return {
    strength: inheritAttribute(parent1.strength, parent2.strength),
    agility: inheritAttribute(parent1.agility, parent2.agility),
    endurance: inheritAttribute(parent1.endurance, parent2.endurance),
    perception: inheritAttribute(parent1.perception, parent2.perception),
    size: inheritAttribute(parent1.size, parent2.size),
  };
}

export function inheritBehavioralAttributes(
  parent1: BehavioralAttributes,
  parent2: BehavioralAttributes
): BehavioralAttributes {
  return {
    aggression: inheritAttribute(parent1.aggression, parent2.aggression),
    flightInstinct: inheritAttribute(parent1.flightInstinct, parent2.flightInstinct),
    foodPriorityThreshold: inheritAttribute(parent1.foodPriorityThreshold, parent2.foodPriorityThreshold),
    reproductiveUrge: inheritAttribute(parent1.reproductiveUrge, parent2.reproductiveUrge),
    carrionPreference: inheritAttribute(parent1.carrionPreference, parent2.carrionPreference),
  };
}

export function inheritLifecycleAttributes(
  parent1: LifecycleAttributes,
  parent2: LifecycleAttributes
): LifecycleAttributes {
  return {
    maxAge: inheritAttribute(parent1.maxAge, parent2.maxAge),
    maturityAge: inheritAttribute(parent1.maturityAge, parent2.maturityAge),
    litterSize: inheritAttribute(parent1.litterSize, parent2.litterSize),
  };
}

export function createOffspringAttributes(
  parent1: Animal,
  parent2: Animal,
  rng: RandomGenerator,
  config: SimulationConfig
): {
  baseAttributes: BaseAttributes;
  behavioralAttributes: BehavioralAttributes;
  lifecycleAttributes: LifecycleAttributes;
} {
  // Inherit base attributes
  let baseAttributes = inheritBaseAttributes(
    parent1.baseAttributes,
    parent2.baseAttributes
  );

  // Inherit behavioral attributes
  let behavioralAttributes = inheritBehavioralAttributes(
    parent1.behavioralAttributes,
    parent2.behavioralAttributes
  );

  // Inherit lifecycle attributes
  let lifecycleAttributes = inheritLifecycleAttributes(
    parent1.lifecycleAttributes,
    parent2.lifecycleAttributes
  );

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
