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
import { Material, Model, Assembly, b, part, cylinder, describe } from "@dector/picom";

const steel = Material.new({
  color: "#b2b5ae", roughness: 0.56, metalness: 0.6,
});
const model = Model.new("Stand", { materials: { steel } });
const base = Assembly.from({ name: "base", category: "structure" });
model.addAssembly(base);

b(base, "plinth", [0, 0, 0.1], [1, 1, 0.2], "steel", "solid");
part(base, "column", cylinder([0, 0, 0.7], 0.08, 1), "steel", "solid");

const description = describe(model, { ground: true, scale: 1 });
console.log(JSON.stringify(description));
```

`Assembly.from(...)` creates a standalone assembly; `model.addAssembly(...)` registers it. The old `assembly(model, ...)` helper is deprecated but remains available for compatibility.

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
- [Visibility and inspection](docs/inspection.md) — visibility hierarchy, bounds, dimensions and explosion offsets.
- [Three.js adapter](docs/three-adapter.md) — rendering, state updates and resource disposal.
- [Development](docs/development.md) — local setup, tests, examples, module map and extraction history.
- [Publishing](docs/publishing.md) — manual JSR releases.

## License

[MIT](LICENSE).
