import type { PopulationHistory, PopulationDataPoint } from '../data/PopulationHistory';
import { GRAPH_COLORS } from '../rendering/sprites';

export interface GraphOptions {
  showDeer: boolean;
  showWolves: boolean;
  showVegetation: boolean;
  timeWindow: number;
  smoothing: boolean;
}

export interface PopulationGraph {
  render(): void;
  setOptions(options: Partial<GraphOptions>): void;
  setHistory(history: PopulationHistory): void;
  show(): void;
  hide(): void;
  isVisible(): boolean;
  resize(): void;
  destroy(): void;
}

export function createPopulationGraph(
  container: HTMLElement,
  history: PopulationHistory
): PopulationGraph {
  let visible = false;
  let populationHistory = history;

  let options: GraphOptions = {
    showDeer: true,
    showWolves: true,
    showVegetation: false,
    timeWindow: 500,
    smoothing: false,
  };

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;

  const padding = { top: 25, right: 70, bottom: 30, left: 50 };

  function resize(): void {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }

  function drawGrid(
    graphWidth: number,
    graphHeight: number,
    maxPop: number,
    startTick: number,
    endTick: number
  ): void {
    ctx.strokeStyle = GRAPH_COLORS.grid;
    ctx.lineWidth = 1;

    // Horizontal grid lines (population)
    const numHLines = 4;
    for (let i = 0; i <= numHLines; i++) {
      const y = padding.top + (graphHeight / numHLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + graphWidth, y);
      ctx.stroke();

      // Y-axis label
      const popValue = maxPop - (maxPop / numHLines) * i;
      ctx.fillStyle = GRAPH_COLORS.text;
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(popValue)), padding.left - 5, y + 3);
    }

    // Vertical grid lines (time)
    const tickRange = endTick - startTick;
    const numVLines = 5;
    for (let i = 0; i <= numVLines; i++) {
      const x = padding.left + (graphWidth / numVLines) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + graphHeight);
      ctx.stroke();

      // X-axis label
      const tickValue = startTick + (tickRange / numVLines) * i;
      ctx.fillStyle = GRAPH_COLORS.text;
      ctx.textAlign = 'center';
      ctx.fillText(String(Math.round(tickValue)), x, padding.top + graphHeight + 15);
    }
  }

  function drawLine(
    data: PopulationDataPoint[],
    getValue: (d: PopulationDataPoint) => number,
    xScale: (tick: number) => number,
    yScale: (pop: number) => number,
    color: string
  ): void {
    if (data.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    let started = false;
    for (const point of data) {
      const x = xScale(point.tick);
      const y = yScale(getValue(point));

      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  function drawLegend(graphWidth: number): void {
    const legendX = padding.left + graphWidth + 10;
    let legendY = padding.top + 10;
    const spacing = 18;

    ctx.font = '11px monospace';

    if (options.showDeer) {
      ctx.fillStyle = GRAPH_COLORS.deer;
      ctx.fillRect(legendX, legendY - 8, 12, 12);
      ctx.fillStyle = GRAPH_COLORS.text;
      ctx.textAlign = 'left';
      ctx.fillText('Deer', legendX + 18, legendY);
      legendY += spacing;
    }

    if (options.showWolves) {
      ctx.fillStyle = GRAPH_COLORS.wolf;
      ctx.fillRect(legendX, legendY - 8, 12, 12);
      ctx.fillStyle = GRAPH_COLORS.text;
      ctx.fillText('Wolves', legendX + 18, legendY);
      legendY += spacing;
    }

    if (options.showVegetation) {
      ctx.fillStyle = GRAPH_COLORS.vegetation;
      ctx.fillRect(legendX, legendY - 8, 12, 12);
      ctx.fillStyle = GRAPH_COLORS.text;
      ctx.fillText('Veg', legendX + 18, legendY);
    }
  }

  function render(): void {
    if (!visible) return;

    const data = populationHistory.getData();
    if (data.length === 0) {
      // Clear and show "No data"
      ctx.fillStyle = GRAPH_COLORS.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = GRAPH_COLORS.text;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', canvas.width / 2, canvas.height / 2);
      return;
    }

    const { width, height } = canvas;
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    // Clear
    ctx.fillStyle = GRAPH_COLORS.background;
    ctx.fillRect(0, 0, width, height);

    // Calculate visible range
    const latestTick = data[data.length - 1].tick;
    const startTick = Math.max(0, latestTick - options.timeWindow);
    const visibleData = data.filter(d => d.tick >= startTick);

    // Calculate max population for Y scale
    let maxPop = 10; // minimum
    for (const d of visibleData) {
      if (options.showDeer && d.deerCount > maxPop) maxPop = d.deerCount;
      if (options.showWolves && d.wolfCount > maxPop) maxPop = d.wolfCount;
    }
    maxPop = Math.ceil(maxPop * 1.1); // 10% headroom

    // Scale functions
    const xScale = (tick: number): number =>
      padding.left + ((tick - startTick) / options.timeWindow) * graphWidth;
    const yScale = (pop: number): number =>
      padding.top + graphHeight - (pop / maxPop) * graphHeight;

    // Draw grid
    drawGrid(graphWidth, graphHeight, maxPop, startTick, latestTick);

    // Draw lines
    if (options.showDeer) {
      drawLine(visibleData, d => d.deerCount, xScale, yScale, GRAPH_COLORS.deer);
    }
    if (options.showWolves) {
      drawLine(visibleData, d => d.wolfCount, xScale, yScale, GRAPH_COLORS.wolf);
    }

    // Draw legend
    drawLegend(graphWidth);

    // Draw title
    ctx.fillStyle = GRAPH_COLORS.text;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Population Over Time', width / 2, 15);
  }

  // Initial resize
  resize();

  return {
    render,

    setOptions(newOptions: Partial<GraphOptions>): void {
      options = { ...options, ...newOptions };
    },

    setHistory(history: PopulationHistory): void {
      populationHistory = history;
    },

    show(): void {
      visible = true;
      container.classList.add('visible');
      resize();
    },

    hide(): void {
      visible = false;
      container.classList.remove('visible');
    },

    isVisible(): boolean {
      return visible;
    },

    resize,

    destroy(): void {
      container.removeChild(canvas);
    },
  };
}
