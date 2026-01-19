import type { Camera } from '../rendering/Camera';
import type { SelectionManager } from './SelectionManager';
import type { Simulation } from '../core/Simulation';

export interface InputHandlerConfig {
  panSpeed: number;
  zoomSpeed: number;
  doubleClickTime: number;
  hitTestTolerance: number;
}

export interface InputHandlerCallbacks {
  onToggleInfoPanel?: () => void;
  onToggleGraph?: () => void;
  onToggleVisualization?: () => void;
  onShowHelp?: () => void;
}

export interface InputHandler {
  enable(): void;
  disable(): void;
  setCallbacks(callbacks: InputHandlerCallbacks): void;
  destroy(): void;
}

export function createInputHandler(
  canvas: HTMLCanvasElement,
  camera: Camera,
  selectionManager: SelectionManager,
  simulation: Simulation,
  config: InputHandlerConfig = {
    panSpeed: 50,
    zoomSpeed: 1.1,
    doubleClickTime: 300,
    hitTestTolerance: 10,
  }
): InputHandler {
  let enabled = true;
  let isPanning = false;
  let lastMousePos = { x: 0, y: 0 };
  let lastClickTime = 0;
  let lastClickPos = { x: 0, y: 0 };
  let callbacks: InputHandlerCallbacks = {};

  // Mouse handlers
  function handleMouseDown(e: MouseEvent): void {
    if (!enabled) return;
    if (e.button !== 0) return; // Only left click

    isPanning = true;
    lastMousePos = { x: e.clientX, y: e.clientY };
  }

  function handleMouseMove(e: MouseEvent): void {
    if (!enabled || !isPanning) return;

    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    camera.pan({ x: dx, y: dy });

    lastMousePos = { x: e.clientX, y: e.clientY };
  }

  function handleMouseUp(e: MouseEvent): void {
    if (!enabled) return;

    isPanning = false;

    // Check for double-click
    const now = Date.now();
    const rect = canvas.getBoundingClientRect();
    const clickPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const dx = clickPos.x - lastClickPos.x;
    const dy = clickPos.y - lastClickPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (now - lastClickTime < config.doubleClickTime && dist < 10) {
      // Double-click detected
      handleDoubleClick(clickPos);
      lastClickTime = 0; // Reset to prevent triple-click
    } else {
      lastClickTime = now;
      lastClickPos = clickPos;
    }
  }

  function handleDoubleClick(screenPos: { x: number; y: number }): void {
    const worldPos = camera.screenToWorld(screenPos);
    const entity = selectionManager.findEntityAtPosition(
      simulation.world,
      worldPos,
      config.hitTestTolerance
    );

    if (entity) {
      selectionManager.select(entity);
    } else {
      selectionManager.deselect();
    }
  }

  function handleWheel(e: WheelEvent): void {
    if (!enabled) return;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const focalPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const factor = e.deltaY < 0 ? config.zoomSpeed : 1 / config.zoomSpeed;
    camera.zoomBy(factor, focalPoint);
  }

  // Keyboard handlers
  function handleKeyDown(e: KeyboardEvent): void {
    if (!enabled) return;

    // Don't intercept if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (simulation.isPaused) {
          simulation.start();
        } else {
          simulation.pause();
        }
        break;

      case '+':
      case '=':
        e.preventDefault();
        camera.zoomBy(config.zoomSpeed);
        break;

      case '-':
        e.preventDefault();
        camera.zoomBy(1 / config.zoomSpeed);
        break;

      case '0':
        e.preventDefault();
        camera.fitToWorld(
          simulation.config.world.WORLD_WIDTH,
          simulation.config.world.WORLD_HEIGHT
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        camera.pan({ x: 0, y: config.panSpeed });
        break;

      case 'ArrowDown':
        e.preventDefault();
        camera.pan({ x: 0, y: -config.panSpeed });
        break;

      case 'ArrowLeft':
        e.preventDefault();
        camera.pan({ x: config.panSpeed, y: 0 });
        break;

      case 'ArrowRight':
        e.preventDefault();
        camera.pan({ x: -config.panSpeed, y: 0 });
        break;

      case 'Tab':
        e.preventDefault();
        const direction = e.shiftKey ? 'previous' : 'next';
        selectionManager.cycleSelection(simulation.world, direction);
        break;

      case 'Escape':
        e.preventDefault();
        selectionManager.deselect();
        break;

      case '[':
        e.preventDefault();
        simulation.setSpeed(Math.max(0.1, simulation.speed - 0.5));
        break;

      case ']':
        e.preventDefault();
        simulation.setSpeed(Math.min(10, simulation.speed + 0.5));
        break;

      case 'i':
      case 'I':
        e.preventDefault();
        if (callbacks.onToggleInfoPanel) {
          callbacks.onToggleInfoPanel();
        }
        break;

      case 'g':
      case 'G':
        e.preventDefault();
        if (callbacks.onToggleGraph) {
          callbacks.onToggleGraph();
        }
        break;

      case 'v':
      case 'V':
        e.preventDefault();
        if (callbacks.onToggleVisualization) {
          callbacks.onToggleVisualization();
        }
        break;

      case '?':
        e.preventDefault();
        if (callbacks.onShowHelp) {
          callbacks.onShowHelp();
        }
        break;
    }
  }

  // Touch handlers (basic support)
  let touchStartPos: { x: number; y: number } | null = null;
  let initialPinchDistance: number | null = null;

  function handleTouchStart(e: TouchEvent): void {
    if (!enabled) return;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartPos = { x: touch.clientX, y: touch.clientY };
      lastMousePos = touchStartPos;
    } else if (e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
    }
  }

  function handleTouchMove(e: TouchEvent): void {
    if (!enabled) return;

    if (e.touches.length === 1 && touchStartPos) {
      // Pan
      const touch = e.touches[0];
      const dx = touch.clientX - lastMousePos.x;
      const dy = touch.clientY - lastMousePos.y;
      camera.pan({ x: dx, y: dy });
      lastMousePos = { x: touch.clientX, y: touch.clientY };
    } else if (e.touches.length === 2 && initialPinchDistance) {
      // Pinch zoom
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const factor = distance / initialPinchDistance;
      camera.zoomBy(factor);
      initialPinchDistance = distance;
    }
  }

  function handleTouchEnd(_e: TouchEvent): void {
    if (!enabled) return;
    touchStartPos = null;
    initialPinchDistance = null;
  }

  // Attach listeners
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', () => { isPanning = false; });
  canvas.addEventListener('wheel', handleWheel, { passive: false });
  document.addEventListener('keydown', handleKeyDown);

  // Touch events
  canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
  canvas.addEventListener('touchend', handleTouchEnd);

  return {
    enable(): void {
      enabled = true;
    },

    disable(): void {
      enabled = false;
      isPanning = false;
    },

    setCallbacks(newCallbacks: InputHandlerCallbacks): void {
      callbacks = { ...callbacks, ...newCallbacks };
    },

    destroy(): void {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    },
  };
}
