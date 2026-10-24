import { createModel, assembly, b, describe } from "../src/index.js";

const model = createModel("Table", {
  wood: { color: "#bc885b", roughness: 0.8, metalness: 0 },
  steel: { color: "#48515b", roughness: 0.4, metalness: 0.7 },
});
const table = assembly(model, "table", "furniture");
b(table, "top", [0, 0, 0.75], [1.4, 0.8, 0.08], "wood", "top");

// Reuse one shape at four positions.
for (const x of [-0.6, 0.6]) {
  for (const y of [-0.3, 0.3]) {
    b(table, `leg-${x}-${y}`, [x, y, 0.355], [0.07, 0.07, 0.71], "steel", "legs");
  }
}

const description = describe(model, { ground: true });
console.log(JSON.stringify(description, null, 2));
