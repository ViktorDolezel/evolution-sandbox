import type { Animal, Corpse, Species } from '../entities/types';
import type { SimulationConfig } from '../config/types';
import type { EntityManager } from '../entities/EntityManager';
import type { VegetationGrid } from '../spatial/VegetationGrid';
import type { SpatialIndex, SpatialEntity } from '../spatial/SpatialIndex';
import type { RandomGenerator } from './SeededRandom';
import type { EntityId } from '../utils/id';
import { createEntityManager } from '../entities/EntityManager';
import { createVegetationGrid, initializeVegetation } from '../spatial/VegetationGrid';
import { createSpatialIndex } from '../spatial/SpatialIndex';
import { createSeededRandom } from './SeededRandom';
import { createAnimal } from '../entities/Animal';
import { createIdGenerator } from '../utils/id';

export interface World {
  entityManager: EntityManager;
  vegetationGrid: VegetationGrid;
  animalSpatialIndex: SpatialIndex<Animal & SpatialEntity>;
  config: SimulationConfig;
  rng: RandomGenerator;
  currentTick: number;
  // Persistent ID generators for offspring
  deerIdGen: () => string;
  wolfIdGen: () => string;
  corpseIdGen: () => string;

  // Accessors
  getAnimal(id: EntityId): Animal | undefined;
  getCorpse(id: EntityId): Corpse | undefined;
  getAllAnimals(): Animal[];
  getLivingAnimals(): Animal[];
  getAnimalsBySpecies(species: Species): Animal[];
  getAllCorpses(): Corpse[];
  getVegetationCount(): number;

  // Population counts
  getDeerCount(): number;
  getWolfCount(): number;
  getTotalAnimalCount(): number;
}

export function createWorld(config: SimulationConfig, seed: number): World {
  const rng = createSeededRandom(seed);
  const entityManager = createEntityManager();
  const vegetationGrid = createVegetationGrid(
    config.world.WORLD_WIDTH,
    config.world.WORLD_HEIGHT,
    config.world.VEGETATION_TILE_SIZE
  );
  const animalSpatialIndex = createSpatialIndex<Animal & SpatialEntity>(
    config.performance.SPATIAL_INDEX_BUCKET_SIZE,
    config.world.WORLD_WIDTH,
    config.world.WORLD_HEIGHT
  );

  // Create persistent ID generators (shared across initial population and offspring)
  const deerIdGen = createIdGenerator('deer');
  const wolfIdGen = createIdGenerator('wolf');
  const corpseIdGen = createIdGenerator('corpse');

  const world: World = {
    entityManager,
    vegetationGrid,
    animalSpatialIndex,
    config,
    rng,
    currentTick: 0,
    deerIdGen,
    wolfIdGen,
    corpseIdGen,

    getAnimal(id: EntityId): Animal | undefined {
      return entityManager.getAnimal(id);
    },

    getCorpse(id: EntityId): Corpse | undefined {
      return entityManager.getCorpse(id);
    },

    getAllAnimals(): Animal[] {
      return entityManager.getAllAnimals();
    },

    getLivingAnimals(): Animal[] {
      return entityManager.getLivingAnimals();
    },

    getAnimalsBySpecies(species: Species): Animal[] {
      return entityManager.getAnimalsBySpecies(species);
    },

    getAllCorpses(): Corpse[] {
      return entityManager.getAllCorpses();
    },

    getVegetationCount(): number {
      return vegetationGrid.getCount();
    },

    getDeerCount(): number {
      return entityManager.getAnimalsBySpecies('deer').filter(a => !a.state.isDead).length;
    },

    getWolfCount(): number {
      return entityManager.getAnimalsBySpecies('wolf').filter(a => !a.state.isDead).length;
    },

    getTotalAnimalCount(): number {
      return entityManager.getLivingAnimals().length;
    },
  };

  return world;
}

function getRandomPosition(
  config: SimulationConfig,
  rng: RandomGenerator,
  existingAnimals: Animal[],
  minDistance: number
): { x: number; y: number } {
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = rng.next() * config.world.WORLD_WIDTH;
    const y = rng.next() * config.world.WORLD_HEIGHT;

    // Check distance from existing animals
    let tooClose = false;
    for (const animal of existingAnimals) {
      const dx = x - animal.state.position.x;
      const dy = y - animal.state.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      return { x, y };
    }
  }

  // Fallback: return random position even if too close
  return {
    x: rng.next() * config.world.WORLD_WIDTH,
    y: rng.next() * config.world.WORLD_HEIGHT,
  };
}

function animalToSpatialEntity(animal: Animal): Animal & SpatialEntity {
  return {
    ...animal,
    position: animal.state.position,
    size: animal.baseAttributes.size,
  };
}

export function initializePopulation(world: World): void {
  const { config, rng, entityManager, vegetationGrid, animalSpatialIndex, deerIdGen, wolfIdGen } = world;

  // Initialize vegetation
  initializeVegetation(vegetationGrid, config.vegetation.INITIAL_VEGETATION_DENSITY, rng);

  const allAnimals: Animal[] = [];

  // Create deer
  for (let i = 0; i < config.world.INITIAL_DEER_COUNT; i++) {
    const position = getRandomPosition(
      config,
      rng,
      allAnimals,
      config.world.INITIAL_SPAWN_MIN_DISTANCE
    );

    const deer = createAnimal(
      { species: 'deer', position },
      config,
      deerIdGen
    );

    allAnimals.push(deer);
    entityManager.addAnimal(deer);
    animalSpatialIndex.insert(animalToSpatialEntity(deer));
  }

  // Create wolves
  for (let i = 0; i < config.world.INITIAL_WOLF_COUNT; i++) {
    const position = getRandomPosition(
      config,
      rng,
      allAnimals,
      config.world.INITIAL_SPAWN_MIN_DISTANCE
    );

    const wolf = createAnimal(
      { species: 'wolf', position },
      config,
      wolfIdGen
    );

    allAnimals.push(wolf);
    entityManager.addAnimal(wolf);
    animalSpatialIndex.insert(animalToSpatialEntity(wolf));
  }
}
