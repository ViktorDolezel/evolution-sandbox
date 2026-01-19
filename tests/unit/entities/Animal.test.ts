import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAnimal,
  calculateDerivedStats,
  isMature,
  isReproductionReady,
  getFitness,
  updateAnimalState,
  applyHungerDecay,
  applyMovementCost,
} from '../../../src/entities/Animal';
import { getDefaultConfig } from '../../../src/config/defaults';
import { createIdGenerator } from '../../../src/utils/id';
import type { SimulationConfig } from '../../../src/config/types';
import type { BaseAttributes } from '../../../src/entities/types';

describe('Animal', () => {
  let config: SimulationConfig;
  let deerIdGen: () => string;
  let wolfIdGen: () => string;

  beforeEach(() => {
    config = getDefaultConfig();
    deerIdGen = createIdGenerator('deer');
    wolfIdGen = createIdGenerator('wolf');
  });

  describe('createAnimal', () => {
    it('creates a deer with species defaults', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 100, y: 100 } },
        config,
        deerIdGen
      );

      expect(animal.species).toBe('deer');
      expect(animal.id).toBe('deer_1');
      expect(animal.baseAttributes.strength).toBe(5);
      expect(animal.baseAttributes.agility).toBe(12);
      expect(animal.baseAttributes.perception).toBe(14);
      expect(animal.diet.canEatVegetation).toBe(true);
      expect(animal.diet.canEatAnimals).toBe(false);
    });

    it('creates a wolf with species defaults', () => {
      const animal = createAnimal(
        { species: 'wolf', position: { x: 100, y: 100 } },
        config,
        wolfIdGen
      );

      expect(animal.species).toBe('wolf');
      expect(animal.baseAttributes.strength).toBe(12);
      expect((animal.baseAttributes as unknown as Record<string, unknown>)['aggression']).toBeUndefined(); // Base attributes don't include behavioral
      expect(animal.behavioralAttributes.aggression).toBe(0.6);
      expect(animal.diet.canEatAnimals).toBe(true);
      expect(animal.diet.canEatCorpses).toBe(true);
    });

    it('sets initial state correctly', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 50, y: 75 } },
        config,
        deerIdGen
      );

      expect(animal.state.position).toEqual({ x: 50, y: 75 });
      expect(animal.state.hunger).toBe(config.entities.INITIAL_HUNGER_SPAWN);
      expect(animal.state.age).toBe(0);
      expect(animal.state.ticksSinceLastReproduction).toBe(config.reproduction.REPRODUCTION_COOLDOWN);
      expect(animal.state.isDead).toBe(false);
    });

    it('allows overriding initial hunger', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 50 },
        config,
        deerIdGen
      );

      expect(animal.state.hunger).toBe(50);
    });

    it('allows custom base attributes', () => {
      const animal = createAnimal(
        {
          species: 'deer',
          position: { x: 0, y: 0 },
          baseAttributes: { strength: 10, agility: 15 },
        },
        config,
        deerIdGen
      );

      expect(animal.baseAttributes.strength).toBe(10);
      expect(animal.baseAttributes.agility).toBe(15);
      expect(animal.baseAttributes.endurance).toBe(10); // Species default
    });

    it('sets parent IDs and generation', () => {
      const animal = createAnimal(
        {
          species: 'deer',
          position: { x: 0, y: 0 },
          parentIds: ['deer_1', 'deer_2'],
          generation: 3,
        },
        config,
        deerIdGen
      );

      expect(animal.parentIds).toEqual(['deer_1', 'deer_2']);
      expect(animal.generation).toBe(3);
    });

    it('sets null parent IDs for initial population', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );

      expect(animal.parentIds).toEqual([null, null]);
      expect(animal.generation).toBe(0);
    });

    it('calculates derived stats on creation', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );

      expect(animal.derivedStats.speed).toBeGreaterThan(0);
      expect(animal.derivedStats.alertRange).toBeGreaterThan(0);
      expect(animal.derivedStats.attackPower).toBeGreaterThan(0);
      expect(animal.derivedStats.defense).toBeGreaterThan(0);
      expect(animal.derivedStats.hungerDecayRate).toBeGreaterThan(0);
    });
  });

  describe('calculateDerivedStats', () => {
    it('calculates speed = agility * (1/sqrt(size)) * SPEED_MULTIPLIER', () => {
      const baseAttrs: BaseAttributes = {
        strength: 10,
        agility: 10,
        endurance: 10,
        perception: 10,
        size: 1.0,
      };

      const stats = calculateDerivedStats(baseAttrs, config);
      // speed = 10 * (1/sqrt(1.0)) * 2.0 = 10 * 1 * 2 = 20
      expect(stats.speed).toBeCloseTo(20);
    });

    it('calculates alertRange = perception * PERCEPTION_MULTIPLIER', () => {
      const baseAttrs: BaseAttributes = {
        strength: 10,
        agility: 10,
        endurance: 10,
        perception: 14,
        size: 1.0,
      };

      const stats = calculateDerivedStats(baseAttrs, config);
      // alertRange = 14 * 5.0 = 70
      expect(stats.alertRange).toBe(70);
    });

    it('calculates attackPower = strength * sqrt(size)', () => {
      const baseAttrs: BaseAttributes = {
        strength: 12,
        agility: 10,
        endurance: 8,
        perception: 10,
        size: 1.44, // sqrt(1.44) = 1.2
      };

      const stats = calculateDerivedStats(baseAttrs, config);
      // attackPower = 12 * sqrt(1.44) = 12 * 1.2 = 14.4
      expect(stats.attackPower).toBeCloseTo(14.4);
    });

    it('calculates defense = size * (1 + agility * 0.3)', () => {
      const baseAttrs: BaseAttributes = {
        strength: 10,
        agility: 10,
        endurance: 10,
        perception: 10,
        size: 1.0,
      };

      const stats = calculateDerivedStats(baseAttrs, config);
      // defense = 1.0 * (1 + 10 * 0.3) = 1.0 * 4 = 4
      expect(stats.defense).toBeCloseTo(4);
    });

    it('calculates hungerDecayRate = BASE_DECAY * (size + speed * 0.3) / endurance', () => {
      const baseAttrs: BaseAttributes = {
        strength: 10,
        agility: 10,
        endurance: 10,
        perception: 10,
        size: 1.0,
      };

      const stats = calculateDerivedStats(baseAttrs, config);
      // speed = 20 (from above)
      // hungerDecayRate = 0.5 * (1.0 + 20 * 0.3) / 10 = 0.5 * 7 / 10 = 0.35
      expect(stats.hungerDecayRate).toBeCloseTo(0.35);
    });

    it('larger animals are slower', () => {
      const small: BaseAttributes = { strength: 10, agility: 10, endurance: 10, perception: 10, size: 0.5 };
      const large: BaseAttributes = { strength: 10, agility: 10, endurance: 10, perception: 10, size: 2.0 };

      const smallStats = calculateDerivedStats(small, config);
      const largeStats = calculateDerivedStats(large, config);

      expect(smallStats.speed).toBeGreaterThan(largeStats.speed);
    });

    it('larger animals have more attack power', () => {
      const small: BaseAttributes = { strength: 10, agility: 10, endurance: 10, perception: 10, size: 0.5 };
      const large: BaseAttributes = { strength: 10, agility: 10, endurance: 10, perception: 10, size: 2.0 };

      const smallStats = calculateDerivedStats(small, config);
      const largeStats = calculateDerivedStats(large, config);

      expect(largeStats.attackPower).toBeGreaterThan(smallStats.attackPower);
    });
  });

  describe('isMature', () => {
    it('returns false when age < maturityAge', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );
      // Deer maturityAge = 50, age starts at 0

      expect(isMature(animal)).toBe(false);
    });

    it('returns true when age >= maturityAge', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );
      animal.state.age = 50; // Equal to maturityAge

      expect(isMature(animal)).toBe(true);
    });
  });

  describe('isReproductionReady', () => {
    it('returns false when not mature', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );
      animal.state.age = 5; // Not mature (maturityAge is 10)
      animal.state.hunger = 100; // Full hunger
      animal.state.ticksSinceLastReproduction = 1000; // Past cooldown

      expect(isReproductionReady(animal, config)).toBe(false);
    });

    it('returns false when hunger too low', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );
      animal.state.age = 100; // Mature
      // Required: (0.15 * 1 + 0.2) * 100 = 35
      animal.state.hunger = 30; // Below threshold
      animal.state.ticksSinceLastReproduction = 1000;

      expect(isReproductionReady(animal, config)).toBe(false);
    });

    it('returns false when in cooldown', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );
      animal.state.age = 100;
      animal.state.hunger = 100;
      animal.state.ticksSinceLastReproduction = 5; // Still in cooldown (10 required)

      expect(isReproductionReady(animal, config)).toBe(false);
    });

    it('returns true when all conditions met', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );
      animal.state.age = 100;
      animal.state.hunger = 100;
      animal.state.ticksSinceLastReproduction = 100;

      expect(isReproductionReady(animal, config)).toBe(true);
    });

    it('accounts for litter size in hunger requirement', () => {
      const animal = createAnimal(
        { species: 'wolf', position: { x: 0, y: 0 } },
        config,
        wolfIdGen
      );
      // Wolf litterSize = 2
      // Required: (0.15 * 2 + 0.2) * 100 = 50
      animal.state.age = 100;
      animal.state.hunger = 40; // Below 50
      animal.state.ticksSinceLastReproduction = 100;

      expect(isReproductionReady(animal, config)).toBe(false);

      animal.state.hunger = 60; // Above 50
      expect(isReproductionReady(animal, config)).toBe(true);
    });
  });

  describe('getFitness', () => {
    it('returns sum of strength + agility + endurance', () => {
      const animal = createAnimal(
        {
          species: 'deer',
          position: { x: 0, y: 0 },
          baseAttributes: { strength: 5, agility: 10, endurance: 8 },
        },
        config,
        deerIdGen
      );

      expect(getFitness(animal)).toBe(23); // 5 + 10 + 8
    });
  });

  describe('updateAnimalState', () => {
    it('updates specified state properties', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );

      const updated = updateAnimalState(animal, {
        position: { x: 50, y: 50 },
        hunger: 90,
      });

      expect(updated.state.position).toEqual({ x: 50, y: 50 });
      expect(updated.state.hunger).toBe(90);
      expect(updated.state.age).toBe(animal.state.age); // Unchanged
    });

    it('does not mutate original animal', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );
      const originalPos = { ...animal.state.position };

      updateAnimalState(animal, { position: { x: 100, y: 100 } });

      expect(animal.state.position).toEqual(originalPos);
    });
  });

  describe('applyHungerDecay', () => {
    it('reduces hunger by hungerDecayRate', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );
      const initialHunger = animal.state.hunger;

      const updated = applyHungerDecay(animal);

      expect(updated.state.hunger).toBe(initialHunger - animal.derivedStats.hungerDecayRate);
    });

    it('does not reduce hunger below 0', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 0.1 },
        config,
        deerIdGen
      );

      const updated = applyHungerDecay(animal);

      expect(updated.state.hunger).toBeGreaterThanOrEqual(0);
    });
  });

  describe('applyMovementCost', () => {
    it('reduces hunger by MOVE_COST * distance', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 100 },
        config,
        deerIdGen
      );

      const updated = applyMovementCost(animal, 10, false, config);
      // Cost = 0.05 * 10 = 0.5
      expect(updated.state.hunger).toBe(99.5);
    });

    it('adds FLEE_COST_BONUS when fleeing', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 }, initialHunger: 100 },
        config,
        deerIdGen
      );

      const updated = applyMovementCost(animal, 10, true, config);
      // Cost = (0.05 + 0.03) * 10 = 0.8
      expect(updated.state.hunger).toBe(99.2);
    });
  });
});
