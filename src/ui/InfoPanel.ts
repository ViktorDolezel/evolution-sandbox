export interface InfoPanelData {
  seed: number;
  tick: number;
  deerCount: number;
  wolfCount: number;
  vegetationCount: number;
  corpseCount: number;
  fps: number;
}

export interface InfoPanel {
  update(data: Partial<InfoPanelData>): void;
  show(): void;
  hide(): void;
  isVisible(): boolean;
  resetUptime(): void;
  destroy(): void;
}

export function createInfoPanel(container: HTMLElement): InfoPanel {
  let visible = true;
  let startTime = Date.now();
  let currentData: InfoPanelData = {
    seed: 0,
    tick: 0,
    deerCount: 0,
    wolfCount: 0,
    vegetationCount: 0,
    corpseCount: 0,
    fps: 0,
  };

  function formatUptime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Create DOM structure
  container.innerHTML = `
    <div class="info-row"><span>Seed:</span><span id="info-seed">0</span></div>
    <div class="info-row"><span>Tick:</span><span id="info-tick">0</span></div>
    <div class="info-row"><span>Uptime:</span><span id="info-uptime">00:00</span></div>
    <div class="info-row"><span>Deer:</span><span id="info-deer" class="text-green">0</span></div>
    <div class="info-row"><span>Wolves:</span><span id="info-wolves" class="text-red">0</span></div>
    <div class="info-row"><span>Vegetation:</span><span id="info-veg">0</span></div>
    <div class="info-row"><span>Corpses:</span><span id="info-corpses">0</span></div>
    <div class="info-row"><span>FPS:</span><span id="info-fps">0</span></div>
  `;

  const seedEl = container.querySelector('#info-seed') as HTMLSpanElement;
  const tickEl = container.querySelector('#info-tick') as HTMLSpanElement;
  const uptimeEl = container.querySelector('#info-uptime') as HTMLSpanElement;
  const deerEl = container.querySelector('#info-deer') as HTMLSpanElement;
  const wolvesEl = container.querySelector('#info-wolves') as HTMLSpanElement;
  const vegEl = container.querySelector('#info-veg') as HTMLSpanElement;
  const corpsesEl = container.querySelector('#info-corpses') as HTMLSpanElement;
  const fpsEl = container.querySelector('#info-fps') as HTMLSpanElement;

  // Make seed clickable to copy
  seedEl.style.cursor = 'pointer';
  seedEl.title = 'Click to copy seed';
  seedEl.addEventListener('click', () => {
    navigator.clipboard.writeText(String(currentData.seed));
    seedEl.textContent = 'Copied!';
    setTimeout(() => {
      seedEl.textContent = String(currentData.seed);
    }, 1000);
  });

  function updateDisplay(): void {
    seedEl.textContent = String(currentData.seed);
    tickEl.textContent = String(currentData.tick);
    uptimeEl.textContent = formatUptime(Date.now() - startTime);
    deerEl.textContent = String(currentData.deerCount);
    wolvesEl.textContent = String(currentData.wolfCount);
    vegEl.textContent = String(currentData.vegetationCount);
    corpsesEl.textContent = String(currentData.corpseCount);
    fpsEl.textContent = String(currentData.fps);
  }

  return {
    update(data: Partial<InfoPanelData>): void {
      currentData = { ...currentData, ...data };
      updateDisplay();
    },

    show(): void {
      visible = true;
      container.style.display = 'block';
    },

    hide(): void {
      visible = false;
      container.style.display = 'none';
    },

    isVisible(): boolean {
      return visible;
    },

    resetUptime(): void {
      startTime = Date.now();
    },

    destroy(): void {
      container.innerHTML = '';
    },
  };
}
