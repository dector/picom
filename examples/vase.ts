import { Model, Assembly, g, describe } from "../src/index.js";

const model = Model.new("Vase", {
  materials: {
    clay: { color: "#cb8065", roughness: 0.9, metalness: 0 },
  },
});
const vase = model.addAssembly(
  Assembly.new({ name: "vase", category: "pottery" }),
);

// Closed wall cross-section: [height, radius], clockwise.
// Trace the outside upward, then the inside downward. Radii stay positive.
// This makes a hollow vessel with an open bottom, not a watertight container.
vase.part(
  "shell",
  g.revolve([0, 0, 0], [0, 0, 1], [
    [0, 0.3],
    [0.15, 0.45],
    [0.55, 0.5],
    [0.9, 0.22],
    [1.1, 0.22],
    [1.1, 0.17],
    [0.9, 0.17],
    [0.55, 0.45],
    [0.15, 0.4],
    [0, 0.25],
  ], 12),
  { material: "clay" },
);

const description = describe(model, { ground: true });
console.log(JSON.stringify(description, null, 2));
