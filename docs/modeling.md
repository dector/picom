# Modeling

## Build a model

```ts
import { Material, Model, Assembly, b, part, cylinder, describe } from "@dector/picom";

const steel = Material.new({
  color: "#b2b5ae", roughness: 0.56, metalness: 0.6,
});
const model = Model.new("Stand", {
  materials: { steel },
});
const base = Assembly.new({ name: "base", category: "structure" });
model.addAssembly(base);
b(base, "plinth", [0, 0, 0.1], [1, 1, 0.2], "steel", "solid");
part(base, "column", cylinder([0, 0, 0.7], 0.08, 1), "steel", "solid");

const description = describe(model, { ground: true, scale: 1 });
console.log(description.bounds, description.triangleCount);
console.log(JSON.stringify(description));
```

Within this checkout, examples import `../src/index.js`; `.js` specifiers resolve to `.ts` through Bun/TypeScript. Installed consumers use `@dector/picom` (or `jsr:@dector/picom` directly in Deno).

## Assemblies

`Assembly.from(...parts, options)` creates a standalone assembly with required trailing options. `name` is required; `category` defaults to `"default"`, `tags` to `{}`, and `explode` to `[0, 0, 0]`. An optional `label` controls its display name. Parts and options are copied, so changes to the assembly do not affect the inputs.

```ts
import { Assembly } from "@dector/picom";

const body = Assembly.from(...parts, {
  name: "body",
  category: "robot",
  explode: [0, 0, 0.5],
  label: "Robot body",
});
model.addAssembly(body);
```

`Assembly.new({ name: "empty" })` creates an empty assembly, accepting only an options object (no parts). It uses the same defaults, validation, and copying as `Assembly.from`. Zero parts is also valid with `Assembly.from({ name: "empty" })`. Names and categories must be nonempty and cannot contain `/`. `model.addAssembly(assembly)` registers and returns the assembly, rejecting duplicate paths (`category/name`). It retains the supplied assembly reference. `describe` also checks uniqueness. The `assembly(model, id, category?, tags?, explode?)` helper is deprecated but remains available for compatibility. Use `Assembly.new({ name: id, category, tags, explode })` followed by `model.addAssembly(...)` instead.

## Geometry conventions and limits

- Defaults: **Z-up, meters**, outward triangle winding. Arrays contain three coordinates; triangle indices are zero-based. Normals are derived by the renderer, not stored in JSON.
- `slab(points, normal, depth)` extrudes opposite the supplied **unit** normal. Polygon points must be coplanar and simple, without holes.
- `loft(sections)` expects convex, equal-order loops with matching vertex counts, arranged to form a convex solid.
- `revolve` expects a simple closed profile winding clockwise in axial/radial space, with **strictly positive radii**. The closing profile edge is implicit; do not duplicate the first point. This models hollow rings/profiles, not profiles touching the rotation axis; use `cylinder` for a capped cylinder.
- `band` expects matching contour endpoint order and a resulting simple polygon; it does not perform polygon subtraction.
- Use positive dimensions/radii/depths. These are lightweight modeling helpers, not a CAD/CSG kernel. No Boolean operations, general self-intersection repair, UVs or topology editing.
- `describe` validates finite vertices, valid triangle indices, material references and unique assembly paths. It does not certify manifoldness or arbitrary input winding. Tests check built-in solids for finite, indexed, nondegenerate, manifold, outward-facing geometry.
- `describe` deep-copies input, grounds **all geometry together** when requested, scales geometry and explosion offsets, and derives summaries. Builder drafts and reused geometries remain untouched. Grounding assumes Z-up.

## Materials

`Material.new(options?)` creates a plain material, defaulting to color `#b0b0b0`, roughness `0.65`, and metalness `0`. Emission fields are optional. `Model.new(name?, { materials }?)` creates an empty model with a cloned palette; omitting materials supplies a `default` material. Parts still reference materials by palette name. `createModel(name, materials)` is deprecated but remains compatible.

`MATERIALS` is an immutable preset palette. Pass it (or a selected subset) as `Model.new("Name", { materials: MATERIALS })`; palettes are cloned. `recolorMaterials(palette, names, '#rrggbb', referenceName?)` returns a new palette, preserving relative sRGB channel offsets and emission differences. The reference defaults to the first selected name. Colors are six-digit sRGB hex values. The `glass` preset is an opaque, glass-like finish, not physical transparency.
