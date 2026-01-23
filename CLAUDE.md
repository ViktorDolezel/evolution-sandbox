# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # TypeScript compile + Vite build (outputs to dist/)
npm run test         # Run tests in watch mode
npm run test:run     # Run all tests once
npm run test:coverage # Run tests with v8 coverage
```

**Running specific tests:**
```bash
npx vitest run tests/unit/genetics/inheritance.test.ts   # Single file
npx vitest run -t "should flee"                          # By test name pattern
npx vitest run tests/unit/behavior/                      # Directory
```

## Architecture Overview

### Simulation Loop

The simulation uses a **two-phase tick system** (`src/core/TickLoop.ts`):

1. **Decision Phase**: All animals evaluate their state and decide an action simultaneously. Animals are processed by perception (alert range) - more perceptive animals decide first.

2. **Execution Phase**: Actions execute in order. Priority: `DIE > FLEE > EAT > MOVE_TO_FOOD > ATTACK > REPRODUCE > DRIFT > STAY`

The `Simulation` class (`src/core/Simulation.ts`) orchestrates the loop and emits events (`tick`, `animalBorn`, `animalDied`, `corpseCreated`, `corpseRemoved`) that the UI subscribes to.

### Unified Behavior System

All animals use the same `DecisionEngine` (`src/behavior/DecisionEngine.ts`). Species differences emerge entirely from:
- **Diet flags**: `canEatVegetation`, `canEatAnimals`, `canEatCorpses`
- **Base attributes**: strength, agility, endurance, perception, size
- **Behavioral attributes**: aggression, flightInstinct, foodPriorityThreshold, reproductiveUrge, carrionPreference

There is no species-specific behavior code. A "wolf" is simply an animal with `canEatAnimals: true` and higher aggression.

### Genetics & Evolution

- **Inheritance** (`src/genetics/inheritance.ts`): Offspring copy parent attributes (asexual reproduction in V1)
- **Mutation** (`src/genetics/mutation.ts`): Normal distribution mutations applied post-inheritance
- **Derived stats** (`src/genetics/derived.ts`): speed, alertRange, attackPower, defense calculated from base attributes

### Determinism

Seeded RNG (`src/core/SeededRandom.ts`) ensures identical simulations given the same seed and config. This is tested in `tests/integration/determinism.test.ts`.

### Key Domain Modules

| Directory | Purpose |
|-----------|---------|
| `src/core/` | Simulation controller, tick loop, world state, seeded RNG |
| `src/entities/` | Animal/Corpse types and EntityManager (CRUD operations) |
| `src/behavior/` | DecisionEngine, ThreatCalculator, FoodFinder, MateFinder |
| `src/genetics/` | Attribute bounds, mutation, inheritance, derived stat formulas |
| `src/spatial/` | VegetationGrid (grid-based plants), SpatialIndex (bucketed proximity queries) |
| `src/rendering/` | Canvas Renderer, Camera (viewport pan/zoom) |
| `src/ui/` | UIManager coordinates ControlPanel, Sidebar, PopulationGraph, InputHandler |
| `src/config/` | SimulationConfig types, defaults, presets (balanced/fast/harsh/peaceful), validation |

### Data Flow

```
User Input → InputHandler → Simulation.start/pause/reset
                         → Camera.pan/zoom
                         → SelectionManager

Simulation tick → emits events → UIManager updates:
                              → PopulationGraph
                              → Sidebar (selected animal)
                              → InfoPanel (tick count, entity counts)

Renderer (requestAnimationFrame) → reads World state → draws to Canvas
```

### Entity Types

From `src/entities/types.ts`:
- **Animal**: id, species, diet, baseAttributes, behavioralAttributes, lifecycleAttributes, derivedStats, state (position, hunger, age, isDead)
- **Corpse**: id, sourceSpecies, position, foodValue, decayTimer

### Testing Structure

- `tests/unit/` - Module-level tests organized by source directory
- `tests/integration/` - Full simulation runs, determinism verification
- Tests use Vitest globals (`describe`, `it`, `expect`) - no imports needed
