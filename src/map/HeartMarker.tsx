import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Memory } from '../types';

export interface HeartMarkerProps {
  memory: Memory;
  isActive: boolean;
  onClick: (memory: Memory) => void;
}

const HEART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><path d="M16 28S3 18 3 10a6.5 6.5 0 0 1 13-1 6.5 6.5 0 0 1 13 1c0 8-13 18-13 18Z" fill="#fb7185" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`;

export function HeartMarker({ memory, isActive: _isActive, onClick }: HeartMarkerProps) {
  const icon = useMemo(
    () =>
      L.divIcon({
        html: HEART_SVG,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      }),
    [],
  );

  return (
    <Marker
      position={[memory.lat, memory.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(memory),
      }}
    />
  );
}
