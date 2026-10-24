import type { Description, Visibility, Vector } from "./types.ts";
import { boundsOf } from "./bounds.ts";
import { componentPath, isVisible } from "./visibility.ts";

// Measure the assembled visible geometry, not the exploded inspection layout.
export function visibleDimensions(
  description: Description,
  visibility: Visibility,
): Vector {
  const parts = description.assemblies.flatMap((a) =>
    a.parts.filter((p) => isVisible(visibility, componentPath(a, p))),
  );
  return parts.length ? boundsOf(parts).size : [0, 0, 0];
}

export function formatDimensions(size: Vector): string {
  return size.map((value) => `${value.toFixed(2)} m`).join(" × ");
}
