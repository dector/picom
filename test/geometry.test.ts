import { describe, test, expect } from "bun:test";
import {
  box,
  cylinder,
  rod,
  slab,
  loft,
  band,
  revolve,
  transform,
  triangulate,
  unit,
  add,
  sub,
  mul,
  dot,
  cross,
  frame,
  mesh,
  convex,
} from "../src/index.js";
import type { Geometry } from "../src/index.js";
import { assertSolid } from "./solid.js";

const solid = (geometry: Geometry) =>
  assertSolid(
    { name: "shape", geometry, material: "default", tags: {} },
    { name: "test", category: "test", tags: {}, explode: [0, 0, 0], parts: [] },
  );
describe("closed mesh primitives", () => {
  const cases: [string, () => Geometry][] = [
    ["box", () => box([0, 0, 0], [2, 3, 4], 0)],
    ["beveled box", () => box([2, -1, 3], [2, 3, 4], 0.15)],
    ["clamped bevel", () => box([0, 0, 0], [1, 1, 1], 5)],
    ["cylinder", () => cylinder([1, 2, 3], 1, 2, [1, 2, 3], 12)],
    ["rod", () => rod([1, 2, 3], [4, 6, 9], 0.3)],
    [
      "concave slab",
      () =>
        slab(
          [
            [0, 0, 1],
            [2, 0, 1],
            [2, 1, 1],
            [1, 1, 1],
            [1, 2, 1],
            [0, 2, 1],
          ],
          [0, 0, 1],
          0.2,
        ),
    ],
    [
      "reversed slab",
      () =>
        slab(
          [
            [0, 0, 1],
            [0, 2, 1],
            [2, 2, 1],
            [2, 0, 1],
          ],
          [0, 0, 1],
          0.2,
        ),
    ],
    [
      "loft",
      () =>
        loft([
          [
            [-1, -1, 0],
            [1, -1, 0],
            [1, 1, 0],
            [-1, 1, 0],
          ],
          [
            [-0.5, -0.5, 2],
            [0.5, -0.5, 2],
            [0.5, 0.5, 2],
            [-0.5, 0.5, 2],
          ],
        ]),
    ],
    [
      "band",
      () =>
        band(
          [
            [-2, 0, 0],
            [-2, 0, 2],
            [2, 0, 2],
            [2, 0, 0],
          ],
          [
            [-1, 0, 0],
            [-1, 0, 1],
            [1, 0, 1],
            [1, 0, 0],
          ],
          [0, 1, 0],
          0.2,
        ),
    ],
    [
      "revolved profile",
      () =>
        revolve(
          [0, 0, 0],
          [0, 1, 0],
          [
            [-0.5, 1],
            [-0.5, 2],
            [0.5, 2],
            [0.5, 1],
          ],
          16,
        ),
    ],
  ];
  for (const [name, build] of cases) test(name, () => solid(build()));
});
test("triangulates concave polygons", () => {
  expect(
    triangulate([
      [0, 0, 0],
      [2, 0, 0],
      [2, 1, 0],
      [1, 1, 0],
      [1, 2, 0],
      [0, 2, 0],
    ]),
  ).toHaveLength(4);
});
test("mesh and convex preserve indexed solids", () => {
  const vertices = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const faces = [
    [0, 2, 1],
    [0, 1, 3],
    [1, 2, 3],
    [2, 0, 3],
  ];
  solid(mesh(vertices, faces));
  solid(
    convex(
      vertices,
      faces.map((f) => [...f].reverse()),
    ),
  );
});
test("transforms do not mutate input", () => {
  const original = box([0, 0, 0], [1, 1, 1]);
  const snapshot = structuredClone(original);
  const moved = transform(original, (v) => add(v, [1, 2, 3]));
  moved.triangles[0][0] = 999;
  expect(original).toEqual(snapshot);
  expect(moved.vertices[0]).toEqual(add(original.vertices[0], [1, 2, 3]));
});
test("vector helpers and orthonormal frames", () => {
  expect(sub([3, 2, 1], [1, 1, 1])).toEqual([2, 1, 0]);
  expect(mul([1, 2, 3], 2)).toEqual([2, 4, 6]);
  expect(dot([1, 0, 0], [0, 1, 0])).toBe(0);
  expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
  expect(unit([0, 0, 2])).toEqual([0, 0, 1]);
  const [u, v, n] = frame([1, 2, 3]);
  expect(dot(u, v)).toBeCloseTo(0);
  expect(dot(n, n)).toBeCloseTo(1);
});
test("rejects invalid structural input", () => {
  expect(() => unit([0, 0, 0])).toThrow();
  expect(() => triangulate([])).toThrow();
  expect(() => cylinder([0, 0, 0], 1, 1, [0, 0, 1], 2)).toThrow();
  expect(() => rod([0, 0, 0], [0, 0, 0])).toThrow();
  expect(() => loft([])).toThrow();
  expect(() =>
    loft([
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      [[0, 0, 1]],
    ]),
  ).toThrow();
  expect(() =>
    revolve(
      [0, 0, 0],
      [0, 0, 1],
      [
        [0, 0],
        [1, 1],
        [0, 1],
      ],
    ),
  ).toThrow();
  expect(() => band([], [], [0, 0, 1])).toThrow();
});
