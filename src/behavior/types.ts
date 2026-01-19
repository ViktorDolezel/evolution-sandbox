import type { Vector2 } from '../utils/vector';
import type { EntityId } from '../utils/id';
import type { ActionType } from '../entities/types';

export interface Action {
  type: ActionType;
  targetId?: EntityId;
  targetPosition?: Vector2;
  details?: string;
}

export interface ThreatInfo {
  id: EntityId;
  distance: number;
  perceivedThreat: number;
}

export interface FoodTarget {
  type: 'vegetation' | 'corpse' | 'prey';
  position: Vector2;
  targetId?: EntityId;
  distance: number;
}

export interface MateTarget {
  id: EntityId;
  position: Vector2;
  fitness: number;
  distance: number;
}
