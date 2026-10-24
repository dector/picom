import { Model, Assembly, g, describe } from "../src/index.js";

const model = Model.new("Desk sculpture", {
  materials: {
    stone: { color: "#aaa69b", roughness: 0.9, metalness: 0 },
    brass: { color: "#bba158", roughness: 0.3, metalness: 0.8 },
  },
});
const base = model.addAssembly(
  Assembly.new({ name: "pedestal", category: "structure" }),
);
base.part("plinth", g.box([0, 0, 0.1], [1, 1, 0.2], 0.03), {
  material: "stone",
  component: "base",
});
const sculpture = model.addAssembly(
  Assembly.new({
    name: "sculpture",
    category: "decoration",
    explode: [0, 0, 0.5],
  }),
);
sculpture.part("stem", g.rod([0, 0, 0.2], [0, 0, 1.2], 0.06), {
  material: "brass",
  component: "stem",
});
sculpture.part(
  "ring",
  g.revolve(
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
  { material: "brass", component: "ring" },
);
const description = describe(model, { ground: true });
console.log(JSON.stringify(description, null, 2));
