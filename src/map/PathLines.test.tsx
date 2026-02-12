import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MapContainer } from 'react-leaflet';
import { PathLines } from './PathLines';
import type { Memory } from '../types';

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

describe('PathLines', () => {
  /**
   * Unit tests for PathLines component
   * Validates: Requirements 1.1, 1.2, 1.4
   */
  describe('rendering behavior', () => {
    it('should render nothing with 0 memories', () => {
      const { container } = render(
        <MapContainer center={[0, 0]} zoom={2}>
          <PathLines memories={[]} currentIndex={0} />
        </MapContainer>
      );

      const polylines = container.querySelectorAll('.leaflet-interactive');
      expect(polylines.length).toBe(0);
    });

    it('should render nothing with 1 memory', () => {
      const memories = [createMemory('1', 45.5, 12.3)];

      const { container } = render(
        <MapContainer center={[0, 0]} zoom={2}>
          <PathLines memories={memories} currentIndex={0} />
        </MapContainer>
      );

      const polylines = container.querySelectorAll('.leaflet-interactive');
      expect(polylines.length).toBe(0);
    });

    it('should render 1 path line with 2 memories', () => {
      const memories = [
        createMemory('1', 45.5, 12.3),
        createMemory('2', 46.0, 13.0),
      ];

      const { container } = render(
        <MapContainer center={[0, 0]} zoom={2}>
          <PathLines memories={memories} currentIndex={0} />
        </MapContainer>
      );

      const polylines = container.querySelectorAll('.leaflet-interactive');
      expect(polylines.length).toBe(1);
    });

    it('should render 2 path lines with 3 memories', () => {
      const memories = [
        createMemory('1', 45.5, 12.3),
        createMemory('2', 46.0, 13.0),
        createMemory('3', 46.5, 13.5),
      ];

      const { container } = render(
        <MapContainer center={[0, 0]} zoom={2}>
          <PathLines memories={memories} currentIndex={0} />
        </MapContainer>
      );

      const polylines = container.querySelectorAll('.leaflet-interactive');
      expect(polylines.length).toBe(2);
    });

    it('should highlight current path segment', () => {
      const memories = [
        createMemory('1', 45.5, 12.3),
        createMemory('2', 46.0, 13.0),
        createMemory('3', 46.5, 13.5),
      ];

      const { container } = render(
        <MapContainer center={[0, 0]} zoom={2}>
          <PathLines memories={memories} currentIndex={1} />
        </MapContainer>
      );

      const polylines = container.querySelectorAll('.leaflet-interactive');
      expect(polylines.length).toBe(2);

      // First polyline (index 0) should be highlighted when currentIndex is 1
      const firstPath = polylines[0] as SVGPathElement;
      const strokeWidth = firstPath.getAttribute('stroke-width');
      
      // Highlighted path should have greater stroke width
      expect(parseFloat(strokeWidth || '0')).toBeGreaterThan(2);
    });
  });
});
