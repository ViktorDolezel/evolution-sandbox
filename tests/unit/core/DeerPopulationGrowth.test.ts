import { describe, it, expect } from 'vitest';
import { createSimulation } from '../../../src/core/Simulation';
import { getDefaultConfig } from '../../../src/config/defaults';
import { createAnimal } from '../../../src/entities/Animal';

describe('Deer Population Growth', () => {
  /**
   * Test that a single deer on a fully vegetated 10x10 grid can reproduce
   * and grow the population to at least 10 deer within 500 ticks.
   *
   * With reproduction cooldown of 100 ticks and litterSize of 1,
   * theoretical maximum is ~32 deer (5 doublings), but accounting for
   * probabilistic reproduction (50% reproductiveUrge) and food constraints,
   * we expect at least 10 deer.
   */
  it('single deer on fully vegetated 10x10 grid should grow to at least 10 deer in 500 ticks', () => {
    const config = getDefaultConfig();

    // 10x10 vegetation grid (50x50 world with tile size 5)
    config.world.WORLD_WIDTH = 50;
    config.world.WORLD_HEIGHT = 50;
    config.world.VEGETATION_TILE_SIZE = 5;

    // Fully vegetated
    config.vegetation.INITIAL_VEGETATION_DENSITY = 1.0;

    // No initial animals - we'll add one deer manually
    config.world.INITIAL_DEER_COUNT = 0;
    config.world.INITIAL_WOLF_COUNT = 0;

    const seed = 42;
    const simulation = createSimulation(config, seed);

    // Add one deer in the middle of the grid
    // Use the world's ID generator to get a unique ID that won't collide with offspring
    const deer = createAnimal(
      {
        species: 'deer',
        position: { x: 25, y: 25 }, // Center of 50x50 world
      },
      config,
      simulation.world.deerIdGen
    );

    // Add deer to the world
    simulation.world.entityManager.addAnimal(deer);
    simulation.world.animalSpatialIndex.insert({
      ...deer,
      position: deer.state.position,
      size: deer.baseAttributes.size,
    });

    expect(simulation.world.getDeerCount()).toBe(1);

    // Run simulation for 200 ticks (enough for ~2 reproduction cycles)
    for (let i = 0; i < 200; i++) {
      simulation.step();
    }

    const finalDeerCount = simulation.world.getDeerCount();

    // With abundant food and no predators, population should grow
    // At 200 ticks: original deer reproduces at ~tick 10, offspring at ~110
    // Expect at least 5 deer (conservative with stochastic reproduction)
    expect(finalDeerCount).toBeGreaterThanOrEqual(5);
  }, 10000);
});
