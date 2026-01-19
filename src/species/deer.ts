import type { BaseAttributes, BehavioralAttributes, LifecycleAttributes, DietFlags } from '../entities/types';

export const DEER_DIET: DietFlags = {
  canEatVegetation: true,
  canEatAnimals: false,
  canEatCorpses: false,
};

export const DEER_BASE_ATTRIBUTES: BaseAttributes = {
  strength: 5,
  agility: 12,
  endurance: 10,
  perception: 14,
  size: 1.0,
};

export const DEER_BEHAVIORAL_ATTRIBUTES: BehavioralAttributes = {
  aggression: 0.0,
  flightInstinct: 0.8,
  foodPriorityThreshold: 0.4,
  reproductiveUrge: 0.5,
  carrionPreference: 0.0,
};

export const DEER_LIFECYCLE_ATTRIBUTES: LifecycleAttributes = {
  maxAge: 800,
  maturityAge: 50,
  litterSize: 1,
};
