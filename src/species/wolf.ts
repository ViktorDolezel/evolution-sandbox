import type { BaseAttributes, BehavioralAttributes, LifecycleAttributes, DietFlags } from '../entities/types';

export const WOLF_DIET: DietFlags = {
  canEatVegetation: false,
  canEatAnimals: true,
  canEatCorpses: true,
};

export const WOLF_BASE_ATTRIBUTES: BaseAttributes = {
  strength: 12,
  agility: 10,
  endurance: 8,
  perception: 10,
  size: 1.2,
};

export const WOLF_BEHAVIORAL_ATTRIBUTES: BehavioralAttributes = {
  aggression: 0.6,
  flightInstinct: 0.1,
  foodPriorityThreshold: 0.5,
  reproductiveUrge: 0.4,
  carrionPreference: 0.3,
};

export const WOLF_LIFECYCLE_ATTRIBUTES: LifecycleAttributes = {
  maxAge: 1000,
  maturityAge: 80,
  litterSize: 2,
};
