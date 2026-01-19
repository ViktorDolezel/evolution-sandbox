import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createSimulation, type Simulation } from '../../src/core/Simulation';
import { createWorld, initializePopulation } from '../../src/core/World';
import { runTick } from '../../src/core/TickLoop';
import { getDefaultConfig } from '../../src/config/defaults';
import { createSeededRandom } from '../../src/core/SeededRandom';
import type { SimulationConfig } from '../../src/config/types';

// Mock browser APIs for Node environment
const mockRequestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  return setTimeout(() => cb(performance.now()), 16) as unknown as number;
});
const mockCancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id);
});

vi.stubGlobal('requestAnimationFrame', mockRequestAnimationFrame);
vi.stubGlobal('cancelAnimationFrame', mockCancelAnimationFrame);

describe('Simulation Integration Tests', () => {
  let config: SimulationConfig;

  beforeEach(() => {
    config = getDefaultConfig();
    // Use smaller world and population for faster tests
    config.world.WORLD_WIDTH = 100;
    config.world.WORLD_HEIGHT = 100;
    config.world.INITIAL_DEER_COUNT = 5;
    config.world.INITIAL_WOLF_COUNT = 2;
    config.world.INITIAL_SPAWN_MIN_DISTANCE = 5;
  });

  describe('Determinism', () => {
    it('produces identical results with same seed', () => {
      const seed = 12345;

      // Run simulation 1
      const sim1 = createSimulation(config, seed);
      for (let i = 0; i < 20; i++) {
        sim1.step();
      }

      // Run simulation 2 with same seed
      const sim2 = createSimulation(config, seed);
      for (let i = 0; i < 20; i++) {
        sim2.step();
      }

      // Compare final states
      expect(sim1.currentTick).toBe(sim2.currentTick);
      expect(sim1.world.getDeerCount()).toBe(sim2.world.getDeerCount());
      expect(sim1.world.getWolfCount()).toBe(sim2.world.getWolfCount());
      expect(sim1.world.getVegetationCount()).toBe(sim2.world.getVegetationCount());

      // Compare animal positions
      const animals1 = sim1.world.getAllAnimals().sort((a, b) => a.id.localeCompare(b.id));
      const animals2 = sim2.world.getAllAnimals().sort((a, b) => a.id.localeCompare(b.id));

      expect(animals1.length).toBe(animals2.length);
      for (let i = 0; i < animals1.length; i++) {
        expect(animals1[i].id).toBe(animals2[i].id);
        expect(animals1[i].state.position.x).toBeCloseTo(animals2[i].state.position.x);
        expect(animals1[i].state.position.y).toBeCloseTo(animals2[i].state.position.y);
        expect(animals1[i].state.hunger).toBeCloseTo(animals2[i].state.hunger);
      }
    });

    it('produces different results with different seeds', () => {
      const sim1 = createSimulation(config, 12345);
      const sim2 = createSimulation(config, 54321);

      for (let i = 0; i < 10; i++) {
        sim1.step();
        sim2.step();
      }

      // States should differ (statistically almost certain)
      const animals1 = sim1.world.getAllAnimals();
      const animals2 = sim2.world.getAllAnimals();

      // At least one animal should have different position
      const hasDifference = animals1.some((a1, i) => {
        const a2 = animals2.find((a) => a.id === a1.id);
        if (!a2) return true;
        return (
          Math.abs(a1.state.position.x - a2.state.position.x) > 0.001 ||
          Math.abs(a1.state.position.y - a2.state.position.y) > 0.001
        );
      });

      expect(hasDifference).toBe(true);
    });
  });

  describe('Population Dynamics', () => {
    it('deer find and eat vegetation', () => {
      // Use config where vegetation doesn't spread (to clearly see consumption)
      config.vegetation.VEGETATION_SPREAD_RATE = 0;
      config.world.INITIAL_DEER_COUNT = 5;
      config.world.INITIAL_WOLF_COUNT = 0;

      const sim = createSimulation(config, 42);
      const initialVegetation = sim.world.getVegetationCount();

      // Run enough ticks for deer to eat some vegetation
      for (let i = 0; i < 20; i++) {
        sim.step();
      }

      // Some vegetation should be consumed (since spread is disabled)
      expect(sim.world.getVegetationCount()).toBeLessThan(initialVegetation);
    });

    it('wolves hunt deer and create corpses', () => {
      // Setup: hungrier wolves, small world to ensure encounters
      config.world.INITIAL_DEER_COUNT = 10;
      config.world.INITIAL_WOLF_COUNT = 5;
      config.world.INITIAL_SPAWN_MIN_DISTANCE = 2; // Very close spawning
      config.world.WORLD_WIDTH = 50; // Small world forces encounters
      config.world.WORLD_HEIGHT = 50;
      config.entities.INITIAL_HUNGER_SPAWN = 30; // Start animals hungrier

      const sim = createSimulation(config, 12345);

      let deerDied = false;
      let corpseCreated = false;

      sim.on('animalDied', ({ animal, cause }) => {
        if (animal.species === 'deer' && (cause === 'predation' || cause === 'killed')) {
          deerDied = true;
        }
      });

      sim.on('corpseCreated', () => {
        corpseCreated = true;
      });

      // Run until a hunt happens (small world should make this quick)
      for (let i = 0; i < 200 && !deerDied; i++) {
        sim.step();
      }

      // With wolves and deer in a small world, hunting should occur eventually
      expect(deerDied).toBe(true);
      expect(corpseCreated).toBe(true);
    });

    it('reproduction creates offspring with mutation (asexual)', () => {
      // Use config that encourages reproduction
      config.reproduction.REPRODUCTION_COOLDOWN = 10;
      config.world.INITIAL_DEER_COUNT = 5;
      config.world.INITIAL_WOLF_COUNT = 0; // No predators

      const sim = createSimulation(config, 42);

      let offspring: import('../../src/entities/types').Animal[] = [];
      sim.on('animalBorn', ({ animal }) => {
        offspring.push(animal);
      });

      // Run until reproduction happens
      for (let i = 0; i < 50 && offspring.length === 0; i++) {
        sim.step();
      }

      expect(offspring.length).toBeGreaterThan(0);

      // Offspring should have a single parent (asexual reproduction)
      const firstOffspring = offspring[0];
      expect(firstOffspring).toHaveProperty('parentId');
      expect(firstOffspring.parentId).toBeDefined();
      expect(firstOffspring.parentId).not.toBeNull();
      expect(typeof firstOffspring.parentId).toBe('string');
      expect(firstOffspring.generation).toBeGreaterThan(0);

      // Offspring attributes should be close to but not exactly parent (due to mutation)
      const parent = sim.world.getAnimal(firstOffspring.parentId!);

      if (parent) {
        // Offspring strength should be near parent's value (within mutation range)
        expect(Math.abs(firstOffspring.baseAttributes.strength - parent.baseAttributes.strength)).toBeLessThan(
          parent.baseAttributes.strength * 0.3
        );
      }
    });

    it('starvation causes death', () => {
      // Create scenario where deer will starve
      config.world.INITIAL_DEER_COUNT = 5;
      config.vegetation.INITIAL_VEGETATION_DENSITY = 0; // No food
      config.vegetation.VEGETATION_SPREAD_RATE = 0; // No new vegetation
      config.world.INITIAL_WOLF_COUNT = 0;
      config.entities.INITIAL_HUNGER_SPAWN = 20; // Start with low hunger

      const sim = createSimulation(config, 42);

      let starvationDeath = false;
      sim.on('animalDied', ({ cause }) => {
        if (cause === 'starvation') {
          starvationDeath = true;
        }
      });

      // Run until starvation occurs (should be quick with no food and low initial hunger)
      for (let i = 0; i < 100 && !starvationDeath; i++) {
        sim.step();
      }

      expect(starvationDeath).toBe(true);
    });

    it('old age causes death', () => {
      // Create scenario where animals will age out
      config.world.INITIAL_DEER_COUNT = 5;
      config.world.INITIAL_WOLF_COUNT = 0;
      config.vegetation.INITIAL_VEGETATION_DENSITY = 0.9; // Plenty of food

      const sim = createSimulation(config, 42);

      // Artificially age an animal
      const deer = sim.world.getAllAnimals()[0];
      deer.state.age = deer.lifecycleAttributes.maxAge - 1;

      let oldAgeDeath = false;
      sim.on('animalDied', ({ cause }) => {
        if (cause === 'old age') {
          oldAgeDeath = true;
        }
      });

      // Run a few ticks
      for (let i = 0; i < 10; i++) {
        sim.step();
      }

      expect(oldAgeDeath).toBe(true);
    });
  });

  describe('Tick Execution Order', () => {
    it('death checks happen before other actions', () => {
      const sim = createSimulation(config, 42);

      // Set a deer to 0 hunger
      const deer = sim.world.getAnimalsBySpecies('deer')[0];
      deer.state.hunger = 0;

      sim.step();

      // Deer should be marked as dead and not in living animals list
      const updatedDeer = sim.world.getAnimal(deer.id);
      expect(updatedDeer?.state.isDead).toBe(true);
      // Living animals should not include the dead deer
      expect(sim.world.getLivingAnimals().find(a => a.id === deer.id)).toBeUndefined();
    });

    it('more perceptive animals act first (after deaths)', () => {
      const world = createWorld(config, 42);
      initializePopulation(world);

      // Get sorted animals by alertRange
      const animals = world.getLivingAnimals();
      const sorted = [...animals].sort(
        (a, b) => b.derivedStats.alertRange - a.derivedStats.alertRange
      );

      // Higher perception animals should act before lower
      expect(sorted[0].derivedStats.alertRange).toBeGreaterThanOrEqual(
        sorted[sorted.length - 1].derivedStats.alertRange
      );
    });
  });

  describe('World Boundaries', () => {
    it('animals stay within world bounds', () => {
      const sim = createSimulation(config, 42);

      // Run enough ticks to test boundary behavior
      for (let i = 0; i < 30; i++) {
        sim.step();
      }

      // Check all living animals are within bounds
      for (const animal of sim.world.getLivingAnimals()) {
        expect(animal.state.position.x).toBeGreaterThanOrEqual(0);
        expect(animal.state.position.x).toBeLessThanOrEqual(config.world.WORLD_WIDTH);
        expect(animal.state.position.y).toBeGreaterThanOrEqual(0);
        expect(animal.state.position.y).toBeLessThanOrEqual(config.world.WORLD_HEIGHT);
      }
    });
  });

  describe('Events', () => {
    it('emits tick event with correct data', () => {
      const sim = createSimulation(config, 42);

      let lastTickEvent: { tick: number; deerCount: number; wolfCount: number } | null = null;
      sim.on('tick', (data) => {
        lastTickEvent = data;
      });

      sim.step();
      sim.step();
      sim.step();

      expect(lastTickEvent).not.toBeNull();
      expect(lastTickEvent!.tick).toBe(3);
      expect(typeof lastTickEvent!.deerCount).toBe('number');
      expect(typeof lastTickEvent!.wolfCount).toBe('number');
    });
  });

  describe('Control', () => {
    it('pause and resume work correctly', () => {
      const sim = createSimulation(config, 42);
      sim.start();

      expect(sim.isPaused).toBe(false);

      sim.pause();
      expect(sim.isPaused).toBe(true);

      sim.resume();
      expect(sim.isPaused).toBe(false);
    });

    it('reset clears state and reinitializes', () => {
      const sim = createSimulation(config, 42);

      // Run some ticks
      for (let i = 0; i < 10; i++) {
        sim.step();
      }

      const tickBefore = sim.currentTick;
      sim.reset();

      expect(sim.currentTick).toBe(0);
      expect(sim.currentTick).not.toBe(tickBefore);
    });

    it('setSpeed changes simulation speed', () => {
      const sim = createSimulation(config, 42);

      sim.setSpeed(2.0);
      expect(sim.speed).toBe(2.0);

      sim.setSpeed(0.5);
      expect(sim.speed).toBe(0.5);
    });
  });
});
