import type { SimulationConfig, ConfigPreset } from '../config/types';
import { createEventEmitter } from '../utils/events';
import { getDefaultConfig } from '../config/defaults';
import { CONFIG_METADATA, type ConfigPropertyMetadata } from '../config/metadata';
import { CONFIG_RANGES, clampConfigValue } from '../config/validation';
import { getPresetConfig } from '../config/presets';

export interface PendingChange {
  category: string;
  key: string;
  oldValue: number;
  newValue: number;
}

export interface ConfigPanelEvents {
  configChanged: {
    category: string;
    key: string;
    value: number;
    isLive: boolean;
  };
  presetApplied: { preset: ConfigPreset };
  resetToDefaults: void;
  resetRequired: { pendingChanges: PendingChange[] };
  requestReset: void;
}

export interface ConfigPanel {
  show(): void;
  hide(): void;
  toggle(): void;
  isVisible(): boolean;
  syncConfig(config: SimulationConfig): void;
  getPendingResetChanges(): PendingChange[];
  clearPendingChanges(): void;
  on<K extends keyof ConfigPanelEvents>(
    event: K,
    callback: (data: ConfigPanelEvents[K]) => void
  ): void;
  off<K extends keyof ConfigPanelEvents>(
    event: K,
    callback: (data: ConfigPanelEvents[K]) => void
  ): void;
  destroy(): void;
}

export function createConfigPanel(
  getConfig: () => SimulationConfig,
  onConfigChange: (category: string, key: string, value: number) => void,
  onReset: () => void
): ConfigPanel {
  const emitter = createEventEmitter<ConfigPanelEvents>();
  const defaults = getDefaultConfig();

  let visible = false;
  let overlay: HTMLDivElement | null = null;
  let pendingResetChanges: PendingChange[] = [];
  let currentConfig: SimulationConfig = JSON.parse(JSON.stringify(getConfig()));
  const expandedCategories = new Set<string>(['world', 'evolution']);

  function formatValue(value: number, meta: ConfigPropertyMetadata): string {
    return value.toFixed(meta.precision);
  }

  function renderProperties(categoryKey: string): string {
    const categoryMeta = CONFIG_METADATA[categoryKey];
    const categoryConfig = currentConfig[categoryKey as keyof SimulationConfig] as unknown as Record<string, number>;
    const categoryDefaults = defaults[categoryKey as keyof SimulationConfig] as unknown as Record<string, number>;
    const ranges = CONFIG_RANGES[categoryKey];

    return Object.entries(categoryMeta.properties)
      .map(([propKey, propMeta]) => {
        const value = categoryConfig[propKey];
        const defaultValue = categoryDefaults[propKey];
        const range = ranges[propKey];
        const isModified = value !== defaultValue;
        const isPendingReset = pendingResetChanges.some(
          (c) => c.category === categoryKey && c.key === propKey
        );

        return `
        <div class="config-property ${isModified ? 'modified' : ''} ${isPendingReset ? 'pending-reset' : ''}">
          <div class="property-header">
            <label title="${propMeta.description}">
              ${propMeta.label}
              ${!propMeta.isLiveChangeable ? '<span class="reset-required-icon" title="Requires simulation reset">⟲</span>' : ''}
            </label>
            <div class="property-value-display">
              <span class="current-value">${formatValue(value, propMeta)}</span>
              ${propMeta.unit ? `<span class="unit">${propMeta.unit}</span>` : ''}
              ${isModified ? `<span class="default-value">(default: ${formatValue(defaultValue, propMeta)})</span>` : ''}
            </div>
          </div>
          <div class="property-controls">
            <input type="range"
              class="config-slider"
              data-category="${categoryKey}"
              data-key="${propKey}"
              min="${range.min}"
              max="${range.max}"
              step="${propMeta.step}"
              value="${value}"
            />
            <input type="number"
              class="config-input"
              data-category="${categoryKey}"
              data-key="${propKey}"
              min="${range.min}"
              max="${range.max}"
              step="${propMeta.step}"
              value="${value}"
            />
            ${isModified ? `
              <button class="reset-property-btn"
                data-category="${categoryKey}"
                data-key="${propKey}"
                title="Reset to default (${formatValue(defaultValue, propMeta)})">
                ↺
              </button>
            ` : '<span class="reset-property-placeholder"></span>'}
          </div>
        </div>
      `;
      })
      .join('');
  }

  function renderCategories(): string {
    return Object.entries(CONFIG_METADATA)
      .map(([categoryKey, categoryMeta]) => {
        const isExpanded = expandedCategories.has(categoryKey);
        const hasPendingChanges = pendingResetChanges.some((c) => c.category === categoryKey);

        return `
        <div class="config-category ${isExpanded ? 'expanded' : ''} ${hasPendingChanges ? 'has-pending' : ''}">
          <div class="config-category-header" data-category="${categoryKey}">
            <span class="expand-icon">${isExpanded ? '▼' : '▶'}</span>
            <h3>${categoryMeta.label}</h3>
            ${hasPendingChanges ? '<span class="pending-badge">!</span>' : ''}
          </div>
          <div class="config-category-content" ${isExpanded ? '' : 'style="display: none;"'}>
            <p class="category-description">${categoryMeta.description}</p>
            ${renderProperties(categoryKey)}
          </div>
        </div>
      `;
      })
      .join('');
  }

  function renderFooter(): string {
    if (pendingResetChanges.length === 0) {
      return '<span class="footer-hint">Changes to live properties apply immediately</span>';
    }

    return `
      <div class="pending-changes-warning">
        <span class="warning-icon">⚠</span>
        <span>${pendingResetChanges.length} change(s) require simulation reset</span>
      </div>
      <button id="apply-reset-btn" class="apply-reset-btn">
        Apply Changes & Reset Simulation
      </button>
    `;
  }

  function handlePropertyChange(category: string, key: string, value: number): void {
    const meta = CONFIG_METADATA[category].properties[key];
    const range = CONFIG_RANGES[category][key];
    const clampedValue = clampConfigValue(value, range.min, range.max);

    // Update local state
    (currentConfig[category as keyof SimulationConfig] as unknown as Record<string, number>)[key] = clampedValue;

    if (meta.isLiveChangeable) {
      onConfigChange(category, key, clampedValue);
      emitter.emit('configChanged', {
        category,
        key,
        value: clampedValue,
        isLive: true,
      });
    } else {
      // Track as pending reset change
      const originalConfig = getConfig();
      const originalValue = (originalConfig[category as keyof SimulationConfig] as unknown as Record<string, number>)[key];

      const existingIdx = pendingResetChanges.findIndex(
        (c) => c.category === category && c.key === key
      );

      if (clampedValue === originalValue) {
        // Value restored to original, remove from pending
        if (existingIdx >= 0) {
          pendingResetChanges.splice(existingIdx, 1);
        }
      } else {
        const change: PendingChange = {
          category,
          key,
          oldValue: originalValue,
          newValue: clampedValue,
        };

        if (existingIdx >= 0) {
          pendingResetChanges[existingIdx] = change;
        } else {
          pendingResetChanges.push(change);
        }
      }

      emitter.emit('resetRequired', { pendingChanges: [...pendingResetChanges] });
    }

    // Re-render to update UI state
    if (overlay) {
      updatePropertyDisplay(category, key, clampedValue);
      updateFooter();
    }
  }

  function updatePropertyDisplay(category: string, key: string, value: number): void {
    if (!overlay) return;

    const meta = CONFIG_METADATA[category].properties[key];
    const defaultValue = (defaults[category as keyof SimulationConfig] as unknown as Record<string, number>)[key];
    const isModified = value !== defaultValue;
    const isPendingReset = pendingResetChanges.some(
      (c) => c.category === category && c.key === key
    );

    const property = overlay.querySelector(
      `.config-property:has([data-category="${category}"][data-key="${key}"])`
    ) as HTMLElement;

    if (property) {
      property.classList.toggle('modified', isModified);
      property.classList.toggle('pending-reset', isPendingReset);

      const valueDisplay = property.querySelector('.current-value');
      if (valueDisplay) {
        valueDisplay.textContent = formatValue(value, meta);
      }

      const defaultDisplay = property.querySelector('.default-value');
      if (isModified && !defaultDisplay) {
        const valueContainer = property.querySelector('.property-value-display');
        if (valueContainer) {
          const span = document.createElement('span');
          span.className = 'default-value';
          span.textContent = `(default: ${formatValue(defaultValue, meta)})`;
          valueContainer.appendChild(span);
        }
      } else if (!isModified && defaultDisplay) {
        defaultDisplay.remove();
      }

      // Update reset button visibility
      const controls = property.querySelector('.property-controls');
      const resetBtn = controls?.querySelector('.reset-property-btn');
      const placeholder = controls?.querySelector('.reset-property-placeholder');

      if (isModified && !resetBtn && controls) {
        if (placeholder) placeholder.remove();
        const btn = document.createElement('button');
        btn.className = 'reset-property-btn';
        btn.dataset.category = category;
        btn.dataset.key = key;
        btn.title = `Reset to default (${formatValue(defaultValue, meta)})`;
        btn.textContent = '↺';
        btn.addEventListener('click', () => {
          handlePropertyChange(category, key, defaultValue);
          syncInputs(category, key, defaultValue);
        });
        controls.appendChild(btn);
      } else if (!isModified && resetBtn) {
        resetBtn.remove();
        const span = document.createElement('span');
        span.className = 'reset-property-placeholder';
        controls?.appendChild(span);
      }
    }

    // Update category pending badge
    const categoryEl = overlay.querySelector(`.config-category-header[data-category="${category}"]`);
    if (categoryEl) {
      const hasPending = pendingResetChanges.some((c) => c.category === category);
      const badge = categoryEl.querySelector('.pending-badge');
      if (hasPending && !badge) {
        const span = document.createElement('span');
        span.className = 'pending-badge';
        span.textContent = '!';
        categoryEl.appendChild(span);
      } else if (!hasPending && badge) {
        badge.remove();
      }
    }
  }

  function syncInputs(category: string, key: string, value: number): void {
    if (!overlay) return;

    const slider = overlay.querySelector(
      `.config-slider[data-category="${category}"][data-key="${key}"]`
    ) as HTMLInputElement;
    const input = overlay.querySelector(
      `.config-input[data-category="${category}"][data-key="${key}"]`
    ) as HTMLInputElement;

    if (slider) slider.value = String(value);
    if (input) input.value = String(value);
  }

  function updateFooter(): void {
    if (!overlay) return;

    const footer = overlay.querySelector('.config-panel-footer');
    if (footer) {
      footer.className = `config-panel-footer ${pendingResetChanges.length > 0 ? 'has-pending' : ''}`;
      footer.innerHTML = renderFooter();

      // Re-attach apply-reset handler
      const applyResetBtn = footer.querySelector('#apply-reset-btn');
      if (applyResetBtn) {
        applyResetBtn.addEventListener('click', applyPendingChangesAndReset);
      }
    }
  }

  function applyPendingChangesAndReset(): void {
    // Apply all pending changes
    for (const change of pendingResetChanges) {
      onConfigChange(change.category, change.key, change.newValue);
    }

    pendingResetChanges = [];
    onReset();
    emitter.emit('requestReset', undefined as unknown as void);

    // Sync local config
    currentConfig = JSON.parse(JSON.stringify(getConfig()));

    // Re-render
    if (overlay) {
      const content = overlay.querySelector('.config-panel-content');
      if (content) {
        content.innerHTML = renderCategories();
        attachPropertyHandlers();
      }
      updateFooter();
    }
  }

  function applyPreset(preset: ConfigPreset): void {
    const presetConfig = getPresetConfig(preset);
    const fullConfig = { ...getDefaultConfig() };

    // Merge preset into defaults
    for (const [category, values] of Object.entries(presetConfig)) {
      if (values && typeof values === 'object') {
        for (const [key, value] of Object.entries(values)) {
          (fullConfig[category as keyof SimulationConfig] as unknown as Record<string, unknown>)[key] = value;
        }
      }
    }

    // Apply each property
    for (const [category, categoryMeta] of Object.entries(CONFIG_METADATA)) {
      for (const key of Object.keys(categoryMeta.properties)) {
        const value = (fullConfig[category as keyof SimulationConfig] as unknown as Record<string, number>)[key];
        handlePropertyChange(category, key, value);
        syncInputs(category, key, value);
      }
    }

    emitter.emit('presetApplied', { preset });
  }

  function resetToDefaults(): void {
    for (const [category, categoryMeta] of Object.entries(CONFIG_METADATA)) {
      for (const key of Object.keys(categoryMeta.properties)) {
        const defaultValue = (defaults[category as keyof SimulationConfig] as unknown as Record<string, number>)[key];
        handlePropertyChange(category, key, defaultValue);
        syncInputs(category, key, defaultValue);
      }
    }

    emitter.emit('resetToDefaults', undefined as unknown as void);
  }

  function attachPropertyHandlers(): void {
    if (!overlay) return;

    // Slider handlers
    overlay.querySelectorAll('.config-slider').forEach((slider) => {
      slider.addEventListener('input', (e) => {
        const el = e.target as HTMLInputElement;
        const category = el.dataset.category!;
        const key = el.dataset.key!;
        const value = parseFloat(el.value);

        // Sync number input
        const input = overlay!.querySelector(
          `.config-input[data-category="${category}"][data-key="${key}"]`
        ) as HTMLInputElement;
        if (input) input.value = el.value;

        handlePropertyChange(category, key, value);
      });
    });

    // Number input handlers
    overlay.querySelectorAll('.config-input').forEach((input) => {
      input.addEventListener('change', (e) => {
        const el = e.target as HTMLInputElement;
        const category = el.dataset.category!;
        const key = el.dataset.key!;
        const value = parseFloat(el.value);

        // Sync slider
        const slider = overlay!.querySelector(
          `.config-slider[data-category="${category}"][data-key="${key}"]`
        ) as HTMLInputElement;
        if (slider) slider.value = el.value;

        handlePropertyChange(category, key, value);
      });
    });

    // Reset property buttons
    overlay.querySelectorAll('.reset-property-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const el = e.target as HTMLButtonElement;
        const category = el.dataset.category!;
        const key = el.dataset.key!;
        const defaultValue = (defaults[category as keyof SimulationConfig] as unknown as Record<string, number>)[key];

        handlePropertyChange(category, key, defaultValue);
        syncInputs(category, key, defaultValue);
      });
    });

    // Category headers (expand/collapse)
    overlay.querySelectorAll('.config-category-header').forEach((header) => {
      header.addEventListener('click', (e) => {
        const el = e.currentTarget as HTMLElement;
        const category = el.dataset.category!;
        const categoryEl = el.closest('.config-category') as HTMLElement;
        const content = categoryEl.querySelector('.config-category-content') as HTMLElement;
        const icon = el.querySelector('.expand-icon') as HTMLElement;

        if (expandedCategories.has(category)) {
          expandedCategories.delete(category);
          categoryEl.classList.remove('expanded');
          content.style.display = 'none';
          icon.textContent = '▶';
        } else {
          expandedCategories.add(category);
          categoryEl.classList.add('expanded');
          content.style.display = '';
          icon.textContent = '▼';
        }
      });
    });
  }

  function render(): HTMLDivElement {
    const div = document.createElement('div');
    div.className = 'config-panel-overlay';
    div.innerHTML = `
      <div class="config-panel">
        <div class="config-panel-header">
          <h2>Configuration</h2>
          <div class="config-panel-actions">
            <select id="preset-selector" class="preset-selector">
              <option value="">-- Select Preset --</option>
              <option value="balanced">Balanced</option>
              <option value="fastEvolution">Fast Evolution</option>
              <option value="harshWorld">Harsh World</option>
              <option value="peaceful">Peaceful</option>
            </select>
            <button id="reset-defaults-btn" class="config-btn" title="Reset all to defaults">
              Reset All
            </button>
          </div>
          <button class="config-close-btn">&times;</button>
        </div>
        <div class="config-panel-content">
          ${renderCategories()}
        </div>
        <div class="config-panel-footer ${pendingResetChanges.length > 0 ? 'has-pending' : ''}">
          ${renderFooter()}
        </div>
      </div>
    `;

    // Close button handler
    const closeBtn = div.querySelector('.config-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => hide());
    }

    // Click outside to close
    div.addEventListener('click', (e) => {
      if (e.target === div) {
        hide();
      }
    });

    // Preset selector
    const presetSelector = div.querySelector('#preset-selector') as HTMLSelectElement;
    if (presetSelector) {
      presetSelector.addEventListener('change', () => {
        const preset = presetSelector.value as ConfigPreset;
        if (preset) {
          applyPreset(preset);
          presetSelector.value = '';
        }
      });
    }

    // Reset defaults button
    const resetDefaultsBtn = div.querySelector('#reset-defaults-btn');
    if (resetDefaultsBtn) {
      resetDefaultsBtn.addEventListener('click', () => {
        resetToDefaults();
      });
    }

    // Apply reset button
    const applyResetBtn = div.querySelector('#apply-reset-btn');
    if (applyResetBtn) {
      applyResetBtn.addEventListener('click', applyPendingChangesAndReset);
    }

    attachPropertyHandlers();

    return div;
  }

  function show(): void {
    if (visible) return;
    visible = true;
    currentConfig = JSON.parse(JSON.stringify(getConfig()));
    overlay = render();
    document.body.appendChild(overlay);
  }

  function hide(): void {
    if (!visible || !overlay) return;
    visible = false;
    document.body.removeChild(overlay);
    overlay = null;
  }

  return {
    show,
    hide,
    toggle(): void {
      if (visible) {
        hide();
      } else {
        show();
      }
    },
    isVisible(): boolean {
      return visible;
    },
    syncConfig(config: SimulationConfig): void {
      currentConfig = JSON.parse(JSON.stringify(config));
      if (overlay) {
        const content = overlay.querySelector('.config-panel-content');
        if (content) {
          content.innerHTML = renderCategories();
          attachPropertyHandlers();
        }
      }
    },
    getPendingResetChanges(): PendingChange[] {
      return [...pendingResetChanges];
    },
    clearPendingChanges(): void {
      pendingResetChanges = [];
      updateFooter();
    },
    on<K extends keyof ConfigPanelEvents>(
      event: K,
      callback: (data: ConfigPanelEvents[K]) => void
    ): void {
      emitter.on(event, callback as (data: ConfigPanelEvents[keyof ConfigPanelEvents]) => void);
    },
    off<K extends keyof ConfigPanelEvents>(
      event: K,
      callback: (data: ConfigPanelEvents[K]) => void
    ): void {
      emitter.off(event, callback as (data: ConfigPanelEvents[keyof ConfigPanelEvents]) => void);
    },
    destroy(): void {
      hide();
    },
  };
}
