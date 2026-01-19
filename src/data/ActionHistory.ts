import type { EntityId } from '../utils/id';
import type { ActionLogEntry, ActionType } from '../entities/types';

export interface ActionHistory {
  record(animalId: EntityId, tick: number, action: ActionType, details: string): void;
  getHistory(animalId: EntityId, limit?: number): ActionLogEntry[];
  clear(): void;
  clearAnimal(animalId: EntityId): void;
}

export function createActionHistory(maxPerAnimal: number = 100): ActionHistory {
  const historyMap = new Map<EntityId, ActionLogEntry[]>();

  return {
    record(animalId: EntityId, tick: number, action: ActionType, details: string): void {
      if (!historyMap.has(animalId)) {
        historyMap.set(animalId, []);
      }

      const entries = historyMap.get(animalId)!;
      entries.push({ tick, action, details });

      // Trim to max size (keep most recent)
      if (entries.length > maxPerAnimal) {
        entries.shift();
      }
    },

    getHistory(animalId: EntityId, limit?: number): ActionLogEntry[] {
      const entries = historyMap.get(animalId) || [];
      if (limit && entries.length > limit) {
        return entries.slice(-limit);
      }
      return [...entries];
    },

    clear(): void {
      historyMap.clear();
    },

    clearAnimal(animalId: EntityId): void {
      historyMap.delete(animalId);
    },
  };
}

export function formatActionDetails(action: ActionType, targetId?: EntityId, details?: string): string {
  switch (action) {
    case 'DIE':
      return details || 'Died';
    case 'FLEE':
      return targetId ? `Fled from ${targetId}` : 'Fled';
    case 'EAT':
      if (details === 'vegetation') return 'Ate vegetation';
      if (details === 'corpse' && targetId) return `Ate corpse ${targetId}`;
      return 'Ate';
    case 'MOVE_TO_FOOD':
      return details === 'vegetation' ? 'Moving to vegetation' : (targetId ? `Moving to ${targetId}` : 'Moving to food');
    case 'ATTACK':
      return targetId ? `Attacked ${targetId}` : 'Attacked';
    case 'REPRODUCE':
      return 'Reproduced';
    case 'DRIFT':
      return 'Drifting';
    case 'STAY':
      return 'Staying';
    default:
      return action;
  }
}
