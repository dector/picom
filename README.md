# picom

A small TypeScript toolkit for procedural low-poly models. Geometry and model descriptions are plain, JSON-serializable data; the core has **no runtime dependencies**. Three.js is an optional rendering adapter.

Extracted from `wonderer/generator/model`, without changing the source project. Vehicle builders, settings, registries, identifiers, UI and browser tooling are not included.

## Run

Requires Bun and a TypeScript-aware runtime/bundler (the package currently exports source TypeScript, not compiled JavaScript).

```sh
bun install
bun test
bun run typecheck
bun run example  # prints a desk sculpture as JSON
```

## Build a model

```ts
import { createModel, assembly, b, part, cylinder, describe } from "picom";

const model = createModel("Stand", {
  steel: { color: "#b2b5ae", roughness: 0.56, metalness: 0.6 },
});
const base = assembly(model, "base", "structure");
b(base, "plinth", [0, 0, 0.1], [1, 1, 0.2], "steel", "solid");
part(base, "column", cylinder([0, 0, 0.7], 0.08, 1), "steel", "solid");

const description = describe(model, { ground: true, scale: 1 });
console.log(description.bounds, description.triangleCount);
console.log(JSON.stringify(description));
```

Within this checkout, examples import `../src/index.js`; `.js` specifiers resolve to `.ts` through Bun/TypeScript. External consumers can use the `picom` package export via a local link/workspace dependency.

## What's retained

| Module                 | Functionality                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/geometry.ts`      | Vector math, polygon triangulation, indexed meshes, outward-oriented convex meshes, beveled boxes, slabs/extrusions, cylinders, rods, lofts, transforms, bands and revolved profiles |
| `src/parts.ts`         | Assembly/part builders; `b`, `r` and `pane` convenience builders; arbitrary string tags and explosion offsets                                                                        |
| `src/model.ts`         | Draft creation, nonmutating translation, finalization, optional grounding/scaling, bounds, triangle counts and visibility hierarchy                                                  |
| `src/materials.ts`     | 17 neutral PBR presets; generic palette recoloring retaining finish/emission differences                                                                                             |
| `src/bounds.ts`        | Bounds, centers and triangle counting; empty models have finite zero bounds                                                                                                          |
| `src/visibility.ts`    | Category → assembly → component hierarchy; ancestor gates, tri-state status, toggling and inversion                                                                                  |
| `src/dimensions.ts`    | Visible assembled dimensions and meter formatting                                                                                                                                    |
| `src/three-adapter.ts` | Optional Three.js objects, flat shading, per-mesh materials, shadows, visibility/explosion updates and resource disposal                                                             |

The old fixed wheel arch is now `band(outer, inner, normal, depth)`: two open coplanar contours joined into one extruded polygon. The old tire mesh algorithm is now `revolve(center, axis, profile, segments)`: a caller-provided closed `[axialOffset, radius]` profile. No vehicle dimensions or preset profiles remain.

### Geometry conventions and limits

- Defaults: **Z-up, meters**, outward triangle winding. Arrays contain three coordinates; triangle indices are zero-based. Normals are derived by the renderer, not stored in JSON.
- `slab(points, normal, depth)` extrudes opposite the supplied **unit** normal. Polygon points must be coplanar and simple, without holes.
- `loft(sections)` expects convex, equal-order loops with matching vertex counts, arranged to form a convex solid.
- `revolve` expects a simple closed profile winding clockwise in axial/radial space, with **strictly positive radii**. The closing profile edge is implicit; do not duplicate the first point. This models hollow rings/profiles, not profiles touching the rotation axis; use `cylinder` for a capped cylinder.
- `band` expects matching contour endpoint order and a resulting simple polygon; it does not perform polygon subtraction.
- Use positive dimensions/radii/depths. These are lightweight modeling helpers, not a CAD/CSG kernel. No Boolean operations, general self-intersection repair, UVs or topology editing.
- `describe` validates finite vertices, valid triangle indices, material references and unique assembly paths. It does not certify manifoldness or arbitrary input winding. Tests check built-in solids for finite, indexed, nondegenerate, manifold, outward-facing geometry.
- `describe` deep-copies input, grounds **all geometry together** when requested, scales geometry and explosion offsets, and derives summaries. Builder drafts and reused geometries remain untouched. Grounding assumes Z-up.

### Materials

`MATERIALS` is an immutable preset palette. Pass it (or a selected subset) to `createModel`; palettes are cloned. `recolorMaterials(palette, names, '#rrggbb', referenceName?)` returns a new palette, preserving relative sRGB channel offsets and emission differences. The reference defaults to the first selected name. Colors are six-digit sRGB hex values. The `glass` preset is an opaque, glass-like finish, not physical transparency.

### Visibility and inspection

Assembly IDs and categories must be nonempty path segments without `/`. Components use `part.tags.component`, defaulting to `default`. Other tags are free-form. Paths are `category/assembly/component`; several parts can share a component.

Missing visibility entries are visible. A `false` ancestor hides its descendants. `setVisibility` updates a node and descendants; enabling a child also releases ancestor gates. `invertVisibility` inverts effective leaf states, including when a category is hidden. Category ordering and labels are caller-provided; no domain registry is hardcoded.

```ts
import { setVisibility, visibleDimensions } from "picom";

const visibility = {};
setVisibility(visibility, description.visibilityTree[0], false);
const size = visibleDimensions(description, visibility);
```

Dimensions describe assembled geometry, not exploded inspection positions.

### Optional Three.js adapter

```ts
import { createObject, applyState, disposeObject } from "picom/three";

const object = createObject(description);
// The core is Z-up; configure your scene/camera accordingly.
scene.add(object);
applyState(object, { visibility: {}, explode: 0.5 });
// Later, after removing it from the scene:
scene.remove(object);
disposeObject(object);
```

Only `picom/three` imports Three.js. Install `three` in applications using this adapter; the dev installation includes it for tests. The adapter owns the geometry and per-mesh materials it creates, cleans up on construction errors, and does not own your scene, renderer or externally supplied textures. `applyState` expects a root created by `createObject`.

## Source extraction notes

Retained algorithms and material values come from `wonderer/generator/model/{geometry,parts,materials,colors,bounds,visibility,dimensions,three-adapter}.ts`; generic finalization was adapted from `wrg.ts`. The solid assertion helper also comes from its test support. Domain palette membership, per-optic identities, style selectors, fixed category labels, vehicle-specific grounding, body selection and all feature builders were intentionally omitted. No source license has been inferred or added; package publication is disabled (`private: true`).
