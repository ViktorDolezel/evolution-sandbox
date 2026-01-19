import type { SimulationConfig } from '../config/types';
import type { World } from './World';
import type { Animal, Corpse } from '../entities/types';
import type { ActionHistory } from '../data/ActionHistory';
import { createWorld, initializePopulation } from './World';
import { runTick } from './TickLoop';
import { createEventEmitter } from '../utils/events';

export interface SimulationEvents {
  tick: { tick: number; deerCount: number; wolfCount: number; vegetationCount: number };
  animalBorn: { animal: Animal };
  animalDied: { animal: Animal; cause: string };
  corpseCreated: { corpse: Corpse };
  corpseRemoved: { corpseId: string };
  paused: void;
  resumed: void;
  reset: void;
}

export interface ISimulation {
  // State
  readonly world: World;
  readonly config: SimulationConfig;
  readonly seed: number;
  readonly currentTick: number;
  readonly isPaused: boolean;
  readonly speed: number;

  // Control
  start(): void;
  pause(): void;
  resume(): void;
  reset(newSeed?: number): void;
  setSpeed(multiplier: number): void;
  step(): void;
  setActionHistory(history: ActionHistory | null): void;

  // Events
  on<K extends keyof SimulationEvents>(
    event: K,
    callback: (data: SimulationEvents[K]) => void
  ): void;
  off<K extends keyof SimulationEvents>(
    event: K,
    callback: (data: SimulationEvents[K]) => void
  ): void;
}

export function createSimulation(config: SimulationConfig, seed?: number): ISimulation {
  const actualSeed = seed ?? Date.now();
  let world = createWorld(config, actualSeed);
  initializePopulation(world);

  let isPaused = true;
  let speed = 1;
  let animationFrameId: number | null = null;
  let lastTickTime = 0;
  let actionHistory: ActionHistory | null = null;

  const emitter = createEventEmitter<SimulationEvents>();

  function tick(): void {
    const result = runTick({
      entityManager: world.entityManager,
      vegetationGrid: world.vegetationGrid,
      animalSpatialIndex: world.animalSpatialIndex,
      config: world.config,
      rng: world.rng,
      currentTick: world.currentTick,
      actionHistory: actionHistory ?? undefined,
    });

    world.currentTick++;

    // Emit events
    emitter.emit('tick', {
      tick: world.currentTick,
      deerCount: world.getDeerCount(),
      wolfCount: world.getWolfCount(),
      vegetationCount: world.getVegetationCount(),
    });

    for (const death of result.deaths) {
      const animal = world.entityManager.getAnimal(death);
      if (animal) {
        const cause = animal.state.hunger <= 0 ? 'starvation' :
                      animal.state.age >= animal.lifecycleAttributes.maxAge ? 'old age' :
                      'killed';
        emitter.emit('animalDied', { animal, cause });
      }
    }

    for (const birth of result.births) {
      emitter.emit('animalBorn', { animal: birth });
    }

    for (const corpse of result.corpsesCreated) {
      emitter.emit('corpseCreated', { corpse });
    }

    for (const corpseId of result.corpsesRemoved) {
      emitter.emit('corpseRemoved', { corpseId });
    }
  }

  function gameLoop(currentTime: number): void {
    if (isPaused) {
      animationFrameId = null;
      return;
    }

    const tickInterval = 1000 / (config.world.TICK_RATE * speed);

    if (currentTime - lastTickTime >= tickInterval) {
      tick();
      lastTickTime = currentTime;
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  const simulation: ISimulation = {
    get world() {
      return world;
    },
    get config() {
      return config;
    },
    get seed() {
      return actualSeed;
    },
    get currentTick() {
      return world.currentTick;
    },
    get isPaused() {
      return isPaused;
    },
    get speed() {
      return speed;
    },

    start(): void {
      if (!isPaused) return;
      isPaused = false;
      lastTickTime = performance.now();
      animationFrameId = requestAnimationFrame(gameLoop);
      emitter.emit('resumed', undefined as unknown as void);
    },

    pause(): void {
      if (isPaused) return;
      isPaused = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      emitter.emit('paused', undefined as unknown as void);
    },

    resume(): void {
      this.start();
    },

    reset(newSeed?: number): void {
      this.pause();
      const resetSeed = newSeed ?? actualSeed;
      world = createWorld(config, resetSeed);
      initializePopulation(world);
      emitter.emit('reset', undefined as unknown as void);
    },

    setSpeed(multiplier: number): void {
      speed = Math.max(0.1, Math.min(10, multiplier));
    },

    step(): void {
      tick();
    },

    setActionHistory(history: ActionHistory | null): void {
      actionHistory = history;
    },

    on<K extends keyof SimulationEvents>(
      event: K,
      callback: (data: SimulationEvents[K]) => void
    ): void {
      emitter.on(event, callback as (data: SimulationEvents[keyof SimulationEvents]) => void);
    },

    off<K extends keyof SimulationEvents>(
      event: K,
      callback: (data: SimulationEvents[K]) => void
    ): void {
      emitter.off(event, callback as (data: SimulationEvents[keyof SimulationEvents]) => void);
    },
  };

  return simulation;
}

// Re-export class for backwards compatibility
export class SimulationClass implements ISimulation {
  private _sim: ISimulation;

  constructor(config: SimulationConfig, seed?: number) {
    this._sim = createSimulation(config, seed);
  }

  get world() { return this._sim.world; }
  get config() { return this._sim.config; }
  get seed() { return this._sim.seed; }
  get currentTick() { return this._sim.currentTick; }
  get isPaused() { return this._sim.isPaused; }
  get speed() { return this._sim.speed; }

  start(): void { this._sim.start(); }
  pause(): void { this._sim.pause(); }
  resume(): void { this._sim.resume(); }
  reset(newSeed?: number): void { this._sim.reset(newSeed); }
  setSpeed(multiplier: number): void { this._sim.setSpeed(multiplier); }
  step(): void { this._sim.step(); }
  setActionHistory(history: ActionHistory | null): void { this._sim.setActionHistory(history); }

  on<K extends keyof SimulationEvents>(
    event: K,
    callback: (data: SimulationEvents[K]) => void
  ): void {
    this._sim.on(event, callback);
  }

  off<K extends keyof SimulationEvents>(
    event: K,
    callback: (data: SimulationEvents[K]) => void
  ): void {
    this._sim.off(event, callback);
  }
}

// Export class as default Simulation
export { SimulationClass as Simulation };
