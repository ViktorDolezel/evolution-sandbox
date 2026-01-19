import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCorpseFromAnimal,
  consumeCorpse,
  decayCorpse,
  isCorpseExhausted,
  worldToGrid,
} from '../../../src/entities/Corpse';
import { createAnimal } from '../../../src/entities/Animal';
import { getDefaultConfig } from '../../../src/config/defaults';
import { createIdGenerator } from '../../../src/utils/id';
import type { SimulationConfig } from '../../../src/config/types';

describe('Corpse', () => {
  let config: SimulationConfig;
  let animalIdGen: () => string;
  let corpseIdGen: () => string;

  beforeEach(() => {
    config = getDefaultConfig();
    animalIdGen = createIdGenerator('deer');
    corpseIdGen = createIdGenerator('corpse');
  });

  describe('worldToGrid', () => {
    it('converts world coordinates to grid coordinates', () => {
      const result = worldToGrid(27, 13, 5);
      expect(result).toEqual({ x: 5, y: 2 }); // floor(27/5) = 5, floor(13/5) = 2
    });

    it('handles exact tile boundaries', () => {
      const result = worldToGrid(25, 15, 5);
      expect(result).toEqual({ x: 5, y: 3 });
    });

    it('handles origin', () => {
      const result = worldToGrid(0, 0, 5);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('works with different tile sizes', () => {
      const result = worldToGrid(100, 100, 10);
      expect(result).toEqual({ x: 10, y: 10 });
    });
  });

  describe('createCorpseFromAnimal', () => {
    it('creates corpse with correct source info', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 123, y: 456 } },
        config,
        animalIdGen
      );

      const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);

      expect(corpse.sourceSpecies).toBe('deer');
      expect(corpse.sourceId).toBe(animal.id);
      expect(corpse.sourceSize).toBe(animal.baseAttributes.size);
    });

    it('snaps position to grid', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 123, y: 456 } },
        config,
        animalIdGen
      );

      const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);

      // Grid position should be floor(pos / tileSize)
      expect(corpse.gridPosition.x).toBe(Math.floor(123 / config.world.VEGETATION_TILE_SIZE));
      expect(corpse.gridPosition.y).toBe(Math.floor(456 / config.world.VEGETATION_TILE_SIZE));
    });

    it('calculates food value based on size and hunger', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 100 },
        config,
        animalIdGen
      );
      // size = 1.0, hunger = 100, MAX_HUNGER = 100, multiplier = 50
      // foodValue = 1.0 * (100/100) * 50 = 50

      const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);

      expect(corpse.foodValue).toBe(50);
    });

    it('produces lower food value for starved animals', () => {
      const wellFedAnimal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 100 },
        config,
        animalIdGen
      );
      const starvedAnimal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 10 },
        config,
        animalIdGen
      );

      const wellFedCorpse = createCorpseFromAnimal(wellFedAnimal, config, corpseIdGen);
      const starvedCorpse = createCorpseFromAnimal(starvedAnimal, config, corpseIdGen);

      expect(starvedCorpse.foodValue).toBeLessThan(wellFedCorpse.foodValue);
    });

    it('produces zero food value for completely starved animal', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 0 },
        config,
        animalIdGen
      );

      const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);

      expect(corpse.foodValue).toBe(0);
    });

    it('sets decay timer from config', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        animalIdGen
      );

      const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);

      expect(corpse.decayTimer).toBe(config.corpse.CORPSE_DECAY_TICKS);
    });

    it('larger animals produce more food', () => {
      const smallAnimal = createAnimal(
        {
          species: 'deer',
          position: { x: 0, y: 0 },
          baseAttributes: { size: 0.5 },
          initialHunger: 100,
        },
        config,
        animalIdGen
      );
      const largeAnimal = createAnimal(
        {
          species: 'deer',
          position: { x: 0, y: 0 },
          baseAttributes: { size: 2.0 },
          initialHunger: 100,
        },
        config,
        animalIdGen
      );

      const smallCorpse = createCorpseFromAnimal(smallAnimal, config, corpseIdGen);
      const largeCorpse = createCorpseFromAnimal(largeAnimal, config, corpseIdGen);

      expect(largeCorpse.foodValue).toBeGreaterThan(smallCorpse.foodValue);
    });
  });

  describe('consumeCorpse', () => {
    it('reduces food value by amount eaten', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 100 },
        config,
        animalIdGen
      );
      const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);
      const initialFoodValue = corpse.foodValue;

      const updated = consumeCorpse(corpse, 20);

      expect(updated.foodValue).toBe(initialFoodValue - 20);
    });

    it('does not reduce food value below 0', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 100 },
        config,
        animalIdGen
      );
      const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);

      const updated = consumeCorpse(corpse, 1000); // More than available

      expect(updated.foodValue).toBe(0);
    });

    it('does not mutate original corpse', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 100 },
        config,
        animalIdGen
      );
      const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);
      const originalFoodValue = corpse.foodValue;

      consumeCorpse(corpse, 20);

      expect(corpse.foodValue).toBe(originalFoodValue);
    });
  });

  describe('decayCorpse', () => {
    it('reduces decay timer by 1', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        animalIdGen
      );
      const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);
      const initialTimer = corpse.decayTimer;

      const updated = decayCorpse(corpse);

      expect(updated.decayTimer).toBe(initialTimer - 1);
    });

    it('does not reduce timer below 0', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        animalIdGen
      );
      let corpse = createCorpseFromAnimal(animal, config, corpseIdGen);
      corpse = { ...corpse, decayTimer: 0 };

      const updated = decayCorpse(corpse);

      expect(updated.decayTimer).toBe(0);
    });
  });

  describe('isCorpseExhausted', () => {
    it('returns true when food value is 0', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 0 },
        config,
        animalIdGen
      );
      const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);

      expect(isCorpseExhausted(corpse)).toBe(true);
    });

    it('returns true when decay timer is 0', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 100 },
        config,
        animalIdGen
      );
      let corpse = createCorpseFromAnimal(animal, config, corpseIdGen);
      corpse = { ...corpse, decayTimer: 0 };

      expect(isCorpseExhausted(corpse)).toBe(true);
    });

    it('returns false when food value and decay timer are positive', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 100 },
        config,
        animalIdGen
      );
      const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);

      expect(isCorpseExhausted(corpse)).toBe(false);
    });
  });
});
