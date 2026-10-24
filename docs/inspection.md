# Visibility and inspection

Assembly IDs and categories must be nonempty path segments without `/`. Components use `part.tags.component`, defaulting to `default`. Other tags are free-form. Paths are `category/assembly/component`; several parts can share a component.

Missing visibility entries are visible. A `false` ancestor hides its descendants. `setVisibility` updates a node and descendants; enabling a child also releases ancestor gates. `invertVisibility` inverts effective leaf states, including when a category is hidden. Category ordering and labels are caller-provided; no domain registry is hardcoded.

```ts
import { setVisibility, visibleDimensions } from "@dector/picom";

const visibility = {};
setVisibility(visibility, description.visibilityTree[0], false);
const size = visibleDimensions(description, visibility);
```

Dimensions describe assembled geometry, not exploded inspection positions.

## Bounds and explosion offsets

`describe` derives bounds and triangle counts. Empty models have finite zero bounds. Assemblies support explosion offsets; `describe` scales these offsets along with geometry.

The [Three.js adapter](three-adapter.md) applies visibility and explosion state to rendered objects.
