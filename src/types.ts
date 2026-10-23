// Renderer-independent, JSON-serializable model descriptions. Z-up, meters by default.
export type Vector = number[];
export interface Geometry {
  vertices: Vector[];
  triangles: number[][];
  closed: boolean;
}
export interface Material {
  color: string;
  roughness: number;
  metalness: number;
  emissive?: string;
  emissiveIntensity?: number;
}
export type Materials = Record<string, Material>;
export type Tags = Record<string, string>;
export interface Part {
  name: string;
  geometry: Geometry;
  material: string;
  tags: Tags;
}
export interface Assembly {
  name: string;
  tags: Tags;
  category: string;
  explode: Vector;
  parts: Part[];
  label?: string;
}
export interface Bounds {
  min: Vector;
  max: Vector;
  size: Vector;
}
export interface VisibilityNode {
  id: string;
  label: string;
  children: VisibilityNode[];
}
export type Visibility = Record<string, boolean>;
export interface ModelDraft {
  name: string;
  schemaVersion: number;
  coordinates: { up: string; units: string };
  materials: Materials;
  assemblies: Assembly[];
}
export interface Description extends ModelDraft {
  visibilityTree: VisibilityNode[];
  bounds: Bounds;
  triangleCount: number;
}
export interface ModelState {
  visibility: Visibility;
  explode: number;
}
