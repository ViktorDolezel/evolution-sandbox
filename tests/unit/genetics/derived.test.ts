import { describe, it, expect } from 'vitest';
import {
  calculateSpeed,
  calculateAlertRange,
  calculateAttackPower,
  calculateDefense,
  calculateHungerDecayRate,
  calculateAllDerivedStats,
} from '../../../src/genetics/derived';
import { getDefaultConfig } from '../../../src/config/defaults';
import type { BaseAttributes } from '../../../src/entities/types';

describe('Derived stats', () => {
  describe('calculateSpeed', () => {
    it('follows formula: agility * (1/sqrt(size)) * multiplier', () => {
      // agility=10, size=1.0, multiplier=2.0 => 10 * 1 * 2 = 20
      expect(calculateSpeed(10, 1.0, 2.0)).toBeCloseTo(20);
    });

    it('larger size means slower speed', () => {
      const smallSpeed = calculateSpeed(10, 0.5, 2.0);
      const largeSpeed = calculateSpeed(10, 2.0, 2.0);

      expect(smallSpeed).toBeGreaterThan(largeSpeed);
    });

    it('higher agility means faster speed', () => {
      const lowAgility = calculateSpeed(5, 1.0, 2.0);
      const highAgility = calculateSpeed(15, 1.0, 2.0);

      expect(highAgility).toBeGreaterThan(lowAgility);
    });

    it('handles minimum size (0.3)', () => {
      const speed = calculateSpeed(10, 0.3, 2.0);
      // 10 * (1/sqrt(0.3)) * 2 = 10 * 1.826 * 2 ≈ 36.5
      expect(speed).toBeGreaterThan(30);
    });
  });

  describe('calculateAlertRange', () => {
    it('follows formula: perception * multiplier', () => {
      expect(calculateAlertRange(14, 5.0)).toBe(70);
    });

    it('higher perception means larger range', () => {
      expect(calculateAlertRange(20, 5.0)).toBeGreaterThan(calculateAlertRange(10, 5.0));
    });
  });

  describe('calculateAttackPower', () => {
    it('follows formula: strength * sqrt(size)', () => {
      // strength=12, size=1.44 => 12 * 1.2 = 14.4
      expect(calculateAttackPower(12, 1.44)).toBeCloseTo(14.4);
    });

    it('larger size increases attack power', () => {
      const smallAttack = calculateAttackPower(10, 0.5);
      const largeAttack = calculateAttackPower(10, 2.0);

      expect(largeAttack).toBeGreaterThan(smallAttack);
    });

    it('higher strength increases attack power', () => {
      const weakAttack = calculateAttackPower(5, 1.0);
      const strongAttack = calculateAttackPower(15, 1.0);

      expect(strongAttack).toBeGreaterThan(weakAttack);
    });
  });

  describe('calculateDefense', () => {
    it('follows formula: size * (1 + agility * 0.3)', () => {
      // size=1.0, agility=10 => 1.0 * (1 + 10*0.3) = 1.0 * 4 = 4
      expect(calculateDefense(1.0, 10)).toBeCloseTo(4);
    });

    it('larger size increases defense', () => {
      const smallDefense = calculateDefense(0.5, 10);
      const largeDefense = calculateDefense(2.0, 10);

      expect(largeDefense).toBeGreaterThan(smallDefense);
    });

    it('higher agility increases defense', () => {
      const slowDefense = calculateDefense(1.0, 5);
      const agileDefense = calculateDefense(1.0, 15);

      expect(agileDefense).toBeGreaterThan(slowDefense);
    });
  });

  describe('calculateHungerDecayRate', () => {
    it('follows formula: baseDecay * (size + speed * 0.3) / endurance', () => {
      // baseDecay=0.5, size=1.0, speed=20, endurance=10
      // 0.5 * (1.0 + 20*0.3) / 10 = 0.5 * 7 / 10 = 0.35
      expect(calculateHungerDecayRate(1.0, 20, 10, 0.5)).toBeCloseTo(0.35);
    });

    it('larger size increases hunger decay', () => {
      const smallDecay = calculateHungerDecayRate(0.5, 20, 10, 0.5);
      const largeDecay = calculateHungerDecayRate(2.0, 20, 10, 0.5);

      expect(largeDecay).toBeGreaterThan(smallDecay);
    });

    it('higher endurance decreases hunger decay', () => {
      const lowEndurance = calculateHungerDecayRate(1.0, 20, 5, 0.5);
      const highEndurance = calculateHungerDecayRate(1.0, 20, 15, 0.5);

      expect(highEndurance).toBeLessThan(lowEndurance);
    });

    it('faster animals burn more energy', () => {
      const slowDecay = calculateHungerDecayRate(1.0, 10, 10, 0.5);
      const fastDecay = calculateHungerDecayRate(1.0, 30, 10, 0.5);

      expect(fastDecay).toBeGreaterThan(slowDecay);
    });
  });

  describe('calculateAllDerivedStats', () => {
    it('calculates all derived stats from base attributes', () => {
      const config = getDefaultConfig();
      const baseAttrs: BaseAttributes = {
        strength: 10,
        agility: 12,
        endurance: 10,
        perception: 14,
        size: 1.0,
      };

      const stats = calculateAllDerivedStats(baseAttrs, config);

      expect(stats.speed).toBeGreaterThan(0);
      expect(stats.alertRange).toBe(70); // 14 * 5
      expect(stats.attackPower).toBe(10); // 10 * sqrt(1)
      expect(stats.defense).toBeCloseTo(4.6); // 1 * (1 + 12 * 0.3)
      expect(stats.hungerDecayRate).toBeGreaterThan(0);
    });

    it('produces consistent results', () => {
      const config = getDefaultConfig();
      const baseAttrs: BaseAttributes = {
        strength: 5,
        agility: 12,
        endurance: 10,
        perception: 14,
        size: 1.0,
      };

      const stats1 = calculateAllDerivedStats(baseAttrs, config);
      const stats2 = calculateAllDerivedStats(baseAttrs, config);

      expect(stats1).toEqual(stats2);
    });
  });
});
