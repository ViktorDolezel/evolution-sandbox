import { describe, it, expect } from 'vitest';
import * as Vector from '../../../src/utils/vector';

describe('Vector2', () => {
  describe('create', () => {
    it('creates a vector with given x and y', () => {
      const v = Vector.create(3, 4);
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
    });

    it('creates a zero vector when given zeros', () => {
      const v = Vector.create(0, 0);
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });

    it('handles negative values', () => {
      const v = Vector.create(-5, -10);
      expect(v.x).toBe(-5);
      expect(v.y).toBe(-10);
    });
  });

  describe('add', () => {
    it('adds two vectors', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 3, y: 4 };
      const result = Vector.add(a, b);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('handles negative values', () => {
      const a = { x: 5, y: 3 };
      const b = { x: -2, y: -1 };
      const result = Vector.add(a, b);
      expect(result.x).toBe(3);
      expect(result.y).toBe(2);
    });

    it('returns new vector, does not mutate inputs', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 3, y: 4 };
      const result = Vector.add(a, b);
      expect(result).not.toBe(a);
      expect(result).not.toBe(b);
      expect(a.x).toBe(1);
      expect(b.x).toBe(3);
    });
  });

  describe('subtract', () => {
    it('subtracts two vectors', () => {
      const a = { x: 5, y: 7 };
      const b = { x: 2, y: 3 };
      const result = Vector.subtract(a, b);
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('can produce negative results', () => {
      const a = { x: 2, y: 3 };
      const b = { x: 5, y: 7 };
      const result = Vector.subtract(a, b);
      expect(result.x).toBe(-3);
      expect(result.y).toBe(-4);
    });
  });

  describe('multiply', () => {
    it('multiplies vector by scalar', () => {
      const v = { x: 3, y: 4 };
      const result = Vector.multiply(v, 2);
      expect(result.x).toBe(6);
      expect(result.y).toBe(8);
    });

    it('handles zero scalar', () => {
      const v = { x: 3, y: 4 };
      const result = Vector.multiply(v, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('handles negative scalar', () => {
      const v = { x: 3, y: 4 };
      const result = Vector.multiply(v, -1);
      expect(result.x).toBe(-3);
      expect(result.y).toBe(-4);
    });
  });

  describe('divide', () => {
    it('divides vector by scalar', () => {
      const v = { x: 6, y: 8 };
      const result = Vector.divide(v, 2);
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('handles fractional results', () => {
      const v = { x: 5, y: 7 };
      const result = Vector.divide(v, 2);
      expect(result.x).toBe(2.5);
      expect(result.y).toBe(3.5);
    });
  });

  describe('magnitude', () => {
    it('calculates magnitude of vector', () => {
      const v = { x: 3, y: 4 };
      expect(Vector.magnitude(v)).toBe(5);
    });

    it('returns 0 for zero vector', () => {
      const v = { x: 0, y: 0 };
      expect(Vector.magnitude(v)).toBe(0);
    });

    it('handles single non-zero component', () => {
      expect(Vector.magnitude({ x: 5, y: 0 })).toBe(5);
      expect(Vector.magnitude({ x: 0, y: 5 })).toBe(5);
    });
  });

  describe('normalize', () => {
    it('normalizes vector to unit length', () => {
      const v = { x: 3, y: 4 };
      const result = Vector.normalize(v);
      expect(result.x).toBeCloseTo(0.6);
      expect(result.y).toBeCloseTo(0.8);
      expect(Vector.magnitude(result)).toBeCloseTo(1);
    });

    it('returns zero vector when normalizing zero vector', () => {
      const v = { x: 0, y: 0 };
      const result = Vector.normalize(v);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('handles already normalized vectors', () => {
      const v = { x: 1, y: 0 };
      const result = Vector.normalize(v);
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(0);
    });
  });

  describe('distance', () => {
    it('calculates distance between two points', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 3, y: 4 };
      expect(Vector.distance(a, b)).toBe(5);
    });

    it('returns 0 for same point', () => {
      const a = { x: 5, y: 5 };
      const b = { x: 5, y: 5 };
      expect(Vector.distance(a, b)).toBe(0);
    });

    it('is commutative', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 4, y: 6 };
      expect(Vector.distance(a, b)).toBe(Vector.distance(b, a));
    });
  });

  describe('distanceSquared', () => {
    it('calculates squared distance (faster than distance)', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 3, y: 4 };
      expect(Vector.distanceSquared(a, b)).toBe(25);
    });

    it('returns 0 for same point', () => {
      const a = { x: 5, y: 5 };
      expect(Vector.distanceSquared(a, a)).toBe(0);
    });
  });

  describe('dot', () => {
    it('calculates dot product', () => {
      const a = { x: 1, y: 2 };
      const b = { x: 3, y: 4 };
      expect(Vector.dot(a, b)).toBe(11); // 1*3 + 2*4
    });

    it('returns 0 for perpendicular vectors', () => {
      const a = { x: 1, y: 0 };
      const b = { x: 0, y: 1 };
      expect(Vector.dot(a, b)).toBe(0);
    });

    it('returns negative for opposing vectors', () => {
      const a = { x: 1, y: 0 };
      const b = { x: -1, y: 0 };
      expect(Vector.dot(a, b)).toBe(-1);
    });
  });

  describe('lerp', () => {
    it('interpolates at t=0 returns a', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 10, y: 10 };
      const result = Vector.lerp(a, b, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('interpolates at t=1 returns b', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 10, y: 10 };
      const result = Vector.lerp(a, b, 1);
      expect(result.x).toBe(10);
      expect(result.y).toBe(10);
    });

    it('interpolates at t=0.5 returns midpoint', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 10, y: 10 };
      const result = Vector.lerp(a, b, 0.5);
      expect(result.x).toBe(5);
      expect(result.y).toBe(5);
    });

    it('handles negative vectors', () => {
      const a = { x: -10, y: -10 };
      const b = { x: 10, y: 10 };
      const result = Vector.lerp(a, b, 0.5);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('clampMagnitude', () => {
    it('does not change vector within max magnitude', () => {
      const v = { x: 3, y: 4 }; // magnitude = 5
      const result = Vector.clampMagnitude(v, 10);
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('clamps vector exceeding max magnitude', () => {
      const v = { x: 6, y: 8 }; // magnitude = 10
      const result = Vector.clampMagnitude(v, 5);
      expect(Vector.magnitude(result)).toBeCloseTo(5);
      expect(result.x).toBeCloseTo(3);
      expect(result.y).toBeCloseTo(4);
    });

    it('handles zero vector', () => {
      const v = { x: 0, y: 0 };
      const result = Vector.clampMagnitude(v, 5);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('randomUnit', () => {
    it('creates unit vector with magnitude 1', () => {
      const mockRandom = () => 0.25; // Will produce angle of PI/2
      const result = Vector.randomUnit(mockRandom);
      expect(Vector.magnitude(result)).toBeCloseTo(1);
    });

    it('produces different vectors for different random values', () => {
      const v1 = Vector.randomUnit(() => 0);
      const v2 = Vector.randomUnit(() => 0.5);
      expect(v1.x).not.toBe(v2.x);
    });
  });

  describe('ZERO constant', () => {
    it('is a zero vector', () => {
      expect(Vector.ZERO.x).toBe(0);
      expect(Vector.ZERO.y).toBe(0);
    });
  });
});
