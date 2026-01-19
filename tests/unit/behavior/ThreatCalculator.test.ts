import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculatePerceivedThreat,
  isThreatening,
  findThreats,
  calculateFleeVector,
} from '../../../src/behavior/ThreatCalculator';
import { createAnimal } from '../../../src/entities/Animal';
import { getDefaultConfig } from '../../../src/config/defaults';
import { createIdGenerator } from '../../../src/utils/id';
import type { SimulationConfig } from '../../../src/config/types';
import type { Animal } from '../../../src/entities/types';

describe('ThreatCalculator', () => {
  let config: SimulationConfig;
  let deerIdGen: () => string;
  let wolfIdGen: () => string;

  beforeEach(() => {
    config = getDefaultConfig();
    deerIdGen = createIdGenerator('deer');
    wolfIdGen = createIdGenerator('wolf');
  });

  describe('calculatePerceivedThreat', () => {
    it('follows formula: (other.attackPower * other.aggression) / self.defense', () => {
      const deer = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );
      const wolf = createAnimal(
        { species: 'wolf', position: { x: 10, y: 0 } },
        config,
        wolfIdGen
      );

      const threat = calculatePerceivedThreat(deer, wolf);

      // Wolf: attackPower = strength(12) * sqrt(size(1.2)) ≈ 13.15
      // Wolf aggression = 0.6
      // Deer: defense = size(1.0) * (1 + agility(12) * 0.3) = 4.6
      // perceivedThreat = (13.15 * 0.6) / 4.6 ≈ 1.71
      expect(threat).toBeGreaterThan(1);
    });

    it('returns 0 for non-aggressive animals', () => {
      const deer1 = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );
      const deer2 = createAnimal(
        { species: 'deer', position: { x: 10, y: 0 } },
        config,
        deerIdGen
      );

      const threat = calculatePerceivedThreat(deer1, deer2);

      // Deer aggression = 0.0
      expect(threat).toBe(0);
    });

    it('higher self defense reduces perceived threat', () => {
      const weakDeer = createAnimal(
        {
          species: 'deer',
          position: { x: 0, y: 0 },
          baseAttributes: { size: 0.5, agility: 5 },
        },
        config,
        deerIdGen
      );
      const strongDeer = createAnimal(
        {
          species: 'deer',
          position: { x: 0, y: 0 },
          baseAttributes: { size: 2.0, agility: 15 },
        },
        config,
        deerIdGen
      );
      const wolf = createAnimal(
        { species: 'wolf', position: { x: 10, y: 0 } },
        config,
        wolfIdGen
      );

      const weakThreat = calculatePerceivedThreat(weakDeer, wolf);
      const strongThreat = calculatePerceivedThreat(strongDeer, wolf);

      expect(strongThreat).toBeLessThan(weakThreat);
    });
  });

  describe('isThreatening', () => {
    it('returns true when perceivedThreat > flightInstinct', () => {
      const deer = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );
      const wolf = createAnimal(
        { species: 'wolf', position: { x: 10, y: 0 } },
        config,
        wolfIdGen
      );

      // Deer has high flightInstinct (0.8), wolf is very threatening
      expect(isThreatening(deer, wolf)).toBe(true);
    });

    it('returns false for non-aggressive animals', () => {
      const deer1 = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );
      const deer2 = createAnimal(
        { species: 'deer', position: { x: 10, y: 0 } },
        config,
        deerIdGen
      );

      expect(isThreatening(deer1, deer2)).toBe(false);
    });

    it('returns false for animals with high flightInstinct threshold', () => {
      const wolf1 = createAnimal(
        { species: 'wolf', position: { x: 0, y: 0 } },
        config,
        wolfIdGen
      );
      const wolf2 = createAnimal(
        {
          species: 'wolf',
          position: { x: 10, y: 0 },
          behavioralAttributes: { aggression: 0.3 },
        },
        config,
        wolfIdGen
      );

      // Wolf1 has low flightInstinct (0.1), so moderate threats don't trigger
      // Wolf2 aggression = 0.3, lower than default
      expect(isThreatening(wolf1, wolf2)).toBe(false);
    });
  });

  describe('findThreats', () => {
    it('returns all threatening animals within alert range', () => {
      const deer = createAnimal(
        { species: 'deer', position: { x: 100, y: 100 } },
        config,
        deerIdGen
      );
      const wolf1 = createAnimal(
        { species: 'wolf', position: { x: 110, y: 100 } },
        config,
        wolfIdGen
      );
      const wolf2 = createAnimal(
        { species: 'wolf', position: { x: 120, y: 100 } },
        config,
        wolfIdGen
      );
      const farWolf = createAnimal(
        { species: 'wolf', position: { x: 1000, y: 1000 } },
        config,
        wolfIdGen
      );

      const threats = findThreats(deer, [wolf1, wolf2, farWolf]);

      expect(threats.length).toBeGreaterThanOrEqual(2);
      expect(threats.map((t) => t.id)).toContain(wolf1.id);
      expect(threats.map((t) => t.id)).toContain(wolf2.id);
    });

    it('returns empty array when no threats', () => {
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

      const threats = findThreats(deer1, [deer2]);

      expect(threats).toHaveLength(0);
    });

    it('includes distance and threat level in results', () => {
      const deer = createAnimal(
        { species: 'deer', position: { x: 100, y: 100 } },
        config,
        deerIdGen
      );
      const wolf = createAnimal(
        { species: 'wolf', position: { x: 110, y: 100 } },
        config,
        wolfIdGen
      );

      const threats = findThreats(deer, [wolf]);

      expect(threats[0].distance).toBeCloseTo(10);
      expect(threats[0].perceivedThreat).toBeGreaterThan(0);
    });
  });

  describe('calculateFleeVector', () => {
    it('returns vector pointing away from single threat', () => {
      const selfPos = { x: 100, y: 100 };
      const wolf = createAnimal(
        { species: 'wolf', position: { x: 90, y: 100 } },
        config,
        wolfIdGen
      );
      const threats = [{ id: wolf.id, distance: 10, perceivedThreat: 2 }];
      const animals = new Map([[wolf.id, wolf]]);

      const fleeVector = calculateFleeVector(selfPos, threats, animals);

      // Threat is to the left (x=90), so flee to the right (positive x)
      expect(fleeVector.x).toBeGreaterThan(0);
    });

    it('calculates weighted repulsion from multiple threats', () => {
      const selfPos = { x: 100, y: 100 };
      const wolf1 = createAnimal(
        { species: 'wolf', position: { x: 90, y: 100 } },
        config,
        wolfIdGen
      );
      const wolf2 = createAnimal(
        { species: 'wolf', position: { x: 100, y: 90 } },
        config,
        wolfIdGen
      );

      const threats = [
        { id: wolf1.id, distance: 10, perceivedThreat: 2 },
        { id: wolf2.id, distance: 10, perceivedThreat: 2 },
      ];
      const animals = new Map([
        [wolf1.id, wolf1],
        [wolf2.id, wolf2],
      ]);

      const fleeVector = calculateFleeVector(selfPos, threats, animals);

      // Should flee diagonally away from both threats
      expect(fleeVector.x).toBeGreaterThan(0);
      expect(fleeVector.y).toBeGreaterThan(0);
    });

    it('closer threats have stronger influence', () => {
      const selfPos = { x: 100, y: 100 };
      const closeWolf = createAnimal(
        { species: 'wolf', position: { x: 95, y: 100 } },
        config,
        wolfIdGen
      );
      const farWolf = createAnimal(
        { species: 'wolf', position: { x: 100, y: 150 } },
        config,
        wolfIdGen
      );

      const threats = [
        { id: closeWolf.id, distance: 5, perceivedThreat: 2 },
        { id: farWolf.id, distance: 50, perceivedThreat: 2 },
      ];
      const animals = new Map([
        [closeWolf.id, closeWolf],
        [farWolf.id, farWolf],
      ]);

      const fleeVector = calculateFleeVector(selfPos, threats, animals);

      // Close wolf is to the left, should have stronger influence
      expect(fleeVector.x).toBeGreaterThan(0);
    });
  });
});
