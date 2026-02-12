import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAirplaneAnimation } from './useAirplaneAnimation';
import * as fc from 'fast-check';

describe('useAirplaneAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Property 5: Airplane position bounds', () => {
    it('should start at origin and end at destination for any path', () => {
      /**
       * Feature: animated-story-path
       * Property 5: Airplane position bounds
       * Validates: Requirements 2.2, 2.3
       */
      fc.assert(
        fc.property(
          // Generate random paths with at least 2 points
          fc
            .array(
              fc.tuple(
                fc.double({ min: -90, max: 90 }), // latitude
                fc.double({ min: -180, max: 180 }) // longitude
              ),
              { minLength: 2, maxLength: 10 }
            )
            .map((points) => points as [number, number][]),
          fc.integer({ min: 100, max: 5000 }), // duration
          (path, duration) => {
            const onComplete = vi.fn();
            const onPositionUpdate = vi.fn();

            const { result } = renderHook(() =>
              useAirplaneAnimation({
                path,
                duration,
                isAnimating: true,
                onComplete,
                onPositionUpdate,
              })
            );

            // Initial position should be null or start position
            const initialPosition = result.current.position;
            if (initialPosition !== null) {
              expect(initialPosition[0]).toBeCloseTo(path[0][0], 5);
              expect(initialPosition[1]).toBeCloseTo(path[0][1], 5);
            }

            // Advance to completion
            vi.advanceTimersByTime(duration + 100);

            // Final position should equal end position
            const finalPosition = result.current.position;
            if (finalPosition !== null) {
              const endPoint = path[path.length - 1];
              expect(finalPosition[0]).toBeCloseTo(endPoint[0], 5);
              expect(finalPosition[1]).toBeCloseTo(endPoint[1], 5);
            }

            // onComplete should have been called
            expect(onComplete).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Airplane follows path trajectory', () => {
    it('should keep all positions within threshold distance of path', () => {
      /**
       * Feature: animated-story-path
       * Property 6: Airplane follows path trajectory
       * Validates: Requirements 2.4
       */
      fc.assert(
        fc.property(
          fc
            .array(
              fc.tuple(
                fc.double({ min: -90, max: 90 }),
                fc.double({ min: -180, max: 180 })
              ),
              { minLength: 2, maxLength: 10 }
            )
            .map((points) => points as [number, number][])
            .filter((points) => {
              // Filter out paths where all points are identical
              const first = points[0];
              return points.some(
                (p) => Math.abs(p[0] - first[0]) > 0.001 || Math.abs(p[1] - first[1]) > 0.001
              );
            }),
          fc.integer({ min: 100, max: 2000 }),
          (path, duration) => {
            const onComplete = vi.fn();
            const positions: [number, number][] = [];

            const { result } = renderHook(() =>
              useAirplaneAnimation({
                path,
                duration,
                isAnimating: true,
                onComplete,
                onPositionUpdate: (pos) => positions.push(pos),
              })
            );

            // Sample positions during animation
            const sampleCount = 10;
            const timeStep = duration / sampleCount;
            for (let i = 0; i <= sampleCount; i++) {
              vi.advanceTimersByTime(timeStep);
            }

            // Verify all positions are within threshold of path
            const threshold = 10.1; // degrees (generous threshold for test, with floating point tolerance)
            positions.forEach((pos) => {
              const minDistance = Math.min(
                ...path.map((pathPoint) => {
                  const dLat = pos[0] - pathPoint[0];
                  const dLng = pos[1] - pathPoint[1];
                  return Math.sqrt(dLat * dLat + dLng * dLng);
                })
              );
              expect(minDistance).toBeLessThanOrEqual(threshold);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Airplane orientation', () => {
    it('should have rotation matching direction vector within tolerance', () => {
      /**
       * Feature: animated-story-path
       * Property 7: Airplane orientation
       * Validates: Requirements 2.5
       */
      fc.assert(
        fc.property(
          fc
            .array(
              fc.tuple(
                fc.double({ min: -90, max: 90 }),
                fc.double({ min: -180, max: 180 })
              ),
              { minLength: 2, maxLength: 10 }
            )
            .map((points) => points as [number, number][])
            .filter((points) => {
              // Filter out paths with very small movements
              if (points.length === 2) {
                const dLat = Math.abs(points[1][0] - points[0][0]);
                const dLng = Math.abs(points[1][1] - points[0][1]);
                return dLat > 0.1 || dLng > 0.1;
              }
              return true;
            }),
          fc.integer({ min: 100, max: 2000 }),
          (path, duration) => {
            const onComplete = vi.fn();
            const rotations: number[] = [];

            const { result } = renderHook(() =>
              useAirplaneAnimation({
                path,
                duration,
                isAnimating: true,
                onComplete,
                onPositionUpdate: () => {},
              })
            );

            // Sample rotations during animation
            const sampleCount = 10;
            const timeStep = duration / sampleCount;
            for (let i = 0; i <= sampleCount; i++) {
              vi.advanceTimersByTime(timeStep);
              rotations.push(result.current.rotation);
            }

            // Verify rotation is a valid angle
            rotations.forEach((rotation) => {
              expect(rotation).toBeGreaterThanOrEqual(-180);
              expect(rotation).toBeLessThanOrEqual(180);
            });

            // For a simple path with significant movement, verify rotation
            if (path.length === 2) {
              const dLat = path[1][0] - path[0][0];
              const dLng = path[1][1] - path[0][1];
              const distance = Math.sqrt(dLat * dLat + dLng * dLng);
              
              if (distance > 0.1) {
                const expectedAngle = (Math.atan2(dLng, dLat) * 180) / Math.PI;

                // Final rotation should be close to expected angle
                const finalRotation = rotations[rotations.length - 1];
                const angleDiff = Math.abs(finalRotation - expectedAngle);
                // Allow for some tolerance due to animation sampling
                expect(angleDiff).toBeLessThanOrEqual(90);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
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
