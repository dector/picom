# Visibility and inspection

Assembly IDs and categories must be nonempty path segments without `/`. Components use `part.tags.component`, defaulting to `default`. Component paths are split on `/`; each segment must be nonempty. Other tags are free-form. Paths are `category/assembly/component`; several parts can share a component.

`assembly.group("legs")` and `legs.group("front")` are lightweight builders. Their parts still live in the original assembly, with `tags.component` set to `legs` or `legs/front`. Groups add no model data, so empty groups produce no nodes. `describe` derives `visibilityTree` from the part paths, nesting one node per segment. Node labels fall back to the title-cased segment, while `labels` keys use full node paths:

```ts
const labels = {
  "furniture/table/legs": "Legs",
  "furniture/table/legs/front": "Front legs",
};
const description = describe(model, { labels });
```

A mixed node that has both direct parts and child groups gets derived `hasParts: true` in the tree. Hiding a parent hides all descendants. Hiding a child group leaves parts directly in its parent visible, because their component is only the parent path. `visibilityStatus` counts a mixed node's own parts alongside its children, giving the correct tri-state checkbox.

Missing visibility entries are visible. A `false` ancestor hides its descendants. `setVisibility` updates a node and descendants; enabling a child also releases ancestor gates. `invertVisibility` normally flips every group containing parts, including mixed parents with direct parts: all-visible becomes all-hidden, and all-hidden becomes all-visible. It applies parents before descendants. Descendants take priority when an ancestor gate conflicts: inverting a hidden child to visible releases the parent gate, so the parent's own parts stay visible too. Direct parts in a mixed group therefore cannot be hidden independently while any descendant is visible. Category ordering and labels are caller-provided; no domain registry is hardcoded.

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
