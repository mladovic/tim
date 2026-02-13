import type { Memory } from '../types';
import type { MapControllerHandle } from './MapController';
import { PathLines } from './PathLines';

export interface StoryPathLayerProps {
  isPlaying: boolean;
  currentIndex: number;
  memories: Memory[];
  mapHandle: MapControllerHandle | null;
}

/**
 * StoryPathLayer manages the visual path connections between memories.
 * Path lines are always visible, providing a constant visual representation
 * of the memory journey.
 */
export function StoryPathLayer({
  isPlaying,
  currentIndex,
  memories,
}: StoryPathLayerProps) {
  return (
    <>
      {/* Render path lines connecting all memories - always visible */}
      <PathLines memories={memories} currentIndex={currentIndex} isPlaying={isPlaying} />
    </>
  );
}
