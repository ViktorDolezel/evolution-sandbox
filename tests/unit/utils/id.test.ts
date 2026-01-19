import { describe, it, expect } from 'vitest';
import { createIdGenerator, parseId } from '../../../src/utils/id';

describe('ID utilities', () => {
  describe('createIdGenerator', () => {
    it('creates generator that produces sequential IDs', () => {
      const generate = createIdGenerator('deer');
      expect(generate()).toBe('deer_1');
      expect(generate()).toBe('deer_2');
      expect(generate()).toBe('deer_3');
    });

    it('different generators have independent counters', () => {
      const generateDeer = createIdGenerator('deer');
      const generateWolf = createIdGenerator('wolf');

      expect(generateDeer()).toBe('deer_1');
      expect(generateWolf()).toBe('wolf_1');
      expect(generateDeer()).toBe('deer_2');
      expect(generateWolf()).toBe('wolf_2');
    });

    it('handles various prefixes', () => {
      const gen1 = createIdGenerator('entity');
      const gen2 = createIdGenerator('corpse');

      expect(gen1()).toBe('entity_1');
      expect(gen2()).toBe('corpse_1');
    });
  });

  describe('parseId', () => {
    it('parses valid ID into prefix and number', () => {
      const result = parseId('deer_42');
      expect(result).toEqual({ prefix: 'deer', number: 42 });
    });

    it('handles single digit numbers', () => {
      const result = parseId('wolf_5');
      expect(result).toEqual({ prefix: 'wolf', number: 5 });
    });

    it('handles large numbers', () => {
      const result = parseId('entity_999999');
      expect(result).toEqual({ prefix: 'entity', number: 999999 });
    });

    it('returns null for invalid format', () => {
      expect(parseId('invalid')).toBeNull();
      expect(parseId('deer-42')).toBeNull();
      expect(parseId('42_deer')).toBeNull();
      expect(parseId('')).toBeNull();
    });

    it('returns null for non-numeric suffix', () => {
      expect(parseId('deer_abc')).toBeNull();
    });
  });
});
