import type { Vector2 } from '../utils/vector';
import type { EntityId } from '../utils/id';

export type Species = 'deer' | 'wolf';

export interface DietFlags {
  canEatVegetation: boolean;
  canEatAnimals: boolean;
  canEatCorpses: boolean;
}

export interface BaseAttributes {
  strength: number;
  agility: number;
  endurance: number;
  perception: number;
  size: number;
}

export interface BehavioralAttributes {
  aggression: number;
  flightInstinct: number;
  foodPriorityThreshold: number;
  reproductiveUrge: number;
  carrionPreference: number;
}

export interface LifecycleAttributes {
  maxAge: number;
  maturityAge: number;
  litterSize: number;
}

export interface DerivedStats {
  speed: number;
  alertRange: number;
  attackPower: number;
  defense: number;
  hungerDecayRate: number;
}

export interface AnimalState {
  position: Vector2;
  hunger: number;
  age: number;
  ticksSinceLastReproduction: number;
  isDead: boolean;
}

export interface Animal {
  id: EntityId;
  species: Species;
  diet: DietFlags;
  baseAttributes: BaseAttributes;
  behavioralAttributes: BehavioralAttributes;
  lifecycleAttributes: LifecycleAttributes;
  derivedStats: DerivedStats;
  state: AnimalState;
  parentIds: [EntityId | null, EntityId | null];
  generation: number;
}

export interface Corpse {
  id: EntityId;
  sourceSpecies: Species;
  sourceId: EntityId;
  position: Vector2;
  gridPosition: { x: number; y: number };
  foodValue: number;
  sourceSize: number;
  decayTimer: number;
}

export type ActionType =
  | 'DIE'
  | 'FLEE'
  | 'EAT'
  | 'MOVE_TO_FOOD'
  | 'ATTACK'
  | 'REPRODUCE'
  | 'MOVE_TO_MATE'
  | 'DRIFT'
  | 'STAY';

export interface ActionLogEntry {
  tick: number;
  action: ActionType;
  details: string;
}
