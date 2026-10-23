import type { ModelDraft, Description, Materials, Vector } from "./types.js";
import { boundsOf, triangleCount } from "./bounds.js";
import { visibilityTree } from "./visibility.js";
import { pathSegment } from "./parts.js";

export function createModel(
  name = "Model",
  materials: Materials = {
    default: { color: "#b0b0b0", roughness: 0.65, metalness: 0 },
  },
): ModelDraft {
  return {
    name,
    schemaVersion: 1,
    coordinates: { up: "+z", units: "meters" },
    materials: structuredClone(materials),
    assemblies: [],
  };
}
export interface DescribeOptions {
  scale?: number;
  ground?: boolean;
  categories?: readonly string[];
  labels?: Readonly<Record<string, string>>;
}
// Work on a deep copy: reusable geometry and builder input are never modified.
export function describe(
  model: ModelDraft,
  options: DescribeOptions = {},
): Description {
  const scale = options.scale ?? 1;
  if (!Number.isFinite(scale) || scale <= 0)
    throw RangeError("Scale must be finite and positive");
  const result = structuredClone(model);
  const ids = new Set<string>();
  for (const a of result.assemblies) {
    const id = `${pathSegment(a.category)}/${pathSegment(a.name)}`;
    if (ids.has(id)) throw RangeError(`Duplicate assembly: ${id}`);
    ids.add(id);
    if (a.explode.length !== 3 || !a.explode.every(Number.isFinite))
      throw RangeError("Explode vector needs three finite coordinates");
    for (const p of a.parts) {
      pathSegment(p.tags.component ?? "default");
      if (!Object.hasOwn(result.materials, p.material))
        throw RangeError(`Unknown material: ${p.material}`);
      const g = p.geometry;
      if (g.vertices.some((v) => v.length !== 3 || !v.every(Number.isFinite)))
        throw RangeError("Vertices need three finite coordinates");
      if (
        g.triangles.some(
          (t) =>
            t.length !== 3 ||
            t.some(
              (i) => !Number.isInteger(i) || i < 0 || i >= g.vertices.length,
            ),
        )
      )
        throw RangeError("Invalid triangle indices");
    }
  }
  const parts = result.assemblies.flatMap((a) => a.parts);
  const ground = options.ground ? boundsOf(parts).min[2] : 0;
  for (const a of result.assemblies) {
    a.explode = a.explode.map((v) => v * scale);
    for (const p of a.parts)
      p.geometry = {
        ...p.geometry,
        vertices: p.geometry.vertices.map((v) =>
          v.map((x, i) => (x - (i === 2 ? ground : 0)) * scale),
        ),
      };
  }
  return {
    ...result,
    visibilityTree: visibilityTree(
      result.assemblies,
      options.categories,
      options.labels,
    ),
    bounds: boundsOf(parts),
    triangleCount: triangleCount(parts),
  };
}
// Pure geometry transform suitable for composing imported or generated meshes.
export function translateModel(model: ModelDraft, offset: Vector): ModelDraft {
  if (offset.length !== 3 || !offset.every(Number.isFinite))
    throw RangeError("Offset needs three finite coordinates");
  const result = structuredClone(model);
  for (const a of result.assemblies)
    for (const p of a.parts)
      p.geometry = {
        ...p.geometry,
        vertices: p.geometry.vertices.map((v) =>
          v.map((x, i) => x + offset[i]),
        ),
      };
  return result;
}
