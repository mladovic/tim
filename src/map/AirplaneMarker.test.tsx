import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MapContainer } from 'react-leaflet';
import { AirplaneMarker } from './AirplaneMarker';

// Mock the useAirplaneAnimation hook
vi.mock('../hooks/useAirplaneAnimation', () => ({
  useAirplaneAnimation: vi.fn(),
}));

import { useAirplaneAnimation } from '../hooks/useAirplaneAnimation';

describe('AirplaneMarker', () => {
  const mockPath: [number, number][] = [
    [40.7128, -74.006],
    [41.8781, -87.6298],
  ];
  const mockOnComplete = vi.fn();
  const mockOnPositionUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isAnimating is false', () => {
    vi.mocked(useAirplaneAnimation).mockReturnValue({
      position: null,
      rotation: 0,
    });

    const { container } = render(
      <MapContainer center={[40.7128, -74.006]} zoom={10}>
        <AirplaneMarker
          path={mockPath}
          isAnimating={false}
          duration={2000}
          onComplete={mockOnComplete}
          onPositionUpdate={mockOnPositionUpdate}
        />
      </MapContainer>
    );

    // Should not render any marker
    const markers = container.querySelectorAll('.airplane-marker');
    expect(markers.length).toBe(0);
  });

  it('should not render when position is null', () => {
    vi.mocked(useAirplaneAnimation).mockReturnValue({
      position: null,
      rotation: 0,
    });

    const { container } = render(
      <MapContainer center={[40.7128, -74.006]} zoom={10}>
        <AirplaneMarker
          path={mockPath}
          isAnimating={true}
          duration={2000}
          onComplete={mockOnComplete}
          onPositionUpdate={mockOnPositionUpdate}
        />
      </MapContainer>
    );

    // Should not render any marker
    const markers = container.querySelectorAll('.airplane-marker');
    expect(markers.length).toBe(0);
  });

  it('should render when isAnimating is true and position is available', () => {
    const mockPosition: [number, number] = [40.7128, -74.006];
    vi.mocked(useAirplaneAnimation).mockReturnValue({
      position: mockPosition,
      rotation: 45,
    });

    const { container } = render(
      <MapContainer center={[40.7128, -74.006]} zoom={10}>
        <AirplaneMarker
          path={mockPath}
          isAnimating={true}
          duration={2000}
          onComplete={mockOnComplete}
          onPositionUpdate={mockOnPositionUpdate}
        />
      </MapContainer>
    );

    // Should render the airplane marker
    const markers = container.querySelectorAll('.airplane-marker');
    expect(markers.length).toBe(1);
  });

  it('should apply rotation transform to the airplane icon', () => {
    const mockPosition: [number, number] = [40.7128, -74.006];
    const mockRotation = 90;
    vi.mocked(useAirplaneAnimation).mockReturnValue({
      position: mockPosition,
      rotation: mockRotation,
    });

    const { container } = render(
      <MapContainer center={[40.7128, -74.006]} zoom={10}>
        <AirplaneMarker
          path={mockPath}
          isAnimating={true}
          duration={2000}
          onComplete={mockOnComplete}
          onPositionUpdate={mockOnPositionUpdate}
        />
      </MapContainer>
    );

    // Check that rotation is applied in the SVG container
    const markerElement = container.querySelector('.airplane-marker');
    expect(markerElement).toBeTruthy();
    expect(markerElement?.innerHTML).toContain(`rotate(${mockRotation}deg)`);
  });

  it('should call useAirplaneAnimation with correct parameters', () => {
    vi.mocked(useAirplaneAnimation).mockReturnValue({
      position: [40.7128, -74.006],
      rotation: 0,
    });

    render(
      <MapContainer center={[40.7128, -74.006]} zoom={10}>
        <AirplaneMarker
          path={mockPath}
          isAnimating={true}
          duration={3000}
          onComplete={mockOnComplete}
          onPositionUpdate={mockOnPositionUpdate}
        />
      </MapContainer>
    );

    expect(useAirplaneAnimation).toHaveBeenCalledWith({
      path: mockPath,
      duration: 3000,
      isAnimating: true,
      onComplete: mockOnComplete,
      onPositionUpdate: mockOnPositionUpdate,
    });
  });

  it('should pass onComplete callback to useAirplaneAnimation', () => {
    vi.mocked(useAirplaneAnimation).mockReturnValue({
      position: [40.7128, -74.006],
      rotation: 0,
    });

    render(
      <MapContainer center={[40.7128, -74.006]} zoom={10}>
        <AirplaneMarker
          path={mockPath}
          isAnimating={true}
          duration={2000}
          onComplete={mockOnComplete}
          onPositionUpdate={mockOnPositionUpdate}
        />
      </MapContainer>
    );

    // Verify the hook was called with the onComplete callback
    const callArgs = vi.mocked(useAirplaneAnimation).mock.calls[0][0];
    expect(callArgs.onComplete).toBe(mockOnComplete);
  });
});
