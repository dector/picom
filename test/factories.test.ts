import { test, expect } from "bun:test";
import { Material, Model, MATERIALS, createModel, assembly, b, describe } from "../src/index.js";
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

test("presets and legacy factory remain compatible", () => {
  const model = Model.new("Presets", { materials: MATERIALS });
  expect(model).toEqual(createModel("Presets", MATERIALS));
  model.materials.steel.color = "#000000";
  expect(MATERIALS.steel.color).toBe("#b2b5ae");
});
