import { Polyline } from 'react-leaflet';
import type { Memory } from '../types';

export interface PathLinesProps {
  memories: Memory[];
  currentIndex: number;
  isPlaying: boolean;
}

/**
 * Renders straight dashed path lines connecting consecutive memories in chronological order.
 * Highlights the current path segment being traveled during story mode transitions.
 */
export function PathLines({ memories, currentIndex, isPlaying }: PathLinesProps) {
  // Need at least 2 memories to create a path
  if (memories.length < 2) {
    return null;
  }

  // Generate path segments for consecutive memory pairs
  const pathSegments = [];
  for (let i = 0; i < memories.length - 1; i++) {
    const from = memories[i];
    const to = memories[i + 1];
    
    // Straight line path - just start and end coordinates
    const path: [number, number][] = [
      [from.lat, from.lng],
      [to.lat, to.lng]
    ];

    // Highlight the current segment during story mode transitions
    const isCurrentSegment = isPlaying && i === currentIndex - 1;

    pathSegments.push({
      key: `${from.id}-${to.id}`,
      path,
      isCurrentSegment,
    });
  }

  return (
    <>
      {pathSegments.map(({ key, path, isCurrentSegment }) => (
        <Polyline
          key={key}
          positions={path}
          pathOptions={{
            color: isCurrentSegment ? '#fb7185' : '#fda4af',
            weight: isCurrentSegment ? 3 : 2,
            opacity: isCurrentSegment ? 0.9 : 0.6,
            dashArray: '10, 10',
          }}
          pane="overlayPane"
        />
      ))}
    </>
  );
}
