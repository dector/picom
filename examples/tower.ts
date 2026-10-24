import { createModel, assembly, b, r, part, cylinder, describe } from "../src/index.js";

const model = createModel("Watchtower", {
  stone: { color: "#b0aaa0", roughness: 0.95, metalness: 0 },
  wood: { color: "#906747", roughness: 0.85, metalness: 0 },
});
const tower = assembly(model, "tower", "structure");
part(tower, "base", cylinder([0, 0, 0.12], 0.85, 0.24), "stone", "base");
b(tower, "platform", [0, 0, 1.8], [1.3, 1.3, 0.14], "wood", "platform");

for (const x of [-0.5, 0.5]) {
  for (const y of [-0.5, 0.5]) {
    r(tower, `post-${x}-${y}`, [x, y, 0.24], [x, y, 2.4], 0.1, "wood", "posts");
  }
}
for (const side of [-0.5, 0.5]) {
  r(tower, `rail-x-${side}`, [-0.5, side, 2.35], [0.5, side, 2.35], 0.06, "wood", "rails");
  r(tower, `rail-y-${side}`, [side, -0.5, 2.35], [side, 0.5, 2.35], 0.06, "wood", "rails");
}

const description = describe(model, { ground: true });
console.log(JSON.stringify(description, null, 2));
