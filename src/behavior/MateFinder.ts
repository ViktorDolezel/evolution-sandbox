import type { Animal } from '../entities/types';
import type { SimulationConfig } from '../config/types';
import type { MateTarget } from './types';
import { distance } from '../utils/vector';
import { isReproductionReady, isMature, getFitness } from '../entities/Animal';

/**
 * Find all eligible mates within alert range.
 * An eligible mate is a same-species animal that is mature, reproduction-ready,
 * and alive.
 */
export function findEligibleMates(
  animal: Animal,
  nearbyAnimals: Animal[],
  config: SimulationConfig
): MateTarget[] {
  // Animal must be ready to reproduce
  if (!isReproductionReady(animal, config)) {
    return [];
  }

  const alertRange = animal.derivedStats.alertRange;
  const mates: MateTarget[] = [];

  for (const other of nearbyAnimals) {
    // Skip self
    if (other.id === animal.id) {
      continue;
    }

    // Must be same species
    if (other.species !== animal.species) {
      continue;
    }

    // Must be alive
    if (other.state.isDead) {
      continue;
    }

    // Must be reproduction ready
    if (!isReproductionReady(other, config)) {
      continue;
    }

    const dist = distance(animal.state.position, other.state.position);

    // Must be within alert range
    if (dist > alertRange) {
      continue;
    }

    mates.push({
      id: other.id,
      position: other.state.position,
      fitness: getFitness(other),
      distance: dist,
    });
  }

  return mates;
}

/**
 * Select the best mate from available mates.
 * Prefers mates with higher fitness.
 */
export function selectBestMate(mates: MateTarget[]): MateTarget | null {
  if (mates.length === 0) {
    return null;
  }

  // Sort by fitness (descending) then by distance (ascending)
  const sorted = [...mates].sort((a, b) => {
    if (b.fitness !== a.fitness) {
      return b.fitness - a.fitness;
    }
    return a.distance - b.distance;
  });

  return sorted[0];
}

/**
 * Check if animal is within mating range of the mate.
 * Mating range is based on the sizes of both animals.
 */
export function isInMatingRange(animal: Animal, mate: Animal): boolean {
  const matingRange = calculateMatingRange(animal, mate);
  const dist = distance(animal.state.position, mate.state.position);
  return dist <= matingRange;
}

/**
 * Calculate the mating range between two animals.
 * Based on the combined sizes of both animals.
 */
export function calculateMatingRange(animal: Animal, mate: Animal): number {
  // Contact distance based on combined sizes + small buffer
  return animal.baseAttributes.size + mate.baseAttributes.size + 3;
}
