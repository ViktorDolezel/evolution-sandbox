import type { World } from '../core/World';
import type { Animal } from '../entities/types';
import type { SimulationConfig } from '../config/types';
import type { Camera } from './Camera';
import type { SelectionManager } from '../ui/SelectionManager';
import { ENTITY_COLORS, RENDER_SCALE, getHungerBarColor, getEntityRadius } from './sprites';

export interface RenderOptions {
  showHungerBars: boolean;
  showMaturityBadges: boolean;
  showReproductionGlow: boolean;
  showVegetation: boolean;
  showCorpses: boolean;
  showAnimals: boolean;
  debugMode: boolean;
}

export interface Renderer {
  render(world: World): void;
  setOptions(options: Partial<RenderOptions>): void;
  getOptions(): RenderOptions;
  getFPS(): number;
  resize(): void;
  destroy(): void;
}

export function createRenderer(
  canvas: HTMLCanvasElement,
  camera: Camera,
  selectionManager: SelectionManager,
  config: SimulationConfig
): Renderer {
  const ctx = canvas.getContext('2d')!;

  let options: RenderOptions = {
    showHungerBars: true,
    showMaturityBadges: true,
    showReproductionGlow: true,
    showVegetation: true,
    showCorpses: true,
    showAnimals: true,
    debugMode: false,
  };

  let frameCount = 0;
  let fps = 0;
  let fpsUpdateTime = performance.now();

  function updateFPS(): void {
    frameCount++;
    const now = performance.now();
    if (now - fpsUpdateTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      fpsUpdateTime = now;
    }
  }

  function clear(): void {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function renderVegetation(world: World): void {
    if (!options.showVegetation) return;

    const bounds = camera.getVisibleBounds();
    const tileSize = config.world.VEGETATION_TILE_SIZE;
    const { zoom } = camera.getState();

    ctx.fillStyle = ENTITY_COLORS.vegetation.fill;

    const positions = world.vegetationGrid.getAllPositions();
    for (const gridPos of positions) {
      const worldPos = world.vegetationGrid.gridToWorld(gridPos.x, gridPos.y);

      // Frustum culling
      if (
        worldPos.x < bounds.minX - tileSize ||
        worldPos.x > bounds.maxX + tileSize ||
        worldPos.y < bounds.minY - tileSize ||
        worldPos.y > bounds.maxY + tileSize
      ) {
        continue;
      }

      const screenPos = camera.worldToScreen(worldPos);
      const screenSize = tileSize * zoom;
      const padding = RENDER_SCALE.VEGETATION_TILE_PADDING * zoom;

      ctx.fillRect(
        screenPos.x - screenSize / 2 + padding,
        screenPos.y - screenSize / 2 + padding,
        screenSize - padding * 2,
        screenSize - padding * 2
      );
    }
  }

  function renderCorpses(world: World): void {
    if (!options.showCorpses) return;

    const bounds = camera.getVisibleBounds();
    const corpses = world.getAllCorpses();
    const { zoom } = camera.getState();

    for (const corpse of corpses) {
      // Frustum culling
      if (
        corpse.position.x < bounds.minX - 20 ||
        corpse.position.x > bounds.maxX + 20 ||
        corpse.position.y < bounds.minY - 20 ||
        corpse.position.y > bounds.maxY + 20
      ) {
        continue;
      }

      const screenPos = camera.worldToScreen(corpse.position);
      const radius = corpse.sourceSize * RENDER_SCALE.CORPSE_RADIUS_MULTIPLIER * RENDER_SCALE.ANIMAL_BASE_RADIUS * zoom;

      // Corpse body (X shape)
      ctx.strokeStyle = ENTITY_COLORS.corpse.fill;
      ctx.lineWidth = 3 * zoom;
      ctx.beginPath();
      ctx.moveTo(screenPos.x - radius * 0.7, screenPos.y - radius * 0.7);
      ctx.lineTo(screenPos.x + radius * 0.7, screenPos.y + radius * 0.7);
      ctx.moveTo(screenPos.x + radius * 0.7, screenPos.y - radius * 0.7);
      ctx.lineTo(screenPos.x - radius * 0.7, screenPos.y + radius * 0.7);
      ctx.stroke();
    }
  }

  function renderAnimal(animal: Animal, isSelected: boolean): void {
    const { zoom } = camera.getState();
    const screenPos = camera.worldToScreen(animal.state.position);
    const radius = getEntityRadius(animal.baseAttributes.size) * zoom;
    const colors = animal.species === 'deer' ? ENTITY_COLORS.deer : ENTITY_COLORS.wolf;

    // Check if reproduction ready
    const isMature = animal.state.age >= animal.lifecycleAttributes.maturityAge;
    const reproductionCost = config.reproduction.REPRODUCTION_COST * animal.lifecycleAttributes.litterSize;
    const reproductionThreshold = (reproductionCost + config.reproduction.REPRODUCTION_SAFETY_BUFFER) * config.entities.MAX_HUNGER;
    const isReproductionReady = isMature &&
      animal.state.hunger > reproductionThreshold &&
      animal.state.ticksSinceLastReproduction >= config.reproduction.REPRODUCTION_COOLDOWN;

    // Reproduction glow
    if (options.showReproductionGlow && isReproductionReady) {
      const glowRadius = radius + RENDER_SCALE.REPRODUCTION_GLOW_RADIUS * zoom;
      const gradient = ctx.createRadialGradient(
        screenPos.x, screenPos.y, radius,
        screenPos.x, screenPos.y, glowRadius
      );
      gradient.addColorStop(0, ENTITY_COLORS.ui.reproductionGlow);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Selection ring
    if (isSelected) {
      ctx.strokeStyle = ENTITY_COLORS.selection.ring;
      ctx.lineWidth = RENDER_SCALE.SELECTION_RING_WIDTH * zoom;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, radius + RENDER_SCALE.SELECTION_RING_PADDING * zoom, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Animal body
    ctx.fillStyle = colors.body;
    ctx.strokeStyle = colors.outline;
    ctx.lineWidth = 1.5 * zoom;
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Species indicator (small inner shape)
    if (animal.species === 'wolf') {
      // Wolf: pointed ears suggestion
      ctx.fillStyle = colors.outline;
      ctx.beginPath();
      ctx.moveTo(screenPos.x - radius * 0.5, screenPos.y - radius * 0.3);
      ctx.lineTo(screenPos.x - radius * 0.3, screenPos.y - radius * 0.8);
      ctx.lineTo(screenPos.x - radius * 0.1, screenPos.y - radius * 0.3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(screenPos.x + radius * 0.5, screenPos.y - radius * 0.3);
      ctx.lineTo(screenPos.x + radius * 0.3, screenPos.y - radius * 0.8);
      ctx.lineTo(screenPos.x + radius * 0.1, screenPos.y - radius * 0.3);
      ctx.fill();
    }

    // Maturity badge (purple dot for immature)
    if (options.showMaturityBadges && !isMature) {
      const badgeSize = RENDER_SCALE.MATURITY_BADGE_SIZE * zoom;
      ctx.fillStyle = ENTITY_COLORS.ui.maturityBadge;
      ctx.beginPath();
      ctx.arc(screenPos.x + radius * 0.7, screenPos.y - radius * 0.7, badgeSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hunger bar
    if (options.showHungerBars) {
      const barWidth = RENDER_SCALE.HUNGER_BAR_WIDTH * zoom;
      const barHeight = RENDER_SCALE.HUNGER_BAR_HEIGHT * zoom;
      const barX = screenPos.x - barWidth / 2;
      const barY = screenPos.y + RENDER_SCALE.HUNGER_BAR_OFFSET_Y * zoom - radius;

      // Background
      ctx.fillStyle = ENTITY_COLORS.ui.hungerBarBg;
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Fill
      const hungerPercent = animal.state.hunger / config.entities.MAX_HUNGER;
      ctx.fillStyle = getHungerBarColor(hungerPercent);
      ctx.fillRect(barX, barY, barWidth * hungerPercent, barHeight);
    }
  }

  function renderAnimals(world: World): void {
    if (!options.showAnimals) return;

    const bounds = camera.getVisibleBounds();
    const livingAnimals = world.getLivingAnimals();
    const selectedId = selectionManager.getSelection().entityId;

    // Sort by Y for depth (render top to bottom)
    livingAnimals.sort((a, b) => a.state.position.y - b.state.position.y);

    for (const animal of livingAnimals) {
      // Frustum culling
      const size = animal.baseAttributes.size * RENDER_SCALE.ANIMAL_BASE_RADIUS;
      if (
        animal.state.position.x < bounds.minX - size * 2 ||
        animal.state.position.x > bounds.maxX + size * 2 ||
        animal.state.position.y < bounds.minY - size * 2 ||
        animal.state.position.y > bounds.maxY + size * 2
      ) {
        continue;
      }

      const isSelected = animal.id === selectedId;
      renderAnimal(animal, isSelected);
    }
  }

  function renderDebugInfo(world: World): void {
    if (!options.debugMode) return;

    const { zoom, position } = camera.getState();
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`Zoom: ${zoom.toFixed(2)}x`, 10, canvas.height - 60);
    ctx.fillText(`Camera: (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`, 10, canvas.height - 45);
    ctx.fillText(`Animals: ${world.getLivingAnimals().length}`, 10, canvas.height - 30);
    ctx.fillText(`FPS: ${fps}`, 10, canvas.height - 15);
  }

  return {
    render(world: World): void {
      updateFPS();
      clear();
      renderVegetation(world);
      renderCorpses(world);
      renderAnimals(world);
      renderDebugInfo(world);
    },

    setOptions(newOptions: Partial<RenderOptions>): void {
      options = { ...options, ...newOptions };
    },

    getOptions(): RenderOptions {
      return { ...options };
    },

    getFPS(): number {
      return fps;
    },

    resize(): void {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      camera.setViewportSize(canvas.width, canvas.height);
    },

    destroy(): void {
      // Nothing to clean up for Canvas 2D
    },
  };
}
