import type { Animal } from '../entities/types';
import type { ThreatInfo } from './types';
import { distance, subtract, normalize } from '../utils/vector';

/**
 * Calculate perceived threat from another animal.
 * Formula: (other.attackPower * other.aggression) / self.defense
 */
export function calculatePerceivedThreat(self: Animal, other: Animal): number {
  const attackPower = other.derivedStats.attackPower;
  const aggression = other.behavioralAttributes.aggression;
  const defense = self.derivedStats.defense;

  if (defense === 0) {
    return Infinity;
  }

  return (attackPower * aggression) / defense;
}

/**
 * Determine if another animal is threatening enough to flee from.
 * Returns true when perceivedThreat > (1 - flightInstinct).
 * Higher flightInstinct (0.8) = lower threshold (0.2) = easily scared.
 * Lower flightInstinct (0.1) = higher threshold (0.9) = brave animal.
 */
export function isThreatening(self: Animal, other: Animal): boolean {
  const perceivedThreat = calculatePerceivedThreat(self, other);
  const threshold = 1 - self.behavioralAttributes.flightInstinct;
  return perceivedThreat > threshold;
}

/**
 * Find all threatening animals within alert range.
 * Returns array of ThreatInfo sorted by distance (closest first).
 */
export function findThreats(self: Animal, nearbyAnimals: Animal[]): ThreatInfo[] {
  const threats: ThreatInfo[] = [];
  const alertRange = self.derivedStats.alertRange;

  for (const other of nearbyAnimals) {
    if (other.id === self.id) {
      continue;
    }

    const dist = distance(self.state.position, other.state.position);

    // Check if within alert range and is threatening
    if (dist <= alertRange && isThreatening(self, other)) {
      threats.push({
        id: other.id,
        distance: dist,
        perceivedThreat: calculatePerceivedThreat(self, other),
      });
    }
  }

  // Sort by distance (closest first)
  threats.sort((a, b) => a.distance - b.distance);

  return threats;
}

/**
 * Calculate flee direction as weighted average of directions away from threats.
 * Closer threats have stronger influence (weighted by 1/distance).
 */
export function calculateFleeVector(
  selfPosition: { x: number; y: number },
  threats: ThreatInfo[],
  animals: Map<string, Animal>
): { x: number; y: number } {
  if (threats.length === 0) {
    return { x: 0, y: 0 };
  }

  let totalWeight = 0;
  let fleeX = 0;
  let fleeY = 0;

  for (const threat of threats) {
    const animal = animals.get(threat.id);
    if (!animal) {
      continue;
    }

    // Direction from threat to self (flee away)
    const dx = selfPosition.x - animal.state.position.x;
    const dy = selfPosition.y - animal.state.position.y;

    // Weight by inverse distance (closer = more weight)
    const weight = 1 / Math.max(1, threat.distance);

    fleeX += dx * weight;
    fleeY += dy * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return { x: 0, y: 0 };
  }

  // Normalize the result
  const result = { x: fleeX / totalWeight, y: fleeY / totalWeight };
  return normalize(result);
}
