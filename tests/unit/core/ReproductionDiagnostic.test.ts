import { describe, it, expect } from 'vitest';
import { createSimulation } from '../../../src/core/Simulation';
import { getDefaultConfig } from '../../../src/config/defaults';
import { isReproductionReady } from '../../../src/entities/Animal';

describe('Reproduction Diagnostic', () => {
  it('tracks births and deaths over simulation lifecycle', () => {
    const config = getDefaultConfig();

    config.world.WORLD_WIDTH = 50;
    config.world.WORLD_HEIGHT = 50;
    config.world.INITIAL_WOLF_COUNT = 0;
    config.world.INITIAL_DEER_COUNT = 3;

    const simulation = createSimulation(config, 12345);

    let totalBirths = 0;
    let deathsByStarvation = 0;
    let deathsByOldAge = 0;

    simulation.on('animalBorn', () => {
      totalBirths++;
    });

    simulation.on('animalDied', ({ cause }) => {
      if (cause === 'starvation') deathsByStarvation++;
      else if (cause === 'old age') deathsByOldAge++;
    });

    const snapshots: { tick: number; count: number; births: number; starvation: number; oldAge: number }[] = [];

    // Run simulation for 200 ticks
    for (let i = 0; i < 200; i++) {
      simulation.step();

      // Snapshot every 50 ticks
      if (i % 50 === 0) {
        snapshots.push({
          tick: i,
          count: simulation.world.getDeerCount(),
          births: totalBirths,
          starvation: deathsByStarvation,
          oldAge: deathsByOldAge,
        });
      }
    }

    console.log('\n=== Population and Death Tracking ===');
    console.log('Tick | Population | Total Births | Starvation Deaths | Old Age Deaths');
    console.log('-----|------------|--------------|-------------------|---------------');
    for (const s of snapshots) {
      console.log(
        `${String(s.tick).padStart(4)} | ${String(s.count).padStart(10)} | ${String(s.births).padStart(12)} | ${String(s.starvation).padStart(17)} | ${String(s.oldAge).padStart(14)}`
      );
    }

    console.log('\nFinal stats at tick 200:');
    console.log('Population:', simulation.world.getDeerCount());
    console.log('Total births:', totalBirths);
    console.log('Deaths by starvation:', deathsByStarvation);
    console.log('Deaths by old age:', deathsByOldAge);
    console.log('Net population change:', simulation.world.getDeerCount() - 3);

    // The test: population should survive
    expect(simulation.world.getDeerCount()).toBeGreaterThan(0);
  }, 15000);

  it('analyzes the extinction mechanism', () => {
    const config = getDefaultConfig();

    config.world.WORLD_WIDTH = 50;
    config.world.WORLD_HEIGHT = 50;
    config.world.INITIAL_WOLF_COUNT = 0;
    config.world.INITIAL_DEER_COUNT = 3;

    const simulation = createSimulation(config, 12345);

    // Track age distribution at key moments
    function getAgeDistribution() {
      const deer = simulation.world.entityManager.getLivingAnimals()
        .filter(a => a.species === 'deer');
      const ages = deer.map(d => d.state.age);
      if (ages.length === 0) return { min: 0, max: 0, avg: 0, count: 0 };
      return {
        min: Math.min(...ages),
        max: Math.max(...ages),
        avg: ages.reduce((a, b) => a + b, 0) / ages.length,
        count: ages.length,
      };
    }

    console.log('\n=== Age Distribution Analysis ===');
    console.log('Tick | Count | Min Age | Max Age | Avg Age');
    console.log('-----|-------|---------|---------|--------');

    for (let i = 0; i < 200; i++) {
      simulation.step();

      if (i % 50 === 0) {
        const dist = getAgeDistribution();
        console.log(
          `${String(i).padStart(4)} | ${String(dist.count).padStart(5)} | ${String(dist.min).padStart(7)} | ${String(dist.max).padStart(7)} | ${dist.avg.toFixed(1).padStart(7)}`
        );
      }

      // Stop early if extinct
      if (simulation.world.getDeerCount() === 0) {
        console.log(`\nExtinction at tick ${i}!`);
        break;
      }
    }

    // Should survive, but likely won't
    expect(simulation.world.getDeerCount()).toBeGreaterThan(0);
  }, 15000);
});
