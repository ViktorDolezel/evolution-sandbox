import { describe, it, expect } from 'vitest';
import { createSimulation } from '../../../src/core/Simulation';
import { getDefaultConfig } from '../../../src/config/defaults';

describe('Deer Population Sustainability', () => {
  /**
   * BUG: Deer populations go extinct even with no predators and adequate food.
   *
   * Root cause: Deer only produce 1 offspring per reproduction (litterSize=1),
   * and reproduction rate is too low to sustain population. When the first
   * generation dies of old age (~800 ticks), not enough offspring have been
   * born to replace them, leading to inevitable extinction.
   *
   * This test documents the bug - it should PASS once reproduction is fixed.
   */
  it('should maintain deer population with no predators and adequate food', () => {
    const config = getDefaultConfig();

    // Smaller world for faster test
    config.world.WORLD_WIDTH = 200;
    config.world.WORLD_HEIGHT = 200;

    // No predators - deer should thrive
    config.world.INITIAL_WOLF_COUNT = 0;

    // Start with healthy population
    config.world.INITIAL_DEER_COUNT = 20;

    // Default vegetation settings provide adequate food

    const simulation = createSimulation(config, 12345);
    const initialDeerCount = simulation.world.getDeerCount();

    // Run simulation for 3000 ticks (well past first generation lifespan of 800)
    // This ensures we test reproduction across multiple generations
    for (let i = 0; i < 3000; i++) {
      simulation.step();
    }

    const finalDeerCount = simulation.world.getDeerCount();

    // With no predators and adequate food, population should be sustainable
    // At minimum, some deer should survive across generations
    expect(finalDeerCount).toBeGreaterThan(0);
  }, 60000);
});
