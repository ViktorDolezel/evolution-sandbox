import { describe, it, expect } from 'vitest';
import { createSimulation } from '../../src/core/Simulation';
import { getDefaultConfig } from '../../src/config/defaults';

describe('Determinism Verification', () => {
  it('1000 ticks produce identical state hash with same seed', () => {
    const config = getDefaultConfig();
    config.world.INITIAL_DEER_COUNT = 15;
    config.world.INITIAL_WOLF_COUNT = 5;

    const seed = 98765;

    // Helper to create state hash
    const hashState = (sim: ReturnType<typeof createSimulation>): string => {
      const animals = sim.world.getAllAnimals().sort((a, b) => a.id.localeCompare(b.id));
      const corpses = sim.world.getAllCorpses().sort((a, b) => a.id.localeCompare(b.id));

      const state = {
        tick: sim.currentTick,
        animalCount: animals.length,
        corpseCount: corpses.length,
        vegetationCount: sim.world.getVegetationCount(),
        animals: animals.map((a) => ({
          id: a.id,
          x: Math.round(a.state.position.x * 1000) / 1000,
          y: Math.round(a.state.position.y * 1000) / 1000,
          hunger: Math.round(a.state.hunger * 1000) / 1000,
          age: a.state.age,
        })),
      };

      return JSON.stringify(state);
    };

    // Run 1
    const sim1 = createSimulation(config, seed);
    for (let i = 0; i < 1000; i++) {
      sim1.step();
    }
    const hash1 = hashState(sim1);

    // Run 2
    const sim2 = createSimulation(config, seed);
    for (let i = 0; i < 1000; i++) {
      sim2.step();
    }
    const hash2 = hashState(sim2);

    expect(hash1).toBe(hash2);
  });

  it('vegetation spread is deterministic', () => {
    const config = getDefaultConfig();
    config.world.INITIAL_DEER_COUNT = 0;
    config.world.INITIAL_WOLF_COUNT = 0;

    const seed = 11111;

    const sim1 = createSimulation(config, seed);
    const sim2 = createSimulation(config, seed);

    // Run 100 ticks (vegetation spread only)
    for (let i = 0; i < 100; i++) {
      sim1.step();
      sim2.step();
    }

    expect(sim1.world.getVegetationCount()).toBe(sim2.world.getVegetationCount());
  });

  it('mutation results are deterministic', () => {
    const config = getDefaultConfig();
    config.world.INITIAL_DEER_COUNT = 4;
    config.world.INITIAL_WOLF_COUNT = 0;
    config.reproduction.REPRODUCTION_COOLDOWN = 10;

    const seed = 22222;

    // Helper to collect offspring
    const collectOffspring = (
      sim: ReturnType<typeof createSimulation>
    ): import('../../src/entities/types').Animal[] => {
      const offspring: import('../../src/entities/types').Animal[] = [];
      sim.on('animalBorn', ({ animal }) => {
        offspring.push(animal);
      });
      return offspring;
    };

    const sim1 = createSimulation(config, seed);
    const offspring1 = collectOffspring(sim1);

    const sim2 = createSimulation(config, seed);
    const offspring2 = collectOffspring(sim2);

    // Run until some offspring born
    for (let i = 0; i < 500; i++) {
      sim1.step();
      sim2.step();
    }

    // Same number of offspring
    expect(offspring1.length).toBe(offspring2.length);

    // Offspring should have identical attributes
    for (let i = 0; i < offspring1.length; i++) {
      expect(offspring1[i].baseAttributes.strength).toBe(offspring2[i].baseAttributes.strength);
      expect(offspring1[i].baseAttributes.agility).toBe(offspring2[i].baseAttributes.agility);
      expect(offspring1[i].behavioralAttributes.aggression).toBe(
        offspring2[i].behavioralAttributes.aggression
      );
    }
  });

  it('combat outcomes are deterministic', () => {
    const config = getDefaultConfig();
    config.world.INITIAL_DEER_COUNT = 10;
    config.world.INITIAL_WOLF_COUNT = 5;

    const seed = 33333;

    const countDeaths = (sim: ReturnType<typeof createSimulation>): number => {
      let deaths = 0;
      sim.on('animalDied', () => deaths++);
      return deaths;
    };

    const sim1 = createSimulation(config, seed);
    let deaths1 = 0;
    sim1.on('animalDied', () => deaths1++);

    const sim2 = createSimulation(config, seed);
    let deaths2 = 0;
    sim2.on('animalDied', () => deaths2++);

    for (let i = 0; i < 500; i++) {
      sim1.step();
      sim2.step();
    }

    expect(deaths1).toBe(deaths2);
    expect(sim1.world.getDeerCount()).toBe(sim2.world.getDeerCount());
    expect(sim1.world.getWolfCount()).toBe(sim2.world.getWolfCount());
  });
});
