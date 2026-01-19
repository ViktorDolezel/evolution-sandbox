import type { Animal, Corpse } from '../entities/types';
import type { SimulationConfig } from '../config/types';
import type { VegetationGrid } from '../spatial/VegetationGrid';
import type { RandomGenerator } from '../core/SeededRandom';
import type { Action, ThreatInfo, FoodTarget } from './types';
import { findThreats, calculateFleeVector } from './ThreatCalculator';
import { selectFoodTarget, isAtFoodPosition, findNearestPrey } from './FoodFinder';
import { distance } from '../utils/vector';
import { isReproductionReady } from '../entities/Animal';

export interface DecisionContext {
  animal: Animal;
  nearbyAnimals: Animal[];
  corpses: Corpse[];
  vegetationGrid: VegetationGrid;
  config: SimulationConfig;
  rng: RandomGenerator;
}

/**
 * Check if animal should die.
 * Returns true if hunger <= 0 (starvation) or age >= maxAge (old age).
 */
export function shouldDie(animal: Animal): { should: boolean; cause?: string } {
  if (animal.state.hunger <= 0) {
    return { should: true, cause: 'starvation' };
  }

  if (animal.state.age >= animal.lifecycleAttributes.maxAge) {
    return { should: true, cause: 'old age' };
  }

  return { should: false };
}

/**
 * Determine if animal should flee from nearby threats.
 * May override flee decision when very hungry.
 */
export function shouldFlee(
  animal: Animal,
  nearbyAnimals: Animal[],
  config: SimulationConfig,
  rng: RandomGenerator
): boolean {
  const threats = findThreats(animal, nearbyAnimals);

  if (threats.length === 0) {
    return false;
  }

  // Check if hunger overrides flee instinct
  const hungerRatio = animal.state.hunger / config.entities.MAX_HUNGER;
  const foodPriorityThreshold = animal.behavioralAttributes.foodPriorityThreshold;

  // If hunger is high (ratio is above threshold), always flee
  if (hungerRatio > foodPriorityThreshold) {
    return true;
  }

  // When very hungry, may choose to ignore threats
  // Probability to flee decreases as hunger drops below threshold
  const fleeChance = hungerRatio / foodPriorityThreshold;
  return rng.next() < fleeChance;
}

/**
 * Determine if predator should attack a target.
 * Based on aggression and hunger level.
 * attackChance = aggression * (1 - hunger/MAX_HUNGER)
 */
export function shouldAttack(
  animal: Animal,
  target: Animal,
  rng: RandomGenerator
): boolean {
  const aggression = animal.behavioralAttributes.aggression;

  if (aggression === 0) {
    return false;
  }

  // Attack motivation increases as hunger decreases
  // When full (hunger = MAX_HUNGER), attackChance = 0
  // When starving (hunger = 0), attackChance = aggression
  const hungerRatio = animal.state.hunger / 100; // Assume MAX_HUNGER = 100
  const attackChance = aggression * (1 - hungerRatio);

  return rng.next() < attackChance;
}

/**
 * Determine if attacker can kill defender.
 * True when attackPower > defense.
 */
export function canKill(attacker: Animal, defender: Animal): boolean {
  return attacker.derivedStats.attackPower > defender.derivedStats.defense;
}

/**
 * Main decision-making function.
 * Priority order: DIE > FLEE > EAT > MOVE_TO_FOOD > ATTACK > REPRODUCE > DRIFT/STAY
 * Note: V1 uses asexual reproduction - no mate required
 */
export function makeDecision(context: DecisionContext): Action {
  const { animal, nearbyAnimals, corpses, vegetationGrid, config, rng } = context;

  // 1. Check if should die
  const deathCheck = shouldDie(animal);
  if (deathCheck.should) {
    return { type: 'DIE', details: deathCheck.cause };
  }

  // 2. Check threats and flee
  if (shouldFlee(animal, nearbyAnimals, config, rng)) {
    const threats = findThreats(animal, nearbyAnimals);
    const animalsMap = new Map(nearbyAnimals.map((a) => [a.id, a]));
    const fleeDir = calculateFleeVector(animal.state.position, threats, animalsMap);

    return {
      type: 'FLEE',
      targetPosition: {
        x: animal.state.position.x + fleeDir.x * animal.derivedStats.speed,
        y: animal.state.position.y + fleeDir.y * animal.derivedStats.speed,
      },
    };
  }

  // 3. Check for food needs
  const hungerRatio = animal.state.hunger / config.entities.MAX_HUNGER;
  const isHungry = hungerRatio < 0.9; // Consider hungry if below 90%

  if (isHungry) {
    const foodTarget = selectFoodTarget(animal, vegetationGrid, corpses, nearbyAnimals, rng);

    if (foodTarget) {
      // For prey targets, we need to ATTACK not EAT
      if (foodTarget.type === 'prey' && foodTarget.targetId) {
        const preyAnimal = nearbyAnimals.find((a) => a.id === foodTarget.targetId);
        if (preyAnimal) {
          const contactDist = animal.baseAttributes.size + preyAnimal.baseAttributes.size + 2;
          const dist = distance(animal.state.position, preyAnimal.state.position);

          if (dist <= contactDist) {
            // In contact range - attack if conditions met
            if (shouldAttack(animal, preyAnimal, rng)) {
              return {
                type: 'ATTACK',
                targetId: preyAnimal.id,
                targetPosition: preyAnimal.state.position,
              };
            }
          } else {
            // Move toward prey
            return {
              type: 'MOVE_TO_FOOD',
              targetId: foodTarget.targetId,
              targetPosition: foodTarget.position,
            };
          }
        }
      } else {
        // Vegetation or corpse - check if at food position
        if (isAtFoodPosition(animal, foodTarget, vegetationGrid)) {
          return {
            type: 'EAT',
            targetId: foodTarget.targetId,
            targetPosition: foodTarget.position,
            details: foodTarget.type,
          };
        }

        // Move toward food
        return {
          type: 'MOVE_TO_FOOD',
          targetId: foodTarget.targetId,
          targetPosition: foodTarget.position,
        };
      }
    }
  }

  // 4. Check for attack opportunity (predators) - even when not hungry
  if (animal.diet.canEatAnimals && !isHungry) {
    const prey = findNearestPrey(animal, nearbyAnimals);

    if (prey && prey.targetId) {
      const preyAnimal = nearbyAnimals.find((a) => a.id === prey.targetId);

      if (preyAnimal) {
        const contactDist = animal.baseAttributes.size + preyAnimal.baseAttributes.size + 2;
        const dist = distance(animal.state.position, preyAnimal.state.position);

        // If in contact range and should attack
        if (dist <= contactDist && shouldAttack(animal, preyAnimal, rng)) {
          return {
            type: 'ATTACK',
            targetId: preyAnimal.id,
            targetPosition: preyAnimal.state.position,
          };
        }
      }
    }
  }

  // 5. Check for reproduction (asexual - no mate required)
  if (isReproductionReady(animal, config)) {
    // Reproduction chance based on reproductive urge
    if (rng.next() < animal.behavioralAttributes.reproductiveUrge) {
      return {
        type: 'REPRODUCE',
      };
    }
  }

  // 6. Default: drift or stay
  // If hungry but no food nearby, drift in a random direction
  if (isHungry) {
    const angle = rng.next() * Math.PI * 2;
    const driftDir = { x: Math.cos(angle), y: Math.sin(angle) };

    return {
      type: 'DRIFT',
      targetPosition: {
        x: animal.state.position.x + driftDir.x * animal.derivedStats.speed * 0.5,
        y: animal.state.position.y + driftDir.y * animal.derivedStats.speed * 0.5,
      },
    };
  }

  // If full and nothing to do, stay in place
  return { type: 'STAY' };
}
