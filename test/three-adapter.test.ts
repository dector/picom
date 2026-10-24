import { test, expect, spyOn } from "bun:test";
import * as THREE from "three";
import { Assembly, Model, createModel, assembly, b, describe, g } from "../src/index.js";
import {
  createObject,
  applyState,
  disposeObject,
  visibleTriangles,
} from "../src/three-adapter.js";

function fixture() {
  const model = createModel();
  const a = assembly(model, "base", "objects", { kind: "custom" }, [1, 2, 3]);
  b(a, "block", [0, 0, 0], [1, 1, 1], "default", "solid", 0);
  b(a, "cap", [0, 0, 1], [1, 1, 1], "default", "detail", 0);
  return describe(model);
}
test("constructs final meshes without a renderer or DOM", () => {
  const root = createObject(fixture());
  try {
    expect(root.children).toHaveLength(1);
    expect(visibleTriangles(root)).toBe(24);
    expect(root.children[0].userData.kind).toBe("custom");
    const [first, second] = root.children[0].children as THREE.Mesh[];
    expect(first.material).not.toBe(second.material);
    expect(first.castShadow).toBe(true);
    expect(first.geometry.getAttribute("normal").count).toBe(
      first.geometry.getAttribute("position").count,
    );
    applyState(root, {
      visibility: { "objects/base/detail": false },
      explode: 2,
    });
    expect(root.children[0].position.toArray()).toEqual([2, 4, 6]);
    expect(visibleTriangles(root)).toBe(12);
    applyState(root, { visibility: { objects: false }, explode: 0 });
    expect(visibleTriangles(root)).toBe(0);
  } finally {
    disposeObject(root);
  }
});
test("applies nested component visibility paths", () => {
  const model = Model.new();
  const base = model.with(
    Assembly.new({ name: "robot", category: "bot" }),
  );
  const legs = base.group("legs");
  legs.part("hip", g.box([0, 0, 0], [1, 1, 1], 0));
  legs.group("front").part("shin", g.box([0, 0, 2], [1, 1, 1], 0));
  const root = createObject(describe(model));
  try {
    const assembly = root.children[0] as THREE.Group;
    expect(
      assembly.children.map((mesh) => mesh.userData.visibilityPath),
    ).toEqual(["bot/robot/legs", "bot/robot/legs/front"]);
    expect(visibleTriangles(root)).toBe(24);

    applyState(root, {
      visibility: { "bot/robot/legs/front": false },
      explode: 0,
    });
    expect(visibleTriangles(root)).toBe(12);

    applyState(root, {
      visibility: { "bot/robot/legs": false },
      explode: 0,
    });
    expect(visibleTriangles(root)).toBe(0);
  } finally {
    disposeObject(root);
  }
});
test("disposes owned geometry and materials", () => {
  const root = createObject(fixture());
  let geometries = 0,
    materials = 0;
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.addEventListener("dispose", () => geometries++);
      o.material.addEventListener("dispose", () => materials++);
    }
  });
  disposeObject(root);
  expect(geometries).toBe(2);
  expect(materials).toBe(2);
});
test("cleans up already-created meshes after failure", () => {
  const model = fixture();
  model.assemblies[0].parts[1].material = "missing";
  const geometry = spyOn(THREE.BufferGeometry.prototype, "dispose");
  const material = spyOn(THREE.MeshStandardMaterial.prototype, "dispose");
  try {
    expect(() => createObject(model)).toThrow("Unknown material");
    expect(geometry).toHaveBeenCalledTimes(1);
    expect(material).toHaveBeenCalledTimes(1);
  } finally {
    geometry.mockRestore();
    material.mockRestore();
  }
});
