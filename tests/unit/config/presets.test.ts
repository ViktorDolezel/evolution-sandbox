import { describe, it, expect } from 'vitest';
import { applyPreset, getPresetConfig } from '../../../src/config/presets';
import { getDefaultConfig } from '../../../src/config/defaults';

describe('Config presets', () => {
  describe('getPresetConfig', () => {
    it('returns fast evolution preset values', () => {
      const preset = getPresetConfig('fastEvolution');
      expect(preset.evolution?.BEHAVIORAL_MUTATION_RATE).toBe(0.20);
      expect(preset.evolution?.LIFECYCLE_MUTATION_RATE).toBe(0.10);
      expect(preset.reproduction?.REPRODUCTION_COOLDOWN).toBe(50);
      expect(preset.world?.TICK_RATE).toBe(20);
    });

    it('returns harsh world preset values', () => {
      const preset = getPresetConfig('harshWorld');
      expect(preset.derivedStats?.BASE_DECAY).toBe(1.0);
      expect(preset.vegetation?.VEGETATION_SPREAD_RATE).toBe(0.025);
      expect(preset.vegetation?.INITIAL_VEGETATION_DENSITY).toBe(0.2);
      expect(preset.corpse?.CORPSE_DECAY_TICKS).toBe(50);
    });

    it('returns peaceful preset values', () => {
      const preset = getPresetConfig('peaceful');
      expect(preset.derivedStats?.BASE_DECAY).toBe(0.2);
      expect(preset.vegetation?.VEGETATION_SPREAD_RATE).toBe(0.1);
      expect(preset.world?.INITIAL_WOLF_COUNT).toBe(0);
      expect(preset.reproduction?.REPRODUCTION_COOLDOWN).toBe(50);
    });

    it('returns empty object for balanced preset', () => {
      const preset = getPresetConfig('balanced');
      expect(Object.keys(preset).length).toBe(0);
    });
  });

  describe('applyPreset', () => {
    it('merges preset values with base config', () => {
      const baseConfig = getDefaultConfig();
      const result = applyPreset(baseConfig, 'fastEvolution');

      // Preset values should be applied
      expect(result.evolution.BEHAVIORAL_MUTATION_RATE).toBe(0.20);
      expect(result.reproduction.REPRODUCTION_COOLDOWN).toBe(50);

      // Non-preset values should remain from base
      expect(result.world.WORLD_WIDTH).toBe(1000);
      expect(result.entities.MAX_HUNGER).toBe(100);
    });

    it('does not mutate original config', () => {
      const baseConfig = getDefaultConfig();
      const originalRate = baseConfig.evolution.BEHAVIORAL_MUTATION_RATE;

      applyPreset(baseConfig, 'fastEvolution');

      expect(baseConfig.evolution.BEHAVIORAL_MUTATION_RATE).toBe(originalRate);
    });

    it('handles balanced preset (no changes)', () => {
      const baseConfig = getDefaultConfig();
      const result = applyPreset(baseConfig, 'balanced');

      expect(result).toEqual(baseConfig);
    });
  });
});
