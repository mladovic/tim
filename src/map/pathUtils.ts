/**
 * Path calculation utilities for animated story paths
 */

/**
 * Calculates a curved path between two geographic coordinates using a quadratic Bezier curve.
 * 
 * @param start - Starting coordinates [latitude, longitude]
 * @param end - Ending coordinates [latitude, longitude]
 * @param curvature - Curvature factor (0 = straight line, higher = more curved). Default: 0.3
 * @param segments - Number of intermediate points to generate. Default: 20
 * @returns Array of coordinate points forming the curved path
 */
export function calculateCurvedPath(
  start: [number, number],
  end: [number, number],
  curvature: number = 0.3,
  segments: number = 20
): [number, number][] {
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

  // Calculate the midpoint
  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;

  // Calculate the perpendicular offset for the control point
  // Vector from start to end
  const deltaLat = endLat - startLat;
  const deltaLng = endLng - startLng;

  // Perpendicular vector (rotated 90 degrees)
  const perpLat = -deltaLng;
  const perpLng = deltaLat;

  // Calculate control point offset from midpoint
  const controlLat = midLat + perpLat * curvature;
  const controlLng = midLng + perpLng * curvature;

  // Generate points along the quadratic Bezier curve
  const path: [number, number][] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    
    // Quadratic Bezier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
    const oneMinusT = 1 - t;
    const lat = oneMinusT * oneMinusT * startLat + 
                2 * oneMinusT * t * controlLat + 
                t * t * endLat;
    const lng = oneMinusT * oneMinusT * startLng + 
                2 * oneMinusT * t * controlLng + 
                t * t * endLng;

    path.push([lat, lng]);
  }

  return path;
}
