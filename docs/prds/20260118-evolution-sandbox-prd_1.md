# Evolution Sandbox — Product Requirements Document (V1)

## 1. Overview

### 1.1 Project Summary

**Evolution Sandbox** is a browser-based 2D simulation demonstrating natural selection and evolution through predator-prey dynamics. The simulation features herbivores (deer) and carnivores (wolves) with evolvable physical and behavioral attributes competing for survival in a bounded ecosystem with vegetation and corpses as food sources.

**Target Audience:** Educational tool, demonstration of evolutionary principles, generative entertainment

**Technical Stack:** Browser-native (HTML5 Canvas 2D), TypeScript/JavaScript, no server dependencies (client-side only)

**Development Target:** Specification for Claude Code implementation

### 1.2 Core Mechanics

The simulation operates on a tick-based loop where animals:
1. **Make decisions** based on hunger, threats, reproductive readiness, and evolvable behavioral traits
2. **Execute actions** (flee, eat, attack, reproduce, move, or stay)
3. **Evolve over generations** through inheritance with mutation
4. **Die** from starvation, old age, or predation — creating corpses that scavengers can eat

**Key Innovation:** All animal behavior emerges from a unified decision algorithm. Species differences arise purely from diet flags and baseline attribute values, not hardcoded behavior. A deer with high aggression can attack (but gains nothing), while a wolf with low aggression may starve despite being physically capable of hunting.

### 1.3 Entity Types

| Entity | Description | Grid-Based? |
|--------|-------------|-------------|
| **Vegetation** | Stationary food for herbivores; spreads probabilistically | Yes |
| **Animal** | Mobile entities with evolvable attributes (deer, wolf) | No (continuous 2D) |
| **Corpse** | Dead animals; food for carnivores/scavengers | Yes |

### 1.4 Evolvable Attributes

**Base Attributes** (physical):
- Strength, agility, endurance, perception, size

**Behavioral Attributes** (decision-making):
- Aggression, flight instinct, food priority threshold, reproductive urge, carrion preference

**Lifecycle Attributes** (longevity/reproduction):
- Max age, maturity age, litter size

**Derived Stats** (calculated from base attributes):
- Speed, alert range, attack power, defense, hunger decay rate

All attributes inherit from parents as the mean value plus mutation (normal distribution). Offspring in a litter share identical properties (simplified genetics model).

### 1.5 Evolution Emerges Through Selection Pressure

**Survival Pressure:**
- High hunger decay selects for high endurance
- Predation selects for high agility (flee faster) or high perception (detect threats sooner)
- Starvation selects for food-seeking behavior (lower food priority threshold)

**Reproductive Pressure:**
- Mate selection prioritizes fitness (strength + agility + endurance)
- Only reproduction-ready animals attract mates (mature, well-fed, not in cooldown)
- Litter size affects reproduction cost — larger litters require more hunger buffer

**Behavioral Trade-offs:**
- High aggression enables hunting but risks injury from failed attacks (wasted energy)
- High flight instinct improves survival but reduces feeding opportunities (flee from non-threats)
- Early maturity enables faster reproduction but at cost of lifetime offspring count (die younger)

### 1.6 Deterministic Simulation

Every aspect of the simulation uses seeded random number generation for full reproducibility:
- Same seed + same config = identical outcome
- Users can share seeds to replay interesting scenarios
- Enables scientific experimentation (change one variable, observe effect)

The "Generate Random Seed" button provides a new random seed for variety.

### 1.7 User Interface

**Canvas Visualization:**
- 2D viewport with zoom/pan controls
- Animals, vegetation, and corpses rendered with species-specific sprites
- Visual indicators: hunger bars, maturity badges, reproduction-ready glow

**Selection System:**
- Double-click animal to view detailed sidebar
- Sidebar shows: attributes, derived stats, lineage (clickable parents), action log
- Parent navigation: click living parent ID to pan camera and update selection

**Global Controls:**
- Play/pause, speed slider (0.1× to 10×), reset/new simulation
- Population graph: species counts over time
- Simulation info panel: seed, tick, entity counts (collapsible)

**Keyboard Shortcuts:**
- Space (pause), arrow keys (pan), +/- (zoom), Tab (cycle selection)
- Esc (deselect), I (info panel), G (graph), ? (help)

### 1.8 Configuration

40+ tunable config keys organized into categories:
- World & simulation (size, initial populations, tick rate)
- Vegetation (density, spread rate, food value)
- Movement & energy (speed, hunger decay, move costs)
- Reproduction (cost, cooldown, offspring placement)
- Evolution (mutation rates for different attribute types)
- Combat & death (corpse decay, food multipliers)
- UI (zoom limits, sidebar width, action log size)
- Performance (entity caps, spatial indexing)

**Config Presets:** Balanced (default), Fast Evolution, Harsh World, Peaceful Sandbox

**Export/Import:** Save custom configs as JSON for sharing

### 1.9 Document Structure

This PRD is organized into 10 sections:

| Section | Content |
|---------|---------|
| **2. Entities** | Vegetation, animals, corpses, species definitions |
| **3. Evolution & Genetics** | Attributes, inheritance, mutation, mate selection |
| **4. Behavior System** | Decision algorithm, actions, combat, energy costs |
| **5. World & Simulation** | Canvas model, tick loop, vegetation mechanics, seeded RNG |
| **6. Predation & Death** | Death triggers, kill mechanics, corpse system |
| **7. Reproduction** | Conditions, offspring placement, costs, cooldowns |
| **8. User Interface** | Canvas, controls, selection, graphs, keyboard shortcuts |
| **9. Configuration** | All config keys, presets, validation, export/import |
| **10. Future Considerations** | V2+ features (HP system, pack dynamics, speciation, etc.) |

### 1.10 Success Criteria

A successful V1 implementation demonstrates:

**Core Loop:**
- Animals make sensible decisions (flee threats, seek food, reproduce when safe)
- Populations fluctuate dynamically (predator-prey cycles, boom/bust)
- Attributes evolve over 20+ generations toward local optima

**Emergent Behaviors:**
- Herbivores evolve high perception and flight instinct in predator-heavy environments
- Predators evolve aggression and size when prey is abundant
- Scavengers (high carrion preference wolves) emerge when hunting is risky

**Reproducibility:**
- Same seed produces identical simulation across multiple runs
- Config changes produce predictable, logical differences

**Usability:**
- Users can observe, pause, speed up, and understand what's happening
- Selection sidebar provides insight into individual animal properties
- Population graph shows long-term trends

**Performance:**
- Maintains 30+ FPS with 500 animals
- Spatial indexing enables efficient proximity queries
- Graceful degradation beyond 1000 animals

### 1.11 Out of Scope for V1

The following are explicitly deferred to V2+ (see Section 10):
- Multi-hit combat / HP-based health
- Pack dynamics / social behaviors
- Line-of-sight detection / stealth
- Speciation mechanics
- Learned behaviors
- Terrain / obstacles
- Seasons / weather
- Mobile-first UI

V1 focuses on establishing a solid foundation for the core evolution loop before adding complexity.

## 2. Entities

### 2.1 Entity Types

| Entity | Description |
|--------|-------------|
| Vegetation | Stationary food source for herbivores; grid-based |
| Animal | Mobile entity with evolvable attributes; species defines diet and baseline traits |
| Corpse | Dead animal; grid-based food source for carnivores/scavengers |

### 2.2 Vegetation

- Grid-based (see Section 5.1)
- Spreads probabilistically to adjacent tiles
- Consumed instantly by animals with `canEatVegetation = true`
- No evolution — static entity

### 2.3 Animal

All animals share a unified blueprint. Species (deer, wolf) define:
- Diet flags (what they can eat)
- Baseline attribute values
- Visual representation

Animals have:
- **Base attributes** (evolvable): strength, agility, endurance, perception, size
- **Behavioral attributes** (evolvable): aggression, flightInstinct, foodPriorityThreshold, reproductiveUrge, carrionPreference
- **Derived stats** (calculated): speed, alertRange, attackPower, defense, hungerDecayRate
- **State**: position, hunger, age, cooldowns

See **Section 3** for full attribute definitions.

### 2.4 Species (V1)

Species are predefined blueprints. No emergent speciation in V1.

| Species | canEatVegetation | canEatAnimals | canEatCorpses |
|---------|------------------|---------------|---------------|
| Deer | true | false | false |
| Wolf | false | true | true |

Animals can only reproduce with same species.

### 2.5 Corpse

- Grid-based (snapped to tile where animal died)
- Multiple corpses can occupy the same grid tile (stored as list per tile)
- Food value based on size and hunger at death
- Decays over time
- Consumed by animals with `canEatCorpses = true`

See **Section 6** for corpse mechanics.

## 3. Evolution & Genetics

### 3.1 Base Attributes

Evolvable physical attributes that define an animal's capabilities:

| Attribute | Min | Max | Description |
|-----------|-----|-----|-------------|
| `strength` | 1 | 20 | Physical power — affects attack |
| `agility` | 1 | 20 | Reflexes, quickness — affects speed, evasion |
| `endurance` | 1 | 20 | Energy efficiency — reduces hunger decay |
| `perception` | 1 | 20 | Sensory acuity — affects detection range |
| `size` | 0.3 | 3.0 | Physical mass (radius in world units) — affects multiple derived stats |

**Note:** Size represents the animal's radius in world units. Visual diameter = `size × 2`. Contact range between two animals = `size1 + size2` (sum of radii).

### 3.2 Behavioral Attributes

Evolvable traits that affect decision-making:

| Attribute | Min | Max | Description |
|-----------|-----|-----|-------------|
| `aggression` | 0.0 | 1.0 | Propensity to attack (even when not very hungry) |
| `flightInstinct` | 0.0 | 1.0 | Propensity to flee from threats |
| `foodPriorityThreshold` | 0.1 | 0.9 | Hunger level below which food becomes priority (lower = seek food sooner) |
| `reproductiveUrge` | 0.1 | 0.9 | Priority for mate-seeking |
| `carrionPreference` | 0.0 | 1.0 | Prefer corpses over hunting (carnivores only) |

### 3.3 Lifecycle Attributes

Evolvable traits that affect lifespan and reproduction:

| Attribute | Min | Max | Description |
|-----------|-----|-----|-------------|
| `maxAge` | 50 | 2000 | Lifespan in ticks |
| `maturityAge` | 10 | 500 | Ticks until reproductive capability (must be < maxAge) |
| `litterSize` | 1 | 4 | Offspring per reproduction |

### 3.4 Derived Stats

Calculated from base attributes — not directly evolvable:

| Stat | Formula | Notes |
|------|---------|-------|
| `speed` | `agility × (1 / √size) × SPEED_MULTIPLIER` | Agile + small = fast |
| `alertRange` | `perception × PERCEPTION_MULTIPLIER` | Sensory detection radius |
| `attackPower` | `strength × √size` | Damage dealt in combat |
| `defense` | `size × (1 + agility × 0.3)` | Survivability when attacked |
| `hungerDecayRate` | `BASE_DECAY × (size + speed × 0.3) / endurance` | Energy burn per tick |

**Config multipliers:**

| Config Key | Default | Notes |
|------------|---------|-------|
| `SPEED_MULTIPLIER` | 2.0 | Tune overall movement speed |
| `PERCEPTION_MULTIPLIER` | 5.0 | Tune detection ranges |
| `BASE_DECAY` | 0.5 | Base hunger loss per tick |

### 3.5 Perceived Threat (Emergent)

Animals dynamically calculate how threatening another animal is:

```
perceivedThreat(other) = (other.attackPower × other.aggression) / my.defense
```

An animal considers fleeing when `perceivedThreat > flightInstinct`. No hardcoded "wolves are scary" — threat emerges from attributes.

### 3.6 Species Baselines

Default starting values per species. All values evolvable within bounds.

**Base Attributes:**

| Attribute | Deer | Wolf |
|-----------|------|------|
| strength | 5 | 12 |
| agility | 12 | 10 |
| endurance | 10 | 8 |
| perception | 14 | 10 |
| size | 1.0 | 1.2 |

**Behavioral Attributes:**

| Attribute | Deer | Wolf |
|-----------|------|------|
| aggression | 0.0 | 0.6 |
| flightInstinct | 0.8 | 0.1 |
| foodPriorityThreshold | 0.4 | 0.5 |
| reproductiveUrge | 0.5 | 0.4 |
| carrionPreference | N/A | 0.3 |

**Lifecycle Attributes:**

| Attribute | Deer | Wolf |
|-----------|------|------|
| maxAge | 800 | 1000 |
| maturityAge | 50 | 80 |
| litterSize | 1 | 2 |

**Diet Flags (species-level, not evolvable):**

| Flag | Deer | Wolf |
|------|------|------|
| canEatVegetation | true | false |
| canEatAnimals | false | true |
| canEatCorpses | false | true |

### 3.7 Inheritance Formula

When two animals reproduce, offspring properties are calculated:

```
offspringProperty = mean(parent1Property, parent2Property) × (1 + mutation)
```

Where `mutation` is drawn from a normal distribution centered at 0 with standard deviation equal to the mutation rate.

### 3.8 Mutation Rates

| Category | Default Rate | Config Key |
|----------|--------------|------------|
| Base attributes | ±5% (σ = 0.05) | `BASE_MUTATION_RATE` |
| Behavioral attributes | ±10% (σ = 0.10) | `BEHAVIORAL_MUTATION_RATE` |
| Lifecycle attributes | ±5% (σ = 0.05) | `LIFECYCLE_MUTATION_RATE` |

### 3.9 Litter Inheritance

**All offspring in a litter share identical properties.** Properties are calculated once per reproduction event, then applied to all offspring.

Rationale: Siblings are genetically identical (simplified model). Variation comes from different reproduction events, not within litters.

### 3.10 Mate Selection

When multiple eligible mates are in range, selection prioritizes fitness:

1. **Filter:** Only consider mates that are reproduction-ready (see below)
2. **Primary factor:** Prefer higher combined fitness (`strength + agility + endurance`)
3. **Tiebreaker:** If fitness equal, prefer nearest

**Reproduction Readiness (publicly visible):**

Animals can assess potential mates' readiness before approaching:

| Indicator | Visible? | Effect on Selection |
|-----------|----------|---------------------|
| Maturity (`age ≥ maturityAge`) | Yes | Immature animals excluded |
| Hunger level | Yes | Animals with `hunger < reproductionThreshold` excluded |
| Cooldown status | Yes | Animals in cooldown excluded |

Where `reproductionThreshold = (REPRODUCTION_COST × litterSize + REPRODUCTION_SAFETY_BUFFER) × MAX_HUNGER`

**Rationale:** Animals can visually assess health (hunger) and avoid wasting energy pursuing unsuitable mates. This creates selection pressure toward high fitness and good timing.

### 3.11 Edge Cases

- If `maturityAge` mutation exceeds `maxAge`, clamp `maturityAge` to `maxAge - 1`
- If any mutation pushes a property outside bounds, clamp to nearest bound
- Derived stats are recalculated whenever base attributes change

## 4. Behavior System

### 4.1 Action Types

Each tick, an animal executes exactly one action:

| Action | Description |
|--------|-------------|
| `DIE` | Automatic — triggered by hunger ≤ 0, age ≥ maxAge, or killed in combat |
| `FLEE` | Move away from perceived threats at full speed |
| `EAT` | Consume food at current position |
| `MOVE_TO_FOOD` | Move toward nearest valid food source |
| `ATTACK` | Attempt to kill target animal |
| `REPRODUCE` | Spawn offspring with nearby mate |
| `MOVE_TO_MATE` | Move toward nearest eligible mate |
| `DRIFT` | Move toward food at half speed (lazy grazing/stalking) |
| `STAY` | No movement |

### 4.2 Unified Decision Algorithm

All animals use the same decision logic. Behavior differences emerge from attributes and diet flags.

**Evaluated in order — first match wins:**

```
1. If age ≥ maxAge → DIE
2. If hunger ≤ 0 → DIE (starvation)

3. THREAT CHECK:
   - Find all animals where perceivedThreat(other) > flightInstinct
   - If threats exist AND (hunger > foodPriorityThreshold × MAX_HUNGER OR random() < flightInstinct) → FLEE

4. FOOD CHECK (hunger-driven):
   - If hunger < foodPriorityThreshold × MAX_HUNGER:
     - Determine food target based on diet flags and preferences:
       - If canEatAnimals AND canEatCorpses:
         - If random() < carrionPreference AND corpse in alertRange → target = nearest corpse
         - Else if prey in alertRange → target = nearest prey
         - Else if corpse in alertRange → target = nearest corpse (fallback)
       - Else if canEatAnimals → target = nearest prey
       - Else if canEatCorpses → target = nearest corpse
       - Else if canEatVegetation → target = nearest vegetation
     - If target is animal currently at contact range AND attackPower > target.defense:
       - If random() < aggression × (1 - hunger/MAX_HUNGER) → ATTACK
     - If food at current position → EAT
     - If target exists → MOVE_TO_FOOD

5. OPPORTUNISTIC ATTACK (aggression-driven):
   - If canEatAnimals AND prey currently at contact range AND attackPower > prey.defense:
     - If random() < aggression × 0.5 → ATTACK (hunt even when not hungry)

6. REPRODUCTION CHECK:
   - reproductionCost = REPRODUCTION_COST × litterSize
   - If mature AND hunger > (reproductionCost + REPRODUCTION_SAFETY_BUFFER) × MAX_HUNGER
     AND reproduction-ready mate in alertRange AND random() < reproductiveUrge:
     - If mate adjacent → REPRODUCE
     - Else → MOVE_TO_MATE

7. IDLE:
   - If food in alertRange → DRIFT
   - Else → STAY
```

**Prey Definition:** Any animal where `my.attackPower > their.defense`. This is independent of diet flags — an animal with high aggression but `canEatAnimals = false` could still attack and kill, but would gain no food value from the corpse. Such wasteful aggression would be selected against over time.

**Note:** `foodPriorityThreshold` works inversely to its name value — a lower threshold (e.g., 0.3) means the animal only seeks food when quite hungry (hunger < 30), while a higher threshold (e.g., 0.7) means it seeks food even when moderately fed (hunger < 70).

### 4.3 Perceived Threat Calculation

Each animal dynamically evaluates threats:

```
perceivedThreat(other) = (other.attackPower × other.aggression) / my.defense
```

- Animal considers fleeing when `perceivedThreat > flightInstinct`
- High defense reduces perceived threat
- Low aggression in others reduces perceived threat
- A non-aggressive wolf (aggression = 0) is not threatening

### 4.4 Attack Propensity

Attack likelihood scales with hunger — full animals are less motivated to hunt:

```
attackChance = aggression × (1 - hunger/MAX_HUNGER)
```

- Very hungry animal (hunger = 10): attackChance = aggression × 0.9 (high motivation)
- Moderately fed (hunger = 50): attackChance = aggression × 0.5
- Full animal (hunger = 100): attackChance = aggression × 0.0 (won't attack for food)
- Opportunistic attacks (step 5) use `aggression × 0.5` — reduced but possible even when full

### 4.5 Action Execution

| Action | Execution Details |
|--------|-------------------|
| `FLEE` | Calculate weighted repulsion vector from all threats, move at full `speed` |
| `EAT` | Consume stationary food at current position: vegetation (if `canEatVegetation`) or corpse (if `canEatCorpses`). For vegetation, map animal position to grid tile: `gridX = floor(x / VEGETATION_TILE_SIZE)`, `gridY = floor(y / VEGETATION_TILE_SIZE)`. Gain hunger based on food value. Live animals are consumed via ATTACK, not EAT. |
| `MOVE_TO_FOOD` | Move toward nearest valid food at full `speed` |
| `ATTACK` | If `attackPower > target.defense`, kill target. If target no longer exists (died earlier in execution), action fails gracefully. Otherwise target escapes. |
| `REPRODUCE` | Spawn `litterSize` offspring at midpoint between parents |
| `MOVE_TO_MATE` | Move toward nearest eligible mate at full `speed` |
| `DRIFT` | Move toward nearest food at `speed × 0.5` |
| `STAY` | No position change |

**Weighted Repulsion Formula (FLEE):**

```
escapeVector = sum(for each threat: normalize(myPos - threatPos) / distance²)
finalVector = normalize(escapeVector) × speed
```

Closer threats contribute more to escape direction.

**Combat Resolution:**

Deterministic: `attackPower > defense` = kill, otherwise prey escapes.

```
if attacker.attackPower > defender.defense:
    defender dies, corpse created
    attacker gets first bite
else:
    defender escapes (no damage, no kill)
```

### 4.6 Hunger System

| Parameter | Value | Notes |
|-----------|-------|-------|
| `MAX_HUNGER` | 100 | Hunger gauge range: 0–100 |
| Starting hunger (initial population) | 80 | Animals spawned at simulation start |
| Starting hunger (offspring) | 70 | Newborns start slightly hungrier |
| Vegetation food value | +20 | Hunger restored for herbivores |
| Corpse food value | See Section 6.3 | Based on size × hunger at death |

### 4.7 Distances & Collision

Animals can freely overlap — no collision detection for positioning or movement. Distance checks only apply to specific interactions:

| Interaction | Distance calculation |
|-------------|---------------------|
| Contact range (attack) | `animal1.size + animal2.size` |
| Adjacent for mating | `(animal1.size + animal2.size) × 1.5` |
| Corpse eating range | `animal.size + corpse.sourceSize` |

### 4.8 Reproduction Conditions

An animal can reproduce when all conditions are met:

| Condition | Requirement | Visible to Others? |
|-----------|-------------|-------------------|
| Maturity | `age ≥ maturityAge` | Yes |
| Hunger buffer | `hunger > (REPRODUCTION_COST × litterSize + REPRODUCTION_SAFETY_BUFFER) × MAX_HUNGER` | Yes |
| Cooldown | `ticksSinceLastReproduction ≥ REPRODUCTION_COOLDOWN` | Yes |
| Mate available | Same-species reproduction-ready animal within mating range | — |
| Behavioral check | `random() < reproductiveUrge` | No (internal) |

**Visibility:** Animals can assess maturity, hunger, and cooldown status of potential mates before pursuing. This prevents wasted movement toward unsuitable mates. See **Section 3.10** for selection logic.

**Config:**

| Config Key | Default | Notes |
|------------|---------|-------|
| `REPRODUCTION_COST` | 0.15 | Hunger cost per offspring (fraction of MAX_HUNGER) |
| `REPRODUCTION_SAFETY_BUFFER` | 0.2 | Extra hunger required beyond cost |
| `REPRODUCTION_COOLDOWN` | 100 | Ticks before can reproduce again |

Example: `litterSize = 2`, cost = 0.15, buffer = 0.2
- Required hunger: `(0.15 × 2 + 0.2) × 100 = 50`
- Must have hunger > 50 to reproduce

### 4.9 Energy Costs

| Cost Type | Description |
|-----------|-------------|
| Base decay | `hungerDecayRate` applied every tick (see Section 3.4) |
| Full-speed movement | Additional `MOVE_COST × distance` hunger drain |
| Drift movement | Additional `MOVE_COST × 0.5 × distance` hunger drain |
| Reproduction | `REPRODUCTION_COST × litterSize × MAX_HUNGER` from each parent |
| Flee sprint tax | Additional `FLEE_COST_BONUS × distance` hunger drain |

**Config:**

| Config Key | Default | Notes |
|------------|---------|-------|
| `MOVE_COST` | 0.05 | Hunger per unit distance at full speed |
| `FLEE_COST_BONUS` | 0.03 | Extra hunger cost when fleeing |

### 4.10 Detection

- `alertRange` (derived from perception) used for all detection
- Detection is instant — if target within alertRange, animal is aware
- No line-of-sight checks for V1

### 4.11 Edge Cases

- **Multiple threats:** Flee using weighted repulsion from all
- **Food at current position:** Eat before considering movement
- **Reproduction ready but mate not adjacent:** Execute MOVE_TO_MATE instead
- **Multiple potential mates:** Use selection rules (Section 3.10)
- **World bounds:** Animals clamped to canvas edge
- **Both animals try to reproduce with each other:** Only one event occurs (first to act in execution order initiates)

## 5. World & Simulation

### 5.1 Canvas Model

Hybrid approach: continuous 2D coordinates for animals, discrete grid overlay for vegetation.

| Aspect | Model |
|--------|-------|
| Animal positions | Continuous floating-point (x, y) coordinates |
| Vegetation | Discrete grid of tiles overlaid on world |
| Coordinate system | Origin (0,0) at top-left, positive X right, positive Y down |

**World Dimensions:**

| Config Key | Default | Notes |
|------------|---------|-------|
| `WORLD_WIDTH` | 1000 | World units |
| `WORLD_HEIGHT` | 800 | World units |
| `VEGETATION_TILE_SIZE` | 5 | World units per vegetation tile (5×5 default) |

Vegetation grid dimensions = `(WORLD_WIDTH / VEGETATION_TILE_SIZE) × (WORLD_HEIGHT / VEGETATION_TILE_SIZE)`

### 5.2 Tick Loop

Each tick has two phases:

**Phase 1: Decision**
- All entities calculate their action simultaneously
- No state changes during this phase
- Each animal reads current world state and determines action

**Phase 2: Execution**
- Death checks (starvation, old age) processed first
- ATTACK actions processed next (among remaining living animals): killing animal gets immediate first bite of corpse
- All other actions applied in order of `alertRange` (highest first — more perceptive animals act first)
- Ties broken by entity ID (deterministic)
- Vegetation spread processed after all animal actions

**Rationale:** Perceptive animals reacting first creates selection pressure on perception. A highly alert animal might flee or attack before a less perceptive one notices the opportunity/threat. Killer eating first rewards successful hunts.

### 5.3 Vegetation Mechanics

| Parameter | Value | Notes |
|-----------|-------|-------|
| Spread chance | 5% per tick | Each vegetation tile has 5% chance to spread to ONE randomly selected orthogonal neighbor |
| Spread direction | Orthogonal only | 4 neighbors (up, down, left, right), not diagonal |
| Consumption | Immediate | Tile becomes empty when eaten |
| Regrowth | From neighbors | Empty tile can regrow if adjacent vegetation spreads to it |

**Initial Vegetation Placement:**

At simulation start, vegetation is randomly distributed based on:
- Seed value (deterministic)
- `INITIAL_VEGETATION_DENSITY` config (percentage of tiles that start with vegetation)

### 5.4 Initial Simulation Setup

**Animal Placement:**

At simulation start, animals are placed using seeded RNG:

1. For each species (deer, then wolves), spawn `INITIAL_X_COUNT` animals
2. Each animal placed at random (x, y) within world bounds
3. Minimum distance enforcement: New animal must be ≥ `INITIAL_SPAWN_MIN_DISTANCE` from all animals of **different species**
4. If placement fails after 100 attempts, relax distance requirement by 10% and retry
5. All initial animals start with `hunger = INITIAL_HUNGER_SPAWN`

**Rationale:** Minimum distance between species prevents immediate predation before simulation starts, giving herbivores a chance to establish.

**Vegetation Placement:**

1. For each grid tile, generate random value using seeded RNG
2. If random value < `INITIAL_VEGETATION_DENSITY`, tile starts with vegetation
3. Expected vegetation tiles = `gridWidth × gridHeight × INITIAL_VEGETATION_DENSITY`

### 5.5 Seeded RNG

All randomness uses a seeded pseudo-random number generator for reproducibility.

| Feature | Behavior |
|---------|----------|
| Seed source | User-provided at simulation start |
| "Generate Random" button | Creates random seed for user |
| Seed display | Always visible in UI for replay/sharing |
| Scope | All randomness: mutations, behavior decisions (`random()`), vegetation spread |

**Reproducibility guarantee:** Same seed + same config = identical simulation run.

**Implementation:** Injectable RNG interface allows mock injection for unit testing.

```typescript
interface RandomGenerator {
  next(): number;  // Returns 0–1
}

class SeededRandom implements RandomGenerator {
  constructor(seed: number) { /* ... */ }
  next(): number { /* ... */ }
}
```

### 5.6 Simulation Speed

| Config Key | Default | Range | Notes |
|------------|---------|-------|-------|
| `TICK_RATE` | 10 | 1–60 | Ticks per second |

- Pause freezes tick execution; UI remains responsive
- Speed adjustable during simulation via controls

### 5.7 World Bounds

- Animals are clamped to world edges — cannot exit
- Flee/movement vectors truncated at boundaries
- Vegetation grid matches world dimensions exactly (no vegetation outside bounds)

### 5.8 Performance Considerations

| Mechanism | Purpose |
|-----------|---------|
| Spatial indexing | Grid-based bucketing for proximity queries (find nearby animals/vegetation/corpses efficiently) |
| Entity cap | Soft warning at 1000 animals; hard cap configurable via `MAX_ENTITIES` |

Spatial index bucket size should match `alertRange` of largest animal for optimal query performance.

## 6. Predation & Death

### 6.1 Death Triggers

| Trigger | Condition | Creates Corpse |
|---------|-----------|----------------|
| Starvation | `hunger ≤ 0` | Yes |
| Old age | `age ≥ maxAge` | Yes |
| Predation | ATTACK succeeds | Yes |

All animal deaths create corpses. Animals with `canEatCorpses = true` can eat any corpse.

### 6.2 Kill Mechanics

Combat is deterministic based on `attackPower` vs `defense`:

```
if attacker.attackPower > defender.defense:
    kill succeeds — defender dies, corpse created
else:
    defender escapes — no damage, no kill
```

See **Section 4.5** for full ATTACK execution details.

**Outcome on success:** Target dies immediately, corpse created at target's grid tile, attacking animal gets first bite.

### 6.3 Corpse Entity

Corpses are grid-based, snapping to the tile where the animal died.

| Property | Value | Notes |
|----------|-------|-------|
| `foodValue` | `size × (hunger / MAX_HUNGER) × CORPSE_FOOD_MULTIPLIER` | Based on size and hunger at death |
| `sourceSize` | `animal.size` | Size of dead animal (used for eating range calculation) |
| `decayTimer` | Configurable | Ticks until corpse disappears |
| `position` | Grid tile | Snapped to nearest vegetation-grid cell |
| `sourceSpecies` | `deer` or `wolf` | For visualization/stats |

**Food Value Formula:**

```
foodValue = animal.size × (animal.hunger / MAX_HUNGER) × CORPSE_FOOD_MULTIPLIER
```

A starved animal (hunger near 0) produces a nearly worthless corpse. A well-fed animal produces maximum nutrition.

**Config:**

| Config Key | Default | Notes |
|------------|---------|-------|
| `CORPSE_DECAY_TICKS` | 100 | Ticks before corpse disappears |
| `CORPSE_FOOD_MULTIPLIER` | 50 | Base multiplier (adjusted by hunger) |

### 6.4 Corpse Consumption

Multiple animals with `canEatCorpses = true` can eat from the same corpse:

**Eating order:**
1. Killing animal eats first (if ATTACK created the corpse this tick)
2. Remaining animals eat in order of `alertRange` (highest first)

**Per-animal consumption:**
```
amountEaten = min(corpse.foodValue, MAX_HUNGER - animal.hunger)
animal.hunger += amountEaten
corpse.foodValue -= amountEaten
```

- Animal eats only what it needs to reach MAX_HUNGER (100)
- Remainder stays in corpse for others
- If `corpse.foodValue ≤ 0`, corpse is removed immediately

### 6.5 Corpse Decay

Each tick, corpse's `decayTimer` decrements by 1. When `decayTimer ≤ 0`:
- Corpse is removed from world
- Any remaining food value is lost

### 6.6 Death Event Handling

When an animal dies:

1. Remove animal entity from world
2. Create corpse at animal's grid tile position
3. Set `corpse.foodValue = animal.size × (animal.hunger / MAX_HUNGER) × CORPSE_FOOD_MULTIPLIER`
4. Set `corpse.sourceSize = animal.size`
5. Set `corpse.decayTimer = CORPSE_DECAY_TICKS`
6. Set `corpse.sourceSpecies = animal.species`
7. Log death event (cause, position, animal properties)

**Note:** Starved animals (hunger = 0) produce corpses with foodValue = 0. These still exist visually but provide no nutrition.

### 6.7 Corpse Visualization

Corpses use distinct sprites, separate from living animals:

| Source | Visualization |
|--------|---------------|
| Deer corpse | Distinct deer corpse sprite (e.g., prone deer, meat icon) |
| Wolf corpse | Distinct wolf corpse sprite |

- Shows remaining food value on hover/selection
- Fades as decay timer approaches zero (optional visual cue)
- Starved corpses (foodValue = 0) could use "bones" variant

## 7. Reproduction

### 7.1 Reproduction Conditions

An animal can reproduce when all conditions are met:

| Condition | Requirement |
|-----------|-------------|
| Maturity | `age ≥ maturityAge` |
| Hunger buffer | `hunger > (REPRODUCTION_COST × litterSize + REPRODUCTION_SAFETY_BUFFER) × MAX_HUNGER` |
| Cooldown | `ticksSinceLastReproduction ≥ REPRODUCTION_COOLDOWN` |
| Mate available | Same-species reproduction-ready animal within mating range |
| Behavioral check | `random() < reproductiveUrge` |

See **Section 4.2** for how reproduction fits into decision logic and **Section 4.8** for detailed conditions.

### 7.2 Mate Selection

When multiple eligible mates are in range:

1. **Filter:** Only reproduction-ready mates (mature, sufficient hunger, not in cooldown)
2. **Primary factor:** Prefer higher combined fitness (`strength + agility + endurance`)
3. **Tiebreaker:** If fitness equal, prefer nearest

See **Section 3.10** for details on reproduction readiness visibility.

### 7.3 Offspring Placement

Offspring spawn at the midpoint between parents:

```
midpoint = (parent1.position + parent2.position) / 2
for each offspring (up to litterSize):
    offset = randomVector() × randomRange(0, OFFSPRING_SPAWN_OFFSET_MAX)
    position = midpoint + offset
```

- Animals can overlap — no collision detection
- All offspring from a single reproduction spawn at/near same location
- Random offset prevents exact stacking (visual clarity only, no gameplay impact)
- Offset magnitude controlled by `OFFSPRING_SPAWN_OFFSET_MAX` config (default 2.0 world units)

### 7.4 Offspring Properties

| Property | Value |
|----------|-------|
| Age | 0 (must reach `maturityAge` to reproduce) |
| Hunger | 70 (see Section 4.6) |
| Cooldown | 0 (can reproduce once mature) |
| Position | Midpoint between parents + small offset |
| Inherited traits | See Section 3.7 (mean of parents + mutation) |

**Litter inheritance:** All siblings share identical properties. Calculated once per reproduction event. See **Section 3.9**.

### 7.5 Reproduction Cost

Both parents pay a hunger penalty:

```
hungerCost = REPRODUCTION_COST × litterSize × MAX_HUNGER
parent1.hunger -= hungerCost
parent2.hunger -= hungerCost
```

| Config Key | Default | Notes |
|------------|---------|-------|
| `REPRODUCTION_COST` | 0.15 | Base cost per offspring (fraction of MAX_HUNGER) |

Example: `litterSize = 2` → each parent loses `0.15 × 2 × 100 = 30` hunger.

### 7.6 Reproduction Cooldown

After reproducing, both parents enter cooldown:

```
parent1.ticksSinceLastReproduction = 0
parent2.ticksSinceLastReproduction = 0
```

Neither can reproduce again until `ticksSinceLastReproduction ≥ REPRODUCTION_COOLDOWN`.

| Config Key | Default | Notes |
|------------|---------|-------|
| `REPRODUCTION_COOLDOWN` | 100 | Ticks before animal can reproduce again |

### 7.7 Edge Cases

- **Insufficient hunger for reproduction:** Reproduction is blocked if `hunger ≤ (REPRODUCTION_COST × litterSize + REPRODUCTION_SAFETY_BUFFER) × MAX_HUNGER`. The safety buffer ensures parents can't starve from reproduction cost.
- **Parents die during reproduction tick:** If both parents selected REPRODUCE action in the decision phase, offspring still spawn even if one or both parents die during the execution phase (e.g., from starvation or predation). Reproduction is "committed" once selected during decision phase. Offspring inherit properties from parents' last living state (properties calculated before death).
- **Both animals try to reproduce with each other:** Only one reproduction event occurs (first to act in execution order — highest alertRange — initiates)

## 8. User Interface

### 8.1 Canvas Visualization

**Rendering Engine:**
- HTML5 Canvas 2D (V1)
- Hybrid coordinate system: continuous 2D for animals, discrete grid for vegetation/corpses
- Future consideration: three.js for WebGL acceleration (V2+)

**Entity Display:**

| Entity | Visualization | Notes |
|--------|---------------|-------|
| Vegetation | Grid tile fill/sprite | Distinct color/texture per tile |
| Animal | Sprite/circle | Species-specific, scales with `size` attribute |
| Corpse | Distinct sprite | Different from living animals (see Section 6.7) |

**Visual Properties:**
- Animals face direction of movement (orientation)
- Size attribute affects sprite scale (`size = 0.3` renders smaller than `size = 3.0`)
- Species distinction via color/sprite (deer vs wolf immediately recognizable)

**Canvas Interaction (default mode):**
- Click-drag: Pan viewport
- Double-click animal: Select (see Section 8.3)
- Mouse wheel: Zoom in/out

### 8.2 Viewport Controls

**Zoom:**
- Range: 0.25× to 4.0× (configurable via `MIN_ZOOM`, `MAX_ZOOM`)
- Mouse wheel: incremental zoom centered on cursor position
- UI buttons: "Zoom In" (+), "Zoom Out" (−), "Reset View" (fit world to viewport)

**Pan:**
- Click-drag on canvas: Pan in any direction
- Arrow keys: Pan viewport (see Section 8.10)
- World bounds: Viewport can pan beyond world edges (shows empty space), but "Reset View" centers world

**Reset View:**
- Button: "Reset View" or home icon
- Action: Fit entire world within viewport, centered
- Zoom level adjusted to show full `WORLD_WIDTH × WORLD_HEIGHT`

### 8.3 Selection System

**Selection Method:**
- Double-click animal: Select and show sidebar
- Double-click empty space: Deselect (close sidebar)
- Selected animal gets visual highlight (outline, glow, or contrasting border)

**Selection Persistence:**
- Selection persists across ticks/pans/zooms
- If selected animal dies, sidebar shows "Animal Deceased" with final properties frozen
- Parent navigation (see Section 8.4) updates selection

**Visual Feedback:**
- Highlight color: distinct from any entity color (e.g., cyan outline)
- Highlight persists while animal alive and selected
- Camera does not auto-follow selected animal (user controls viewport independently)

### 8.4 Selection Sidebar

**Layout:**
- Position: Right side overlay (does not resize canvas)
- Width: 300px (configurable)
- Dismissible: Click "X" or double-click empty space
- Scrollable if content exceeds viewport height

**Content Sections (top to bottom):**

1. **Header:**
   - Animal ID (e.g., "deer_142")
   - Species name
   - Age: `{age} / {maxAge}` ticks
   - Status: "Alive", "Deceased", or "Reproduction Ready" badge

2. **State:**
   - Hunger: `{hunger} / {MAX_HUNGER}` with visual bar
   - Position: `(x, y)`
   - Current action: Last action executed (e.g., "MOVE_TO_FOOD")
   - Cooldown: `{ticksSinceLastReproduction} / {REPRODUCTION_COOLDOWN}` (if applicable)

3. **Base Attributes:**
   - Table: attribute name, current value, (parents' average in parentheses if available)
   - strength, agility, endurance, perception, size

4. **Behavioral Attributes:**
   - aggression, flightInstinct, foodPriorityThreshold, reproductiveUrge, carrionPreference (if applicable)

5. **Derived Stats:**
   - speed, alertRange, attackPower, defense, hungerDecayRate (calculated, not stored)

6. **Lifecycle:**
   - maxAge, maturityAge, litterSize

7. **Lineage:**
   - Parent 1: `{species}_{id}` (clickable if alive, grayed if deceased/unknown)
   - Parent 2: `{species}_{id}` (clickable if alive, grayed if deceased/unknown)
   - For initial population animals (spawned at simulation start): Display "None (initial population)"
   - Offspring count: Total offspring produced by this animal

8. **Action Log:**
   - See Section 8.5

**Parent Navigation:**
- Click living parent ID → camera pans/zooms to parent's position, sidebar updates to show parent
- Click deceased/unknown parent → no action (grayed out, not clickable)
- Smooth camera transition (ease-in-out, ~500ms)

### 8.5 Action Log

**Display:**
- Last 10 actions visible by default
- Format per action: `Tick {tick}: {ACTION_TYPE} {target/outcome}`
  - Example: `Tick 523: ATTACK wolf_42 → Success (killed)`
  - Example: `Tick 524: EAT corpse → +35 hunger`
  - Example: `Tick 525: MOVE_TO_FOOD vegetation (14, 28)`

**Paging:**
- "Show More" button at bottom → loads previous 10 actions
- "Show Less" button collapses back to most recent 10
- Maximum history: Last 100 actions (configurable via `MAX_ACTION_LOG_HISTORY`)
- Actions older than max are discarded

**Log Details (per action type):**

| Action | Log Format |
|--------|------------|
| DIE | `Tick X: DIE (cause: starvation / old age / predation by {id})` |
| FLEE | `Tick X: FLEE from {threat_id}` |
| EAT | `Tick X: EAT {food_type} → +{amount} hunger` |
| MOVE_TO_FOOD | `Tick X: MOVE_TO_FOOD {food_type} at ({x}, {y})` |
| ATTACK | `Tick X: ATTACK {target_id} → {Success / Failed}` |
| REPRODUCE | `Tick X: REPRODUCE with {mate_id} → {litterSize} offspring` |
| MOVE_TO_MATE | `Tick X: MOVE_TO_MATE {mate_id}` |
| DRIFT | `Tick X: DRIFT toward {food_type}` |
| STAY | `Tick X: STAY` |

### 8.6 Global Controls Panel

**Location:** Top bar or fixed bottom panel

**Controls:**

| Control | Type | Function |
|---------|------|----------|
| Play/Pause | Toggle button | Pause: freezes tick execution, UI remains interactive |
| Speed Slider | Range input | 0.1× to 10× speed (modifies `TICK_RATE`) |
| Speed Display | Label | Shows current speed multiplier (e.g., "2.5×") |
| Reset | Button | Confirm dialog → clear world, reinitialize with current/new seed |
| New Simulation | Button | Prompt for new seed or "Generate Random" → reset |
| Current Tick | Display | `Tick: {currentTick}` (read-only) |

**Reset Behavior:**
- "Reset" button → confirmation dialog: "Reset with current seed or generate new?"
  - Option A: "Same Seed" → reinitialize with existing seed
  - Option B: "New Random Seed" → generate new seed, reinitialize
  - Option C: "Cancel"

**Speed Adjustment:**
- Slider updates `TICK_RATE` in real-time
- Range: 1 tick/sec (0.1×) to 60 ticks/sec (10×) — exact values configurable
- Paused state preserves speed setting

### 8.7 Population Graph

**Display:**
- Location: Bottom panel or collapsible sidebar section
- Type: Line chart, time-series
- X-axis: Simulation tick (auto-scales, shows last N ticks in viewport)
- Y-axis: Population count

**Species Lines:**
- Deer: One line (e.g., green)
- Wolf: One line (e.g., red)
- Legend: Species name + current count + color indicator

**Graph Behavior:**
- Updates every tick (or every N ticks for performance)
- X-axis scrolls/pans as simulation progresses
- Y-axis auto-scales to highest population in visible range
- Hover tooltip: Shows exact tick + populations for each species

**Optional Features (V1.1):**
- Toggle vegetation count line (gray, tracks total vegetation tiles)
- Toggle corpse count line (brown)
- Zoom/pan within graph (independent of canvas viewport)

### 8.8 Simulation Info Panel

**Layout:**
- Collapsible panel (default: collapsed)
- Toggle button: "Simulation Info" or info icon
- Location: Top-right corner or within sidebar

**Content (when expanded):**

| Info | Display |
|------|---------|
| Seed | `Seed: {seedValue}` (click to copy) |
| Current Tick | `Tick: {currentTick}` |
| Total Animals | `Animals: {count}` (sum of all species) |
| Total Vegetation | `Vegetation: {tileCount}` |
| Total Corpses | `Corpses: {count}` |
| Simulation Speed | `Speed: {multiplier}×` |
| Uptime | `Elapsed: {minutes}:{seconds}` (real-world time) |

**Seed Management:**
- Click seed value → copy to clipboard
- "Generate Random Seed" button → creates new random seed, updates display
- On reset/new simulation, seed display updates immediately

### 8.9 Visual Indicators

**Per-Animal Overlays (visible without selection):**

| Indicator | Display | Trigger |
|-----------|---------|---------|
| Hunger bar | Small bar above sprite | Always visible (color: green → yellow → red) |
| Maturity | Icon/badge | `age < maturityAge` shows "immature" badge |
| Cooldown | Icon/badge | `ticksSinceLastReproduction < REPRODUCTION_COOLDOWN` shows timer |
| Reproduction Ready | Glow/outline | All reproduction conditions met (see Section 7.1) |

**Hunger Bar Color Scale:**
- Green: `hunger > 66`
- Yellow: `33 < hunger ≤ 66`
- Red: `hunger ≤ 33`

**Optional Visual Indicators (V1.1):**
- Alert range circle (when animal selected, shows `alertRange` radius)
- Threat visualization (when fleeing, draw line from animal to threat source)
- Movement trail (last N positions fading opacity)

### 8.10 Keyboard Shortcuts

**Navigation:**
- Arrow keys: Pan viewport (up/down/left/right)
- `+` / `-`: Zoom in/out
- `0`: Reset view (fit world to viewport)

**Simulation Control:**
- `Space`: Toggle play/pause
- `[` / `]`: Decrease/increase speed (±0.5× per press)

**Selection:**
- `Esc`: Deselect current animal (close sidebar)
- `Tab`: Cycle to next living animal (wraps around)
- `Shift+Tab`: Cycle to previous living animal

**UI Toggle:**
- `I`: Toggle Simulation Info Panel
- `G`: Toggle Population Graph
- `L`: Toggle Action Log paging (expand/collapse to default 10)

**All shortcuts listed in a "Keyboard Shortcuts" help dialog (accessible via `?` key).**

### 8.11 Responsive Behavior

**Minimum Viewport Size:**
- Canvas: 640×480px minimum
- Below minimum: Show warning "Viewport too small — minimum 640×480 recommended"
- Sidebar collapses to icon-only mode below 1024px width

**Adaptive Layout:**

| Viewport Width | Behavior |
|----------------|----------|
| < 768px | Mobile: Touch controls prioritized, sidebar becomes modal overlay (full-screen) |
| 768px – 1024px | Tablet: Sidebar width reduces to 250px, graph moves to bottom |
| > 1024px | Desktop: Full layout as described above |

**Touch Gestures (mobile/tablet):**
- Pinch: Zoom in/out
- Two-finger drag: Pan viewport
- Double-tap animal: Select (replaces double-click)
- Swipe from right: Open/close sidebar

**Performance Degradation (graceful):**
- If framerate drops below 30 FPS:
  - Reduce visual effects (hunger bars update every 5 ticks instead of every tick)
  - Reduce graph update frequency (every 10 ticks instead of every tick)
  - Warning: "Performance degraded — reduce population or lower speed"

**Future Mobile Considerations (V2):**
- Dedicated mobile layout with bottom sheet for animal details
- Simplified controls (fewer buttons, gesture-primary)
- Portrait mode optimization

## 9. Configuration

### 9.1 Configuration Philosophy

All tunable parameters are exposed as config keys for balancing and experimentation. Config values affect gameplay but maintain determinism: same seed + same config = identical simulation.

**Config Object Structure:**

```typescript
interface SimulationConfig {
  world: WorldConfig;
  entities: EntityConfig;
  evolution: EvolutionConfig;
  behavior: BehaviorConfig;
  ui: UIConfig;
  performance: PerformanceConfig;
}
```

### 9.2 World & Simulation

| Config Key | Default | Range | Notes |
|------------|---------|-------|-------|
| `WORLD_WIDTH` | 1000 | 500–5000 | World width in units |
| `WORLD_HEIGHT` | 800 | 400–4000 | World height in units |
| `VEGETATION_TILE_SIZE` | 5 | 2–20 | Size of each vegetation grid cell (affects granularity) |
| `TICK_RATE` | 10 | 1–60 | Ticks per second (adjustable during simulation) |
| `INITIAL_DEER_COUNT` | 20 | 1–100 | Deer spawned at simulation start |
| `INITIAL_WOLF_COUNT` | 5 | 1–50 | Wolves spawned at simulation start |
| `INITIAL_SPAWN_MIN_DISTANCE` | 50 | 10–200 | Minimum distance between initial animals of different species |

**Notes:**
- Grid dimensions = `(WORLD_WIDTH / VEGETATION_TILE_SIZE) × (WORLD_HEIGHT / VEGETATION_TILE_SIZE)`
- Smaller `VEGETATION_TILE_SIZE` = more granular vegetation, higher computational cost
- Initial populations affect early dynamics — too many predators = quick herbivore extinction

### 9.3 Vegetation

| Config Key | Default | Range | Notes |
|------------|---------|-------|-------|
| `INITIAL_VEGETATION_DENSITY` | 0.4 | 0.1–0.9 | Fraction of grid tiles with vegetation at start (0.4 = 40%) |
| `VEGETATION_SPREAD_RATE` | 0.05 | 0.01–0.2 | Probability per tick each tile spreads to one random neighbor (0.05 = 5%) |
| `VEGETATION_FOOD_VALUE` | 20 | 5–50 | Hunger restored when herbivore eats vegetation |

**Notes:**
- Higher spread rate = vegetation recovers faster after grazing
- Lower food value = herbivores must graze more frequently
- Spread is to ONE randomly selected orthogonal neighbor per successful spread event

### 9.4 Entities & State

| Config Key | Default | Range | Notes |
|------------|---------|-------|-------|
| `MAX_HUNGER` | 100 | 50–200 | Maximum hunger value (hunger gauge: 0–MAX_HUNGER) |
| `INITIAL_HUNGER_SPAWN` | 80 | 50–100 | Starting hunger for animals in initial population |
| `INITIAL_HUNGER_OFFSPRING` | 70 | 40–90 | Starting hunger for newborn animals |

**Notes:**
- All hunger thresholds and costs are fractions of `MAX_HUNGER`
- Offspring start slightly hungrier to encourage parents to feed before reproducing
- Changing `MAX_HUNGER` requires rebalancing food values and costs

### 9.5 Derived Stats Multipliers

| Config Key | Default | Range | Notes |
|------------|---------|-------|-------|
| `SPEED_MULTIPLIER` | 2.0 | 0.5–10.0 | Tune overall movement speed (`speed = agility × (1/√size) × SPEED_MULTIPLIER`) |
| `PERCEPTION_MULTIPLIER` | 5.0 | 1.0–20.0 | Tune detection ranges (`alertRange = perception × PERCEPTION_MULTIPLIER`) |
| `BASE_DECAY` | 0.5 | 0.1–2.0 | Base hunger decay per tick (higher = animals starve faster) |

**Notes:**
- Higher `SPEED_MULTIPLIER` = faster gameplay, animals cover more ground
- Higher `PERCEPTION_MULTIPLIER` = animals detect threats/food from farther away
- `BASE_DECAY` strongly affects game tempo — low values = slower starvation, longer lives

### 9.6 Movement & Energy

| Config Key | Default | Range | Notes |
|------------|---------|-------|-------|
| `MOVE_COST` | 0.05 | 0.01–0.2 | Hunger cost per unit distance traveled at full speed |
| `FLEE_COST_BONUS` | 0.03 | 0.01–0.1 | Additional hunger cost per unit when fleeing (sprint tax) |

**Notes:**
- Total flee cost = `(MOVE_COST + FLEE_COST_BONUS) × distance`
- Higher move costs = animals tire faster, favoring sedentary strategies
- Flee bonus penalizes panic — animals that flee frequently lose energy faster

### 9.7 Reproduction

| Config Key | Default | Range | Notes |
|------------|---------|-------|-------|
| `REPRODUCTION_COST` | 0.15 | 0.05–0.5 | Hunger cost per offspring (fraction of MAX_HUNGER) |
| `REPRODUCTION_SAFETY_BUFFER` | 0.2 | 0.1–0.5 | Extra hunger required beyond reproduction cost |
| `REPRODUCTION_COOLDOWN` | 100 | 20–500 | Ticks before animal can reproduce again |
| `OFFSPRING_SPAWN_OFFSET_MAX` | 2.0 | 0.5–10.0 | Max random offset from midpoint when spawning offspring (world units) |

**Notes:**
- Reproduction threshold = `(REPRODUCTION_COST × litterSize + REPRODUCTION_SAFETY_BUFFER) × MAX_HUNGER`
- Safety buffer prevents starvation from reproduction — parents must have buffer + cost
- Longer cooldown = slower population growth
- Spawn offset prevents visual stacking, doesn't affect gameplay

### 9.8 Evolution

| Config Key | Default | Range | Notes |
|------------|---------|-------|-------|
| `BASE_MUTATION_RATE` | 0.05 | 0.0–0.3 | Standard deviation for base attribute mutations (0.05 = ±5%) |
| `BEHAVIORAL_MUTATION_RATE` | 0.10 | 0.0–0.5 | Standard deviation for behavioral attribute mutations (0.10 = ±10%) |
| `LIFECYCLE_MUTATION_RATE` | 0.05 | 0.0–0.3 | Standard deviation for lifecycle attribute mutations (0.05 = ±5%) |

**Notes:**
- Mutation rate is σ (standard deviation) of normal distribution centered at 0
- Higher behavioral mutation = more diverse personalities, faster adaptation
- Zero mutation rate = no evolution, populations stay at baseline values
- Mutations are clamped to attribute min/max bounds

### 9.9 Corpses

| Config Key | Default | Range | Notes |
|------------|---------|-------|-------|
| `CORPSE_DECAY_TICKS` | 100 | 20–500 | Ticks before corpse disappears |
| `CORPSE_FOOD_MULTIPLIER` | 50 | 10–200 | Base food value multiplier (actual value = `size × hunger% × multiplier`) |

**Notes:**
- Corpse food value = `animal.size × (animal.hunger / MAX_HUNGER) × CORPSE_FOOD_MULTIPLIER`
- Starved animals (hunger near 0) produce nearly worthless corpses
- Longer decay = corpses available longer for scavengers
- Higher multiplier = corpses more nutritious, favors scavenging strategies

### 9.10 Performance

| Config Key | Default | Range | Notes |
|------------|---------|-------|-------|
| `MAX_ENTITIES` | 2000 | 500–10000 | Hard cap on total animals (prevents runaway growth) |
| `ENTITY_WARNING_THRESHOLD` | 1000 | 100–5000 | Show performance warning at this count |
| `SPATIAL_INDEX_BUCKET_SIZE` | 100 | 20–500 | Grid cell size for spatial indexing (tune to max alertRange) |

**Notes:**
- When population exceeds `MAX_ENTITIES`, no new offspring spawn (reproduction fails silently)
- Warning appears in UI when count exceeds threshold
- Spatial index bucket size should be ≥ largest possible `alertRange` (perception × PERCEPTION_MULTIPLIER)
- Default 100 assumes max perception 20 × multiplier 5.0 = 100 alertRange

### 9.11 UI & Visualization

| Config Key | Default | Range | Notes |
|------------|---------|-------|-------|
| `MIN_ZOOM` | 0.25 | 0.1–1.0 | Minimum zoom level (0.25 = 25%, more zoomed out) |
| `MAX_ZOOM` | 4.0 | 1.0–10.0 | Maximum zoom level (4.0 = 400%, more zoomed in) |
| `SIDEBAR_WIDTH` | 300 | 200–500 | Sidebar width in pixels |
| `MAX_ACTION_LOG_HISTORY` | 100 | 20–500 | Maximum actions stored per animal |
| `MIN_ACCEPTABLE_FPS` | 30 | 15–60 | FPS threshold for performance warnings |

**Notes:**
- Zoom affects only viewport, not simulation
- Smaller sidebar = more canvas space but less info
- Action log stored per animal — memory usage scales with population × log size
- FPS warning triggers visual optimizations (reduce hunger bar update frequency, etc.)

### 9.12 Config Presets

**Balanced (Default):**
- Uses all default values above
- Designed for 5–10 minute sessions with interesting population dynamics

**Fast Evolution:**
```typescript
{
  BEHAVIORAL_MUTATION_RATE: 0.20,  // 2x faster personality evolution
  LIFECYCLE_MUTATION_RATE: 0.10,   // 2x faster lifecycle evolution
  REPRODUCTION_COOLDOWN: 50,       // 2x faster reproduction
  TICK_RATE: 20                    // 2x simulation speed
}
```

**Harsh World:**
```typescript
{
  BASE_DECAY: 1.0,                 // 2x hunger decay
  VEGETATION_SPREAD_RATE: 0.025,   // Half vegetation spread
  INITIAL_VEGETATION_DENSITY: 0.2, // Half initial vegetation
  CORPSE_DECAY_TICKS: 50          // Corpses decay 2x faster
}
```

**Peaceful Sandbox:**
```typescript
{
  BASE_DECAY: 0.2,                 // Very slow hunger decay
  VEGETATION_SPREAD_RATE: 0.1,     // Fast vegetation spread
  INITIAL_WOLF_COUNT: 0,           // No predators
  REPRODUCTION_COOLDOWN: 50        // Fast reproduction
}
```

### 9.13 Determinism Guarantees

**Deterministic (same seed = same outcome):**
- All config values
- Initial animal placement (seeded RNG)
- Initial vegetation placement (seeded RNG)
- Mutations (seeded RNG)
- Behavior decisions using `random()` (seeded RNG)
- Vegetation spread (seeded RNG)
- Tie-breaking in action execution order (entity ID)

**Non-deterministic (does not affect simulation):**
- UI interactions (zoom, pan, selection)
- Pause/resume timing
- Speed slider changes during execution
- Real-world elapsed time

**Partial determinism (affects starting conditions only):**
- Changing `WORLD_WIDTH`, `WORLD_HEIGHT`, or `VEGETATION_TILE_SIZE` changes grid dimensions, affecting initial vegetation placement pattern

### 9.14 Config Validation

When loading/changing config, validate:

| Validation | Rule | Error Handling |
|------------|------|----------------|
| Ranges | All values within specified ranges | Clamp to nearest bound, warn user |
| Grid size | `WORLD_WIDTH / VEGETATION_TILE_SIZE` produces integer | Round down, warn if non-integer |
| Initial populations | `INITIAL_DEER_COUNT + INITIAL_WOLF_COUNT ≤ MAX_ENTITIES` | Reduce counts proportionally |
| Spatial index | `SPATIAL_INDEX_BUCKET_SIZE ≥ perception.max × PERCEPTION_MULTIPLIER` | Warn if too small |
| Reproduction math | `REPRODUCTION_COST + REPRODUCTION_SAFETY_BUFFER ≤ 1.0` | Clamp total to 0.95, warn |

### 9.15 Config Export/Import

**Export Format (JSON):**

```json
{
  "version": "1.0",
  "name": "My Custom Config",
  "description": "Faster evolution, harsher world",
  "config": {
    "BEHAVIORAL_MUTATION_RATE": 0.20,
    "BASE_DECAY": 1.0,
    ...
  }
}
```

**Import Behavior:**
- Validate all keys against schema
- Unknown keys ignored with warning
- Missing keys filled with defaults
- Invalid values clamped to ranges with warning

**UI Features:**
- "Export Config" button downloads JSON
- "Import Config" button loads from file
- "Reset to Defaults" restores all default values

## 10. Future Considerations (V2+)

This section catalogs potential enhancements beyond V1 scope. Items are organized by category and roughly prioritized within each category.

### 10.1 Combat & Health System

**HP-Based Health Model:**
- Replace instant death with hit points (HP)
- Starvation drains HP over time instead of instant death at hunger = 0
- Speed affected by HP percentage (wounded animals move slower)
- Multiple hits required to kill — combat becomes multi-tick
- Healing mechanism: high hunger restores HP gradually
- **Rationale:** More realistic predation, allows wounded animals to escape and recover
- **Complexity:** Medium — affects combat, death, and movement systems

**Damage-Based Combat:**
- Replace deterministic kill (`attackPower > defense`) with damage calculation
- `damage = max(0, attackPower - defense)`
- Target loses HP = damage
- Allows weaker animals to eventually kill stronger ones through persistence
- **Rationale:** More nuanced combat, pack hunting becomes viable
- **Complexity:** Medium — requires HP system first

**Vector Intersection Attacks:**
- Predator can attack prey that is running toward it (not just contact range)
- Calculate if prey's movement vector intersects predator's position
- Ambush mechanic: stationary predators get bonus against moving prey
- **Rationale:** Rewards positioning, punishes fleeing into threats
- **Complexity:** High — requires vector math, careful balance

### 10.2 Sensory & Detection

**Line-of-Sight Detection:**
- Replace instant circular detection with raycasting
- Animals only detect what they can "see" (no detection through obstacles)
- Vegetation blocks line-of-sight (dense vegetation = hiding spots)
- Perception determines how far they can see, not omnidirectional awareness
- **Rationale:** More realistic, creates stealth gameplay, vegetation becomes tactical
- **Complexity:** High — raycasting expensive, needs spatial optimization

**Scent Trails:**
- Animals leave scent markers that fade over time
- Predators can track prey by following scent trails
- Scent strength based on size and time since passage
- Wind direction affects scent spread (directional bias)
- **Rationale:** Enables tracking behavior, makes hiding harder
- **Complexity:** Medium — trail data structure, decay management

**Sound Detection:**
- Movement generates sound proportional to speed and size
- Fast/large animals heard from farther away
- Allows detection beyond visual range
- Introduces noise as separate attribute from perception
- **Rationale:** Faster animals easier to detect, trade-off with stealth
- **Complexity:** Medium — layered detection system

### 10.3 Energy & Movement

**Stamina System:**
- Separate stamina gauge from hunger
- Full-speed movement and fleeing drain stamina
- Stamina regenerates when resting (STAY action)
- Exhausted animals forced to move at half speed
- **Rationale:** Prevents infinite fleeing, creates pursuit dynamics
- **Complexity:** Medium — new gauge, movement system changes

**Terrain Types:**
- Different terrain affects movement speed (grassland, forest, water, rocky)
- Some species faster on certain terrain (wolves in forest, deer in grassland)
- Vegetation density creates implicit terrain (dense vegetation = slow movement)
- **Rationale:** Tactical positioning, species niches by terrain preference
- **Complexity:** High — terrain layer, species-terrain interaction

**Momentum Physics:**
- Animals can't turn instantly — turning radius based on speed and agility
- High-speed fleeing animals overshoot turns
- Agile animals can dodge and weave
- **Rationale:** More realistic movement, agility becomes more valuable
- **Complexity:** High — physics simulation, careful tuning required

### 10.4 Evolution & Genetics

**Speciation Mechanics:**
- Track genetic distance between individuals
- Animals with genetic distance > threshold cannot reproduce
- Over time, populations diverge into separate species
- New species can have different diet flags if mutations accumulate
- **Rationale:** Emergent speciation, long-term evolutionary dynamics
- **Complexity:** Very High — genetic distance tracking, species management

**Intelligence Attribute:**
- New evolvable attribute affecting decision quality
- Low intelligence: suboptimal choices (sometimes flee from non-threats)
- High intelligence: better threat assessment, optimal food selection
- Trade-off: intelligence costs energy (higher hunger decay)
- **Rationale:** Brain size / intelligence trade-offs seen in nature
- **Complexity:** High — decision algorithm becomes intelligence-dependent

**Learned Behaviors:**
- Animals remember successful/failed actions
- Adjust behavior probabilities based on experience (not just genes)
- Memory passed to offspring (cultural transmission)
- Forgetfulness based on intelligence attribute
- **Rationale:** Behavioral evolution beyond genetics
- **Complexity:** Very High — learning system, memory management

**Sexual Selection:**
- Mate choice based on visual traits (color, size, patterns)
- Arbitrary preferences can evolve (peacock tail effect)
- Traits that reduce survival but attract mates
- **Rationale:** Demonstrates sexual selection vs natural selection
- **Complexity:** Medium — mate selection already exists, add trait preferences

### 10.5 Social Behaviors

**Pack Dynamics:**
- Animals form groups that move together
- Pack hunting: multiple animals coordinate attacks
- Shared food: pack members split corpse
- Pack leadership based on fitness
- **Rationale:** Social behaviors, group strategies
- **Complexity:** Very High — group formation, coordination AI

**Parental Care:**
- Parents protect offspring for N ticks after birth
- Parents prioritize feeding offspring (share food)
- Parents attack threats near offspring (protective aggression)
- Survival rate improves with parental care
- **Rationale:** K-selection vs r-selection strategies
- **Complexity:** Medium — parent-child tracking, protective behavior

**Territorial Behavior:**
- Animals establish territories (claimed regions)
- Aggression increases near territory center
- Mark territory boundaries (scent markers)
- Territory size scales with perception and aggression
- **Rationale:** Space competition, population distribution
- **Complexity:** High — territory data structure, boundary system

### 10.6 Environmental Dynamics

**Seasons:**
- Cyclical changes in vegetation growth rate and food value
- Winter: slow vegetation growth, animals need more food (higher decay)
- Summer: fast vegetation growth, abundant food
- Migration behavior emerges (move to follow food)
- **Rationale:** Long-term survival strategies, migration patterns
- **Complexity:** Medium — seasonal clock, growth rate modifiers

**Weather Events:**
- Rain: increases vegetation growth temporarily
- Drought: decreases vegetation growth, increases hunger decay
- Storms: reduce perception range (harder to detect food/threats)
- Random events add unpredictability
- **Rationale:** Environmental pressure, adaptability selection
- **Complexity:** Medium — event system, temporary modifiers

**Day/Night Cycle:**
- Nighttime: reduced perception range for most animals
- Nocturnal animals: inverted perception (better at night)
- Diurnal animals sleep at night (reduced movement)
- New behavioral attribute: nocturnality (0 = diurnal, 1 = nocturnal)
- **Rationale:** Temporal niche partitioning
- **Complexity:** Medium — time-of-day system, perception modifiers

### 10.7 User Interface Enhancements

**Optional Visual Indicators (mentioned in Section 8.9):**
- Alert range circle when animal selected
- Threat visualization (line from fleeing animal to threat)
- Movement trail (last N positions, fading opacity)
- **Complexity:** Low — rendering additions

**Heatmaps:**
- Toggle overlay showing: population density, death locations, birth locations, food consumption
- Useful for understanding simulation dynamics
- **Complexity:** Low — data collection, visualization layer

**Replay System:**
- Record simulation state every N ticks
- Scrub backward/forward through timeline
- Compare different runs with same seed
- **Rationale:** Analysis, debugging, content creation
- **Complexity:** High — state serialization, memory management

**Statistics Dashboard:**
- Average lifespan per species over time
- Average attribute values per species (track evolution)
- Starvation vs predation death ratios
- Reproduction rate graphs
- **Rationale:** Observe evolutionary trends quantitatively
- **Complexity:** Low — data collection, chart library

**Scenario Editor:**
- Place specific animals with custom attributes
- Draw terrain types and vegetation patterns
- Set localized config overrides (region-specific rules)
- Save/load scenarios
- **Rationale:** Education, experimentation, content creation
- **Complexity:** High — editor UI, scenario serialization

### 10.8 Rendering & Performance

**WebGL / Three.js Migration:**
- Replace Canvas 2D with WebGL for better performance
- Handle 10,000+ entities smoothly
- Shader-based rendering for effects
- **Rationale:** Scale to larger populations
- **Complexity:** High — rendering rewrite, shaders

**Web Workers for Simulation:**
- Move tick loop to web worker (off main thread)
- UI remains responsive during heavy computation
- Smooth rendering even at high entity counts
- **Rationale:** Performance, responsiveness
- **Complexity:** Medium — worker communication, state synchronization

**Level of Detail (LOD):**
- Reduce visual detail for distant/small animals
- Skip animation frames for off-screen entities
- Simplify hunger bar rendering at low zoom
- **Rationale:** Maintain framerate at high populations
- **Complexity:** Medium — distance-based rendering rules

### 10.9 Educational Features

**Tutorial Mode:**
- Guided walkthrough of mechanics
- Annotated visualization (labels explaining what's happening)
- Slow-motion during key events (first predation, reproduction)
- **Rationale:** Lower barrier to entry, educational tool
- **Complexity:** Medium — tutorial system, annotations

**Experiment Presets:**
- "What if all deer were aggressive?" (flip aggression baseline)
- "Wolves that prefer scavenging" (high carrionPreference)
- "Immortal herbivores" (no old age death for deer)
- Quick A/B comparison mode
- **Rationale:** Hypothesis testing, science education
- **Complexity:** Low — config presets with explanations

**Evolution Visualizer:**
- Family tree view showing lineage branching
- Attribute histograms over time
- "Time-lapse" mode: show evolution over 10,000 ticks in 1 minute
- **Rationale:** Visualize evolution directly
- **Complexity:** High — lineage tracking, tree visualization

### 10.10 Multiplayer & Social

**Shared Simulations:**
- Multiple users can observe same simulation
- Real-time sync across clients
- Chat/annotations on shared viewport
- **Rationale:** Collaborative observation, teaching
- **Complexity:** Very High — networking, state sync

**Ecosystem Challenges:**
- Leaderboard: "Keep deer alive for N ticks"
- Time trials: "Reach 100 wolves fastest"
- Community competitions with scoring
- **Rationale:** Gamification, community engagement
- **Complexity:** High — challenge system, backend, leaderboards

### 10.11 Mobile & Accessibility

**Mobile-First Redesign (mentioned in Section 8.11):**
- Touch-optimized controls
- Bottom sheet for animal details
- Portrait mode optimization
- Simplified UI for small screens
- **Complexity:** High — responsive redesign

**Accessibility:**
- Screen reader support for animal properties
- High-contrast mode
- Keyboard-only navigation
- Colorblind-friendly palettes
- **Complexity:** Medium — ARIA labels, contrast options

### 10.12 Implementation Priority Recommendations

**Quick Wins (Low effort, high impact):**
1. Statistics dashboard (Section 10.7)
2. Optional visual indicators (Section 10.7)
3. Experiment presets (Section 10.9)
4. Heatmaps (Section 10.7)

**Medium Complexity (Expand core gameplay):**
1. HP-based health model (Section 10.1)
2. Stamina system (Section 10.3)
3. Seasons (Section 10.6)
4. Sexual selection (Section 10.4)

**High Complexity (Major features):**
1. Line-of-sight detection (Section 10.2)
2. Speciation mechanics (Section 10.4)
3. Pack dynamics (Section 10.5)
4. WebGL migration (Section 10.8)

**Research Projects (Very high complexity):**
1. Learned behaviors (Section 10.4)
2. Shared simulations (Section 10.10)
3. Territorial behavior (Section 10.5)

### 10.13 Known Limitations of V1

**What V1 Intentionally Excludes:**
- No collision physics (animals can overlap)
- No obstacle/terrain system
- No social behaviors (packs, families, territories)
- No multi-hit combat (instant kill/escape)
- Omniscient circular detection (no stealth)
- No learned behaviors (purely genetic)
- Single-planet scope (no migration, bounded world)

**Rationale:** V1 prioritizes getting core evolution loop working reliably before adding complexity. Each limitation above is addressed in V2+ sections.

**Design Debt to Address in V2:**
- `foodPriorityThreshold` inverse naming (rename to `hungerTolerance`)
- Separate "Reset" and "New Simulation" buttons (merge into one)
- Deduplicate "Current Tick" display (keep in one location)
- Config keys for UI breakpoints (currently hardcoded)

### 10.14 Backward Compatibility

When implementing V2+ features:
- Maintain V1 config file compatibility (add new keys, don't break old)
- Version simulation files so V1 replays work in V2
- Optional feature flags to enable/disable V2 mechanics
- "Classic Mode" toggle to run pure V1 simulation

This ensures existing simulations remain reproducible and users can choose complexity level.
