import cube from "../../examples/cube.ts?raw";
import table from "../../examples/table.ts?raw";
import robot from "../../examples/robot.ts?raw";
import tower from "../../examples/tower.ts?raw";
import vase from "../../examples/vase.ts?raw";

// Standalone examples import the core and print JSON. The playground injects
// core functions and expects a returned description instead.
export function playgroundSource(source: string): string {
  return source
    .replace(/^import .* from "\.\.\/src\/index\.js";\r?\n/m, "")
    .replace("console.log(JSON.stringify(description, null, 2));", "return description;");
}

export const examples: Record<string, string> = {
  Cube: playgroundSource(cube),
  Table: playgroundSource(table),
  Robot: playgroundSource(robot),
  Watchtower: playgroundSource(tower),
  Vase: playgroundSource(vase),
  "Desk sculpture": `// All picom functions are ready to use. No imports needed.
const model = createModel("Desk sculpture", {
  stone: { color: "#a6aaa4", roughness: 0.9, metalness: 0 },
  brass: { color: "#e4b568", roughness: 0.3, metalness: 0.65 },
});

const base = assembly(model, "pedestal", "structure");
b(base, "plinth", [0, 0, 0.1], [1, 1, 0.2], "stone", "base", 0.03);

const sculpture = assembly(model, "sculpture", "decoration");
r(sculpture, "stem", [0, 0, 0.2], [0, 0, 1.2], 0.06, "brass", "stem");
part(sculpture, "ring", revolve(
  [0, 0, 1.2], [0, 1, 0],
  [[-0.04, 0.25], [-0.04, 0.35], [0.04, 0.35], [0.04, 0.25]],
  16,
), "brass", "ring");

return describe(model, { ground: true });`,
  "Spiral tower": `// Try changing the count, twist, and palette.
const model = createModel("Spiral tower", {
  coral: { color: "#ee947f", roughness: 0.6, metalness: 0.1 },
  blue: { color: "#8bbbc7", roughness: 0.6, metalness: 0.1 },
});
const tower = assembly(model, "tower", "structure");
const count = 24;
for (let i = 0; i < count; i++) {
  const angle = i * 0.32;
  const center = [Math.cos(angle) * 0.28, Math.sin(angle) * 0.28, i * 0.1];
  b(tower, "block-" + i, center, [0.65, 0.65, 0.085],
    i % 2 ? "coral" : "blue", "blocks", 0.015);
}
return describe(model, { ground: true });`,
  "Tiny forest": `const model = createModel("Tiny forest", {
  leaf: { color: "#79b89a", roughness: 1, metalness: 0 },
  bark: { color: "#a48165", roughness: 1, metalness: 0 },
  ground: { color: "#c5c3ac", roughness: 1, metalness: 0 },
});
const island = assembly(model, "island", "landscape");
b(island, "ground", [0, 0, 0], [3, 2.5, 0.15], "ground", "base", 0.08);
for (let i = 0; i < 7; i++) {
  const x = Math.sin(i * 2.4) * 1.05;
  const y = Math.cos(i * 2.4) * 0.8;
  const height = 0.7 + (i % 3) * 0.2;
  const tree = assembly(model, "tree-" + i, "trees");
  r(tree, "trunk", [x, y, 0], [x, y, height], 0.09, "bark", "trunk");
  for (let j = 0; j < 3; j++) {
    const width = 0.65 - j * 0.16;
    b(tree, "crown-" + j, [x, y, height + j * 0.2],
      [width, width, 0.3], "leaf", "foliage", 0.08);
  }
}
return describe(model, { ground: true });`,
};
