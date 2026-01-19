export type EventCallback<T = unknown> = (data: T) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EventEmitter<Events extends { [K in keyof Events]: any }> {
  on<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void;
  off<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void;
  emit<K extends keyof Events>(event: K, data: Events[K]): void;
  once<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createEventEmitter<Events extends { [K in keyof Events]: any }>(): EventEmitter<Events> {
  const listeners = new Map<keyof Events, Set<EventCallback<unknown>>>();

  return {
    on<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(callback as EventCallback<unknown>);
    },

    off<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void {
      const set = listeners.get(event);
      if (set) {
        set.delete(callback as EventCallback<unknown>);
      }
    },

    emit<K extends keyof Events>(event: K, data: Events[K]): void {
      const set = listeners.get(event);
      if (set) {
        for (const callback of set) {
          callback(data);
        }
      }
    },

    once<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void {
      const wrapper: EventCallback<Events[K]> = (data) => {
        this.off(event, wrapper);
        callback(data);
      };
      this.on(event, wrapper);
    },
  };
}
