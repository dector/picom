import {
  createModel,
  assembly,
  b,
  r,
  part,
  revolve,
  describe,
} from "../src/index.js";

const model = createModel("Desk sculpture", {
  stone: { color: "#aaa69b", roughness: 0.9, metalness: 0 },
  brass: { color: "#bba158", roughness: 0.3, metalness: 0.8 },
});
const base = assembly(model, "pedestal", "structure");
b(base, "plinth", [0, 0, 0.1], [1, 1, 0.2], "stone", "base", 0.03);
const sculpture = assembly(model, "sculpture", "decoration", {}, [0, 0, 0.5]);
r(sculpture, "stem", [0, 0, 0.2], [0, 0, 1.2], 0.06, "brass", "stem");
part(
  sculpture,
  "ring",
  revolve(
    [0, 0, 1.2],
    [0, 1, 0],
    [
      [-0.04, 0.25],
      [-0.04, 0.35],
      [0.04, 0.35],
      [0.04, 0.25],
    ],
    16,
  ),
  "brass",
  "ring",
);
const description = describe(model, { ground: true });
console.log(JSON.stringify(description, null, 2));
