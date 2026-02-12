import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';

export interface MapControllerHandle {
  flyToMemory: (lat: number, lng: number, zoom: number, duration?: number) => Promise<void>;
}

interface MapControllerProps {
  onReady: (handle: MapControllerHandle) => void;
}

export function MapController({ onReady }: MapControllerProps) {
  const map = useMap();
  const animatingRef = useRef(false);
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

  useEffect(() => {
    onReadyRef.current({ flyToMemory });
  }, [flyToMemory]);

  return null;
}
