import type { BaseAttributes, BehavioralAttributes, LifecycleAttributes } from '../entities/types';
import type { RandomGenerator } from '../core/SeededRandom';
import { AttributeBounds, BASE_ATTRIBUTE_BOUNDS, BEHAVIORAL_ATTRIBUTE_BOUNDS, LIFECYCLE_ATTRIBUTE_BOUNDS, clampAttribute } from './attributes';

export function mutateValue(
  value: number,
  mutationRate: number,
  bounds: AttributeBounds,
  rng: RandomGenerator
): number {
  if (mutationRate === 0) {
    return value;
  }

  // mutation is drawn from normal distribution with σ = mutationRate
  // offspring = value * (1 + mutation)
  const mutation = rng.nextNormal(0, mutationRate);
  const mutatedValue = value * (1 + mutation);

  return clampAttribute(mutatedValue, bounds);
}

export function mutateBaseAttributes(
  attributes: BaseAttributes,
  mutationRate: number,
  rng: RandomGenerator
): BaseAttributes {
  return {
    strength: mutateValue(attributes.strength, mutationRate, BASE_ATTRIBUTE_BOUNDS.strength, rng),
    agility: mutateValue(attributes.agility, mutationRate, BASE_ATTRIBUTE_BOUNDS.agility, rng),
    endurance: mutateValue(attributes.endurance, mutationRate, BASE_ATTRIBUTE_BOUNDS.endurance, rng),
    perception: mutateValue(attributes.perception, mutationRate, BASE_ATTRIBUTE_BOUNDS.perception, rng),
    size: mutateValue(attributes.size, mutationRate, BASE_ATTRIBUTE_BOUNDS.size, rng),
  };
}

export function mutateBehavioralAttributes(
  attributes: BehavioralAttributes,
  mutationRate: number,
  rng: RandomGenerator
): BehavioralAttributes {
  return {
    aggression: mutateValue(attributes.aggression, mutationRate, BEHAVIORAL_ATTRIBUTE_BOUNDS.aggression, rng),
    flightInstinct: mutateValue(attributes.flightInstinct, mutationRate, BEHAVIORAL_ATTRIBUTE_BOUNDS.flightInstinct, rng),
    foodPriorityThreshold: mutateValue(attributes.foodPriorityThreshold, mutationRate, BEHAVIORAL_ATTRIBUTE_BOUNDS.foodPriorityThreshold, rng),
    reproductiveUrge: mutateValue(attributes.reproductiveUrge, mutationRate, BEHAVIORAL_ATTRIBUTE_BOUNDS.reproductiveUrge, rng),
    carrionPreference: mutateValue(attributes.carrionPreference, mutationRate, BEHAVIORAL_ATTRIBUTE_BOUNDS.carrionPreference, rng),
  };
}

export function mutateLifecycleAttributes(
  attributes: LifecycleAttributes,
  mutationRate: number,
  rng: RandomGenerator
): LifecycleAttributes {
  return {
    maxAge: Math.round(mutateValue(attributes.maxAge, mutationRate, LIFECYCLE_ATTRIBUTE_BOUNDS.maxAge, rng)),
    maturityAge: Math.round(mutateValue(attributes.maturityAge, mutationRate, LIFECYCLE_ATTRIBUTE_BOUNDS.maturityAge, rng)),
    litterSize: Math.round(mutateValue(attributes.litterSize, mutationRate, LIFECYCLE_ATTRIBUTE_BOUNDS.litterSize, rng)),
  };
}

export function ensureMaturityLessThanMaxAge(
  lifecycleAttributes: LifecycleAttributes
): LifecycleAttributes {
  if (lifecycleAttributes.maturityAge >= lifecycleAttributes.maxAge) {
    return {
      ...lifecycleAttributes,
      maturityAge: lifecycleAttributes.maxAge - 1,
    };
  }
  return lifecycleAttributes;
}
