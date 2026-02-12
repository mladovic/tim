import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStoryMode } from './useStoryMode';
import type { Memory } from '../types';

const sampleMemories: Memory[] = [
  { id: 'm1', date: '2023-01-01', title: 'First', description: 'Desc 1', lat: 10, lng: 20, zoomLevel: 14 },
  { id: 'm2', date: '2023-06-15', title: 'Second', description: 'Desc 2', lat: 30, lng: 40, zoomLevel: 12 },
  { id: 'm3', date: '2024-01-01', title: 'Third', description: 'Desc 3', lat: 50, lng: 60, zoomLevel: 15 },
];

describe('useStoryMode', () => {
  let flyToMemory: ReturnType<typeof vi.fn>;
  let showCard: ReturnType<typeof vi.fn>;
  let hideCard: ReturnType<typeof vi.fn>;
  let onPlaybackStart: ReturnType<typeof vi.fn>;
  let onPlaybackEnd: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    flyToMemory = vi.fn().mockResolvedValue(undefined);
    showCard = vi.fn();
    hideCard = vi.fn();
    onPlaybackStart = vi.fn();
    onPlaybackEnd = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderStoryMode(overrides: Record<string, unknown> = {}) {
    return renderHook(() =>
      useStoryMode({
        memories: sampleMemories,
        flyToMemory,
        showCard,
        hideCard,
        onPlaybackStart,
        onPlaybackEnd,
        ...overrides,
      }),
    );
  }

  /** Call start and flush micro-tasks so the first fly + showCard execute */
  async function startPlayback(result: { current: ReturnType<typeof useStoryMode> }) {
    await act(async () => {
      result.current.start();
      await vi.advanceTimersByTimeAsync(0);
    });
  }

  /** Advance past one reading pause (5500ms), flushing resulting micro-tasks */
  async function advancePause() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5500);
    });
  }

  describe('initial state', () => {
    it('returns isPlaying false', () => {
      const { result } = renderStoryMode();
      expect(result.current.isPlaying).toBe(false);
    });

    it('returns null currentMemory', () => {
      const { result } = renderStoryMode();
      expect(result.current.currentMemory).toBeNull();
    });

    it('returns currentIndex 0', () => {
      const { result } = renderStoryMode();
      expect(result.current.currentIndex).toBe(0);
    });

    it('returns totalMemories matching array length', () => {
      const { result } = renderStoryMode();
      expect(result.current.totalMemories).toBe(3);
    });

    it('returns isEmpty false when memories exist', () => {
      const { result } = renderStoryMode();
      expect(result.current.isEmpty).toBe(false);
    });

    it('returns isEmpty true when memories array is empty', () => {
      const { result } = renderStoryMode({ memories: [] });
      expect(result.current.isEmpty).toBe(true);
      expect(result.current.totalMemories).toBe(0);
    });
  });

  describe('start action', () => {
    it('sets isPlaying to true', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);
      expect(result.current.isPlaying).toBe(true);
    });

    it('invokes onPlaybackStart callback', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);
      expect(onPlaybackStart).toHaveBeenCalledTimes(1);
    });

    it('is a no-op when already playing', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);
      flyToMemory.mockClear();
      onPlaybackStart.mockClear();

      await act(async () => {
        result.current.start();
      });

      expect(flyToMemory).not.toHaveBeenCalled();
      expect(onPlaybackStart).not.toHaveBeenCalled();
    });
  });

  describe('playback sequence', () => {
    it('flies to first memory with correct coordinates', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);
      expect(flyToMemory).toHaveBeenCalledWith(10, 20, 14);
    });

    it('shows card for first memory after fly completes', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);
      expect(showCard).toHaveBeenCalledWith(sampleMemories[0]);
    });

    it('sets currentMemory and currentIndex for first memory', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);
      expect(result.current.currentMemory).toEqual(sampleMemories[0]);
      expect(result.current.currentIndex).toBe(0);
    });

    it('hides card and advances to next memory after reading pause', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);
      await advancePause();

      expect(hideCard).toHaveBeenCalledTimes(1);
      expect(flyToMemory).toHaveBeenCalledTimes(2);
      expect(flyToMemory).toHaveBeenCalledWith(30, 40, 12);
      expect(showCard).toHaveBeenCalledWith(sampleMemories[1]);
      expect(result.current.currentIndex).toBe(1);
    });

    it('calls flyToMemory with correct coordinates for each memory in order', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);
      expect(flyToMemory).toHaveBeenNthCalledWith(1, 10, 20, 14);

      await advancePause();
      expect(flyToMemory).toHaveBeenNthCalledWith(2, 30, 40, 12);

      await advancePause();
      expect(flyToMemory).toHaveBeenNthCalledWith(3, 50, 60, 15);
    });

    it('shows card for each memory in sequence', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);
      expect(showCard).toHaveBeenNthCalledWith(1, sampleMemories[0]);

      await advancePause();
      expect(showCard).toHaveBeenNthCalledWith(2, sampleMemories[1]);

      await advancePause();
      expect(showCard).toHaveBeenNthCalledWith(3, sampleMemories[2]);
    });

    it('completes full sequence through all memories', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);

      for (let i = 0; i < 3; i++) {
        await advancePause();
      }

      expect(flyToMemory).toHaveBeenCalledTimes(3);
      expect(showCard).toHaveBeenCalledTimes(3);
      expect(hideCard).toHaveBeenCalledTimes(3);
    });
  });

  describe('playback completion', () => {
    it('resets isPlaying to false after all memories played', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);

      for (let i = 0; i < 3; i++) {
        await advancePause();
      }

      expect(result.current.isPlaying).toBe(false);
    });

    it('resets currentMemory to null after completion', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);

      for (let i = 0; i < 3; i++) {
        await advancePause();
      }

      expect(result.current.currentMemory).toBeNull();
    });

    it('resets currentIndex to 0 after completion', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);

      for (let i = 0; i < 3; i++) {
        await advancePause();
      }

      expect(result.current.currentIndex).toBe(0);
    });

    it('invokes onPlaybackEnd after all memories played', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);

      for (let i = 0; i < 3; i++) {
        await advancePause();
      }

      expect(onPlaybackEnd).toHaveBeenCalledTimes(1);
    });

    it('allows starting playback again after completion', async () => {
      const { result } = renderStoryMode();

      // First playback
      await startPlayback(result);
      for (let i = 0; i < 3; i++) {
        await advancePause();
      }
      expect(result.current.isPlaying).toBe(false);

      // Second playback
      flyToMemory.mockClear();
      showCard.mockClear();
      await startPlayback(result);
      expect(result.current.isPlaying).toBe(true);
      expect(flyToMemory).toHaveBeenCalledTimes(1);
      expect(showCard).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop action', () => {
    it('halts playback and resets isPlaying to false', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);

      await act(async () => {
        result.current.stop();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('calls hideCard when stopping during reading pause', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);
      hideCard.mockClear();

      await act(async () => {
        result.current.stop();
      });

      expect(hideCard).toHaveBeenCalledTimes(1);
    });

    it('resets currentMemory and currentIndex', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);

      await act(async () => {
        result.current.stop();
      });

      expect(result.current.currentMemory).toBeNull();
      expect(result.current.currentIndex).toBe(0);
    });

    it('does not call onPlaybackEnd when stopped', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);

      await act(async () => {
        result.current.stop();
      });

      expect(onPlaybackEnd).not.toHaveBeenCalled();
    });

    it('prevents the loop from continuing after stop', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);

      await act(async () => {
        result.current.stop();
      });

      flyToMemory.mockClear();

      // Advance past what would be the reading pause
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5500);
      });

      expect(flyToMemory).not.toHaveBeenCalled();
    });

    it('is a no-op when not playing', async () => {
      const { result } = renderStoryMode();

      await act(async () => {
        result.current.stop();
      });

      expect(hideCard).not.toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(false);
    });

    it('allows restarting playback after stop', async () => {
      const { result } = renderStoryMode();
      await startPlayback(result);

      await act(async () => {
        result.current.stop();
      });

      expect(result.current.isPlaying).toBe(false);

      flyToMemory.mockClear();
      showCard.mockClear();
      await startPlayback(result);
      expect(result.current.isPlaying).toBe(true);
      expect(flyToMemory).toHaveBeenCalledTimes(1);
      expect(showCard).toHaveBeenCalledTimes(1);
    });
  });

  describe('timeout guard', () => {
    it('auto-advances when flyToMemory does not resolve within 10 seconds', async () => {
      flyToMemory = vi.fn().mockReturnValue(new Promise(() => {}));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderStoryMode();

      await act(async () => {
        result.current.start();
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(flyToMemory).toHaveBeenCalledTimes(1);
      expect(showCard).not.toHaveBeenCalled();

      // Advance past the 10-second timeout guard
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10000);
      });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(showCard).toHaveBeenCalledTimes(1);

      warnSpy.mockRestore();
    });

    it('does not log a warning when flyToMemory resolves normally', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderStoryMode();
      await startPlayback(result);

      for (let i = 0; i < 3; i++) {
        await advancePause();
      }

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('start is a no-op with empty memories', async () => {
      const { result } = renderStoryMode({ memories: [] });

      await act(async () => {
        result.current.start();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(flyToMemory).not.toHaveBeenCalled();
      expect(onPlaybackStart).not.toHaveBeenCalled();
    });

    it('start is a no-op with null flyToMemory', async () => {
      const { result } = renderStoryMode({ flyToMemory: null });

      await act(async () => {
        result.current.start();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(onPlaybackStart).not.toHaveBeenCalled();
    });
  });

  describe('unmount cleanup', () => {
    it('cleans up on unmount during playback without errors', async () => {
      const { result, unmount } = renderStoryMode();
      await startPlayback(result);

      showCard.mockClear();
      flyToMemory.mockClear();

      unmount();

      // Advancing timers after unmount should not cause errors or continue playback
      await vi.advanceTimersByTimeAsync(20000);

      expect(flyToMemory).not.toHaveBeenCalled();
    });

    it('does not throw on unmount when not playing', () => {
      const { unmount } = renderStoryMode();
      expect(() => unmount()).not.toThrow();
    });
  });
});
