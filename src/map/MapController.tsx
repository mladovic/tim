import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';

export interface MapControllerHandle {
  flyToMemory: (lat: number, lng: number, zoom: number, duration?: number) => Promise<void>;
  followPosition: (lat: number, lng: number) => void;
  stopFollowing: () => void;
  isFlyingTo: () => boolean;
}

interface MapControllerProps {
  onReady: (handle: MapControllerHandle) => void;
}

export function MapController({ onReady }: MapControllerProps) {
  const map = useMap();
  const animatingRef = useRef(false);
  const followingRef = useRef(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const flyToMemory = useCallback(
    (lat: number, lng: number, zoom: number, duration = 3): Promise<void> => {
      if (animatingRef.current) {
        return Promise.resolve();
      }

      animatingRef.current = true;
      let resolved = false;

      return new Promise<void>((resolve) => {
        const handler = () => {
          if (resolved) return;
          resolved = true;
          animatingRef.current = false;
          resolve();
        };

        map.once('moveend', handler);
        map.flyTo([lat, lng], zoom, { duration });
      });
    },
    [map],
  );

  const followPosition = useCallback(
    (lat: number, lng: number) => {
      // Don't follow if a flyTo animation is in progress
      if (animatingRef.current) {
        return;
      }
      if (!followingRef.current) {
        followingRef.current = true;
      }
      map.panTo([lat, lng], { animate: false });
    },
    [map],
  );

  const stopFollowing = useCallback(() => {
    followingRef.current = false;
  }, []);

  const isFlyingTo = useCallback(() => {
    return animatingRef.current;
  }, []);

  useEffect(() => {
    onReadyRef.current({ flyToMemory, followPosition, stopFollowing, isFlyingTo });
  }, [flyToMemory, followPosition, stopFollowing, isFlyingTo]);

  return null;
}
