import type { BaseAttributes, DerivedStats } from '../entities/types';
import type { SimulationConfig } from '../config/types';

export function calculateSpeed(agility: number, size: number, multiplier: number): number {
  return agility * (1 / Math.sqrt(size)) * multiplier;
}

export function calculateAlertRange(perception: number, multiplier: number): number {
  return perception * multiplier;
}

export function calculateAttackPower(strength: number, size: number): number {
  return strength * Math.sqrt(size);
}

export function calculateDefense(size: number, agility: number): number {
  return size * (1 + agility * 0.3);
}

export function calculateHungerDecayRate(
  size: number,
  speed: number,
  endurance: number,
  baseDecay: number
): number {
  return baseDecay * (size + speed * 0.3) / endurance;
}

export function calculateAllDerivedStats(
  baseAttributes: BaseAttributes,
  config: SimulationConfig
): DerivedStats {
  const { strength, agility, endurance, perception, size } = baseAttributes;
  const { SPEED_MULTIPLIER, PERCEPTION_MULTIPLIER, BASE_DECAY } = config.derivedStats;

  const speed = calculateSpeed(agility, size, SPEED_MULTIPLIER);
  const alertRange = calculateAlertRange(perception, PERCEPTION_MULTIPLIER);
  const attackPower = calculateAttackPower(strength, size);
  const defense = calculateDefense(size, agility);
  const hungerDecayRate = calculateHungerDecayRate(size, speed, endurance, BASE_DECAY);

  return {
    speed,
    alertRange,
    attackPower,
    defense,
    hungerDecayRate,
  };
}
