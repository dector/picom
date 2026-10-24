import { createModel, assembly, part, revolve, describe } from "../src/index.js";

const model = createModel("Vase", {
  clay: { color: "#cb8065", roughness: 0.9, metalness: 0 },
});
const vase = assembly(model, "vase", "pottery");

// Closed wall cross-section: [height, radius], clockwise.
// Trace the outside upward, then the inside downward. Radii stay positive.
// This makes a hollow vessel with an open bottom, not a watertight container.
part(vase, "shell", revolve([0, 0, 0], [0, 0, 1], [
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
], 12), "clay");

const description = describe(model, { ground: true });
console.log(JSON.stringify(description, null, 2));
