import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateCurvedPath } from './pathUtils';

describe('pathUtils', () => {
  describe('calculateCurvedPath', () => {
    /**
     * Property 2: Curved path calculation
     * Validates: Requirements 1.3
     * 
     * For any two distinct geographic coordinates, the calculated path should contain
     * intermediate points that deviate from the straight line between them, forming a curved trajectory.
     */
    it('should generate curved paths that deviate from straight line', () => {
      fc.assert(
        fc.property(
          // Generate random coordinate pairs
          fc.tuple(
            fc.float({ min: -90, max: 90 }), // start latitude
            fc.float({ min: -180, max: 180 }), // start longitude
            fc.float({ min: -90, max: 90 }), // end latitude
            fc.float({ min: -180, max: 180 }) // end longitude
          ).filter(([startLat, startLng, endLat, endLng]) => {
            // Filter out identical or very close coordinates
            const latDiff = Math.abs(endLat - startLat);
            const lngDiff = Math.abs(endLng - startLng);
            return latDiff > 0.1 || lngDiff > 0.1;
          }),
          ([startLat, startLng, endLat, endLng]) => {
            const start: [number, number] = [startLat, startLng];
            const end: [number, number] = [endLat, endLng];
            
            const path = calculateCurvedPath(start, end);
            
            // Path should have multiple points
            expect(path.length).toBeGreaterThan(2);
            
            // First point should be start, last point should be end
            // Use closeTo for floating point comparison to handle -0 vs 0
            expect(path[0][0]).toBeCloseTo(start[0], 10);
            expect(path[0][1]).toBeCloseTo(start[1], 10);
            expect(path[path.length - 1][0]).toBeCloseTo(end[0], 10);
            expect(path[path.length - 1][1]).toBeCloseTo(end[1], 10);
            
            // Check that intermediate points deviate from straight line
            // Calculate the straight line for comparison
            const hasDeviation = path.slice(1, -1).some((point, index) => {
              const t = (index + 1) / (path.length - 1);
              const straightLat = startLat + t * (endLat - startLat);
              const straightLng = startLng + t * (endLng - startLng);
              
              // Check if point deviates from straight line
              const latDeviation = Math.abs(point[0] - straightLat);
              const lngDeviation = Math.abs(point[1] - straightLng);
              
              // At least one coordinate should deviate by a meaningful amount
              return latDeviation > 0.001 || lngDeviation > 0.001;
            });
            
            expect(hasDeviation).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Unit tests for edge cases
     * Validates: Requirements 1.3
     */
    describe('edge cases', () => {
      it('should handle identical start and end coordinates', () => {
        const start: [number, number] = [45.5, 12.3];
        const end: [number, number] = [45.5, 12.3];
        
        const path = calculateCurvedPath(start, end);
        
        // Should still generate a path
        expect(path.length).toBeGreaterThan(0);
        
        // All points should be at the same location
        path.forEach(point => {
          expect(point[0]).toBeCloseTo(start[0], 10);
          expect(point[1]).toBeCloseTo(start[1], 10);
        });
      });

      it('should handle very close coordinates', () => {
        const start: [number, number] = [45.5, 12.3];
        const end: [number, number] = [45.50001, 12.30001];
        
        const path = calculateCurvedPath(start, end);
        
        // Should generate a valid path
        expect(path.length).toBeGreaterThan(2);
        
        // First and last points should match start and end
        expect(path[0][0]).toBeCloseTo(start[0], 5);
        expect(path[0][1]).toBeCloseTo(start[1], 5);
        expect(path[path.length - 1][0]).toBeCloseTo(end[0], 5);
        expect(path[path.length - 1][1]).toBeCloseTo(end[1], 5);
        
        // All points should be within a small bounding box
        path.forEach(point => {
          expect(point[0]).toBeGreaterThanOrEqual(Math.min(start[0], end[0]) - 0.001);
          expect(point[0]).toBeLessThanOrEqual(Math.max(start[0], end[0]) + 0.001);
          expect(point[1]).toBeGreaterThanOrEqual(Math.min(start[1], end[1]) - 0.001);
          expect(point[1]).toBeLessThanOrEqual(Math.max(start[1], end[1]) + 0.001);
        });
      });

      it('should handle coordinates across the date line', () => {
        // From east of date line to west of date line
        const start: [number, number] = [45.5, 179.5];
        const end: [number, number] = [45.5, -179.5];
        
        const path = calculateCurvedPath(start, end);
        
        // Should generate a valid path
        expect(path.length).toBeGreaterThan(2);
        
        // First and last points should match start and end
        expect(path[0][0]).toBeCloseTo(start[0], 10);
        expect(path[0][1]).toBeCloseTo(start[1], 10);
        expect(path[path.length - 1][0]).toBeCloseTo(end[0], 10);
        expect(path[path.length - 1][1]).toBeCloseTo(end[1], 10);
        
        // Path should be continuous (no huge jumps)
        for (let i = 1; i < path.length; i++) {
          const latDiff = Math.abs(path[i][0] - path[i - 1][0]);
          const lngDiff = Math.abs(path[i][1] - path[i - 1][1]);
          
          // Each step should be relatively small
          expect(latDiff).toBeLessThan(50);
          expect(lngDiff).toBeLessThan(50);
        }
      });
    });
  });
});
