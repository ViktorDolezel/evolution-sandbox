import type { RandomGenerator } from '../core/SeededRandom';

export interface VegetationGrid {
  has(gridX: number, gridY: number): boolean;
  set(gridX: number, gridY: number, value: boolean): void;
  remove(gridX: number, gridY: number): void;
  getCount(): number;
  getAllPositions(): Array<{ x: number; y: number }>;
  spread(rng: RandomGenerator, spreadRate: number): void;
  worldToGrid(worldX: number, worldY: number): { x: number; y: number };
  gridToWorld(gridX: number, gridY: number): { x: number; y: number };
  isValidGridPosition(gridX: number, gridY: number): boolean;
  getNeighbors(gridX: number, gridY: number): Array<{ x: number; y: number }>;
  clear(): void;
}

export function createVegetationGrid(
  worldWidth: number,
  worldHeight: number,
  tileSize: number
): VegetationGrid {
  const cols = Math.floor(worldWidth / tileSize);
  const rows = Math.floor(worldHeight / tileSize);

  // Use a Set to store vegetation positions as "x,y" strings
  const vegetation = new Set<string>();

  function posKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  function parseKey(key: string): { x: number; y: number } {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  }

  const grid: VegetationGrid = {
    has(gridX: number, gridY: number): boolean {
      if (!this.isValidGridPosition(gridX, gridY)) {
        return false;
      }
      return vegetation.has(posKey(gridX, gridY));
    },

    set(gridX: number, gridY: number, value: boolean): void {
      if (!this.isValidGridPosition(gridX, gridY)) {
        return;
      }
      const key = posKey(gridX, gridY);
      if (value) {
        vegetation.add(key);
      } else {
        vegetation.delete(key);
      }
    },

    remove(gridX: number, gridY: number): void {
      if (!this.isValidGridPosition(gridX, gridY)) {
        return;
      }
      vegetation.delete(posKey(gridX, gridY));
    },

    getCount(): number {
      return vegetation.size;
    },

    getAllPositions(): Array<{ x: number; y: number }> {
      return Array.from(vegetation).map(parseKey);
    },

    spread(rng: RandomGenerator, spreadRate: number): void {
      if (spreadRate === 0) {
        return;
      }

      // Get current vegetation positions (copy to avoid modifying during iteration)
      const currentPositions = this.getAllPositions();

      // For each vegetation tile, try to spread to neighbors
      for (const pos of currentPositions) {
        const neighbors = this.getNeighbors(pos.x, pos.y);
        for (const neighbor of neighbors) {
          // Only spread to empty cells
          if (!this.has(neighbor.x, neighbor.y)) {
            if (rng.next() < spreadRate) {
              this.set(neighbor.x, neighbor.y, true);
            }
          }
        }
      }
    },

    worldToGrid(worldX: number, worldY: number): { x: number; y: number } {
      return {
        x: Math.floor(worldX / tileSize),
        y: Math.floor(worldY / tileSize),
      };
    },

    gridToWorld(gridX: number, gridY: number): { x: number; y: number } {
      // Return center of tile
      return {
        x: gridX * tileSize + tileSize / 2,
        y: gridY * tileSize + tileSize / 2,
      };
    },

    isValidGridPosition(gridX: number, gridY: number): boolean {
      return gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows;
    },

    getNeighbors(gridX: number, gridY: number): Array<{ x: number; y: number }> {
      const neighbors: Array<{ x: number; y: number }> = [];
      const directions = [
        { dx: -1, dy: 0 }, // left
        { dx: 1, dy: 0 },  // right
        { dx: 0, dy: -1 }, // up
        { dx: 0, dy: 1 },  // down
      ];

      for (const { dx, dy } of directions) {
        const nx = gridX + dx;
        const ny = gridY + dy;
        if (this.isValidGridPosition(nx, ny)) {
          neighbors.push({ x: nx, y: ny });
        }
      }

      return neighbors;
    },

    clear(): void {
      vegetation.clear();
    },
  };

  return grid;
}

export function initializeVegetation(
  grid: VegetationGrid,
  density: number,
  rng: RandomGenerator
): void {
  // We need to iterate over all grid positions
  // First, let's get the dimensions by testing bounds
  let cols = 0;
  let rows = 0;

  // Find cols
  while (grid.isValidGridPosition(cols, 0)) {
    cols++;
  }

  // Find rows
  while (grid.isValidGridPosition(0, rows)) {
    rows++;
  }

  // Now iterate and set vegetation based on density
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (rng.next() < density) {
        grid.set(x, y, true);
      }
    }
  }
}
