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

export interface PartOptions {
  /** Palette name. Defaults to "default". */
  material?: string;
  /** Visibility path segment. Defaults to "default" and overrides tags.component. */
  component?: string;
  /** Copied into the part; subsequent changes to these tags do not affect it. */
  tags?: Tags;
}

export interface AssemblyBuilder extends AssemblyData {
  /** Adds and returns a part, retaining the supplied geometry reference. */
  part(name: string, geometry: Geometry, options?: PartOptions): Part;
}

export interface AssemblyOptions {
  name: string;
  category?: string;
  tags?: Tags;
  explode?: Vector;
  label?: string;
}

export const Assembly = {
  /** Creates an empty standalone assembly from options only. */
  new(options: AssemblyOptions): AssemblyBuilder {
    return Assembly.from(options);
  },
  /** Creates an independent assembly without adding it to a model. */
  from(...args: [...parts: Part[], options: AssemblyOptions]): AssemblyBuilder {
    const options = args[args.length - 1] as AssemblyOptions;
    const { name, category = "default", tags = {}, explode = [0, 0, 0], label } = options;
    pathSegment(name);
    pathSegment(category);
    const assembly: AssemblyData = {
      name,
      category,
      tags: { ...tags },
      explode: [...explode],
      parts: structuredClone(args.slice(0, -1) as Part[]),
      ...(label !== undefined ? { label } : {}),
    };
    // Builder methods are not part of the serializable assembly data.
    Object.defineProperty(assembly, "part", {
      value(name: string, geometry: Geometry, options: PartOptions = {}): Part {
        return addPart(assembly, name, geometry, options);
      },
    });
    return assembly as AssemblyBuilder;
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
function addPart(
  a: Assembly,
  name: string,
  geometry: Geometry,
  { material = "default", component = "default", tags = {} }: PartOptions = {},
): Part {
  pathSegment(component);
  const p = { name, geometry, material, tags: { ...tags, component } };
  a.parts.push(p);
  return p;
}

/** @deprecated Use assembly.part(name, geometry, options) instead. */
export function part(
  a: Assembly,
  name: string,
  geometry: Geometry,
  material = "default",
  component = "default",
  extra: Tags = {},
): Part {
  return addPart(a, name, geometry, { material, component, tags: extra });
}
/** @deprecated Use assembly.part(name, g.box(...), options) instead. */
export const b = (
  a: Assembly,
  name: string,
  center: Vector,
  size: Vector,
  material = "default",
  component = "default",
  bevel = 0.018,
): Part => part(a, name, box(center, size, bevel), material, component);
/** @deprecated Use assembly.part(name, g.rod(...), options) instead. */
export const r = (
  a: Assembly,
  name: string,
  start: Vector,
  end: Vector,
  width = 0.05,
  material = "default",
  component = "default",
): Part => part(a, name, rod(start, end, width), material, component);
/** @deprecated Use assembly.part(name, g.slab(...), options) instead. */
export const pane = (
  a: Assembly,
  name: string,
  points: Vector[],
  normal: Vector,
  material = "default",
  component = "default",
  depth = 0.012,
): Part => part(a, name, slab(points, normal, depth), material, component);
