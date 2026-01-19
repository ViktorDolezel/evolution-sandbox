import { describe, it, expect, beforeEach } from 'vitest';
import { createEntityManager } from '../../../src/entities/EntityManager';
import { createAnimal } from '../../../src/entities/Animal';
import { createCorpseFromAnimal } from '../../../src/entities/Corpse';
import { getDefaultConfig } from '../../../src/config/defaults';
import { createIdGenerator } from '../../../src/utils/id';
import type { SimulationConfig } from '../../../src/config/types';
import type { EntityManager } from '../../../src/entities/EntityManager';

describe('EntityManager', () => {
  let config: SimulationConfig;
  let deerIdGen: () => string;
  let wolfIdGen: () => string;
  let corpseIdGen: () => string;
  let manager: EntityManager;

  beforeEach(() => {
    config = getDefaultConfig();
    deerIdGen = createIdGenerator('deer');
    wolfIdGen = createIdGenerator('wolf');
    corpseIdGen = createIdGenerator('corpse');
    manager = createEntityManager();
  });

  describe('animal operations', () => {
    describe('addAnimal', () => {
      it('adds an animal to the manager', () => {
        const animal = createAnimal(
          { species: 'deer', position: { x: 0, y: 0 } },
          config,
          deerIdGen
        );

        manager.addAnimal(animal);

        expect(manager.getAnimal(animal.id)).toBe(animal);
      });

      it('increments animal count', () => {
        expect(manager.getAnimalCount()).toBe(0);

        const animal = createAnimal(
          { species: 'deer', position: { x: 0, y: 0 } },
          config,
          deerIdGen
        );
        manager.addAnimal(animal);

        expect(manager.getAnimalCount()).toBe(1);
      });
    });

    describe('removeAnimal', () => {
      it('removes an animal from the manager', () => {
        const animal = createAnimal(
          { species: 'deer', position: { x: 0, y: 0 } },
          config,
          deerIdGen
        );
        manager.addAnimal(animal);
        manager.removeAnimal(animal.id);

        expect(manager.getAnimal(animal.id)).toBeUndefined();
      });

      it('decrements animal count', () => {
        const animal = createAnimal(
          { species: 'deer', position: { x: 0, y: 0 } },
          config,
          deerIdGen
        );
        manager.addAnimal(animal);
        manager.removeAnimal(animal.id);

        expect(manager.getAnimalCount()).toBe(0);
      });

      it('handles removing non-existent animal gracefully', () => {
        expect(() => manager.removeAnimal('nonexistent')).not.toThrow();
      });
    });

    describe('getAnimal', () => {
      it('returns undefined for non-existent animal', () => {
        expect(manager.getAnimal('nonexistent')).toBeUndefined();
      });
    });

    describe('getAllAnimals', () => {
      it('returns empty array when no animals', () => {
        expect(manager.getAllAnimals()).toEqual([]);
      });

      it('returns all animals', () => {
        const deer = createAnimal(
          { species: 'deer', position: { x: 0, y: 0 } },
          config,
          deerIdGen
        );
        const wolf = createAnimal(
          { species: 'wolf', position: { x: 100, y: 100 } },
          config,
          wolfIdGen
        );

        manager.addAnimal(deer);
        manager.addAnimal(wolf);

        const all = manager.getAllAnimals();
        expect(all).toHaveLength(2);
        expect(all).toContain(deer);
        expect(all).toContain(wolf);
      });
    });

    describe('getAnimalsBySpecies', () => {
      it('returns only animals of specified species', () => {
        const deer1 = createAnimal(
          { species: 'deer', position: { x: 0, y: 0 } },
          config,
          deerIdGen
        );
        const deer2 = createAnimal(
          { species: 'deer', position: { x: 50, y: 50 } },
          config,
          deerIdGen
        );
        const wolf = createAnimal(
          { species: 'wolf', position: { x: 100, y: 100 } },
          config,
          wolfIdGen
        );

        manager.addAnimal(deer1);
        manager.addAnimal(deer2);
        manager.addAnimal(wolf);

        const deers = manager.getAnimalsBySpecies('deer');
        expect(deers).toHaveLength(2);
        expect(deers).toContain(deer1);
        expect(deers).toContain(deer2);
        expect(deers).not.toContain(wolf);
      });
    });

    describe('getLivingAnimals', () => {
      it('excludes dead animals', () => {
        const alive = createAnimal(
          { species: 'deer', position: { x: 0, y: 0 } },
          config,
          deerIdGen
        );
        const dead = createAnimal(
          { species: 'deer', position: { x: 50, y: 50 } },
          config,
          deerIdGen
        );
        dead.state.isDead = true;

        manager.addAnimal(alive);
        manager.addAnimal(dead);

        const living = manager.getLivingAnimals();
        expect(living).toHaveLength(1);
        expect(living).toContain(alive);
      });
    });

    describe('updateAnimal', () => {
      it('updates animal properties', () => {
        const animal = createAnimal(
          { species: 'deer', position: { x: 0, y: 0 } },
          config,
          deerIdGen
        );
        manager.addAnimal(animal);

        manager.updateAnimal(animal.id, {
          state: { ...animal.state, hunger: 50 },
        });

        const updated = manager.getAnimal(animal.id);
        expect(updated?.state.hunger).toBe(50);
      });
    });
  });

  describe('corpse operations', () => {
    describe('addCorpse', () => {
      it('adds a corpse to the manager', () => {
        const animal = createAnimal(
          { species: 'deer', position: { x: 0, y: 0 } },
          config,
          deerIdGen
        );
        const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);

        manager.addCorpse(corpse);

        expect(manager.getCorpse(corpse.id)).toBe(corpse);
      });

      it('increments corpse count', () => {
        expect(manager.getCorpseCount()).toBe(0);

        const animal = createAnimal(
          { species: 'deer', position: { x: 0, y: 0 } },
          config,
          deerIdGen
        );
        const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);
        manager.addCorpse(corpse);

        expect(manager.getCorpseCount()).toBe(1);
      });
    });

    describe('removeCorpse', () => {
      it('removes a corpse from the manager', () => {
        const animal = createAnimal(
          { species: 'deer', position: { x: 0, y: 0 } },
          config,
          deerIdGen
        );
        const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);
        manager.addCorpse(corpse);
        manager.removeCorpse(corpse.id);

        expect(manager.getCorpse(corpse.id)).toBeUndefined();
      });
    });

    describe('getAllCorpses', () => {
      it('returns all corpses', () => {
        const animal1 = createAnimal(
          { species: 'deer', position: { x: 0, y: 0 } },
          config,
          deerIdGen
        );
        const animal2 = createAnimal(
          { species: 'wolf', position: { x: 100, y: 100 } },
          config,
          wolfIdGen
        );
        const corpse1 = createCorpseFromAnimal(animal1, config, corpseIdGen);
        const corpse2 = createCorpseFromAnimal(animal2, config, corpseIdGen);

        manager.addCorpse(corpse1);
        manager.addCorpse(corpse2);

        const all = manager.getAllCorpses();
        expect(all).toHaveLength(2);
      });
    });
  });

  describe('clear', () => {
    it('removes all animals and corpses', () => {
      const animal = createAnimal(
        { species: 'deer', position: { x: 0, y: 0 } },
        config,
        deerIdGen
      );
      const corpse = createCorpseFromAnimal(animal, config, corpseIdGen);

      manager.addAnimal(animal);
      manager.addCorpse(corpse);
      manager.clear();

      expect(manager.getAnimalCount()).toBe(0);
      expect(manager.getCorpseCount()).toBe(0);
    });
  });
});
