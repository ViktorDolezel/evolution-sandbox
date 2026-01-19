export interface AttributeBounds {
  min: number;
  max: number;
}

export const BASE_ATTRIBUTE_BOUNDS: Record<string, AttributeBounds> = {
  strength: { min: 1, max: 20 },
  agility: { min: 1, max: 20 },
  endurance: { min: 1, max: 20 },
  perception: { min: 1, max: 20 },
  size: { min: 0.3, max: 3.0 },
};

export const BEHAVIORAL_ATTRIBUTE_BOUNDS: Record<string, AttributeBounds> = {
  aggression: { min: 0.0, max: 1.0 },
  flightInstinct: { min: 0.0, max: 1.0 },
  foodPriorityThreshold: { min: 0.1, max: 0.9 },
  reproductiveUrge: { min: 0.1, max: 0.9 },
  carrionPreference: { min: 0.0, max: 1.0 },
};

export const LIFECYCLE_ATTRIBUTE_BOUNDS: Record<string, AttributeBounds> = {
  maxAge: { min: 50, max: 2000 },
  maturityAge: { min: 10, max: 500 },
  litterSize: { min: 1, max: 4 },
};

export function clampAttribute(value: number, bounds: AttributeBounds): number {
  return Math.max(bounds.min, Math.min(bounds.max, value));
}
