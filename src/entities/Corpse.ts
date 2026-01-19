import type { Animal, Corpse } from './types';
import type { SimulationConfig } from '../config/types';
import type { EntityId } from '../utils/id';

export function worldToGrid(x: number, y: number, tileSize: number): { x: number; y: number } {
  return {
    x: Math.floor(x / tileSize),
    y: Math.floor(y / tileSize),
  };
}

export function createCorpseFromAnimal(
  animal: Animal,
  config: SimulationConfig,
  idGenerator: () => EntityId
): Corpse {
  const gridPosition = worldToGrid(
    animal.state.position.x,
    animal.state.position.y,
    config.world.VEGETATION_TILE_SIZE
  );

  // Food value based on size, hunger ratio, and multiplier
  const hungerRatio = animal.state.hunger / config.entities.MAX_HUNGER;
  const foodValue = animal.baseAttributes.size * hungerRatio * config.corpse.CORPSE_FOOD_MULTIPLIER;

  return {
    id: idGenerator(),
    sourceSpecies: animal.species,
    sourceId: animal.id,
    position: { ...animal.state.position },
    gridPosition,
    foodValue,
    sourceSize: animal.baseAttributes.size,
    decayTimer: config.corpse.CORPSE_DECAY_TICKS,
  };
}

export function consumeCorpse(corpse: Corpse, amountToEat: number): Corpse {
  return {
    ...corpse,
    foodValue: Math.max(0, corpse.foodValue - amountToEat),
  };
}

export function decayCorpse(corpse: Corpse): Corpse {
  return {
    ...corpse,
    decayTimer: Math.max(0, corpse.decayTimer - 1),
  };
}

export function isCorpseExhausted(corpse: Corpse): boolean {
  return corpse.foodValue <= 0 || corpse.decayTimer <= 0;
}
