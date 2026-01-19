import { describe, it, expect, vi } from 'vitest';
import { createEventEmitter } from '../../../src/utils/events';

interface TestEvents {
  tick: number;
  death: { id: string; cause: string };
  empty: void;
}

describe('EventEmitter', () => {
  describe('on and emit', () => {
    it('calls registered callback when event is emitted', () => {
      const emitter = createEventEmitter<TestEvents>();
      const callback = vi.fn();

      emitter.on('tick', callback);
      emitter.emit('tick', 42);

      expect(callback).toHaveBeenCalledWith(42);
    });

    it('supports multiple callbacks for same event', () => {
      const emitter = createEventEmitter<TestEvents>();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      emitter.on('tick', callback1);
      emitter.on('tick', callback2);
      emitter.emit('tick', 100);

      expect(callback1).toHaveBeenCalledWith(100);
      expect(callback2).toHaveBeenCalledWith(100);
    });

    it('handles complex event data', () => {
      const emitter = createEventEmitter<TestEvents>();
      const callback = vi.fn();

      emitter.on('death', callback);
      emitter.emit('death', { id: 'deer_1', cause: 'starvation' });

      expect(callback).toHaveBeenCalledWith({ id: 'deer_1', cause: 'starvation' });
    });

    it('does not call callback for other events', () => {
      const emitter = createEventEmitter<TestEvents>();
      const tickCallback = vi.fn();
      const deathCallback = vi.fn();

      emitter.on('tick', tickCallback);
      emitter.on('death', deathCallback);
      emitter.emit('tick', 1);

      expect(tickCallback).toHaveBeenCalled();
      expect(deathCallback).not.toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('removes callback so it no longer receives events', () => {
      const emitter = createEventEmitter<TestEvents>();
      const callback = vi.fn();

      emitter.on('tick', callback);
      emitter.emit('tick', 1);
      expect(callback).toHaveBeenCalledTimes(1);

      emitter.off('tick', callback);
      emitter.emit('tick', 2);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('only removes the specified callback', () => {
      const emitter = createEventEmitter<TestEvents>();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      emitter.on('tick', callback1);
      emitter.on('tick', callback2);
      emitter.off('tick', callback1);
      emitter.emit('tick', 1);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('handles removing non-existent callback gracefully', () => {
      const emitter = createEventEmitter<TestEvents>();
      const callback = vi.fn();

      // Should not throw
      expect(() => emitter.off('tick', callback)).not.toThrow();
    });
  });

  describe('once', () => {
    it('calls callback only once, then auto-unregisters', () => {
      const emitter = createEventEmitter<TestEvents>();
      const callback = vi.fn();

      emitter.once('tick', callback);
      emitter.emit('tick', 1);
      emitter.emit('tick', 2);
      emitter.emit('tick', 3);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(1);
    });

    it('works with multiple once callbacks', () => {
      const emitter = createEventEmitter<TestEvents>();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      emitter.once('tick', callback1);
      emitter.once('tick', callback2);
      emitter.emit('tick', 100);

      expect(callback1).toHaveBeenCalledWith(100);
      expect(callback2).toHaveBeenCalledWith(100);

      emitter.emit('tick', 200);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('emit with no listeners', () => {
    it('does not throw when emitting event with no listeners', () => {
      const emitter = createEventEmitter<TestEvents>();
      expect(() => emitter.emit('tick', 1)).not.toThrow();
    });
  });
});
