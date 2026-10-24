import type { Vector, Geometry } from "./types.ts";
// Pure final-mesh helpers. Coordinates in meters; no renderer or external dependencies.
export const add = (a: Vector, b: Vector): Vector => a.map((x, i) => x + b[i]);
export const sub = (a: Vector, b: Vector): Vector => a.map((x, i) => x - b[i]);
export const mul = (a: Vector, s: number): Vector => a.map((x) => x * s);
export const dot = (a: Vector, b: Vector): number =>
  a.reduce((s, x, i) => s + x * b[i], 0);
export const cross = (a: Vector, b: Vector): Vector => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const unit = (a: Vector): Vector => {
  const length = Math.hypot(...a);
  if (!Number.isFinite(length) || length === 0)
    throw RangeError("Direction must be finite and nonzero");
  return mul(a, 1 / length);
};
const average = (ps: Vector[]) => mul(ps.reduce(add, [0, 0, 0]), 1 / ps.length);
export function mesh(vertices: Vector[], faces: number[][]): Geometry {
  return {
    vertices,
    triangles: faces.flatMap((f) =>
      triangulate(f.map((i) => vertices[i])).map((t) => t.map((i) => f[i])),
    ),
    closed: true,
  };
}
// Ear clipping in the polygon's dominant plane; supports simple concave polygons.
export function triangulate(points: Vector[]): number[][] {
  if (points.length < 3)
    throw RangeError("Polygon needs at least three points");
  if (points.length === 3) return [[0, 1, 2]];
  let normal = [0, 0, 0];
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length];
    normal = add(normal, cross(p, q));
  });
  const axis = normal.map(Math.abs).indexOf(Math.max(...normal.map(Math.abs)));
  const p = points.map((v) => v.filter((_, i) => i !== axis));
  const area = p.reduce((s, a, i) => {
    const b = p[(i + 1) % p.length];
    return s + a[0] * b[1] - a[1] * b[0];
  }, 0);
  const orient = (a: Vector, b: Vector, c: Vector) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const sign = Math.sign(area),
    ids = points.map((_, i) => i),
    tris = [];
  while (ids.length > 3) {
    let found = false;
    for (let k = 0; k < ids.length; k++) {
      const a = ids[(k + ids.length - 1) % ids.length],
        b = ids[k],
        c = ids[(k + 1) % ids.length];
      if (sign * orient(p[a], p[b], p[c]) < 1e-11) continue;
      if (
        ids.some(
          (i) =>
            i !== a &&
            i !== b &&
            i !== c &&
            sign * orient(p[a], p[b], p[i]) >= -1e-10 &&
            sign * orient(p[b], p[c], p[i]) >= -1e-10 &&
            sign * orient(p[c], p[a], p[i]) >= -1e-10,
        )
      )
        continue;
      tris.push([a, b, c]);
      ids.splice(k, 1);
      found = true;
      break;
    }
    if (!found) throw Error("Non-simple or degenerate polygon");
  }
  tris.push(ids);
  return tris;
}
export function convex(vertices: Vector[], faces: number[][]): Geometry {
  const center = average(vertices);
  return mesh(
    vertices,
    faces.map((f) =>
      dot(
        cross(
          sub(vertices[f[1]], vertices[f[0]]),
          sub(vertices[f[2]], vertices[f[0]]),
        ),
        sub(average(f.map((i) => vertices[i])), center),
      ) > 0
        ? f
        : [...f].reverse(),
    ),
  );
}
export function slab(
  points: Vector[],
  normal: Vector,
  depth = 0.015,
): Geometry {
  const n = points.length,
    vertices = [
      ...points.map((p) => [...p]),
      ...points.map((p) => sub(p, mul(normal, depth))),
    ];
  const tris = triangulate(points),
    t = tris[0];
  const outward =
    dot(
      cross(sub(points[t[1]], points[t[0]]), sub(points[t[2]], points[t[0]])),
      normal,
    ) > 0;
  const front = points.map((_, i) => i);
  if (!outward) front.reverse();
  const faces = [front, [...front].reverse().map((i) => i + n)];
  front.forEach((a, i) => {
    const b = front[(i + 1) % n];
    faces.push([a, a + n, b + n, b]);
  });
  return mesh(vertices, faces);
}
export function box(center: Vector, size: Vector, bevel = 0.02): Geometry {
  const h = size.map((x) => x / 2),
    b = Math.min(bevel, ...h.map((x) => x * 0.8));
  if (b <= 0) {
    const vs = [];
    for (const x of [-1, 1])
      for (const y of [-1, 1])
        for (const z of [-1, 1])
          vs.push(add(center, [x * h[0], y * h[1], z * h[2]]));
    return convex(vs, [
      [0, 1, 3, 2],
      [4, 6, 7, 5],
      [0, 4, 5, 1],
      [2, 3, 7, 6],
      [0, 2, 6, 4],
      [1, 5, 7, 3],
    ]);
  }
  const vs: Vector[] = [],
    faces: number[][] = [],
    map = new Map<string, number>();
  const face = (ps: Vector[]) =>
    faces.push(
      ps.map((p) => {
        const key = p.join(",");
        if (!map.has(key)) {
          map.set(key, vs.length);
          vs.push(add(center, p));
        }
        return map.get(key)!;
      }),
    );
  for (let axis = 0; axis < 3; axis++)
    for (const s of [-1, 1]) {
      const others = [0, 1, 2].filter((i) => i !== axis),
        [a, c] = others;
      const loop = [
        [-h[a] + b, -h[c] + b],
        [h[a] - b, -h[c] + b],
        [h[a] - b, h[c] - b],
        [-h[a] + b, h[c] - b],
      ];
      face(
        loop.map(([u, v]) => {
          const p = [0, 0, 0];
          p[axis] = s * h[axis];
          p[a] = u;
          p[c] = v;
          return p;
        }),
      );
    }
  // Twelve edge bevel strips.
  for (let axis = 0; axis < 3; axis++) {
    const [a, c] = [0, 1, 2].filter((i) => i !== axis);
    for (const sa of [-1, 1])
      for (const sc of [-1, 1])
        face(
          [
            [-1, 0],
            [1, 0],
            [1, 1],
            [-1, 1],
          ].map(([s, k]) => {
            const p = [0, 0, 0];
            p[axis] = s * (h[axis] - b);
            p[a] = sa * (h[a] - (k ? b : 0));
            p[c] = sc * (h[c] - (k ? 0 : b));
            return p;
          }),
        );
  }
  for (const x of [-1, 1])
    for (const y of [-1, 1])
      for (const z of [-1, 1])
        face(
          [0, 1, 2].map((axis) =>
            [x, y, z].map((s, i) => s * (h[i] - (i === axis ? 0 : b))),
          ),
        );
  return convex(vs, faces);
}
export function transform(
  g: Geometry,
  fn: (point: Vector, index: number) => Vector,
): Geometry {
  return {
    ...g,
    vertices: g.vertices.map(fn),
    triangles: g.triangles.map((t) => [...t]),
  };
}
export function frame(axis: Vector): Vector[] {
  const n = unit(axis),
    u = unit(cross(Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0], n));
  return [u, cross(n, u), n];
}
export function cylinder(
  center: Vector,
  radius: number,
  depth: number,
  axis: Vector = [0, 0, 1],
  segments = 8,
): Geometry {
  if (!Number.isInteger(segments) || segments < 3)
    throw RangeError("Segments must be an integer >= 3");
  const [u, v, n] = frame(axis),
    vs = [];
  for (const q of [-depth / 2, depth / 2])
    for (let i = 0; i < segments; i++) {
      const a = (2 * Math.PI * i) / segments + Math.PI / 8;
      vs.push(
        add(
          center,
          add(
            mul(n, q),
            add(mul(u, radius * Math.cos(a)), mul(v, radius * Math.sin(a))),
          ),
        ),
      );
    }
  const faces = [
    Array.from({ length: segments }, (_, i) => i).reverse(),
    Array.from({ length: segments }, (_, i) => i + segments),
  ];
  for (let i = 0; i < segments; i++) {
    const j = (i + 1) % segments;
    faces.push([i, j, j + segments, i + segments]);
  }
  return mesh(vs, faces);
}
export function rod(
  a: Vector,
  b: Vector,
  width = 0.05,
  bevel = 0.01,
): Geometry {
  const delta = sub(b, a),
    [u, v, n] = frame(delta);
  return transform(
    box([0, 0, 0], [width, width, Math.hypot(...delta)], bevel),
    (p) =>
      add(
        mul(add(a, b), 0.5),
        add(mul(u, p[0]), add(mul(v, p[1]), mul(n, p[2]))),
      ),
  );
}
export function loft(sections: Vector[][]): Geometry {
  // Equal-order convex section loops.
  if (
    sections.length < 2 ||
    sections[0].length < 3 ||
    sections.some((s) => s.length !== sections[0].length)
  )
    throw RangeError(
      "Loft needs at least two equal-length loops with three points",
    );
  const n = sections[0].length,
    vs = sections.flat(),
    faces = [Array.from({ length: n }, (_, i) => i)];
  for (let k = 0; k < sections.length - 1; k++)
    for (let i = 0; i < n; i++)
      faces.push([
        k * n + i,
        k * n + ((i + 1) % n),
        (k + 1) * n + ((i + 1) % n),
        (k + 1) * n + i,
      ]);
  faces.push(
    Array.from({ length: n }, (_, i) => (sections.length - 1) * n + i),
  );
  return convex(vs, faces);
}
// Extrude a band between two open, coplanar contours in matching endpoint order.
export function band(
  outer: Vector[],
  inner: Vector[],
  normal: Vector,
  depth = 0.02,
): Geometry {
  if (outer.length < 2 || inner.length < 2)
    throw RangeError("Band contours need at least two points");
  return slab([...outer, ...[...inner].reverse()], normal, depth);
}
// Revolve a closed [axial offset, radius] profile about an arbitrary axis.
// The profile must wind clockwise in axial/radial space for outward faces.
export function revolve(
  center: Vector,
  axis: Vector,
  profile: number[][],
  segments = 20,
): Geometry {
  if (!Number.isInteger(segments) || segments < 3)
    throw RangeError("Segments must be an integer >= 3");
  if (
    profile.length < 3 ||
    profile.some(
      (p) => p.length !== 2 || !p.every(Number.isFinite) || p[1] <= 0,
    )
  )
    throw RangeError("Profile needs three finite points with positive radii");
  const [u, v, n] = frame(axis),
    vs = [];
  for (const [q, r] of profile)
    for (let i = 0; i < segments; i++) {
      const a = (2 * Math.PI * i) / segments;
      vs.push(
        add(
          center,
          add(mul(n, q), add(mul(u, r * Math.cos(a)), mul(v, r * Math.sin(a)))),
        ),
      );
    }
  const faces = [];
  // Join each profile edge, including the closing edge, into a ring.
  for (let k = 0; k < profile.length; k++)
    for (let i = 0; i < segments; i++) {
      const j = (i + 1) % segments,
        l = (k + 1) % profile.length;
      faces.push([
        k * segments + i,
        k * segments + j,
        l * segments + j,
        l * segments + i,
      ]);
    }
  return mesh(vs, faces);
}
