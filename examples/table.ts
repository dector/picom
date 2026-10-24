import { Model, Assembly, g, describe } from "../src/index.js";

const model = Model.new("Table", {
  materials: {
    wood: { color: "#bc885b", roughness: 0.8, metalness: 0 },
    steel: { color: "#48515b", roughness: 0.4, metalness: 0.7 },
  },
});
const table = model.addAssembly(
  Assembly.new({ name: "table", category: "furniture" }),
);
table.group("top").part("top", g.box([0, 0, 0.75], [1.4, 0.8, 0.08], 0.018), {
  material: "wood",
});

// Reuse one shape at four positions, grouped by end of the table.
const legs = table.group("legs");
for (const x of [-0.6, 0.6]) {
  for (const y of [-0.3, 0.3]) {
    legs.group(y < 0 ? "front" : "rear").part(
      `leg-${x}-${y}`,
      g.box([x, y, 0.355], [0.07, 0.07, 0.71], 0.018),
      { material: "steel" },
    );
  }
}

const description = describe(model, { ground: true });
console.log(JSON.stringify(description, null, 2));
