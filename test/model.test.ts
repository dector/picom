import { test, expect } from "bun:test";
import {
  createModel,
  describe,
  assembly,
  part,
  b,
  r,
  pane,
  box,
  boundsOf,
  centerOf,
  translateModel,
  visibleDimensions,
  formatDimensions,
  visibilityTree,
  componentPath,
  isVisible,
  visibilityStatus,
  setVisibility,
  invertVisibility,
} from "../src/index.js";
import type { Visibility } from "../src/index.js";

function fixture() {
  const model = createModel("Sculpture");
  const a = assembly(model, "base", "structure", {}, [1, 0, 0]);
  b(a, "block", [0, 0, 2], [2, 4, 2], "default", "solid", 0);
  b(a, "detail", [0, 0, 5], [1, 1, 1], "default", "detail", 0);
  return model;
}
test("description derives bounds, counts and hierarchy without mutation", () => {
  const model = fixture(),
    snapshot = structuredClone(model);
  const result = describe(model, { scale: 2, ground: true });
  expect(model).toEqual(snapshot);
  expect(result.bounds.min).toEqual([-2, -4, 0]);
  expect(result.bounds.size).toEqual([4, 8, 9]);
  expect(result.triangleCount).toBe(24);
  expect(result.assemblies[0].explode).toEqual([2, 0, 0]);
  expect(
    result.visibilityTree[0].children[0].children.map((n) => n.id),
  ).toEqual(["structure/base/solid", "structure/base/detail"]);
  expect(JSON.parse(JSON.stringify(result))).toEqual(result);
});
test("shared geometry is transformed once per part", () => {
  const model = createModel();
  const a = assembly(model, "shared");
  const g = box([0, 0, 1], [1, 1, 1], 0);
  part(a, "one", g);
  part(a, "two", g);
  const result = describe(model, { scale: 2 });
  expect(result.assemblies[0].parts[0].geometry).toEqual(
    result.assemblies[0].parts[1].geometry,
  );
  const moved = translateModel(model, [1, 2, 3]);
  expect(moved.assemblies[0].parts[0].geometry).toEqual(
    moved.assemblies[0].parts[1].geometry,
  );
  expect(g.vertices[0]).toEqual([-0.5, -0.5, 0.5]);
});
test("empty models and dimensions stay finite", () => {
  const model = describe(createModel());
  expect(model.bounds).toEqual({
    min: [0, 0, 0],
    max: [0, 0, 0],
    size: [0, 0, 0],
  });
  expect(model.triangleCount).toBe(0);
  expect(visibleDimensions(model, {})).toEqual([0, 0, 0]);
  expect(boundsOf([])).toEqual(model.bounds);
  expect(centerOf(model.bounds)).toEqual([0, 0, 0]);
});
test("visibility gates, tri-state, enabling descendants and inversion", () => {
  const model = describe(fixture()),
    tree = model.visibilityTree,
    category = tree[0],
    group = category.children[0];
  const visibility: Visibility = { structure: false };
  expect(isVisible(visibility, group.children[0].id)).toBe(false);
  setVisibility(visibility, group.children[0], true);
  expect(isVisible(visibility, group.children[0].id)).toBe(true);
  setVisibility(visibility, group.children[1], false);
  expect(visibilityStatus(visibility, category)).toEqual({
    checked: false,
    indeterminate: true,
  });
  expect(visibleDimensions(model, visibility)).toEqual([2, 4, 2]);
  invertVisibility(visibility, tree);
  expect(isVisible(visibility, group.children[0].id)).toBe(false);
  expect(isVisible(visibility, group.children[1].id)).toBe(true);
  expect(visibleDimensions(model, visibility)).toEqual([1, 1, 1]);
  setVisibility(visibility, category, false);
  expect(visibleDimensions(model, visibility)).toEqual([0, 0, 0]);
  invertVisibility(visibility, tree);
  expect(visibilityStatus(visibility, category).checked).toBe(true);
});
test("custom labels, category order, component grouping", () => {
  const model = fixture(),
    a = model.assemblies[0];
  a.label = "Foundation";
  const tree = visibilityTree(model.assemblies, ["extras"], {
    structure: "Structure",
    "structure/base/solid": "Solids",
  });
  expect(tree.map((n) => n.id)).toEqual(["extras", "structure"]);
  expect(tree[1].children[0].label).toBe("Foundation");
  expect(tree[1].children[0].children[0].label).toBe("Solids");
  expect(componentPath(a, a.parts[0])).toBe("structure/base/solid");
  expect(formatDimensions([1, 2, 3])).toBe("1.00 m × 2.00 m × 3.00 m");
});
test("builder conveniences and material ownership", () => {
  const materials = {
    default: { color: "#ffffff", roughness: 1, metalness: 0 },
  };
  const model = createModel("test", materials);
  materials.default.color = "#000000";
  const a = assembly(model, "shape", "objects", { kind: "custom" });
  r(a, "bar", [0, 0, 0], [1, 1, 1]);
  pane(
    a,
    "panel",
    [
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
    ],
    [0, 0, 1],
  );
  expect(describe(model).triangleCount).toBeGreaterThan(0);
  expect(model.materials.default.color).toBe("#ffffff");
});
test("rejects invalid scales, IDs, materials, vertices and indices", () => {
  for (const scale of [0, -1, NaN, Infinity])
    expect(() => describe(fixture(), { scale })).toThrow();
  const model = fixture();
  expect(() => assembly(model, "base", "structure")).toThrow();
  expect(() => assembly(model, "bad/id")).toThrow();
  model.assemblies[0].parts[0].material = "missing";
  expect(() => describe(model)).toThrow("Unknown material");
  const invalid = fixture();
  invalid.assemblies[0].parts[0].geometry.vertices[0][0] = NaN;
  expect(() => describe(invalid)).toThrow();
  const indices = fixture();
  indices.assemblies[0].parts[0].geometry.triangles[0][0] = 999;
  expect(() => describe(indices)).toThrow();
});
