# picom

A small TypeScript toolkit for procedural low-poly models. Geometry and model descriptions are plain, JSON-serializable data; the core has **no runtime dependencies**. Three.js is an optional rendering adapter.

## Install

Available on JSR as [`@dector/picom`](https://jsr.io/@dector/picom) after the first release.

```sh
# Bun
bunx jsr add @dector/picom
# npm
npx jsr add @dector/picom
# Deno
deno add jsr:@dector/picom
```

For the optional adapter, also install `three` (`^0.180.0`) in your application.

## Build a model

Models use **Z-up coordinates and meters**. Compose geometry into assemblies, then call `describe` to get a JSON-serializable description with bounds and triangle counts.

```ts
import { Material, Model, Assembly, g, describe } from "@dector/picom";

const steel = Material.new({
  color: "#b2b5ae", roughness: 0.56, metalness: 0.6,
});
const model = Model.new("Stand", { materials: { steel } });
const base = model.with(Assembly.new({ name: "base", category: "structure" }));
const frame = base.group("frame");

frame.part("plinth", g.box([0, 0, 0.1], [1, 1, 0.2], 0.018), {
  material: "steel",
});
frame.part("column", g.cylinder([0, 0, 0.7], 0.08, 1), {
  material: "steel",
});

const description = describe(model, { ground: true, scale: 1 });
console.log(JSON.stringify(description));
```

`assembly.part(name, geometry, { material, tags })` adds a part and returns it. Material defaults to `"default"`, tags are copied, and geometry is retained by reference. `assembly.group(name)` returns a lightweight visibility group handle; use `group.part(...)` to attach parts to the same assembly with `tags.component` set to the group path. Groups nest with `group.group(name)`. Groups have no geometry, transforms, explosion offsets, or inherited defaults, and empty groups are not stored. Explicit `component` on `assembly.part` remains supported for compatibility, including validated slash paths; prefer groups for new code.

`Assembly.new(options)` creates an empty standalone assembly. `Assembly.from(...parts, options)` creates one from parts. `model.with(...)` registers and returns the same assembly, preserving its builder type. Builder methods `.part` and `.group` are non-enumerable, so they are absent from JSON and clones; reconstruct with `Assembly.from(...parts, options)`.

Geometry functions are exported directly, and the same functions are available as `geometry` and `g`; examples prefer `g`. The legacy `assembly`, `createModel`, `part`, `b`, `r`, and `pane` helpers remain available but are deprecated.

These are lightweight modeling helpers, not a CAD/CSG kernel. See the [geometry conventions and limits](docs/modeling.md#geometry-conventions-and-limits) before building more complex shapes.

## Try the playground

From a local checkout, with Bun installed:

```sh
bun install
bun run playground
```

Edit JavaScript with a live Three.js preview, built-in examples and local draft saving. See the [playground guide](playground/README.md) for details.

## Documentation

- [Modeling](docs/modeling.md) — model builders, geometry conventions and materials.
- [Visibility and inspection](docs/inspection.md) — nested visibility groups, bounds, dimensions and explosion offsets.
- [Three.js adapter](docs/three-adapter.md) — rendering, state updates and resource disposal.
- [Development](docs/development.md) — local setup, tests, examples, module map and extraction history.
- [Publishing](docs/publishing.md) — manual JSR releases.

## License

[MIT](LICENSE).
