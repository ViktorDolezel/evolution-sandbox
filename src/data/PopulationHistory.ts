export interface PopulationDataPoint {
  tick: number;
  deerCount: number;
  wolfCount: number;
  vegetationCount: number;
  timestamp: number;
}

export interface PopulationHistory {
  record(tick: number, deerCount: number, wolfCount: number, vegetationCount: number): void;
  getData(): PopulationDataPoint[];
  getDataSince(tick: number): PopulationDataPoint[];
  getLatest(): PopulationDataPoint | null;
  clear(): void;
  setMaxHistory(maxPoints: number): void;
  getLength(): number;
}

export function createPopulationHistory(maxPoints: number = 1000): PopulationHistory {
  let data: PopulationDataPoint[] = [];
  let maxSize = maxPoints;

  return {
    record(tick: number, deerCount: number, wolfCount: number, vegetationCount: number): void {
      const point: PopulationDataPoint = {
        tick,
        deerCount,
        wolfCount,
        vegetationCount,
        timestamp: Date.now(),
      };

      data.push(point);

      // Trim if exceeds max size (circular buffer behavior)
      if (data.length > maxSize) {
        data = data.slice(data.length - maxSize);
      }
    },

    getData(): PopulationDataPoint[] {
      return [...data];
    },

    getDataSince(tick: number): PopulationDataPoint[] {
      return data.filter(d => d.tick >= tick);
    },

    getLatest(): PopulationDataPoint | null {
      return data.length > 0 ? data[data.length - 1] : null;
    },

    clear(): void {
      data = [];
    },

    setMaxHistory(maxPoints: number): void {
      maxSize = maxPoints;
      if (data.length > maxSize) {
        data = data.slice(data.length - maxSize);
      }
    },

    getLength(): number {
      return data.length;
    },
  };
}
