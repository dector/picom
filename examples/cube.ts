import { Model, Assembly, g, describe } from "../src/index.js";

const model = Model.new("Cube", {
  materials: {
    blue: { color: "#4488ff", roughness: 0.6, metalness: 0 },
  },
});
const root = model.with(Assembly.new({ name: "main" }));

// Center [x, y, z], size [width, depth, height], in meters. Z is up.
root.part("cube", g.box([0, 0, 0.5], [1, 1, 1], 0.018), {
  material: "blue",
});

const description = describe(model, { ground: true });
console.log(JSON.stringify(description, null, 2));
