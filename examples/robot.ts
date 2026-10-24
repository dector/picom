import { createModel, assembly, b, describe } from "../src/index.js";

const model = createModel("Robot", {
  blue: { color: "#659dce", roughness: 0.6, metalness: 0 },
  dark: { color: "#354353", roughness: 0.5, metalness: 0 },
  yellow: { color: "#ffd166", roughness: 0.5, metalness: 0 },
});
const body = assembly(model, "body", "robot");
b(body, "torso", [0, 0, 0.95], [0.6, 0.35, 0.7], "blue");
b(body, "badge", [0, -0.185, 1.05], [0.18, 0.03, 0.12], "yellow");

// Explosion offsets move assemblies apart in the playground's exploded view.
const head = assembly(model, "head", "robot", {}, [0, 0, 0.5]);
b(head, "head", [0, 0, 1.55], [0.5, 0.4, 0.4], "blue");
for (const x of [-0.13, 0.13]) {
  b(head, `eye-${x}`, [x, -0.21, 1.6], [0.08, 0.03, 0.08], "yellow", "eyes", 0.005);
}
for (const side of [-1, 1]) {
  const arm = assembly(model, `arm-${side}`, "robot", {}, [side * 0.5, 0, 0]);
  b(arm, "arm", [side * 0.43, 0, 0.95], [0.18, 0.25, 0.6], "blue");
  const leg = assembly(model, `leg-${side}`, "robot", {}, [side * 0.2, 0, -0.3]);
  b(leg, "leg", [side * 0.18, 0, 0.35], [0.22, 0.25, 0.5], "dark");
  b(leg, "foot", [side * 0.18, -0.06, 0.08], [0.26, 0.4, 0.16], "dark");
}

const description = describe(model, { ground: true });
console.log(JSON.stringify(description, null, 2));
