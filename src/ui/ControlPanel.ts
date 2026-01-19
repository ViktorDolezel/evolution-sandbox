import type { Simulation } from '../core/Simulation';
import type { SimulationConfig } from '../config/types';
import { createEventEmitter } from '../utils/events';
import { downloadConfigFile, promptConfigUpload } from '../config/persistence';

export interface ControlPanelEvents {
  playPause: { isPlaying: boolean };
  speedChange: { speed: number };
  reset: void;
  step: void;
  configImported: { config: SimulationConfig; warnings: string[] };
}

export interface ControlPanel {
  syncState(simulation: Simulation): void;
  setSpeed(speed: number): void;
  on<K extends keyof ControlPanelEvents>(event: K, callback: (data: ControlPanelEvents[K]) => void): void;
  off<K extends keyof ControlPanelEvents>(event: K, callback: (data: ControlPanelEvents[K]) => void): void;
  destroy(): void;
}

export function createControlPanel(
  container: HTMLElement,
  simulation: Simulation
): ControlPanel {
  const emitter = createEventEmitter<ControlPanelEvents>();

  // Create DOM structure
  container.innerHTML = `
    <button id="play-pause-btn" title="Space">Play</button>
    <button id="step-btn" title="Step one tick">Step</button>
    <div class="speed-control">
      <label>Speed:</label>
      <input type="range" id="speed-slider" min="0.1" max="10" step="0.1" value="1">
      <span id="speed-value">1.0x</span>
    </div>
    <button id="reset-btn" title="Reset simulation">Reset</button>
    <div class="config-controls">
      <button id="export-config-btn" title="Export configuration">Export</button>
      <button id="import-config-btn" title="Import configuration">Import</button>
    </div>
  `;

  const playPauseBtn = container.querySelector('#play-pause-btn') as HTMLButtonElement;
  const stepBtn = container.querySelector('#step-btn') as HTMLButtonElement;
  const speedSlider = container.querySelector('#speed-slider') as HTMLInputElement;
  const speedValue = container.querySelector('#speed-value') as HTMLSpanElement;
  const resetBtn = container.querySelector('#reset-btn') as HTMLButtonElement;
  const exportBtn = container.querySelector('#export-config-btn') as HTMLButtonElement;
  const importBtn = container.querySelector('#import-config-btn') as HTMLButtonElement;

  function updatePlayPauseButton(isPaused: boolean): void {
    playPauseBtn.textContent = isPaused ? 'Play' : 'Pause';
    stepBtn.disabled = !isPaused;
  }

  function updateSpeedDisplay(speed: number): void {
    speedValue.textContent = `${speed.toFixed(1)}x`;
    speedSlider.value = String(speed);
  }

  // Event handlers
  playPauseBtn.addEventListener('click', () => {
    if (simulation.isPaused) {
      simulation.start();
    } else {
      simulation.pause();
    }
    updatePlayPauseButton(simulation.isPaused);
    emitter.emit('playPause', { isPlaying: !simulation.isPaused });
  });

  stepBtn.addEventListener('click', () => {
    if (simulation.isPaused) {
      simulation.step();
      emitter.emit('step', undefined as unknown as void);
    }
  });

  speedSlider.addEventListener('input', () => {
    const speed = parseFloat(speedSlider.value);
    simulation.setSpeed(speed);
    updateSpeedDisplay(speed);
    emitter.emit('speedChange', { speed });
  });

  resetBtn.addEventListener('click', () => {
    const confirmed = window.confirm('Reset simulation? Choose OK for same seed, or Cancel to abort.');
    if (confirmed) {
      simulation.reset();
      updatePlayPauseButton(true);
      emitter.emit('reset', undefined as unknown as void);
    }
  });

  exportBtn.addEventListener('click', () => {
    downloadConfigFile(simulation.config, 'evolution-sandbox-config.json');
  });

  importBtn.addEventListener('click', async () => {
    const result = await promptConfigUpload();
    if (result && result.success && result.config) {
      // Show warnings if any
      if (result.warnings.length > 0) {
        const warningMsg = 'Config imported with warnings:\n\n' + result.warnings.join('\n');
        window.alert(warningMsg);
      }
      emitter.emit('configImported', { config: result.config, warnings: result.warnings });
    } else if (result && !result.success) {
      window.alert('Failed to import config:\n\n' + result.errors.join('\n'));
    }
  });

  // Initial state
  updatePlayPauseButton(simulation.isPaused);
  updateSpeedDisplay(simulation.speed);

  return {
    syncState(sim: Simulation): void {
      updatePlayPauseButton(sim.isPaused);
      updateSpeedDisplay(sim.speed);
    },

    setSpeed(speed: number): void {
      simulation.setSpeed(speed);
      updateSpeedDisplay(speed);
    },

    on<K extends keyof ControlPanelEvents>(
      event: K,
      callback: (data: ControlPanelEvents[K]) => void
    ): void {
      emitter.on(event, callback as (data: ControlPanelEvents[keyof ControlPanelEvents]) => void);
    },

    off<K extends keyof ControlPanelEvents>(
      event: K,
      callback: (data: ControlPanelEvents[K]) => void
    ): void {
      emitter.off(event, callback as (data: ControlPanelEvents[keyof ControlPanelEvents]) => void);
    },

    destroy(): void {
      container.innerHTML = '';
    },
  };
}
