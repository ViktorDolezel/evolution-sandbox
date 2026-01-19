import { describe, it, expect } from 'vitest';
import { clamp, lerp, inverseLerp, remap, approxEqual } from '../../../src/utils/math';

describe('Math utilities', () => {
  describe('clamp', () => {
    it('returns value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('returns min when value is below range', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('returns max when value is above range', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('handles value equal to min', () => {
      expect(clamp(0, 0, 10)).toBe(0);
    });

    it('handles value equal to max', () => {
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('handles negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(0, -10, -1)).toBe(-1);
    });

    it('handles decimal values', () => {
      expect(clamp(0.5, 0, 1)).toBe(0.5);
      expect(clamp(1.5, 0, 1)).toBe(1);
      expect(clamp(-0.5, 0, 1)).toBe(0);
    });
  });

  describe('lerp', () => {
    it('returns a when t=0', () => {
      expect(lerp(0, 100, 0)).toBe(0);
    });

    it('returns b when t=1', () => {
      expect(lerp(0, 100, 1)).toBe(100);
    });

    it('returns midpoint when t=0.5', () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
    });

    it('handles negative values', () => {
      expect(lerp(-100, 100, 0.5)).toBe(0);
    });

    it('handles t outside [0,1] range (extrapolation)', () => {
      expect(lerp(0, 100, 2)).toBe(200);
      expect(lerp(0, 100, -1)).toBe(-100);
    });

    it('handles decimal values', () => {
      expect(lerp(0, 10, 0.25)).toBe(2.5);
    });
  });

  describe('inverseLerp', () => {
    it('returns 0 when value equals a', () => {
      expect(inverseLerp(0, 100, 0)).toBe(0);
    });

    it('returns 1 when value equals b', () => {
      expect(inverseLerp(0, 100, 100)).toBe(1);
    });

    it('returns 0.5 when value is midpoint', () => {
      expect(inverseLerp(0, 100, 50)).toBe(0.5);
    });

    it('handles negative ranges', () => {
      expect(inverseLerp(-100, 100, 0)).toBe(0.5);
    });

    it('handles values outside range', () => {
      expect(inverseLerp(0, 100, 200)).toBe(2);
      expect(inverseLerp(0, 100, -100)).toBe(-1);
    });
  });

  describe('remap', () => {
    it('remaps value from one range to another', () => {
      expect(remap(5, 0, 10, 0, 100)).toBe(50);
    });

    it('handles different sized ranges', () => {
      expect(remap(2, 0, 10, 0, 50)).toBe(10);
    });

    it('handles inverted output range', () => {
      expect(remap(0, 0, 10, 100, 0)).toBe(100);
      expect(remap(10, 0, 10, 100, 0)).toBe(0);
    });

    it('handles negative ranges', () => {
      expect(remap(0, -10, 10, 0, 100)).toBe(50);
    });
  });

  describe('approxEqual', () => {
    it('returns true for equal values', () => {
      expect(approxEqual(5, 5)).toBe(true);
    });

    it('returns true for values within default epsilon', () => {
      expect(approxEqual(1.0000001, 1.0000002)).toBe(true);
    });

    it('returns false for values outside default epsilon', () => {
      expect(approxEqual(1.0, 1.1)).toBe(false);
    });

    it('accepts custom epsilon', () => {
      expect(approxEqual(1.0, 1.05, 0.1)).toBe(true);
      expect(approxEqual(1.0, 1.2, 0.1)).toBe(false);
    });

    it('handles zero values', () => {
      expect(approxEqual(0, 0)).toBe(true);
      expect(approxEqual(0, 0.0000001)).toBe(true);
    });

    it('handles negative values', () => {
      expect(approxEqual(-5, -5)).toBe(true);
      expect(approxEqual(-5, -5.0000001)).toBe(true);
    });
  });
});
