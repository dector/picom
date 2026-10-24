import { test, expect } from "bun:test";
import {
  Assembly,
  Model,
  describe,
  g,
  isVisible,
  setVisibility,
  visibilityTree,
  visibleDimensions,
} from "../src/index.ts";
import type {
  AssemblyBuilder,
  Part,
  PartGroup,
} from "../src/index.ts";

test("assembly builders expose groups and join group paths in flat parts", () => {
  for (const base of [
    Assembly.new({ name: "new" }),
    Assembly.from({ name: "from" }),
  ]) {
    const legs = base.group("legs");
    const front = legs.group("front");
    const mesh = g.box([0, 0, 0], [1, 1, 1]);
    const tags = { role: "support", component: "ignored" };
    const created: Part = front.part("shin", mesh, {
      material: "steel",
      tags,
    });

    expect(base.parts).toEqual([created]);
    expect(base.parts[0]).toBe(created);
    expect(created.geometry).toBe(mesh);
    expect(created.material).toBe("steel");
    expect(created.tags).toEqual({
      role: "support",
      component: "legs/front",
    });

    tags.role = "changed";
    tags.component = "changed";
    expect(created.tags).toEqual({
      role: "support",
      component: "legs/front",
    });
  }
});

test("group parts use defaults and do not inherit options or transforms", () => {
  const base = Assembly.new({ name: "base" });
  const legs = base.group("legs");
  legs.part("thigh", g.box([0, 0, 0], [1, 1, 1]), {
    material: "steel",
    tags: { role: "upper" },
  });

  const secondMesh = g.box([2, 0, 0], [1, 1, 1]);
  const second = base
    .group("legs")
    .group("rear")
    .part("shin", secondMesh);

  expect(second.geometry).toBe(secondMesh);
  expect(second.material).toBe("default");
  expect(second.tags).toEqual({ component: "legs/rear" });

  const direct = base.group("legs").part("hip", g.box([0, 0, 2], [2, 2, 2]));
  expect(direct.material).toBe("default");
  expect(direct.tags).toEqual({ component: "legs" });
});

test("empty group handles are not persisted or shown in the visibility tree", () => {
  const model = Model.new();
  const base = model.with(Assembly.new({ name: "empty" }));
  const handle: PartGroup = base.group("unused").group("nested");

  expect(handle).toBeDefined();
  expect(base.parts).toEqual([]);
  expect(Object.keys(base)).toEqual([
    "name",
    "category",
    "tags",
    "explode",
    "parts",
  ]);
  expect(Object.getOwnPropertyDescriptor(base, "group")?.enumerable).toBe(false);
  expect(JSON.parse(JSON.stringify(base))).toEqual({
    name: "empty",
    category: "default",
    tags: {},
    explode: [0, 0, 0],
    parts: [],
  });

  const description = describe(model);
  const assemblyNode = description.visibilityTree[0].children[0];
  expect(assemblyNode.children).toEqual([]);
  expect(JSON.stringify(description.visibilityTree)).not.toContain("unused");
});

test("group names must be single nonempty path segments", () => {
  const base = Assembly.new({ name: "base" });
  const legs = base.group("legs");

  for (const name of ["", "/", "/legs", "legs/", "legs/front", "a//b"]) {
    expect(() => base.group(name)).toThrow();
    expect(() => legs.group(name)).toThrow();
  }
  expect(base.parts).toEqual([]);
});

test("component paths accept segments and reject empty segments", () => {
  const model = Model.new();
  const base = model.with(
    Assembly.new({ name: "paths", category: "robot" }),
  );
  const created = base.part("toe", g.box([0, 0, 0], [1, 1, 1]), {
    component: "legs/front/toes",
    tags: { component: "ignored" },
  });
  expect(created.tags.component).toBe("legs/front/toes");
  expect(() => describe(model)).not.toThrow();

  for (const component of [
    "",
    "/",
    "/legs",
    "legs/",
    "legs//front",
    "legs/front/",
    "a/b//c",
  ]) {
    expect(() =>
      base.part("bad", g.box([0, 0, 0], [1, 1, 1]), { component }),
    ).toThrow();
  }
  expect(base.parts).toHaveLength(1);

  const invalid = structuredClone(model);
  invalid.assemblies[0].parts[0].tags.component = "legs//front";
  expect(() => describe(invalid)).toThrow();
});

test("visibility tree nests component paths with stable labels and order", () => {
  const base = Assembly.new({
    name: "robot",
    category: "bot",
    label: "Robot",
  });
  base.group("legs").group("front").part(
    "shin",
    g.box([0, 0, 0], [1, 1, 1]),
  );
  base.group("arms").group("left").part(
    "hand",
    g.box([2, 0, 0], [1, 1, 1]),
  );
  base.group("legs").group("back").part(
    "thigh",
    g.box([0, 2, 0], [1, 1, 1]),
  );
  base.group("legs").part("hip", g.box([0, 0, 2], [2, 2, 2]));

  const labels = {
    bot: "Bot",
    "bot/robot/legs": "Legs",
    "bot/robot/legs/front": "Front legs",
    "bot/robot/arms/left": "Left arm",
  };
  const tree = visibilityTree([base], ["bot"], labels);
  expect(tree[0].id).toBe("bot");
  expect(tree[0].label).toBe("Bot");

  const assemblyNode = tree[0].children[0];
  expect(assemblyNode.id).toBe("bot/robot");
  expect(assemblyNode.label).toBe("Robot");
  expect(assemblyNode.children.map((node) => node.id)).toEqual([
    "bot/robot/legs",
    "bot/robot/arms",
  ]);

  const legs = assemblyNode.children[0];
  expect(legs.label).toBe("Legs");
  expect(legs.children.map((node) => node.id)).toEqual([
    "bot/robot/legs/front",
    "bot/robot/legs/back",
  ]);
  expect(legs.children[0].label).toBe("Front legs");
  expect(legs.children[0].children).toEqual([]);

  const arms = assemblyNode.children[1];
  expect(arms.children.map((node) => node.id)).toEqual([
    "bot/robot/arms/left",
  ]);
  expect(arms.children[0].label).toBe("Left arm");
});

test("flat components keep their existing visibility tree shape", () => {
  const base = Assembly.new({ name: "simple", category: "cat" });
  base.part("solid-part", g.box([0, 0, 0], [1, 1, 1]), {
    component: "solid",
  });
  base.part("detail-part", g.box([2, 0, 0], [1, 1, 1]), {
    component: "detail",
  });

  const assemblyNode = visibilityTree([base])[0].children[0];
  expect(assemblyNode.children.map((node) => [node.id, node.label])).toEqual([
    ["cat/simple/solid", "Solid"],
    ["cat/simple/detail", "Detail"],
  ]);
  expect(
    assemblyNode.children.every((node) => node.children.length === 0),
  ).toBe(true);
});

test("nested visibility hides children with parents and preserves parent parts", () => {
  const model = Model.new();
  const base = model.with(
    Assembly.new({ name: "robot", category: "bot" }),
  );
  const legs = base.group("legs");
  legs.part("hip", g.box([0, 0, 0], [2, 2, 2], 0));
  legs.group("front").part(
    "shin",
    g.box([10, 0, 0], [1, 1, 1], 0),
  );

  const description = describe(model);
  const assemblyNode = description.visibilityTree[0].children[0];
  const legsNode = assemblyNode.children[0];
  const frontNode = legsNode.children[0];
  expect(legsNode.id).toBe("bot/robot/legs");
  expect(frontNode.id).toBe("bot/robot/legs/front");

  const childHidden = { "bot/robot/legs/front": false };
  expect(isVisible(childHidden, legsNode.id)).toBe(true);
  expect(isVisible(childHidden, frontNode.id)).toBe(false);
  expect(visibleDimensions(description, childHidden)).toEqual([2, 2, 2]);

  const parentHidden = { "bot/robot/legs": false };
  expect(isVisible(parentHidden, legsNode.id)).toBe(false);
  expect(isVisible(parentHidden, frontNode.id)).toBe(false);
  expect(visibleDimensions(description, parentHidden)).toEqual([0, 0, 0]);

  const visibility = {};
  setVisibility(visibility, frontNode, false);
  expect(isVisible(visibility, legsNode.id)).toBe(true);
  expect(visibleDimensions(description, visibility)).toEqual([2, 2, 2]);

  setVisibility(visibility, legsNode, false);
  expect(isVisible(visibility, frontNode.id)).toBe(false);
  expect(visibleDimensions(description, visibility)).toEqual([0, 0, 0]);
});

test("with keeps builders while clones stay flat data", () => {
  const model = Model.new();
  const base: AssemblyBuilder = model.with(
    Assembly.new({ name: "robot" }),
  );
  const legs: PartGroup = base.group("legs");
  legs.group("front").part(
    "shin",
    g.box([0, 0, 0], [1, 1, 1]),
    { tags: { role: "support" } },
  );

  expect(model.assemblies[0]).toBe(base);
  expect(Object.getOwnPropertyDescriptor(base, "group")?.enumerable).toBe(false);
  expect(Object.getOwnPropertyDescriptor(base, "part")?.enumerable).toBe(false);

  const cloned = structuredClone(model);
  const plain = cloned.assemblies[0];
  expect("group" in plain).toBe(false);
  expect("part" in plain).toBe(false);
  expect(plain.parts).toHaveLength(1);
  expect(plain.parts[0].tags).toEqual({
    role: "support",
    component: "legs/front",
  });
  expect(JSON.parse(JSON.stringify(model))).toEqual(cloned);

  const description = describe(model);
  expect("group" in description.assemblies[0]).toBe(false);
  expect(description.assemblies[0].parts).toHaveLength(1);
  expect(description.assemblies[0].parts[0].tags).toEqual({
    role: "support",
    component: "legs/front",
  });

  const { parts, ...options } = plain;
  const restored: AssemblyBuilder = Assembly.from(...parts, options);
  const restoredLegs: PartGroup = restored.group("legs");
  const cap = restoredLegs.part("cap", g.box([0, 0, 1], [1, 1, 1]));
  expect(cap.tags.component).toBe("legs");
  expect(restored.parts).toHaveLength(2);
  expect(base.parts).toHaveLength(1);
});
