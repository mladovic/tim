import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MapContainer } from 'react-leaflet';
import { StoryPathLayer } from './StoryPathLayer';
import type { Memory } from '../types';
import type { MapControllerHandle } from './MapController';

// Helper to create a test memory
function createMemory(id: string, lat: number, lng: number): Memory {
  return {
    id,
    date: '2024-01-01',
    title: `Memory ${id}`,
    description: 'Test memory',
    lat,
    lng,
  };
}

// Helper to create a mock map handle
function createMockMapHandle(): MapControllerHandle {
  return {
    flyToMemory: vi.fn().mockResolvedValue(undefined),
    followPosition: vi.fn(),
    stopFollowing: vi.fn(),
  };
}

describe('StoryPathLayer', () => {
  /**
   * Unit tests for StoryPathLayer component
   * Validates: Requirements 1.5, 4.1, 4.4
   */
  describe('rendering behavior', () => {
    it('should render nothing when story mode is not active', () => {
      const memories = [
        createMemory('1', 45.5, 12.3),
        createMemory('2', 46.0, 13.0),
      ];
      const mapHandle = createMockMapHandle();

      const { container } = render(
        <MapContainer center={[0, 0]} zoom={2}>
          <StoryPathLayer
            isPlaying={false}
            currentIndex={0}
            memories={memories}
            mapHandle={mapHandle}
          />
        </MapContainer>
      );

      // Should not render any polylines when story mode is inactive
      const polylines = container.querySelectorAll('.leaflet-interactive');
      expect(polylines.length).toBe(0);
    });

    it('should render path lines when story mode is active', () => {
      const memories = [
        createMemory('1', 45.5, 12.3),
        createMemory('2', 46.0, 13.0),
        createMemory('3', 46.5, 13.5),
      ];
      const mapHandle = createMockMapHandle();

      const { container } = render(
        <MapContainer center={[0, 0]} zoom={2}>
          <StoryPathLayer
            isPlaying={true}
            currentIndex={0}
            memories={memories}
            mapHandle={mapHandle}
          />
        </MapContainer>
      );

      // Should render path lines when story mode is active
      const polylines = container.querySelectorAll('.leaflet-interactive');
      expect(polylines.length).toBeGreaterThan(0);
    });

    it('should not render airplane marker initially', () => {
      const memories = [
        createMemory('1', 45.5, 12.3),
        createMemory('2', 46.0, 13.0),
      ];
      const mapHandle = createMockMapHandle();

      const { container } = render(
        <MapContainer center={[0, 0]} zoom={2}>
          <StoryPathLayer
            isPlaying={true}
            currentIndex={0}
            memories={memories}
            mapHandle={mapHandle}
          />
        </MapContainer>
      );

      // Should not render airplane marker at index 0
      const airplaneMarker = container.querySelector('.airplane-marker');
      expect(airplaneMarker).toBeNull();
    });
  });

  describe('transition coordination', () => {
    it('should trigger airplane animation when transitioning to next memory', async () => {
      const memories = [
        createMemory('1', 45.5, 12.3),
        createMemory('2', 46.0, 13.0),
      ];
      const mapHandle = createMockMapHandle();

      const { container, rerender } = render(
        <MapContainer center={[0, 0]} zoom={2}>
          <StoryPathLayer
            isPlaying={true}
            currentIndex={0}
            memories={memories}
            mapHandle={mapHandle}
          />
        </MapContainer>
      );

      // Initially no airplane marker
      expect(container.querySelector('.airplane-marker')).toBeNull();

      // Transition to next memory
      rerender(
        <MapContainer center={[0, 0]} zoom={2}>
          <StoryPathLayer
            isPlaying={true}
            currentIndex={1}
            memories={memories}
            mapHandle={mapHandle}
          />
        </MapContainer>
      );

      // Should render airplane marker during transition
      await waitFor(() => {
        const airplaneMarker = container.querySelector('.airplane-marker');
        expect(airplaneMarker).not.toBeNull();
      });
    });

    it('should call followPosition during airplane animation', async () => {
      const memories = [
        createMemory('1', 45.5, 12.3),
        createMemory('2', 46.0, 13.0),
      ];
      const mapHandle = createMockMapHandle();

      const { rerender } = render(
        <MapContainer center={[0, 0]} zoom={2}>
          <StoryPathLayer
            isPlaying={true}
            currentIndex={0}
            memories={memories}
            mapHandle={mapHandle}
          />
        </MapContainer>
      );

      // Transition to next memory
      rerender(
        <MapContainer center={[0, 0]} zoom={2}>
          <StoryPathLayer
            isPlaying={true}
            currentIndex={1}
            memories={memories}
            mapHandle={mapHandle}
          />
        </MapContainer>
      );

      // Should call followPosition during animation
      await waitFor(
        () => {
          expect(mapHandle.followPosition).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it('should call stopFollowing when animation completes', async () => {
      const memories = [
        createMemory('1', 45.5, 12.3),
        createMemory('2', 46.0, 13.0),
      ];
      const mapHandle = createMockMapHandle();

      const { rerender } = render(
        <MapContainer center={[0, 0]} zoom={2}>
          <StoryPathLayer
            isPlaying={true}
            currentIndex={0}
            memories={memories}
            mapHandle={mapHandle}
          />
        </MapContainer>
      );

      // Transition to next memory
      rerender(
        <MapContainer center={[0, 0]} zoom={2}>
          <StoryPathLayer
            isPlaying={true}
            currentIndex={1}
            memories={memories}
            mapHandle={mapHandle}
          />
        </MapContainer>
      );

      // Should call stopFollowing after animation completes (2 seconds + buffer)
      await waitFor(
        () => {
          expect(mapHandle.stopFollowing).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('cleanup behavior', () => {
    it('should clean up when story mode stops', () => {
      const memories = [
        createMemory('1', 45.5, 12.3),
        createMemory('2', 46.0, 13.0),
      ];
      const mapHandle = createMockMapHandle();

      const { container, rerender } = render(
        <MapContainer center={[0, 0]} zoom={2}>
          <StoryPathLayer
            isPlaying={true}
            currentIndex={0}
            memories={memories}
            mapHandle={mapHandle}
          />
        </MapContainer>
      );

      // Verify path lines are rendered
      expect(container.querySelectorAll('.leaflet-interactive').length).toBeGreaterThan(0);

      // Stop story mode
      rerender(
        <MapContainer center={[0, 0]} zoom={2}>
          <StoryPathLayer
            isPlaying={false}
            currentIndex={0}
            memories={memories}
            mapHandle={mapHandle}
          />
        </MapContainer>
      );

      // Should clean up path lines
      const polylines = container.querySelectorAll('.leaflet-interactive');
      expect(polylines.length).toBe(0);

      // Should call stopFollowing
      expect(mapHandle.stopFollowing).toHaveBeenCalled();
    });

    it('should clean up on unmount', () => {
      const memories = [
        createMemory('1', 45.5, 12.3),
        createMemory('2', 46.0, 13.0),
      ];
      const mapHandle = createMockMapHandle();

      const { unmount } = render(
        <MapContainer center={[0, 0]} zoom={2}>
          <StoryPathLayer
            isPlaying={true}
            currentIndex={0}
            memories={memories}
            mapHandle={mapHandle}
          />
        </MapContainer>
      );

      // Unmount component
      unmount();

      // Should call stopFollowing on unmount
      expect(mapHandle.stopFollowing).toHaveBeenCalled();
    });

    it('should not animate when transitioning backwards', () => {
      const memories = [
        createMemory('1', 45.5, 12.3),
        createMemory('2', 46.0, 13.0),
        createMemory('3', 46.5, 13.5),
      ];
      const mapHandle = createMockMapHandle();

      const { container, rerender } = render(
        <MapContainer center={[0, 0]} zoom={2}>
          <StoryPathLayer
            isPlaying={true}
            currentIndex={2}
            memories={memories}
            mapHandle={mapHandle}
          />
        </MapContainer>
      );

      // Transition backwards (should not trigger animation)
      rerender(
        <MapContainer center={[0, 0]} zoom={2}>
          <StoryPathLayer
            isPlaying={true}
            currentIndex={1}
            memories={memories}
            mapHandle={mapHandle}
          />
        </MapContainer>
      );

      // Should not render airplane marker for backwards transition
      const airplaneMarker = container.querySelector('.airplane-marker');
      expect(airplaneMarker).toBeNull();
    });
  });
});
