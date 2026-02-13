import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MapContainer } from 'react-leaflet';
import { StoryPathLayer } from './StoryPathLayer';
import type { Memory } from '../types';
import type { MapControllerHandle } from './MapController';

// Helper to create a test memory
function createMemory(id: string, lat: number, lng: number, zoomLevel?: number): Memory {
  return {
    id,
    date: '2024-01-01',
    title: `Memory ${id}`,
    description: 'Test memory',
    lat,
    lng,
    ...(zoomLevel !== undefined && { zoomLevel }),
  };
}

// Helper to create a mock map handle
function createMockMapHandle(): MapControllerHandle {
  return {
    flyToMemory: vi.fn().mockResolvedValue(undefined),
    followPosition: vi.fn(),
    stopFollowing: vi.fn(),
    isFlyingTo: vi.fn().mockReturnValue(false),
  };
}

describe('StoryPathLayer', () => {
  /**
   * Unit tests for StoryPathLayer component
   * Validates: Requirements 1.5
   */
  describe('rendering behavior', () => {
    it('should render path lines when story mode is not active', () => {
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

      // Should render path lines even when story mode is inactive
      const polylines = container.querySelectorAll('.leaflet-interactive');
      expect(polylines.length).toBeGreaterThan(0);
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

    it('should render correct number of path lines', () => {
      const memories = [
        createMemory('1', 45.5, 12.3),
        createMemory('2', 46.0, 13.0),
        createMemory('3', 46.5, 13.5),
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

      // Should render N-1 path lines for N memories
      const polylines = container.querySelectorAll('.leaflet-interactive');
      expect(polylines.length).toBe(2);
    });
  });
});
