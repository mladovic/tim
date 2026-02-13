import { useEffect, useState, useRef } from 'react';
import type { Memory } from '../types';
import type { MapControllerHandle } from './MapController';
import { PathLines } from './PathLines';
import { AirplaneMarker } from './AirplaneMarker';
import { calculateCurvedPath } from './pathUtils';

export interface StoryPathLayerProps {
  isPlaying: boolean;
  currentIndex: number;
  memories: Memory[];
  mapHandle: MapControllerHandle | null;
}

const AIRPLANE_ANIMATION_DURATION = 2; // seconds
const DEFAULT_ZOOM_LEVEL = 13; // Default zoom level when memory doesn't specify one

/**
 * StoryPathLayer manages the visual path connections and airplane animation
 * during story mode playback. It coordinates path rendering, airplane movement,
 * and camera following.
 */
export function StoryPathLayer({
  isPlaying,
  currentIndex,
  memories,
  mapHandle,
}: StoryPathLayerProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPath, setCurrentPath] = useState<[number, number][] | null>(null);
  const previousIndexRef = useRef<number>(0);
  const destinationMemoryRef = useRef<Memory | null>(null);

  // Detect transitions and start airplane animation
  useEffect(() => {
    // Only animate when story mode is playing and we're moving to a new memory
    if (!isPlaying || !mapHandle || memories.length < 2) {
      setIsAnimating(false);
      setCurrentPath(null);
      destinationMemoryRef.current = null;
      return;
    }

    // Check if we've transitioned to a new memory
    const hasTransitioned = currentIndex > previousIndexRef.current && currentIndex > 0;
    
    if (hasTransitioned) {
      // Calculate path from previous memory to current memory
      const fromMemory = memories[currentIndex - 1];
      const toMemory = memories[currentIndex];

      if (fromMemory && toMemory) {
        const path = calculateCurvedPath(
          [fromMemory.lat, fromMemory.lng],
          [toMemory.lat, toMemory.lng]
        );

        setCurrentPath(path);
        setIsAnimating(true);
        destinationMemoryRef.current = toMemory;
      }
    }

    previousIndexRef.current = currentIndex;
  }, [isPlaying, currentIndex, memories, mapHandle]);

  // Handle airplane position updates for camera following
  const handlePositionUpdate = (position: [number, number]) => {
    if (mapHandle && isAnimating) {
      mapHandle.followPosition(position[0], position[1]);
    }
  };

  // Handle airplane animation completion
  const handleAnimationComplete = () => {
    setIsAnimating(false);
    setCurrentPath(null);
    
    if (mapHandle) {
      mapHandle.stopFollowing();
      
      // Trigger zoom transition to destination memory's zoom level
      const destinationMemory = destinationMemoryRef.current;
      if (destinationMemory) {
        const zoomLevel = destinationMemory.zoomLevel ?? DEFAULT_ZOOM_LEVEL;
        mapHandle.flyToMemory(
          destinationMemory.lat,
          destinationMemory.lng,
          zoomLevel,
          1 // Short duration for zoom transition
        );
      }
      
      destinationMemoryRef.current = null;
    }
  };

  // Clean up when story mode stops
  useEffect(() => {
    if (!isPlaying) {
      setIsAnimating(false);
      setCurrentPath(null);
      previousIndexRef.current = 0;
      destinationMemoryRef.current = null;
      
      if (mapHandle) {
        mapHandle.stopFollowing();
      }
    }
  }, [isPlaying, mapHandle]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapHandle) {
        mapHandle.stopFollowing();
      }
    };
  }, [mapHandle]);

  return (
    <>
      {/* Render path lines connecting all memories - always visible */}
      <PathLines memories={memories} currentIndex={currentIndex} />

      {/* Render airplane marker during transitions - only when story mode is active */}
      {isPlaying && isAnimating && currentPath && (
        <AirplaneMarker
          path={currentPath}
          isAnimating={isAnimating}
          duration={AIRPLANE_ANIMATION_DURATION}
          onComplete={handleAnimationComplete}
          onPositionUpdate={handlePositionUpdate}
        />
      )}
    </>
  );
}
