import type { Material as MaterialData, Materials } from "./types.ts";

export type Material = MaterialData;
export type MaterialOptions = Partial<MaterialData>;

export const Material = {
  new(opts: MaterialOptions = {}): MaterialData {
    return {
      color: opts.color ?? "#b0b0b0",
      roughness: opts.roughness ?? 0.65,
      metalness: opts.metalness ?? 0,
      ...(opts.emissive !== undefined ? { emissive: opts.emissive } : {}),
      ...(opts.emissiveIntensity !== undefined
        ? { emissiveIntensity: opts.emissiveIntensity }
        : {}),
    };
  },
};
// Authored sRGB colors; opaque PBR presets, including the dark glass-like finish.
// Renamed neutral finishes retain the source toolkit's numeric values.
const presets: Materials = {
  beige: { color: "#d5cab6", roughness: 0.79, metalness: 0.02 },
  cream: { color: "#e2d7c4", roughness: 0.76, metalness: 0.02 },
  charcoal: { color: "#343b44", roughness: 0.76, metalness: 0.12 },
  rubber: { color: "#30343c", roughness: 0.94, metalness: 0 },
  rubberDark: { color: "#373b43", roughness: 0.92, metalness: 0 },
  black: { color: "#161c24", roughness: 0.92, metalness: 0 },
  metalDark: { color: "#454d58", roughness: 0.68, metalness: 0.25 },
  metalMid: { color: "#525b64", roughness: 0.7, metalness: 0.22 },
  glass: { color: "#3e4b5e", roughness: 0.27, metalness: 0.16 },
  nearBlack: { color: "#262d35", roughness: 0.86, metalness: 0.02 },
  coolEmitter: {
    color: "#e1efff",
    roughness: 0.32,
    metalness: 0.04,
    emissive: "#a7c9ee",
    emissiveIntensity: 0.22,
  },
  ivory: { color: "#e9e1c9", roughness: 0.38, metalness: 0.07 },
  amber: { color: "#ee9b36", roughness: 0.46, metalness: 0.02 },
  red: { color: "#b93e3e", roughness: 0.44, metalness: 0.02 },
  steel: { color: "#b2b5ae", roughness: 0.56, metalness: 0.6 },
  tan: { color: "#bfae93", roughness: 0.94, metalness: 0 },
  slate: { color: "#404754", roughness: 0.86, metalness: 0.01 },
};
export const MATERIALS: Readonly<Record<string, Readonly<Materials[string]>>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(presets).map(([name, material]) => [
        name,
        Object.freeze(material),
      ]),
    ),
  );

function rgb(color: string): number[] {
  if (typeof color !== "string" || !/^#[\da-f]{6}$/i.test(color))
    throw TypeError("Color must be a six-digit sRGB hex color");
  return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
}
const hex = (channels: number[]) =>
  "#" +
  channels
    .map((x) =>
      Math.max(0, Math.min(255, Math.round(x)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
// Return a fresh palette; shift selected finishes relative to an authored reference.
// Relative color and emission differences are retained, clamped to the sRGB range.
export function recolorMaterials(
  materials: Materials,
  names: readonly string[],
  color: string,
  reference = names[0],
): Materials {
  const chosen = rgb(color),
    result = structuredClone(materials);
  if (!Object.hasOwn(materials, reference))
    throw RangeError(`Unknown reference material: ${reference}`);
  const base = rgb(materials[reference].color);
  for (const name of names) {
    if (!Object.hasOwn(materials, name))
      throw RangeError(`Unknown material: ${name}`);
    const finish = materials[name];
    const shift = (source: string) =>
      hex(rgb(source).map((x, i) => x + chosen[i] - base[i]));
    result[name] = {
      ...finish,
      color: shift(finish.color),
      ...(finish.emissive ? { emissive: shift(finish.emissive) } : {}),
    };
  }
  return result;
}
