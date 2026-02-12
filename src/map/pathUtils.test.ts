import { describe, it, expect } from 'vitest';
import { calculateCurvedPath } from './pathUtils';

describe('pathUtils', () => {
  describe('calculateCurvedPath', () => {
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
