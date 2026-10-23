import type {
  ModelDraft,
  Assembly,
  Geometry,
  Tags,
  Vector,
  Part,
} from "./types.js";
import { box, slab, rod } from "./geometry.js";

// IDs and categories are path segments, not paths; arbitrary semantic tags are retained.
export function pathSegment(value: string): string {
  if (!value || value.includes("/"))
    throw RangeError(
      "IDs and categories must be nonempty and cannot contain /",
    );
  return value;
}
export function assembly(
  model: ModelDraft,
  id: string,
  category = "default",
  tags: Tags = {},
  explode: Vector = [0, 0, 0],
): Assembly {
  pathSegment(id);
  pathSegment(category);
  if (model.assemblies.some((a) => a.category === category && a.name === id))
    throw RangeError(`Duplicate assembly: ${category}/${id}`);
  const a: Assembly = {
    name: id,
    tags: { ...tags },
    category,
    explode: [...explode],
    parts: [],
  };
  model.assemblies.push(a);
  return a;
}
export function part(
  a: Assembly,
  name: string,
  geometry: Geometry,
  material = "default",
  component = "default",
  extra: Tags = {},
): Part {
  pathSegment(component);
  const p = { name, geometry, material, tags: { ...extra, component } };
  a.parts.push(p);
  return p;
}
export const b = (
  a: Assembly,
  name: string,
  center: Vector,
  size: Vector,
  material = "default",
  component = "default",
  bevel = 0.018,
) => part(a, name, box(center, size, bevel), material, component);
export const r = (
  a: Assembly,
  name: string,
  start: Vector,
  end: Vector,
  width = 0.05,
  material = "default",
  component = "default",
) => part(a, name, rod(start, end, width), material, component);
export const pane = (
  a: Assembly,
  name: string,
  points: Vector[],
  normal: Vector,
  material = "default",
  component = "default",
  depth = 0.012,
) => part(a, name, slab(points, normal, depth), material, component);
