import { test, expect } from "bun:test";
import {
  Assembly, Model, g, geometry, box, part, b, r, pane, describe,
} from "../src/index.ts";
import type { AssemblyBuilder, Part } from "../src/index.ts";

test("geometry and g expose the existing geometry functions", () => {
  expect(g).toBe(geometry);
  expect(g.box).toBe(box);
  expect(g.rod).toBe(geometry.rod);
  expect(g.revolve).toBe(geometry.revolve);
});

test("assembly.part returns and attaches a part with defaults", () => {
  for (const base of [Assembly.new({ name: "new" }), Assembly.from({ name: "from" })]) {
    const mesh = g.box([0, 0, 0], [1, 1, 1]);
    const created: Part = base.part("cube", mesh);
    expect(base.parts).toEqual([created]);
    expect(base.parts[0]).toBe(created);
    expect(created.geometry).toBe(mesh);
    expect(created).toEqual({
      name: "cube", geometry: mesh, material: "default", tags: { component: "default" },
    });
  }
});

test("part options copy tags and explicit component takes precedence", () => {
  const base = Assembly.new({ name: "base" });
  const tags = { role: "support", component: "ignored" };
  const options = { material: "steel", component: "solid", tags };
  const created = base.part("column", g.cylinder([0, 0, 0.7], 0.08, 1), options);
  expect(created.material).toBe("steel");
  expect(created.tags).toEqual({ role: "support", component: "solid" });
  expect(tags.component).toBe("ignored");
  tags.role = "changed";
  options.material = "changed";
  expect(created.tags.role).toBe("support");
  expect(created.material).toBe("steel");
  expect(base.part("default", created.geometry, { tags }).tags.component).toBe("default");
});

test("invalid components are rejected before adding parts", () => {
  const base = Assembly.new({ name: "base" });
  const mesh = g.box([0, 0, 0], [1, 1, 1]);
  for (const component of ["", "bad/path"]) {
    expect(() => base.part("bad", mesh, { component })).toThrow();
  }
  expect(base.parts).toEqual([]);
});

test("addAssembly preserves builder types, references, and serializable data", () => {
  const model = Model.new();
  const base: AssemblyBuilder = model.addAssembly(Assembly.new({ name: "base" }));
  base.part("cube", g.box([0, 0, 0], [1, 1, 1]));
  expect(model.assemblies[0]).toBe(base);
  expect(Object.getOwnPropertyDescriptor(base, "part")?.enumerable).toBe(false);
  expect(Object.keys(base)).not.toContain("part");
  const cloned = structuredClone(model);
  expect("part" in cloned.assemblies[0]).toBe(false);
  expect(JSON.parse(JSON.stringify(model))).toEqual(cloned);
  const result = describe(model);
  expect(result.triangleCount).toBeGreaterThan(0);
  expect("part" in result.assemblies[0]).toBe(false);
  const { parts, ...options } = cloned.assemblies[0];
  const restored = Assembly.from(...parts, options);
  restored.part("another", g.box([2, 0, 0], [1, 1, 1]));
  expect(restored.parts).toHaveLength(2);
  expect(base.parts).toHaveLength(1);
});

test("deprecated helpers retain the same geometry and metadata", () => {
  const legacy = Assembly.new({ name: "legacy" });
  const modern = Assembly.new({ name: "modern" });
  const center = [0, 0, 0];
  const size = [1, 1, 1];
  const end = [0, 0, 1];
  const points = [[0, 0, 0], [1, 0, 0], [0, 1, 0]];
  const normal = [0, 0, 1];
  const options = { material: "steel", component: "solid" };
  expect(part(legacy, "mesh", g.box(center, size), "steel", "solid", { role: "support" }))
    .toEqual(modern.part("mesh", g.box(center, size), { ...options, tags: { role: "support" } }));
  expect(b(legacy, "default-box", center, size))
    .toEqual(modern.part("default-box", g.box(center, size, 0.018)));
  expect(r(legacy, "default-rod", center, end))
    .toEqual(modern.part("default-rod", g.rod(center, end, 0.05)));
  expect(pane(legacy, "default-pane", points, normal))
    .toEqual(modern.part("default-pane", g.slab(points, normal, 0.012)));
  expect(b(legacy, "box", center, size, "steel", "solid", 0.03))
    .toEqual(modern.part("box", g.box(center, size, 0.03), options));
  expect(r(legacy, "rod", center, end, 0.06, "steel", "solid"))
    .toEqual(modern.part("rod", g.rod(center, end, 0.06), options));
  expect(pane(legacy, "pane", points, normal, "steel", "solid", 0.02))
    .toEqual(modern.part("pane", g.slab(points, normal, 0.02), options));
});
