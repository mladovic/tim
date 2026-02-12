import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAirplaneAnimation } from './useAirplaneAnimation';

describe('useAirplaneAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Unit tests for animation hook', () => {
    it('should return null position when not animating', () => {
      const path: [number, number][] = [
        [0, 0],
        [1, 1],
      ];
      const onComplete = vi.fn();

      const { result } = renderHook(() =>
        useAirplaneAnimation({
          path,
          duration: 1000,
          isAnimating: false,
          onComplete,
        })
      );

      expect(result.current.position).toBeNull();
      expect(result.current.rotation).toBe(0);
    });

    it('should animate from start to end position', async () => {
      const path: [number, number][] = [
        [0, 0],
        [10, 10],
      ];
      const onComplete = vi.fn();
      const duration = 1000;

      const { result } = renderHook(() =>
        useAirplaneAnimation({
          path,
          duration,
          isAnimating: true,
          onComplete,
        })
      );

      // Advance to middle of animation
      await vi.advanceTimersByTimeAsync(duration / 2);

      // Position should be somewhere between start and end
      const midPosition = result.current.position;
      if (midPosition) {
        expect(midPosition[0]).toBeGreaterThan(0);
        expect(midPosition[0]).toBeLessThan(10);
      }

      // Advance to completion
      await vi.advanceTimersByTimeAsync(duration / 2 + 100);

      // Should reach end position
      const finalPosition = result.current.position;
      expect(finalPosition).not.toBeNull();
      if (finalPosition) {
        expect(finalPosition[0]).toBeCloseTo(10, 0);
        expect(finalPosition[1]).toBeCloseTo(10, 0);
      }

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should call onPositionUpdate during animation', () => {
      const path: [number, number][] = [
        [0, 0],
        [10, 10],
      ];
      const onComplete = vi.fn();
      const onPositionUpdate = vi.fn();
      const duration = 1000;

      renderHook(() =>
        useAirplaneAnimation({
          path,
          duration,
          isAnimating: true,
          onComplete,
          onPositionUpdate,
        })
      );

      // Advance animation
      vi.advanceTimersByTime(duration / 2);

      expect(onPositionUpdate).toHaveBeenCalled();
    });

    it('should cleanup animation frame on unmount', () => {
      const path: [number, number][] = [
        [0, 0],
        [10, 10],
      ];
      const onComplete = vi.fn();

      const { unmount } = renderHook(() =>
        useAirplaneAnimation({
          path,
          duration: 1000,
          isAnimating: true,
          onComplete,
        })
      );

      // Start animation
      vi.advanceTimersByTime(100);

      // Unmount should cleanup
      unmount();

      // Advance time further - onComplete should not be called
      vi.advanceTimersByTime(2000);

      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should stop animation when isAnimating becomes false', async () => {
      const path: [number, number][] = [
        [0, 0],
        [10, 10],
      ];
      const onComplete = vi.fn();

      const { result, rerender } = renderHook(
        ({ isAnimating }) =>
          useAirplaneAnimation({
            path,
            duration: 1000,
            isAnimating,
            onComplete,
          }),
        { initialProps: { isAnimating: true } }
      );

      // Start animation
      await vi.advanceTimersByTimeAsync(100);
      
      // Stop animation
      rerender({ isAnimating: false });

      // Position should be null
      expect(result.current.position).toBeNull();
    });

    it('should handle empty path gracefully', () => {
      const path: [number, number][] = [];
      const onComplete = vi.fn();

      const { result } = renderHook(() =>
        useAirplaneAnimation({
          path,
          duration: 1000,
          isAnimating: true,
          onComplete,
        })
      );

      expect(result.current.position).toBeNull();
    });

    it('should handle single point path gracefully', () => {
      const path: [number, number][] = [[5, 5]];
      const onComplete = vi.fn();

      const { result } = renderHook(() =>
        useAirplaneAnimation({
          path,
          duration: 1000,
          isAnimating: true,
          onComplete,
        })
      );

      expect(result.current.position).toBeNull();
    });
  });
});
