import { createModel, assembly, b, describe } from "../src/index.js";

const model = createModel("Cube", {
  blue: { color: "#4488ff", roughness: 0.6, metalness: 0 },
});
const root = assembly(model, "main");

// Center [x, y, z], size [width, depth, height], in meters. Z is up.
b(root, "cube", [0, 0, 0.5], [1, 1, 1], "blue");

const description = describe(model, { ground: true });
console.log(JSON.stringify(description, null, 2));
