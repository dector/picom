import type { Description, Visibility, Vector } from "./types.js";
import { boundsOf } from "./bounds.js";
import { componentPath, isVisible } from "./visibility.js";

// Measure the assembled visible geometry, not the exploded inspection layout.
export function visibleDimensions(
  description: Description,
  visibility: Visibility,
) {
  const parts = description.assemblies.flatMap((a) =>
    a.parts.filter((p) => isVisible(visibility, componentPath(a, p))),
  );
  return parts.length ? boundsOf(parts).size : [0, 0, 0];
}

export function formatDimensions(size: Vector) {
  return size.map((value) => `${value.toFixed(2)} m`).join(" × ");
}
