import type {
  ModelDraft,
  Assembly as AssemblyData,
  Geometry,
  Tags,
  Vector,
  Part,
} from "./types.ts";
import { box, slab, rod } from "./geometry.ts";

export type Assembly = AssemblyData;
export interface AssemblyOptions {
  name: string;
  category?: string;
  tags?: Tags;
  explode?: Vector;
  label?: string;
}

export const Assembly = {
  /** Creates an independent assembly without adding it to a model. */
  from(...args: [...parts: Part[], options: AssemblyOptions]): AssemblyData {
    const options = args[args.length - 1] as AssemblyOptions;
    const { name, category = "default", tags = {}, explode = [0, 0, 0], label } = options;
    pathSegment(name);
    pathSegment(category);
    return {
      name,
      category,
      tags: { ...tags },
      explode: [...explode],
      parts: structuredClone(args.slice(0, -1) as Part[]),
      ...(label !== undefined ? { label } : {}),
    };
  },
};

// IDs and categories are path segments, not paths; arbitrary semantic tags are retained.
export function pathSegment(value: string): string {
  if (!value || value.includes("/"))
    throw RangeError(
      "IDs and categories must be nonempty and cannot contain /",
    );
  return value;
}
/** @deprecated Use Assembly.from(options) and model.addAssembly(assembly) instead. */
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
  const a = Assembly.from({ name: id, category, tags, explode });
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
): Part => part(a, name, box(center, size, bevel), material, component);
export const r = (
  a: Assembly,
  name: string,
  start: Vector,
  end: Vector,
  width = 0.05,
  material = "default",
  component = "default",
): Part => part(a, name, rod(start, end, width), material, component);
export const pane = (
  a: Assembly,
  name: string,
  points: Vector[],
  normal: Vector,
  material = "default",
  component = "default",
  depth = 0.012,
): Part => part(a, name, slab(points, normal, depth), material, component);
