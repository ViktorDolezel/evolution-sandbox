import type { Animal, Corpse } from '../entities/types';
import type { SimulationConfig } from '../config/types';
import type { VegetationGrid } from '../spatial/VegetationGrid';
import type { SpatialIndex, SpatialEntity } from '../spatial/SpatialIndex';
import type { EntityManager } from '../entities/EntityManager';
import type { RandomGenerator } from './SeededRandom';
import type { Action } from '../behavior/types';
import { makeDecision, canKill } from '../behavior/DecisionEngine';
import { createCorpseFromAnimal, decayCorpse, isCorpseExhausted } from '../entities/Corpse';
import { applyHungerDecay, applyMovementCost, updateAnimalState, createAnimal } from '../entities/Animal';
import { createOffspringAttributes } from '../genetics/inheritance';
import { distance, normalize, subtract } from '../utils/vector';
import { createIdGenerator } from '../utils/id';
import { clamp } from '../utils/math';

export interface TickResult {
  tick: number;
  decisions: Map<string, Action>;
  deaths: string[];
  births: Animal[];
  corpsesCreated: Corpse[];
  corpsesRemoved: string[];
}

export interface TickContext {
  entityManager: EntityManager;
  vegetationGrid: VegetationGrid;
  animalSpatialIndex: SpatialIndex<Animal & SpatialEntity>;
  config: SimulationConfig;
  rng: RandomGenerator;
  currentTick: number;
}

/**
 * Sort animals by alert range (descending) for decision priority.
 * More perceptive animals act first.
 */
export function sortByAlertRange(animals: Animal[]): Animal[] {
  return [...animals].sort((a, b) => b.derivedStats.alertRange - a.derivedStats.alertRange);
}

/**
 * Phase 1: Decision Phase
 * Each animal decides what action to take based on its current state.
 */
export function executeDecisionPhase(context: TickContext): Map<string, Action> {
  const { entityManager, vegetationGrid, config, rng } = context;
  const decisions = new Map<string, Action>();

  // Get living animals sorted by perception (more perceptive act first)
  const livingAnimals = sortByAlertRange(entityManager.getLivingAnimals());
  const corpses = entityManager.getAllCorpses();

  for (const animal of livingAnimals) {
    // Get nearby animals for decision making
    const nearbyAnimals = entityManager.getLivingAnimals().filter(
      a => a.id !== animal.id &&
      distance(animal.state.position, a.state.position) <= animal.derivedStats.alertRange
    );

    const action = makeDecision({
      animal,
      nearbyAnimals,
      corpses,
      vegetationGrid,
      config,
      rng,
    });

    decisions.set(animal.id, action);
  }

  return decisions;
}

/**
 * Convert animal to spatial entity for indexing.
 */
function animalToSpatialEntity(animal: Animal): Animal & SpatialEntity {
  return {
    ...animal,
    position: animal.state.position,
    size: animal.baseAttributes.size,
  };
}

/**
 * Clamp position to world bounds.
 */
function clampToWorld(pos: { x: number; y: number }, config: SimulationConfig): { x: number; y: number } {
  return {
    x: clamp(pos.x, 0, config.world.WORLD_WIDTH),
    y: clamp(pos.y, 0, config.world.WORLD_HEIGHT),
  };
}

/**
 * Phase 2: Execution Phase
 * Execute all decisions and update world state.
 */
export function executeExecutionPhase(
  context: TickContext,
  decisions: Map<string, Action>
): Omit<TickResult, 'tick' | 'decisions'> {
  const { entityManager, vegetationGrid, animalSpatialIndex, config, rng, currentTick } = context;

  const deaths: string[] = [];
  const births: Animal[] = [];
  const corpsesCreated: Corpse[] = [];
  const corpsesRemoved: string[] = [];

  const corpseIdGen = createIdGenerator('corpse');
  const deerIdGen = createIdGenerator('deer');
  const wolfIdGen = createIdGenerator('wolf');

  // Get animals sorted by alert range for execution order
  const animals = sortByAlertRange(entityManager.getLivingAnimals());

  // Process each animal's decision
  for (const animal of animals) {
    const action = decisions.get(animal.id);
    if (!action) continue;

    // Skip if animal died this tick
    if (deaths.includes(animal.id)) continue;

    switch (action.type) {
      case 'DIE': {
        deaths.push(animal.id);
        const updatedAnimal = updateAnimalState(animal, { isDead: true });
        entityManager.updateAnimal(animal.id, updatedAnimal);
        animalSpatialIndex.remove(animal.id);

        // Create corpse
        const corpse = createCorpseFromAnimal(updatedAnimal, config, corpseIdGen);
        entityManager.addCorpse(corpse);
        corpsesCreated.push(corpse);
        break;
      }

      case 'FLEE': {
        if (action.targetPosition) {
          const newPos = clampToWorld(action.targetPosition, config);
          const dist = distance(animal.state.position, newPos);
          let updatedAnimal = updateAnimalState(animal, { position: newPos });
          updatedAnimal = applyMovementCost(updatedAnimal, dist, true, config);
          updatedAnimal = applyHungerDecay(updatedAnimal);
          entityManager.updateAnimal(animal.id, updatedAnimal);
          animalSpatialIndex.update(animalToSpatialEntity(updatedAnimal));
        }
        break;
      }

      case 'EAT': {
        if (action.details === 'vegetation') {
          // Eat vegetation
          const gridPos = vegetationGrid.worldToGrid(
            animal.state.position.x,
            animal.state.position.y
          );
          if (vegetationGrid.has(gridPos.x, gridPos.y)) {
            vegetationGrid.remove(gridPos.x, gridPos.y);
            const newHunger = Math.min(
              config.entities.MAX_HUNGER,
              animal.state.hunger + config.vegetation.VEGETATION_FOOD_VALUE
            );
            let updatedAnimal = updateAnimalState(animal, { hunger: newHunger });
            updatedAnimal = applyHungerDecay(updatedAnimal);
            entityManager.updateAnimal(animal.id, updatedAnimal);
          }
        } else if (action.details === 'corpse' && action.targetId) {
          // Eat corpse
          const corpse = entityManager.getCorpse(action.targetId);
          if (corpse && corpse.foodValue > 0) {
            const amountToEat = Math.min(corpse.foodValue, 20); // Eat up to 20 per tick
            const newHunger = Math.min(
              config.entities.MAX_HUNGER,
              animal.state.hunger + amountToEat
            );
            let updatedAnimal = updateAnimalState(animal, { hunger: newHunger });
            updatedAnimal = applyHungerDecay(updatedAnimal);
            entityManager.updateAnimal(animal.id, updatedAnimal);

            // Update corpse
            const updatedCorpse = { ...corpse, foodValue: corpse.foodValue - amountToEat };
            if (updatedCorpse.foodValue <= 0) {
              entityManager.removeCorpse(corpse.id);
              corpsesRemoved.push(corpse.id);
            }
          }
        }
        break;
      }

      case 'MOVE_TO_FOOD':
      case 'MOVE_TO_MATE': {
        if (action.targetPosition) {
          const direction = normalize(subtract(action.targetPosition, animal.state.position));
          const moveDistance = Math.min(
            animal.derivedStats.speed,
            distance(animal.state.position, action.targetPosition)
          );
          const newPos = clampToWorld({
            x: animal.state.position.x + direction.x * moveDistance,
            y: animal.state.position.y + direction.y * moveDistance,
          }, config);
          let updatedAnimal = updateAnimalState(animal, { position: newPos });
          updatedAnimal = applyMovementCost(updatedAnimal, moveDistance, false, config);
          updatedAnimal = applyHungerDecay(updatedAnimal);
          entityManager.updateAnimal(animal.id, updatedAnimal);
          animalSpatialIndex.update(animalToSpatialEntity(updatedAnimal));
        }
        break;
      }

      case 'ATTACK': {
        if (action.targetId) {
          const prey = entityManager.getAnimal(action.targetId);
          if (prey && !prey.state.isDead && canKill(animal, prey)) {
            // Kill prey
            deaths.push(prey.id);
            const deadPrey = updateAnimalState(prey, { isDead: true });
            entityManager.updateAnimal(prey.id, deadPrey);
            animalSpatialIndex.remove(prey.id);

            // Create corpse
            const corpse = createCorpseFromAnimal(deadPrey, config, corpseIdGen);
            entityManager.addCorpse(corpse);
            corpsesCreated.push(corpse);

            // Predator gains some hunger
            const foodGain = prey.baseAttributes.size * 10;
            const newHunger = Math.min(config.entities.MAX_HUNGER, animal.state.hunger + foodGain);
            let updatedAnimal = updateAnimalState(animal, { hunger: newHunger });
            updatedAnimal = applyHungerDecay(updatedAnimal);
            entityManager.updateAnimal(animal.id, updatedAnimal);
          }
        }
        break;
      }

      case 'REPRODUCE': {
        if (action.targetId) {
          const mate = entityManager.getAnimal(action.targetId);
          if (mate && !mate.state.isDead) {
            // Create offspring
            const offspringAttrs = createOffspringAttributes(animal, mate, rng, config);
            const litterSize = animal.lifecycleAttributes.litterSize;
            const idGen = animal.species === 'deer' ? deerIdGen : wolfIdGen;

            for (let i = 0; i < litterSize; i++) {
              // Random offset from parent
              const offsetX = (rng.next() - 0.5) * config.reproduction.OFFSPRING_SPAWN_OFFSET_MAX * 2;
              const offsetY = (rng.next() - 0.5) * config.reproduction.OFFSPRING_SPAWN_OFFSET_MAX * 2;
              const position = clampToWorld({
                x: animal.state.position.x + offsetX,
                y: animal.state.position.y + offsetY,
              }, config);

              const offspring = createAnimal(
                {
                  species: animal.species,
                  position,
                  baseAttributes: offspringAttrs.baseAttributes,
                  behavioralAttributes: offspringAttrs.behavioralAttributes,
                  lifecycleAttributes: offspringAttrs.lifecycleAttributes,
                  parentIds: [animal.id, mate.id],
                  generation: Math.max(animal.generation, mate.generation) + 1,
                  initialHunger: config.entities.INITIAL_HUNGER_OFFSPRING,
                },
                config,
                idGen
              );

              entityManager.addAnimal(offspring);
              animalSpatialIndex.insert(animalToSpatialEntity(offspring));
              births.push(offspring);
            }

            // Apply reproduction cost to both parents
            const hungerCost = config.reproduction.REPRODUCTION_COST * config.entities.MAX_HUNGER;
            const parent1Hunger = Math.max(0, animal.state.hunger - hungerCost);
            const parent2Hunger = Math.max(0, mate.state.hunger - hungerCost);

            let updatedParent1 = updateAnimalState(animal, {
              hunger: parent1Hunger,
              ticksSinceLastReproduction: 0,
            });
            let updatedParent2 = updateAnimalState(mate, {
              hunger: parent2Hunger,
              ticksSinceLastReproduction: 0,
            });

            updatedParent1 = applyHungerDecay(updatedParent1);
            updatedParent2 = applyHungerDecay(updatedParent2);

            entityManager.updateAnimal(animal.id, updatedParent1);
            entityManager.updateAnimal(mate.id, updatedParent2);
          }
        }
        break;
      }

      case 'DRIFT': {
        if (action.targetPosition) {
          const newPos = clampToWorld(action.targetPosition, config);
          const dist = distance(animal.state.position, newPos);
          let updatedAnimal = updateAnimalState(animal, { position: newPos });
          updatedAnimal = applyMovementCost(updatedAnimal, dist, false, config);
          updatedAnimal = applyHungerDecay(updatedAnimal);
          entityManager.updateAnimal(animal.id, updatedAnimal);
          animalSpatialIndex.update(animalToSpatialEntity(updatedAnimal));
        }
        break;
      }

      case 'STAY': {
        // Just apply hunger decay
        let updatedAnimal = applyHungerDecay(animal);
        entityManager.updateAnimal(animal.id, updatedAnimal);
        break;
      }
    }
  }

  // Age all living animals and update reproduction cooldown
  for (const animal of entityManager.getLivingAnimals()) {
    if (!deaths.includes(animal.id)) {
      const updatedAnimal = updateAnimalState(animal, {
        age: animal.state.age + 1,
        ticksSinceLastReproduction: animal.state.ticksSinceLastReproduction + 1,
      });
      entityManager.updateAnimal(animal.id, updatedAnimal);
    }
  }

  // Decay corpses
  for (const corpse of entityManager.getAllCorpses()) {
    const decayed = decayCorpse(corpse);
    if (isCorpseExhausted(decayed)) {
      entityManager.removeCorpse(corpse.id);
      if (!corpsesRemoved.includes(corpse.id)) {
        corpsesRemoved.push(corpse.id);
      }
    }
  }

  // Spread vegetation
  vegetationGrid.spread(rng, config.vegetation.VEGETATION_SPREAD_RATE);

  return {
    deaths,
    births,
    corpsesCreated,
    corpsesRemoved,
  };
}

/**
 * Run a single tick of the simulation.
 */
export function runTick(context: TickContext): TickResult {
  // Phase 1: Decision
  const decisions = executeDecisionPhase(context);

  // Phase 2: Execution
  const executionResult = executeExecutionPhase(context, decisions);

  return {
    tick: context.currentTick,
    decisions,
    ...executionResult,
  };
}
