import type { Part, Assembly } from "../src/types.js";
import { expect } from "bun:test";
import { cross, sub, dot } from "../src/geometry.js";

// Test-only: finite, nondegenerate, manifold, consistently outward-wound solids.
export function assertSolid(part: Part, assembly: Assembly, context = "") {
  const label = [context, `assembly ${assembly.name}`, `part ${part.name}`]
    .filter(Boolean)
    .join(" / ");
  const { vertices, triangles } = part.geometry,
    edges = new Map<string, number[]>();
  let volume = 0;
  for (const [index, v] of vertices.entries()) {
    expect(v, `${label}: vertex ${index} dimensions`).toHaveLength(3);
    expect(
      v.every(Number.isFinite),
      `${label}: vertex ${index} is finite`,
    ).toBe(true);
  }
  for (const [index, t] of triangles.entries()) {
    const triangleLabel = `${label}: triangle ${index}`;
    expect(t, `${triangleLabel} indices`).toHaveLength(3);
    for (const i of t)
      expect(
        Number.isInteger(i) && i >= 0 && i < vertices.length,
        `${triangleLabel}: valid index ${i}`,
      ).toBe(true);
    const [v, w, x] = t.map((i) => vertices[i]);
    expect(
      Math.hypot(...cross(sub(w, v), sub(x, v))),
      `${triangleLabel}: nondegenerate`,
    ).toBeGreaterThan(1e-12);
    volume += dot(v, cross(w, x)) / 6;
    for (let i = 0; i < 3; i++) {
      const a = t[i],
        b = t[(i + 1) % 3],
        key = [Math.min(a, b), Math.max(a, b)].join(":");
      const edge = edges.get(key) ?? [0, 0];
      edge[0]++;
      edge[1] += a < b ? 1 : -1;
      edges.set(key, edge);
    }
  }
  for (const [key, edge] of edges)
    expect(edge, `${label}: edge ${key} has two opposite incidences`).toEqual([
      2, 0,
    ]);
  expect(volume, `${label}: outward signed volume`).toBeGreaterThan(0);
}
