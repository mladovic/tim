import { useEffect, useRef, useState } from 'react';

interface UseAirplaneAnimationParams {
  path: [number, number][];
  duration: number;
  isAnimating: boolean;
  onComplete: () => void;
  onPositionUpdate?: (position: [number, number]) => void;
}

interface UseAirplaneAnimationResult {
  position: [number, number] | null;
  rotation: number;
}

/**
 * Custom hook for animating an airplane along a path
 * Uses requestAnimationFrame for smooth 60fps animation
 */
export function useAirplaneAnimation({
  path,
  duration,
  isAnimating,
  onComplete,
  onPositionUpdate,
}: UseAirplaneAnimationParams): UseAirplaneAnimationResult {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAnimating || path.length < 2) {
      setPosition(null);
      setRotation(0);
      startTimeRef.current = null;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Start animation
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Calculate position along path based on progress
      const currentPosition = interpolatePosition(path, progress);
      setPosition(currentPosition);

      // Calculate rotation based on direction
      if (progress > 0) {
        const prevProgress = Math.max(0, progress - 0.01);
        const prevPosition = interpolatePosition(path, prevProgress);
        const angle = calculateBearing(prevPosition, currentPosition);
        setRotation(angle);
      }

      // Emit position update for camera following
      if (onPositionUpdate) {
        onPositionUpdate(currentPosition);
      }

      // Continue animation or complete
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
        onComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount or when animation stops
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [path, duration, isAnimating, onComplete, onPositionUpdate]);

  return { position, rotation };
}

/**
 * Interpolate position along path based on progress (0 to 1)
 */
function interpolatePosition(
  path: [number, number][],
  progress: number
): [number, number] {
  if (progress <= 0) return path[0];
  if (progress >= 1) return path[path.length - 1];

  // Calculate total path length
  const segmentLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const length = distance(path[i], path[i + 1]);
    segmentLengths.push(length);
    totalLength += length;
  }

  // Find target distance along path
  const targetDistance = progress * totalLength;

  // Find which segment contains the target distance
  let accumulatedDistance = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    const segmentLength = segmentLengths[i];
    if (accumulatedDistance + segmentLength >= targetDistance) {
      // Interpolate within this segment
      const segmentProgress =
        (targetDistance - accumulatedDistance) / segmentLength;
      return interpolateSegment(path[i], path[i + 1], segmentProgress);
    }
    accumulatedDistance += segmentLength;
  }

  // Fallback to end position
  return path[path.length - 1];
}

/**
 * Linear interpolation between two points
 */
function interpolateSegment(
  start: [number, number],
  end: [number, number],
  progress: number
): [number, number] {
  const lat = start[0] + (end[0] - start[0]) * progress;
  const lng = start[1] + (end[1] - start[1]) * progress;
  return [lat, lng];
}

/**
 * Calculate distance between two coordinates (simple Euclidean for path segments)
 */
function distance(p1: [number, number], p2: [number, number]): number {
  const dLat = p2[0] - p1[0];
  const dLng = p2[1] - p1[1];
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Calculate bearing (rotation angle) from one point to another
 * Returns angle in degrees (0 = North, 90 = East, etc.)
 */
function calculateBearing(
  from: [number, number],
  to: [number, number]
): number {
  const dLng = to[1] - from[1];
  const dLat = to[0] - from[0];
  const angleRad = Math.atan2(dLng, dLat);
  const angleDeg = (angleRad * 180) / Math.PI;
  return angleDeg;
}
