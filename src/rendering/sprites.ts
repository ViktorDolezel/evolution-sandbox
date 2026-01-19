export interface EntityColors {
  deer: {
    body: string;
    outline: string;
    dead: string;
  };
  wolf: {
    body: string;
    outline: string;
    dead: string;
  };
  corpse: {
    fill: string;
    outline: string;
  };
  vegetation: {
    fill: string;
    outline: string;
  };
  selection: {
    ring: string;
    glow: string;
  };
  ui: {
    hungerBarBg: string;
    hungerHigh: string;
    hungerMid: string;
    hungerLow: string;
    maturityBadge: string;
    reproductionGlow: string;
  };
}

export const ENTITY_COLORS: EntityColors = {
  deer: {
    body: '#C4A484',
    outline: '#8B7355',
    dead: '#6B5344',
  },
  wolf: {
    body: '#5A5A5A',
    outline: '#3A3A3A',
    dead: '#2A2A2A',
  },
  corpse: {
    fill: '#8B4513',
    outline: '#5C2E0D',
  },
  vegetation: {
    fill: '#228B22',
    outline: '#1A6B1A',
  },
  selection: {
    ring: '#FFD700',
    glow: 'rgba(255, 215, 0, 0.3)',
  },
  ui: {
    hungerBarBg: '#333333',
    hungerHigh: '#4ade80',
    hungerMid: '#facc15',
    hungerLow: '#f87171',
    maturityBadge: '#9333ea',
    reproductionGlow: 'rgba(236, 72, 153, 0.4)',
  },
};

export const RENDER_SCALE = {
  ANIMAL_BASE_RADIUS: 8,
  CORPSE_RADIUS_MULTIPLIER: 0.8,
  VEGETATION_TILE_PADDING: 1,
  HUNGER_BAR_WIDTH: 24,
  HUNGER_BAR_HEIGHT: 4,
  HUNGER_BAR_OFFSET_Y: -12,
  MATURITY_BADGE_SIZE: 4,
  SELECTION_RING_PADDING: 4,
  SELECTION_RING_WIDTH: 2,
  REPRODUCTION_GLOW_RADIUS: 20,
};

export function getHungerBarColor(hungerPercent: number): string {
  if (hungerPercent > 0.66) {
    return ENTITY_COLORS.ui.hungerHigh;
  } else if (hungerPercent > 0.33) {
    return ENTITY_COLORS.ui.hungerMid;
  }
  return ENTITY_COLORS.ui.hungerLow;
}

export function getEntityRadius(baseSize: number): number {
  return baseSize * RENDER_SCALE.ANIMAL_BASE_RADIUS;
}

export const GRAPH_COLORS = {
  deer: '#C4A484',
  wolf: '#5A5A5A',
  vegetation: '#228B22',
  grid: '#333333',
  axis: '#666666',
  text: '#999999',
  background: 'rgba(26, 26, 46, 0.95)',
};
