# Optional Three.js adapter

Install `three` (`^0.180.0`) in applications using this adapter.

```ts
import { createObject, applyState, disposeObject } from "@dector/picom/three";

const object = createObject(description);
// The core is Z-up; configure your scene/camera accordingly.
scene.add(object);
applyState(object, { visibility: {}, explode: 0.5 });
// Later, after removing it from the scene:
scene.remove(object);
disposeObject(object);
```

Only `@dector/picom/three` imports Three.js. The dev installation includes it for tests. The adapter provides flat shading, per-mesh materials, shadows, visibility/explosion updates and resource disposal.

The adapter owns the geometry and per-mesh materials it creates, cleans up on construction errors, and does not own your scene, renderer or externally supplied textures. `applyState` expects a root created by `createObject`.

See [Modeling](modeling.md) for creating a description and [Visibility and inspection](inspection.md) for visibility rules.
