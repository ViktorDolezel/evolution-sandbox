import type { Vector2 } from '../utils/vector';

export interface CameraState {
  readonly position: Vector2;
  readonly zoom: number;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
}

export interface Camera {
  getState(): CameraState;
  worldToScreen(worldPos: Vector2): Vector2;
  screenToWorld(screenPos: Vector2): Vector2;
  setPosition(pos: Vector2): void;
  pan(delta: Vector2): void;
  setZoom(zoom: number): void;
  zoomBy(factor: number, focalPoint?: Vector2): void;
  setViewportSize(width: number, height: number): void;
  getVisibleBounds(): { minX: number; maxX: number; minY: number; maxY: number };
  fitToWorld(worldWidth: number, worldHeight: number): void;
}

export function createCamera(
  viewportWidth: number,
  viewportHeight: number,
  minZoom: number = 0.25,
  maxZoom: number = 4.0
): Camera {
  let position: Vector2 = { x: 0, y: 0 };
  let zoom = 1.0;
  let vpWidth = viewportWidth;
  let vpHeight = viewportHeight;

  function clampZoom(z: number): number {
    return Math.max(minZoom, Math.min(maxZoom, z));
  }

  return {
    getState(): CameraState {
      return {
        position: { ...position },
        zoom,
        viewportWidth: vpWidth,
        viewportHeight: vpHeight,
      };
    },

    worldToScreen(worldPos: Vector2): Vector2 {
      return {
        x: (worldPos.x - position.x) * zoom + vpWidth / 2,
        y: (worldPos.y - position.y) * zoom + vpHeight / 2,
      };
    },

    screenToWorld(screenPos: Vector2): Vector2 {
      return {
        x: (screenPos.x - vpWidth / 2) / zoom + position.x,
        y: (screenPos.y - vpHeight / 2) / zoom + position.y,
      };
    },

    setPosition(pos: Vector2): void {
      position = { ...pos };
    },

    pan(delta: Vector2): void {
      position = {
        x: position.x - delta.x / zoom,
        y: position.y - delta.y / zoom,
      };
    },

    setZoom(z: number): void {
      zoom = clampZoom(z);
    },

    zoomBy(factor: number, focalPoint?: Vector2): void {
      const newZoom = clampZoom(zoom * factor);

      if (focalPoint) {
        // Zoom towards focal point (screen coordinates)
        const worldFocal = this.screenToWorld(focalPoint);
        zoom = newZoom;
        const newScreenFocal = this.worldToScreen(worldFocal);
        // Adjust position so the focal point stays under cursor
        position = {
          x: position.x + (newScreenFocal.x - focalPoint.x) / zoom,
          y: position.y + (newScreenFocal.y - focalPoint.y) / zoom,
        };
      } else {
        zoom = newZoom;
      }
    },

    setViewportSize(width: number, height: number): void {
      vpWidth = width;
      vpHeight = height;
    },

    getVisibleBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
      const halfWidth = vpWidth / 2 / zoom;
      const halfHeight = vpHeight / 2 / zoom;
      return {
        minX: position.x - halfWidth,
        maxX: position.x + halfWidth,
        minY: position.y - halfHeight,
        maxY: position.y + halfHeight,
      };
    },

    fitToWorld(worldWidth: number, worldHeight: number): void {
      // Center camera on world
      position = { x: worldWidth / 2, y: worldHeight / 2 };
      // Calculate zoom to fit world in viewport
      const zoomX = vpWidth / worldWidth;
      const zoomY = vpHeight / worldHeight;
      zoom = clampZoom(Math.min(zoomX, zoomY) * 0.95); // 95% to add small margin
    },
  };
}
