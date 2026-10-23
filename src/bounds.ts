import type { Part, Bounds, Vector } from "./types.js";
// Empty geometry has zero bounds, so descriptions remain finite and serializable.
export function boundsOf(parts: readonly Part[]): Bounds {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  let count = 0;
  for (const p of parts)
    for (const v of p.geometry.vertices) {
      count++;
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], v[i]);
        max[i] = Math.max(max[i], v[i]);
      }
    }
  if (!count) return { min: [0, 0, 0], max: [0, 0, 0], size: [0, 0, 0] };
  return { min, max, size: max.map((v, i) => v - min[i]) };
}
export function triangleCount(parts: readonly Part[]): number {
  return parts.reduce((n, p) => n + p.geometry.triangles.length, 0);
}
export function centerOf(bounds: Bounds): Vector {
  return bounds.min.map((v, i) => (v + bounds.max[i]) / 2);
}
