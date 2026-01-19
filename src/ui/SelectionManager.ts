import type { Animal, Corpse } from '../entities/types';
import type { EntityId } from '../utils/id';
import type { Vector2 } from '../utils/vector';
import type { World } from '../core/World';
import { createEventEmitter } from '../utils/events';

export type SelectableEntity = Animal | Corpse | null;
export type SelectionType = 'animal' | 'corpse' | null;

export interface SelectionState {
  entity: SelectableEntity;
  type: SelectionType;
  entityId: EntityId | null;
}

export interface SelectionEvents {
  selectionChanged: { previous: SelectionState; current: SelectionState };
}

export interface SelectionManager {
  getSelection(): SelectionState;
  getSelectedAnimal(): Animal | null;
  getSelectedCorpse(): Corpse | null;
  hasSelection(): boolean;
  select(entity: Animal | Corpse): void;
  selectById(id: EntityId, world: World): void;
  deselect(): void;
  cycleSelection(world: World, direction: 'next' | 'previous'): void;
  findEntityAtPosition(world: World, worldPos: Vector2, tolerance: number): SelectableEntity;
  refreshSelection(world: World): void;
  on<K extends keyof SelectionEvents>(event: K, callback: (data: SelectionEvents[K]) => void): void;
  off<K extends keyof SelectionEvents>(event: K, callback: (data: SelectionEvents[K]) => void): void;
}

function isAnimal(entity: Animal | Corpse): entity is Animal {
  return 'species' in entity && 'state' in entity;
}

function isCorpse(entity: Animal | Corpse): entity is Corpse {
  return 'sourceSpecies' in entity && 'foodValue' in entity;
}

export function createSelectionManager(): SelectionManager {
  let currentSelection: SelectionState = {
    entity: null,
    type: null,
    entityId: null,
  };

  const emitter = createEventEmitter<SelectionEvents>();

  function setSelection(entity: SelectableEntity): void {
    const previous = { ...currentSelection };

    if (entity === null) {
      currentSelection = { entity: null, type: null, entityId: null };
    } else if (isAnimal(entity)) {
      currentSelection = { entity, type: 'animal', entityId: entity.id };
    } else if (isCorpse(entity)) {
      currentSelection = { entity, type: 'corpse', entityId: entity.id };
    }

    emitter.emit('selectionChanged', { previous, current: { ...currentSelection } });
  }

  return {
    getSelection(): SelectionState {
      return { ...currentSelection };
    },

    getSelectedAnimal(): Animal | null {
      if (currentSelection.type === 'animal' && currentSelection.entity) {
        return currentSelection.entity as Animal;
      }
      return null;
    },

    getSelectedCorpse(): Corpse | null {
      if (currentSelection.type === 'corpse' && currentSelection.entity) {
        return currentSelection.entity as Corpse;
      }
      return null;
    },

    hasSelection(): boolean {
      return currentSelection.entity !== null;
    },

    select(entity: Animal | Corpse): void {
      setSelection(entity);
    },

    selectById(id: EntityId, world: World): void {
      const animal = world.getAnimal(id);
      if (animal && !animal.state.isDead) {
        setSelection(animal);
        return;
      }

      const corpse = world.getCorpse(id);
      if (corpse) {
        setSelection(corpse);
        return;
      }

      // Entity not found, deselect
      setSelection(null);
    },

    deselect(): void {
      setSelection(null);
    },

    cycleSelection(world: World, direction: 'next' | 'previous'): void {
      const livingAnimals = world.getLivingAnimals();
      if (livingAnimals.length === 0) {
        setSelection(null);
        return;
      }

      // Sort by ID for deterministic ordering
      livingAnimals.sort((a, b) => a.id.localeCompare(b.id));

      const currentId = currentSelection.entityId;
      let currentIndex = currentId
        ? livingAnimals.findIndex(a => a.id === currentId)
        : -1;

      if (currentIndex === -1) {
        // No current selection or current selection is not a living animal
        setSelection(livingAnimals[0]);
        return;
      }

      const offset = direction === 'next' ? 1 : -1;
      const nextIndex = (currentIndex + offset + livingAnimals.length) % livingAnimals.length;
      setSelection(livingAnimals[nextIndex]);
    },

    findEntityAtPosition(world: World, worldPos: Vector2, tolerance: number): SelectableEntity {
      // Check animals first (they're more interactive)
      const livingAnimals = world.getLivingAnimals();
      let closestAnimal: Animal | null = null;
      let closestAnimalDist = Infinity;

      for (const animal of livingAnimals) {
        const dx = animal.state.position.x - worldPos.x;
        const dy = animal.state.position.y - worldPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = animal.baseAttributes.size * 8 + tolerance;

        if (dist < hitRadius && dist < closestAnimalDist) {
          closestAnimal = animal;
          closestAnimalDist = dist;
        }
      }

      if (closestAnimal) {
        return closestAnimal;
      }

      // Check corpses
      const corpses = world.getAllCorpses();
      let closestCorpse: Corpse | null = null;
      let closestCorpseDist = Infinity;

      for (const corpse of corpses) {
        const dx = corpse.position.x - worldPos.x;
        const dy = corpse.position.y - worldPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = corpse.sourceSize * 6 + tolerance;

        if (dist < hitRadius && dist < closestCorpseDist) {
          closestCorpse = corpse;
          closestCorpseDist = dist;
        }
      }

      return closestCorpse;
    },

    refreshSelection(world: World): void {
      // Update the stored entity reference with fresh data from world
      if (!currentSelection.entityId) return;

      if (currentSelection.type === 'animal') {
        const animal = world.getAnimal(currentSelection.entityId);
        if (animal && !animal.state.isDead) {
          currentSelection.entity = animal;
        } else {
          // Animal died or removed
          setSelection(null);
        }
      } else if (currentSelection.type === 'corpse') {
        const corpse = world.getCorpse(currentSelection.entityId);
        if (corpse) {
          currentSelection.entity = corpse;
        } else {
          // Corpse decayed
          setSelection(null);
        }
      }
    },

    on<K extends keyof SelectionEvents>(
      event: K,
      callback: (data: SelectionEvents[K]) => void
    ): void {
      emitter.on(event, callback as (data: SelectionEvents[keyof SelectionEvents]) => void);
    },

    off<K extends keyof SelectionEvents>(
      event: K,
      callback: (data: SelectionEvents[K]) => void
    ): void {
      emitter.off(event, callback as (data: SelectionEvents[keyof SelectionEvents]) => void);
    },
  };
}
