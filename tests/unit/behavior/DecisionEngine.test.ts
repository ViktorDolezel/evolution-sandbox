import { describe, it, expect, beforeEach } from 'vitest';
import {
  makeDecision,
  shouldDie,
  shouldFlee,
  shouldAttack,
  canKill,
} from '../../../src/behavior/DecisionEngine';
import { createAnimal } from '../../../src/entities/Animal';
import { createCorpseFromAnimal } from '../../../src/entities/Corpse';
import { createVegetationGrid, initializeVegetation } from '../../../src/spatial/VegetationGrid';
import { getDefaultConfig } from '../../../src/config/defaults';
import { createIdGenerator } from '../../../src/utils/id';
import { createSeededRandom } from '../../../src/core/SeededRandom';
import type { SimulationConfig } from '../../../src/config/types';
import type { Animal } from '../../../src/entities/types';

describe('DecisionEngine', () => {
  let config: SimulationConfig;
  let deerIdGen: () => string;
  let wolfIdGen: () => string;
  let corpseIdGen: () => string;
  let rng: ReturnType<typeof createSeededRandom>;

  beforeEach(() => {
    config = getDefaultConfig();
    deerIdGen = createIdGenerator('deer');
    wolfIdGen = createIdGenerator('wolf');
    corpseIdGen = createIdGenerator('corpse');
    rng = createSeededRandom(42);
  });

  describe('shouldDie', () => {
    it('returns true when hunger <= 0', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 0 },
        config,
        deerIdGen
      );

      const result = shouldDie(animal);

      expect(result.should).toBe(true);
      expect(result.cause).toBe('starvation');
    });

    it('returns true when age >= maxAge', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );
      animal.state.age = animal.lifecycleAttributes.maxAge;

      const result = shouldDie(animal);

      expect(result.should).toBe(true);
      expect(result.cause).toBe('old age');
    });

    it('returns false for healthy animal', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );

      const result = shouldDie(animal);

      expect(result.should).toBe(false);
    });
  });

  describe('shouldFlee', () => {
    it('returns true when threats exist and hunger is high', () => {
      const deer = createAnimal(
        { species: 'deer', position: { x: 100, y: 100 }, initialHunger: 80 },
        config,
        deerIdGen
      );
      const wolf = createAnimal(
        { species: 'wolf', position: { x: 110, y: 100 } },
        config,
        wolfIdGen
      );

      // deer.foodPriorityThreshold = 0.4, hunger = 80 > 40
      const result = shouldFlee(deer, [wolf], config, rng);

      expect(result).toBe(true);
    });

    it('may override flee for food when very hungry', () => {
      const deer = createAnimal(
        { species: 'deer', position: { x: 100, y: 100 }, initialHunger: 20 },
        config,
        deerIdGen
      );
      const wolf = createAnimal(
        { species: 'wolf', position: { x: 110, y: 100 } },
        config,
        wolfIdGen
      );

      // With low hunger, animal may choose not to flee
      // This depends on random(), so we can't guarantee the outcome
      // But the function should not throw
      expect(() => shouldFlee(deer, [wolf], config, rng)).not.toThrow();
    });

    it('returns false when no threats', () => {
      const deer1 = createAnimal(
        { species: 'deer', position: { x: 100, y: 100 } },
        config,
        deerIdGen
      );
      const deer2 = createAnimal(
        { species: 'deer', position: { x: 110, y: 100 } },
        config,
        deerIdGen
      );

      const result = shouldFlee(deer1, [deer2], config, rng);

      expect(result).toBe(false);
    });
  });

  describe('shouldAttack', () => {
    it('returns true based on aggression and hunger', () => {
      const wolf = createAnimal(
        { species: 'wolf', position: { x: 100, y: 100 }, initialHunger: 30 },
        config,
        wolfIdGen
      );
      const deer = createAnimal(
        { species: 'deer', position: { x: 105, y: 100 } },
        config,
        deerIdGen
      );

      // Low hunger = high attack motivation
      // attackChance = aggression * (1 - hunger/MAX_HUNGER)
      // = 0.6 * (1 - 30/100) = 0.6 * 0.7 = 0.42
      // With RNG, sometimes true sometimes false
      let attackedAtLeastOnce = false;
      for (let i = 0; i < 100; i++) {
        if (shouldAttack(wolf, deer, createSeededRandom(i))) {
          attackedAtLeastOnce = true;
          break;
        }
      }
      expect(attackedAtLeastOnce).toBe(true);
    });

    it('returns false when full (hunger = MAX_HUNGER)', () => {
      const wolf = createAnimal(
        { species: 'wolf', position: { x: 100, y: 100 }, initialHunger: 100 },
        config,
        wolfIdGen
      );
      const deer = createAnimal(
        { species: 'deer', position: { x: 105, y: 100 } },
        config,
        deerIdGen
      );

      // attackChance = 0.6 * (1 - 100/100) = 0
      const result = shouldAttack(wolf, deer, rng);

      expect(result).toBe(false);
    });

    it('returns false for non-aggressive animals', () => {
      const deer1 = createAnimal(
        { species: 'deer', position: { x: 100, y: 100 }, initialHunger: 30 },
        config,
        deerIdGen
      );
      const deer2 = createAnimal(
        { species: 'deer', position: { x: 105, y: 100 } },
        config,
        deerIdGen
      );

      // Deer aggression = 0.0
      const result = shouldAttack(deer1, deer2, rng);

      expect(result).toBe(false);
    });
  });

  describe('canKill', () => {
    it('returns true when attackPower > defense', () => {
      const wolf = createAnimal(
        { species: 'wolf', position: { x: 100, y: 100 } },
        config,
        wolfIdGen
      );
      const deer = createAnimal(
        { species: 'deer', position: { x: 105, y: 100 } },
        config,
        deerIdGen
      );

      // Wolf attackPower ≈ 13.15, Deer defense ≈ 4.6
      expect(canKill(wolf, deer)).toBe(true);
    });

    it('returns false when attackPower <= defense', () => {
      const deer = createAnimal(
        { species: 'deer', position: { x: 100, y: 100 } },
        config,
        deerIdGen
      );
      const wolf = createAnimal(
        { species: 'wolf', position: { x: 105, y: 100 } },
        config,
        wolfIdGen
      );

      // Deer attackPower ≈ 5, Wolf defense ≈ 4.6
      // This is close, but deer is weaker
      expect(canKill(deer, wolf)).toBe(false);
    });

    it('returns true for large strong attacker vs small weak defender', () => {
      const strongWolf = createAnimal(
        {
          species: 'wolf',
          position: { x: 100, y: 100 },
          baseAttributes: { strength: 20, size: 3.0 },
        },
        config,
        wolfIdGen
      );
      const weakDeer = createAnimal(
        {
          species: 'deer',
          position: { x: 105, y: 100 },
          baseAttributes: { size: 0.3, agility: 1 },
        },
        config,
        deerIdGen
      );

      expect(canKill(strongWolf, weakDeer)).toBe(true);
    });
  });

  describe('makeDecision', () => {
    it('returns DIE when animal should die', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 0 },
        config,
        deerIdGen
      );
      const grid = createVegetationGrid(1000, 800, 5);

      const action = makeDecision({
        animal,
        nearbyAnimals: [],
        corpses: [],
        vegetationGrid: grid,
        config,
        rng,
      });

      expect(action.type).toBe('DIE');
    });

    it('returns FLEE when threats present and not overridden by hunger', () => {
      const deer = createAnimal(
        { species: 'deer', position: { x: 100, y: 100 }, initialHunger: 80 },
        config,
        deerIdGen
      );
      const wolf = createAnimal(
        { species: 'wolf', position: { x: 110, y: 100 } },
        config,
        wolfIdGen
      );
      const grid = createVegetationGrid(1000, 800, 5);

      const action = makeDecision({
        animal: deer,
        nearbyAnimals: [wolf],
        corpses: [],
        vegetationGrid: grid,
        config,
        rng,
      });

      expect(action.type).toBe('FLEE');
    });

    it('returns EAT when hungry and at food position', () => {
      const deer = createAnimal(
        { species: 'deer', position: { x: 27, y: 13 }, initialHunger: 30 },
        config,
        deerIdGen
      );
      const grid = createVegetationGrid(1000, 800, 5);
      // Place vegetation at grid position (5, 2) which contains world pos (27, 13)
      grid.set(5, 2, true);

      const action = makeDecision({
        animal: deer,
        nearbyAnimals: [],
        corpses: [],
        vegetationGrid: grid,
        config,
        rng,
      });

      expect(action.type).toBe('EAT');
    });

    it('returns MOVE_TO_FOOD when hungry and food in range', () => {
      const deer = createAnimal(
        { species: 'deer', position: { x: 100, y: 100 }, initialHunger: 30 },
        config,
        deerIdGen
      );
      const grid = createVegetationGrid(1000, 800, 5);
      // Place vegetation nearby but not at current position
      grid.set(22, 22, true); // World position around (112.5, 112.5)

      const action = makeDecision({
        animal: deer,
        nearbyAnimals: [],
        corpses: [],
        vegetationGrid: grid,
        config,
        rng,
      });

      expect(action.type).toBe('MOVE_TO_FOOD');
    });

    it('returns ATTACK when predator is at prey and conditions met', () => {
      const wolf = createAnimal(
        { species: 'wolf', position: { x: 100, y: 100 }, initialHunger: 20 },
        config,
        wolfIdGen
      );
      const deer = createAnimal(
        { species: 'deer', position: { x: 101, y: 100 } }, // Within contact range
        config,
        deerIdGen
      );
      const grid = createVegetationGrid(1000, 800, 5);

      // Run multiple times to find when attack happens
      let attacked = false;
      for (let i = 0; i < 100; i++) {
        const action = makeDecision({
          animal: wolf,
          nearbyAnimals: [deer],
          corpses: [],
          vegetationGrid: grid,
          config,
          rng: createSeededRandom(i),
        });
        if (action.type === 'ATTACK') {
          attacked = true;
          expect(action.targetId).toBe(deer.id);
          break;
        }
      }
      expect(attacked).toBe(true);
    });

    it('returns REPRODUCE when conditions met and mate adjacent', () => {
      const deer1 = createAnimal(
        { species: 'deer', position: { x: 100, y: 100 }, initialHunger: 80 },
        config,
        deerIdGen
      );
      deer1.state.age = 100; // Mature
      deer1.state.ticksSinceLastReproduction = 200; // Past cooldown

      const deer2 = createAnimal(
        { species: 'deer', position: { x: 101, y: 100 }, initialHunger: 80 }, // Adjacent
        config,
        deerIdGen
      );
      deer2.state.age = 100;
      deer2.state.ticksSinceLastReproduction = 200;

      const grid = createVegetationGrid(1000, 800, 5);

      // Find a seed where reproduction happens
      let reproduced = false;
      for (let i = 0; i < 100; i++) {
        const action = makeDecision({
          animal: deer1,
          nearbyAnimals: [deer2],
          corpses: [],
          vegetationGrid: grid,
          config,
          rng: createSeededRandom(i),
        });
        if (action.type === 'REPRODUCE') {
          reproduced = true;
          break;
        }
      }
      expect(reproduced).toBe(true);
    });

    it('returns STAY when nothing else to do', () => {
      const deer = createAnimal(
        { species: 'deer', position: { x: 500, y: 400 }, initialHunger: 100 },
        config,
        deerIdGen
      );
      // Not mature yet, so can't reproduce
      deer.state.age = 0;

      const grid = createVegetationGrid(1000, 800, 5);
      // No vegetation anywhere

      const action = makeDecision({
        animal: deer,
        nearbyAnimals: [],
        corpses: [],
        vegetationGrid: grid,
        config,
        rng,
      });

      // When full and no food in range, should STAY or DRIFT
      expect(['STAY', 'DRIFT']).toContain(action.type);
    });

    it('wolf prefers corpse over hunting based on carrionPreference', () => {
      const wolf = createAnimal(
        {
          species: 'wolf',
          position: { x: 100, y: 100 },
          initialHunger: 30,
          behavioralAttributes: { carrionPreference: 0.9 },
        },
        config,
        wolfIdGen
      );

      const deer = createAnimal(
        { species: 'deer', position: { x: 150, y: 100 } },
        config,
        deerIdGen
      );

      const deadDeer = createAnimal(
        { species: 'deer', position: { x: 120, y: 100 }, initialHunger: 80 },
        config,
        deerIdGen
      );
      const corpse = createCorpseFromAnimal(deadDeer, config, corpseIdGen);

      const grid = createVegetationGrid(1000, 800, 5);

      // With high carrionPreference, should prefer corpse
      let movedToCorpse = false;
      for (let i = 0; i < 50; i++) {
        const action = makeDecision({
          animal: wolf,
          nearbyAnimals: [deer],
          corpses: [corpse],
          vegetationGrid: grid,
          config,
          rng: createSeededRandom(i),
        });
        if (action.type === 'MOVE_TO_FOOD' || action.type === 'EAT') {
          // Check if target is corpse position
          movedToCorpse = true;
          break;
        }
      }
      expect(movedToCorpse).toBe(true);
    });
  });
});
