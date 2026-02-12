import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MapContainer } from 'react-leaflet';
import * as fc from 'fast-check';
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
   * Property 1: Consecutive memory connections
   * Validates: Requirements 1.1, 1.2
   * 
   * For any chronologically sorted list of memories in active story mode,
   * the system should render exactly N-1 path lines connecting memory[i] to memory[i+1]
   * for all i from 0 to N-2.
   */
  it('should render N-1 path lines for N memories', () => {
    fc.assert(
      fc.property(
        // Generate random memory collections with 2-10 memories
        fc.integer({ min: 2, max: 10 }).chain(count =>
          fc.tuple(
            fc.constant(count),
            fc.array(
              fc.tuple(
                fc.float({ min: -90, max: 90, noNaN: true }), // latitude
                fc.float({ min: -180, max: 180, noNaN: true }) // longitude
              ),
              { minLength: count, maxLength: count }
            )
          )
        ),
        fc.integer({ min: 0, max: 10 }), // currentIndex
        ([count, coords], currentIndex) => {
          // Create memories from coordinates
          const memories = coords.map(([lat, lng], index) =>
            createMemory(`memory-${index}`, lat, lng)
          );

          const { container } = render(
            <MapContainer center={[0, 0]} zoom={2}>
              <PathLines memories={memories} currentIndex={currentIndex} />
            </MapContainer>
          );

          // Count rendered polylines
          const polylines = container.querySelectorAll('.leaflet-interactive');
          
          // Should render exactly N-1 path lines for N memories
          expect(polylines.length).toBe(count - 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Path line styling
   * Validates: Requirements 1.4
   * 
   * For any rendered path line, the polyline component should have a dashArray property
   * configured for dashed appearance.
   */
  it('should render all polylines with dashArray styling', () => {
    fc.assert(
      fc.property(
        // Generate random memory collections with 2-10 memories
        fc.integer({ min: 2, max: 10 }).chain(count =>
          fc.array(
            fc.tuple(
              fc.float({ min: -90, max: 90, noNaN: true }), // latitude
              fc.float({ min: -180, max: 180, noNaN: true }) // longitude
            ),
            { minLength: count, maxLength: count }
          )
        ),
        (coords) => {
          // Create memories from coordinates
          const memories = coords.map(([lat, lng], index) =>
            createMemory(`memory-${index}`, lat, lng)
          );

          const { container } = render(
            <MapContainer center={[0, 0]} zoom={2}>
              <PathLines memories={memories} currentIndex={0} />
            </MapContainer>
          );

          // Get all rendered polylines
          const polylines = container.querySelectorAll('.leaflet-interactive');
          
          // Every polyline should have dashArray styling
          polylines.forEach((polyline) => {
            const strokeDasharray = polyline.getAttribute('stroke-dasharray');
            expect(strokeDasharray).toBeTruthy();
            expect(strokeDasharray).not.toBe('');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

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
