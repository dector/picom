import { test, expect } from "bun:test";
import { MATERIALS, recolorMaterials, createModel } from "../src/index.js";

test("presets are immutable and can seed independently owned palettes", () => {
  expect(Object.isFrozen(MATERIALS)).toBe(true);
  expect(Object.isFrozen(MATERIALS.steel)).toBe(true);
  const model = createModel("test", MATERIALS);
  model.materials.steel.color = "#000000";
  expect(MATERIALS.steel.color).toBe("#b2b5ae");
});
test("recoloring retains finish variation and shifts emission without mutation", () => {
  const materials = {
    base: { color: "#808080", roughness: 1, metalness: 0 },
    highlight: {
      color: "#909090",
      roughness: 0.5,
      metalness: 0.5,
      emissive: "#a0a0a0",
      emissiveIntensity: 0.2,
    },
    other: { color: "#ffffff", roughness: 1, metalness: 0 },
  };
  const result = recolorMaterials(materials, ["base", "highlight"], "#204060");
  expect(result.base.color).toBe("#204060");
  expect(result.highlight.color).toBe("#305070");
  expect(result.highlight.emissive).toBe("#406080");
  expect(result.highlight.emissiveIntensity).toBe(0.2);
  expect(result.other).toEqual(materials.other);
  expect(materials.base.color).toBe("#808080");
  expect(
    recolorMaterials(materials, ["base", "highlight"], "#ffffff").highlight
      .color,
  ).toBe("#ffffff");
});
test("invalid palettes and colors are rejected", () => {
  expect(() => recolorMaterials({}, ["missing"], "#ffffff")).toThrow();
  expect(() => recolorMaterials({ ...MATERIALS }, ["steel"], "red")).toThrow();
  expect(() =>
    recolorMaterials({ ...MATERIALS }, ["missing"], "#ffffff", "steel"),
  ).toThrow();
});
