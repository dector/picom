# Development

## Run locally

Requires Bun. This checkout exports source TypeScript, not compiled JavaScript.

```sh
bun install
bun test
bun run typecheck
bun run example  # prints a desk sculpture as JSON
```

## Examples

Standalone examples print model descriptions as JSON:

```sh
bun examples/cube.ts
bun examples/table.ts
bun examples/robot.ts
bun examples/tower.ts
bun examples/vase.ts
```

These five examples also appear in the playground picker, using the same source files. They cover boxes with nested visibility groups, loops, assemblies/explosion offsets, rods/cylinders, and revolved profiles. The vase has an open bottom.

## Browser playground

```sh
bun run playground
```

A responsive JavaScript editor with live Three.js preview, touch orbit/zoom, examples, and local draft saving. On phones, switch between Code and Preview. Run `bun run playground:build` to build a static site. See [playground/README.md](../playground/README.md) for details.

## Module map

| Module | Functionality |
| --- | --- |
| `src/geometry.ts` | Vector math, polygon triangulation, indexed meshes, outward-oriented convex meshes, beveled boxes, slabs/extrusions, cylinders, rods, lofts, transforms, bands and revolved profiles |
| `src/parts.ts` | Assembly builders with `.part(...)` and nested `.group(...)` visibility handles; deprecated `part`, `b`, `r` and `pane` helpers; arbitrary string tags and explosion offsets |
| `src/model.ts` | Draft creation, nonmutating translation, finalization, optional grounding/scaling, bounds, triangle counts and derived nested visibility hierarchy |
| `src/materials.ts` | 17 neutral PBR presets; generic palette recoloring retaining finish/emission differences |
| `src/bounds.ts` | Bounds, centers and triangle counting; empty models have finite zero bounds |
| `src/visibility.ts` | Category → assembly → nested group hierarchy; shared paths, mixed-node parts (`hasParts`), ancestor gates, tri-state status, toggling and inversion |
| `src/dimensions.ts` | Visible assembled dimensions and meter formatting |
| `src/three-adapter.ts` | Optional Three.js objects, flat shading, per-mesh materials, shadows, visibility/explosion updates and resource disposal |

## Source extraction notes

Extracted from `wonderer/generator/model`, without changing the source project. Vehicle builders, settings, registries, identifiers, UI and browser tooling are not included.

Retained algorithms and material values come from `wonderer/generator/model/{geometry,parts,materials,colors,bounds,visibility,dimensions,three-adapter}.ts`; generic finalization was adapted from `wrg.ts`. The solid assertion helper also comes from its test support. Domain palette membership, per-optic identities, style selectors, fixed category labels, vehicle-specific grounding, body selection and all feature builders were intentionally omitted. Released under the [MIT license](../LICENSE). `package.json` remains private to prevent accidental npm publication; JSR uses `deno.json`.

The old fixed wheel arch is now `band(outer, inner, normal, depth)`: two open coplanar contours joined into one extruded polygon. The old tire mesh algorithm is now `revolve(center, axis, profile, segments)`: a caller-provided closed `[axialOffset, radius]` profile. No vehicle dimensions or preset profiles remain.

See [Publishing to JSR](publishing.md) for release instructions.
