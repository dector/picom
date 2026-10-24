import { expect, test } from "bun:test";
import {
  Assembly, Model, g, describe, visibilityStatus, setVisibility,
  invertVisibility, isVisible, visibleDimensions,
} from "../src/index.ts";
import type { Visibility } from "../src/index.ts";

function fixture() {
  const model = Model.new();
  const assembly = model.addAssembly(Assembly.new({ name: "table", category: "furniture" }));
  const legs = assembly.group("legs");
  legs.part("brace", g.box([0, 0, 2], [2, 1, 1], 0));
  legs.group("front").part("leg", g.box([0, 0, 0], [1, 1, 1], 0));
  return describe(model);
}

test("mixed group status counts its own parts when child groups are hidden", () => {
  const model = fixture();
  const category = model.visibilityTree[0];
  const assembly = category.children[0];
  const legs = assembly.children[0];
  const front = legs.children[0];
  expect(legs.hasParts).toBe(true);
  expect(front.hasParts).toBeUndefined();
  const visibility: Visibility = {};
  setVisibility(visibility, front, false);
  expect(visibilityStatus(visibility, legs)).toEqual({ checked: false, indeterminate: true });
  expect(visibilityStatus(visibility, category)).toEqual({ checked: false, indeterminate: true });
  expect(visibleDimensions(model, visibility)).toEqual([2, 1, 1]);
  setVisibility(visibility, legs, false);
  expect(visibilityStatus(visibility, legs)).toEqual({ checked: false, indeterminate: false });
  expect(visibleDimensions(model, visibility)).toEqual([0, 0, 0]);
  setVisibility(visibility, front, true);
  expect(isVisible(visibility, legs.id)).toBe(true);
  expect(visibilityStatus(visibility, category)).toEqual({ checked: true, indeterminate: false });
});

test("inversion includes mixed groups and releases ancestor gates for children", () => {
  const model = fixture();
  const legs = model.visibilityTree[0].children[0].children[0];
  const front = legs.children[0];
  const visibility: Visibility = { furniture: false };
  invertVisibility(visibility, model.visibilityTree);
  expect(isVisible(visibility, front.id)).toBe(true);
  // Own parent parts follow the shared ancestor gate, not a separate leaf.
  expect(isVisible(visibility, legs.id)).toBe(true);
  invertVisibility(visibility, model.visibilityTree);
  expect(isVisible(visibility, front.id)).toBe(false);
  expect(isVisible(visibility, legs.id)).toBe(false);
  expect(visibilityStatus(visibility, legs)).toEqual({ checked: false, indeterminate: false });

  setVisibility(visibility, legs, true);
  setVisibility(visibility, front, false);
  invertVisibility(visibility, model.visibilityTree);
  expect(isVisible(visibility, front.id)).toBe(true);
  // A visible child necessarily releases its parent's gate, including own parts.
  expect(isVisible(visibility, legs.id)).toBe(true);
});
