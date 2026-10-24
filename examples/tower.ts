import { Model, Assembly, g, describe } from "../src/index.js";

const model = Model.new("Watchtower", {
  materials: {
    stone: { color: "#b0aaa0", roughness: 0.95, metalness: 0 },
    wood: { color: "#906747", roughness: 0.85, metalness: 0 },
  },
});
const tower = model.addAssembly(
  Assembly.new({ name: "tower", category: "structure" }),
);
tower.part("base", g.cylinder([0, 0, 0.12], 0.85, 0.24), {
  material: "stone",
  component: "base",
});
tower.part("platform", g.box([0, 0, 1.8], [1.3, 1.3, 0.14], 0.018), {
  material: "wood",
  component: "platform",
});

for (const x of [-0.5, 0.5]) {
  for (const y of [-0.5, 0.5]) {
    tower.part(`post-${x}-${y}`, g.rod([x, y, 0.24], [x, y, 2.4], 0.1), {
      material: "wood",
      component: "posts",
    });
  }
}
for (const side of [-0.5, 0.5]) {
  tower.part(
    `rail-x-${side}`,
    g.rod([-0.5, side, 2.35], [0.5, side, 2.35], 0.06),
    { material: "wood", component: "rails" },
  );
  tower.part(
    `rail-y-${side}`,
    g.rod([side, -0.5, 2.35], [side, 0.5, 2.35], 0.06),
    { material: "wood", component: "rails" },
  );
}

const description = describe(model, { ground: true });
console.log(JSON.stringify(description, null, 2));
