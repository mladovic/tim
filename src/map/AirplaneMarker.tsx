import { Marker } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { useAirplaneAnimation } from '../hooks/useAirplaneAnimation';

interface AirplaneMarkerProps {
  path: [number, number][];
  isAnimating: boolean;
  duration: number;
  onComplete: () => void;
  onPositionUpdate?: (position: [number, number]) => void;
}

/**
 * AirplaneMarker component that renders and animates an airplane icon along a path
 * Uses Leaflet DivIcon with SVG content for the airplane graphic
 */
export function AirplaneMarker({
  path,
  isAnimating,
  duration,
  onComplete,
  onPositionUpdate,
}: AirplaneMarkerProps): JSX.Element | null {
  const { position, rotation } = useAirplaneAnimation({
    path,
    duration,
    isAnimating,
    onComplete,
    onPositionUpdate,
  });

  // Don't render if not animating or no position available
  if (!isAnimating || !position) {
    return null;
  }

  // Create airplane SVG icon with rotation
  const airplaneIcon = new DivIcon({
    html: `
      <div style="transform: rotate(${rotation}deg); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 4 L18 14 L26 16 L18 18 L16 28 L14 18 L6 16 L14 14 Z" fill="#ec4899" stroke="#be185d" stroke-width="1.5"/>
        </svg>
      </div>
    `,
    className: 'airplane-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return <Marker position={position} icon={airplaneIcon} />;
}
