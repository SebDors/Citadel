/**
 * Convertit une série de points 2D en courbe de Bézier cubique lissée (Catmull-Rom) pour SVG (AM-06).
 */
export function buildSmoothBezierPath(points: { x: number; y: number }[], tension = 0.2): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`;
  }
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return d;
}

/**
 * Trouve l'indice du point le plus proche horizontalement (pour le scrubbing tactile PanResponder).
 */
export function findNearestChartPointIndex(touchX: number, points: { x: number }[]): number | null {
  if (!points || points.length === 0) return null;
  let bestIdx = 0;
  let bestDist = Math.abs(touchX - points[0].x);
  for (let i = 1; i < points.length; i++) {
    const dist = Math.abs(touchX - points[i].x);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}
