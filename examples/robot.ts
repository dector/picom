import { Model, Assembly, g, describe } from "../src/index.js";

const model = Model.new("Robot", {
  materials: {
    blue: { color: "#659dce", roughness: 0.6, metalness: 0 },
    dark: { color: "#354353", roughness: 0.5, metalness: 0 },
    yellow: { color: "#ffd166", roughness: 0.5, metalness: 0 },
  },
});
const body = model.addAssembly(
  Assembly.new({ name: "body", category: "robot" }),
);
body.part("torso", g.box([0, 0, 0.95], [0.6, 0.35, 0.7], 0.018), {
  material: "blue",
});
body.part("badge", g.box([0, -0.185, 1.05], [0.18, 0.03, 0.12], 0.018), {
  material: "yellow",
});

// Explosion offsets move assemblies apart in the playground's exploded view.
const head = model.addAssembly(
  Assembly.new({ name: "head", category: "robot", explode: [0, 0, 0.5] }),
);
head.part("head", g.box([0, 0, 1.55], [0.5, 0.4, 0.4], 0.018), {
  material: "blue",
});
for (const x of [-0.13, 0.13]) {
  head.part(
    `eye-${x}`,
    g.box([x, -0.21, 1.6], [0.08, 0.03, 0.08], 0.005),
    { material: "yellow", component: "eyes" },
  );
}
for (const side of [-1, 1]) {
  const arm = model.addAssembly(
    Assembly.new({
      name: `arm-${side}`,
      category: "robot",
      explode: [side * 0.5, 0, 0],
    }),
  );
  arm.part("arm", g.box([side * 0.43, 0, 0.95], [0.18, 0.25, 0.6], 0.018), {
    material: "blue",
  });
  const leg = model.addAssembly(
    Assembly.new({
      name: `leg-${side}`,
      category: "robot",
      explode: [side * 0.2, 0, -0.3],
    }),
  );
  leg.part("leg", g.box([side * 0.18, 0, 0.35], [0.22, 0.25, 0.5], 0.018), {
    material: "dark",
  });
  leg.part("foot", g.box([side * 0.18, -0.06, 0.08], [0.26, 0.4, 0.16], 0.018), {
    material: "dark",
  });
}

const description = describe(model, { ground: true });
console.log(JSON.stringify(description, null, 2));
