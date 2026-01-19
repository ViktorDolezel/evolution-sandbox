export interface RandomGenerator {
  next(): number;
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
  nextBoolean(probability?: number): boolean;
  nextNormal(mean?: number, stdDev?: number): number;
  getSeed(): number;
  clone(): RandomGenerator;
}

// Mulberry32 PRNG - fast and deterministic with accessible state
class Mulberry32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  getState(): number {
    return this.state;
  }

  clone(): Mulberry32 {
    const cloned = new Mulberry32(0);
    cloned.state = this.state;
    return cloned;
  }
}

export function createSeededRandom(seed: number): RandomGenerator {
  const rng = new Mulberry32(seed);
  let spareNormal: number | null = null;

  const generator: RandomGenerator = {
    next(): number {
      return rng.next();
    },

    nextInt(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },

    nextFloat(min: number, max: number): number {
      return this.next() * (max - min) + min;
    },

    nextBoolean(probability: number = 0.5): boolean {
      return this.next() < probability;
    },

    nextNormal(mean: number = 0, stdDev: number = 1): number {
      // Box-Muller transform
      if (spareNormal !== null) {
        const result = spareNormal * stdDev + mean;
        spareNormal = null;
        return result;
      }

      let u, v, s;
      do {
        u = this.next() * 2 - 1;
        v = this.next() * 2 - 1;
        s = u * u + v * v;
      } while (s >= 1 || s === 0);

      const mul = Math.sqrt((-2 * Math.log(s)) / s);
      spareNormal = v * mul;
      return u * mul * stdDev + mean;
    },

    getSeed(): number {
      return seed;
    },

    clone(): RandomGenerator {
      const clonedRng = rng.clone();
      const clonedSpare = spareNormal;

      const clonedGenerator: RandomGenerator = {
        next(): number {
          return clonedRng.next();
        },
        nextInt(min: number, max: number): number {
          return Math.floor(this.next() * (max - min + 1)) + min;
        },
        nextFloat(min: number, max: number): number {
          return this.next() * (max - min) + min;
        },
        nextBoolean(probability: number = 0.5): boolean {
          return this.next() < probability;
        },
        nextNormal(mean: number = 0, stdDev: number = 1): number {
          let spare = clonedSpare;
          if (spare !== null) {
            const result = spare * stdDev + mean;
            spare = null;
            return result;
          }
          let u, v, s;
          do {
            u = this.next() * 2 - 1;
            v = this.next() * 2 - 1;
            s = u * u + v * v;
          } while (s >= 1 || s === 0);
          const mul = Math.sqrt((-2 * Math.log(s)) / s);
          spare = v * mul;
          return u * mul * stdDev + mean;
        },
        getSeed(): number {
          return seed;
        },
        clone(): RandomGenerator {
          return clonedGenerator.clone();
        },
      };

      // Allow the clone to also clone properly
      clonedGenerator.clone = () => {
        const innerClonedRng = clonedRng.clone();
        return createClonedGenerator(innerClonedRng, seed, clonedSpare);
      };

      return clonedGenerator;
    },
  };

  return generator;
}

function createClonedGenerator(rng: Mulberry32, seed: number, spare: number | null): RandomGenerator {
  let spareNormal = spare;

  const gen: RandomGenerator = {
    next(): number {
      return rng.next();
    },
    nextInt(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    nextFloat(min: number, max: number): number {
      return this.next() * (max - min) + min;
    },
    nextBoolean(probability: number = 0.5): boolean {
      return this.next() < probability;
    },
    nextNormal(mean: number = 0, stdDev: number = 1): number {
      if (spareNormal !== null) {
        const result = spareNormal * stdDev + mean;
        spareNormal = null;
        return result;
      }
      let u, v, s;
      do {
        u = this.next() * 2 - 1;
        v = this.next() * 2 - 1;
        s = u * u + v * v;
      } while (s >= 1 || s === 0);
      const mul = Math.sqrt((-2 * Math.log(s)) / s);
      spareNormal = v * mul;
      return u * mul * stdDev + mean;
    },
    getSeed(): number {
      return seed;
    },
    clone(): RandomGenerator {
      return createClonedGenerator(rng.clone(), seed, spareNormal);
    },
  };

  return gen;
}

export function generateRandomSeed(): number {
  return Math.floor(Math.random() * 2147483647) + 1;
}
