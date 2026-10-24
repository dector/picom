import { test, expect } from "bun:test";
import { Assembly, Material, Model, MATERIALS, createModel, assembly, b, describe } from "../src/index.js";
import type { Material as MaterialData } from "../src/index.js";

test("Material.new supplies defaults and returns independent plain values", () => {
  const material: MaterialData = Material.new();
  expect(material).toEqual({ color: "#b0b0b0", roughness: 0.65, metalness: 0 });
  material.color = "#000000";
  expect(Material.new().color).toBe("#b0b0b0");
  expect(Material.new({ roughness: 0 })).toEqual({
    color: "#b0b0b0", roughness: 0, metalness: 0,
  });
});

test("Material.new copies custom options including emission", () => {
  const options = {
    color: "#996633", roughness: 0.8, metalness: 0.2,
    emissive: "#112233", emissiveIntensity: 0,
  };
  const material = Material.new(options);
  expect(material).toEqual(options);
  expect(material).not.toBe(options);
  options.color = "#ffffff";
  expect(material.color).toBe("#996633");
});

test("Model.new preserves model defaults and independent ownership", () => {
  const model = Model.new();
  expect(model).toEqual(createModel());
  expect(Model.new("Named").name).toBe("Named");
  model.materials.default.color = "#000000";
  assembly(model, "separate");
  expect(Model.new().materials.default.color).toBe("#b0b0b0");
  expect(Model.new().assemblies).toEqual([]);
  expect(Model.new("Empty", { materials: {} }).materials).toEqual({});
});

test("named palettes work with existing builders and are cloned", () => {
  const wood = Material.new({ color: "#996633" });
  const materials = { wood };
  const model = Model.new("Table", { materials });
  const other = Model.new("Other", { materials });
  wood.color = "#ffffff";
  expect(model.materials.wood.color).toBe("#996633");
  model.materials.wood.roughness = 0;
  expect(other.materials.wood.roughness).toBe(0.65);
  const top = assembly(model, "top");
  b(top, "surface", [0, 0, 1], [2, 1, 0.1], "wood");
  const result = describe(model, { ground: true });
  expect(result.triangleCount).toBeGreaterThan(0);
  expect(JSON.parse(JSON.stringify(result))).toEqual(result);
});

test("Assembly.from accepts zero or multiple parts with trailing options", () => {
  const empty: Assembly = Assembly.from({ name: "empty" });
  expect(empty).toEqual({
    name: "empty", category: "default", tags: {}, explode: [0, 0, 0], parts: [],
  });
  const source = assembly(Model.new(), "source");
  const left = b(source, "left", [0, 0, 0], [1, 1, 1]);
  const right = b(source, "right", [2, 0, 0], [1, 1, 1]);
  const options = {
    name: "body", category: "robot", tags: { kind: "custom" },
    explode: [0, 0, 1], label: "Robot body",
  };
  const result = Assembly.from(left, right, options);
  expect(result).toEqual({ ...options, parts: [left, right] });
  expect(Assembly.from(...source.parts, options)).toEqual(result);
  result.parts[0].geometry.vertices[0][0] = 999;
  result.parts[0].tags.component = "changed";
  result.tags.kind = "changed";
  result.explode[2] = 999;
  expect(left.geometry.vertices[0][0]).not.toBe(999);
  expect(left.tags.component).toBe("default");
  expect(options.tags.kind).toBe("custom");
  expect(options.explode).toEqual([0, 0, 1]);
  const model = Model.new();
  model.addAssembly(Assembly.from(left, right, options));
  expect(describe(model).triangleCount).toBeGreaterThan(0);
});

test("model.addAssembly registers assemblies and rejects duplicate paths", () => {
  const model = Model.new();
  const body = Assembly.from({ name: "body", category: "robot" });
  expect(model.addAssembly(body)).toBe(body);
  expect(model.assemblies).toEqual([body]);
  expect(() => model.addAssembly(body)).toThrow("Duplicate assembly: robot/body");
  model.addAssembly(Assembly.from({ name: "body", category: "other" }));
  expect(() => model.addAssembly({ ...body, name: "bad/name" })).toThrow();
  expect(model.assemblies).toHaveLength(2);
  expect(JSON.parse(JSON.stringify(model))).toEqual(structuredClone(model));
  expect(describe(model).assemblies).toHaveLength(2);
});

test("Assembly.from validates path segments", () => {
  expect(() => Assembly.from({ name: "" })).toThrow();
  expect(() => Assembly.from({ name: "bad/name" })).toThrow();
  expect(() => Assembly.from({ name: "body", category: "" })).toThrow();
  expect(() => Assembly.from({ name: "body", category: "bad/category" })).toThrow();
});

test("presets and legacy factory remain compatible", () => {
  const model = Model.new("Presets", { materials: MATERIALS });
  expect(model).toEqual(createModel("Presets", MATERIALS));
  model.materials.steel.color = "#000000";
  expect(MATERIALS.steel.color).toBe("#b2b5ae");
});
