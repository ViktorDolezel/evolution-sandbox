import type { Animal, Corpse } from '../entities/types';
import type { VegetationGrid } from '../spatial/VegetationGrid';
import type { FoodTarget } from './types';
import type { RandomGenerator } from '../core/SeededRandom';
import { distance } from '../utils/vector';

/**
 * Find the nearest vegetation tile within alert range.
 */
export function findNearestVegetation(
  animal: Animal,
  grid: VegetationGrid
): FoodTarget | null {
  if (!animal.diet.canEatVegetation) {
    return null;
  }

  const alertRange = animal.derivedStats.alertRange;
  const positions = grid.getAllPositions();

  let nearest: FoodTarget | null = null;
  let nearestDist = Infinity;

  for (const gridPos of positions) {
    const worldPos = grid.gridToWorld(gridPos.x, gridPos.y);
    const dist = distance(animal.state.position, worldPos);

    if (dist <= alertRange && dist < nearestDist) {
      nearestDist = dist;
      nearest = {
        type: 'vegetation',
        position: worldPos,
        distance: dist,
      };
    }
  }

  return nearest;
}

/**
 * Find the nearest corpse within alert range.
 */
export function findNearestCorpse(
  animal: Animal,
  corpses: Corpse[]
): FoodTarget | null {
  if (!animal.diet.canEatCorpses) {
    return null;
  }

  const alertRange = animal.derivedStats.alertRange;

  let nearest: FoodTarget | null = null;
  let nearestDist = Infinity;

  for (const corpse of corpses) {
    if (corpse.foodValue <= 0) {
      continue;
    }

    const dist = distance(animal.state.position, corpse.position);

    if (dist <= alertRange && dist < nearestDist) {
      nearestDist = dist;
      nearest = {
        type: 'corpse',
        position: corpse.position,
        targetId: corpse.id,
        distance: dist,
      };
    }
  }

  return nearest;
}

/**
 * Find the nearest prey animal within alert range.
 */
export function findNearestPrey(
  animal: Animal,
  nearbyAnimals: Animal[]
): FoodTarget | null {
  if (!animal.diet.canEatAnimals) {
    return null;
  }

  const alertRange = animal.derivedStats.alertRange;

  let nearest: FoodTarget | null = null;
  let nearestDist = Infinity;

  for (const other of nearbyAnimals) {
    // Can't eat own species or dead animals
    if (other.species === animal.species || other.state.isDead) {
      continue;
    }

    // Can only eat animals we can hunt (herbivores if we're carnivore)
    if (other.diet.canEatAnimals) {
      // Don't attack other predators
      continue;
    }

    const dist = distance(animal.state.position, other.state.position);

    if (dist <= alertRange && dist < nearestDist) {
      nearestDist = dist;
      nearest = {
        type: 'prey',
        position: other.state.position,
        targetId: other.id,
        distance: dist,
      };
    }
  }

  return nearest;
}

/**
 * Select the best food target based on diet flags and carrion preference.
 */
export function selectFoodTarget(
  animal: Animal,
  grid: VegetationGrid,
  corpses: Corpse[],
  nearbyAnimals: Animal[],
  rng: RandomGenerator
): FoodTarget | null {
  const vegetation = findNearestVegetation(animal, grid);
  const corpse = findNearestCorpse(animal, corpses);
  const prey = findNearestPrey(animal, nearbyAnimals);

  // Collect all available targets
  const targets: FoodTarget[] = [];
  if (vegetation) targets.push(vegetation);
  if (corpse) targets.push(corpse);
  if (prey) targets.push(prey);

  if (targets.length === 0) {
    return null;
  }

  // For herbivores, just return the nearest vegetation
  if (animal.diet.canEatVegetation && !animal.diet.canEatAnimals) {
    return vegetation;
  }

  // For carnivores/omnivores, consider carrion preference
  if (corpse && prey) {
    const carrionPreference = animal.behavioralAttributes.carrionPreference;
    // Higher carrionPreference = more likely to choose corpse
    if (rng.next() < carrionPreference) {
      return corpse;
    }
    return prey;
  }

  // Return whatever is available
  if (corpse) return corpse;
  if (prey) return prey;
  if (vegetation) return vegetation;

  return null;
}

/**
 * Check if animal is at a position where it can eat the target.
 */
export function isAtFoodPosition(
  animal: Animal,
  target: FoodTarget,
  grid: VegetationGrid
): boolean {
  if (target.type === 'vegetation') {
    // Check if animal is on the same grid cell as vegetation
    const animalGrid = grid.worldToGrid(
      animal.state.position.x,
      animal.state.position.y
    );
    const targetGrid = grid.worldToGrid(target.position.x, target.position.y);
    return animalGrid.x === targetGrid.x && animalGrid.y === targetGrid.y;
  }

  // For corpses and prey, check if within contact distance
  const contactDistance = animal.baseAttributes.size + 2; // Small buffer
  const dist = distance(animal.state.position, target.position);
  return dist <= contactDistance;
}
