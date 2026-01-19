import type { Animal, Corpse, Species } from './types';
import type { EntityId } from '../utils/id';

export interface EntityManager {
  // Animals
  addAnimal(animal: Animal): void;
  removeAnimal(id: EntityId): void;
  getAnimal(id: EntityId): Animal | undefined;
  getAllAnimals(): Animal[];
  getAnimalsBySpecies(species: Species): Animal[];
  getLivingAnimals(): Animal[];

  // Corpses
  addCorpse(corpse: Corpse): void;
  removeCorpse(id: EntityId): void;
  getCorpse(id: EntityId): Corpse | undefined;
  getAllCorpses(): Corpse[];

  // Counts
  getAnimalCount(): number;
  getCorpseCount(): number;

  // Bulk operations
  updateAnimal(id: EntityId, updates: Partial<Animal>): void;
  clear(): void;
}

export function createEntityManager(): EntityManager {
  const animals = new Map<EntityId, Animal>();
  const corpses = new Map<EntityId, Corpse>();

  return {
    // Animals
    addAnimal(animal: Animal): void {
      animals.set(animal.id, animal);
    },

    removeAnimal(id: EntityId): void {
      animals.delete(id);
    },

    getAnimal(id: EntityId): Animal | undefined {
      return animals.get(id);
    },

    getAllAnimals(): Animal[] {
      return Array.from(animals.values());
    },

    getAnimalsBySpecies(species: Species): Animal[] {
      return Array.from(animals.values()).filter(a => a.species === species);
    },

    getLivingAnimals(): Animal[] {
      return Array.from(animals.values()).filter(a => !a.state.isDead);
    },

    // Corpses
    addCorpse(corpse: Corpse): void {
      corpses.set(corpse.id, corpse);
    },

    removeCorpse(id: EntityId): void {
      corpses.delete(id);
    },

    getCorpse(id: EntityId): Corpse | undefined {
      return corpses.get(id);
    },

    getAllCorpses(): Corpse[] {
      return Array.from(corpses.values());
    },

    // Counts
    getAnimalCount(): number {
      return animals.size;
    },

    getCorpseCount(): number {
      return corpses.size;
    },

    // Bulk operations
    updateAnimal(id: EntityId, updates: Partial<Animal>): void {
      const animal = animals.get(id);
      if (animal) {
        animals.set(id, { ...animal, ...updates });
      }
    },

    clear(): void {
      animals.clear();
      corpses.clear();
    },
  };
}
