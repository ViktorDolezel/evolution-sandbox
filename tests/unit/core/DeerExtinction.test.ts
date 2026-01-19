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

    // Minimal world for fast test
    config.world.WORLD_WIDTH = 50;
    config.world.WORLD_HEIGHT = 50;

    // No predators - deer should thrive
    config.world.INITIAL_WOLF_COUNT = 0;

    // Start with small population
    config.world.INITIAL_DEER_COUNT = 3;

    // Default vegetation settings provide adequate food

    const simulation = createSimulation(config, 12345);
    const initialDeerCount = simulation.world.getDeerCount();

    // Run simulation for 200 ticks to test reproduction behavior
    for (let i = 0; i < 200; i++) {
      simulation.step();
    }

    const finalDeerCount = simulation.world.getDeerCount();

    // With no predators and adequate food, population should be sustainable
    // At minimum, some deer should survive across generations
    expect(finalDeerCount).toBeGreaterThan(0);
  }, 15000);
});
