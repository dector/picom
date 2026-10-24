import type { Assembly, Part, Visibility, VisibilityNode } from "./types.ts";
// Serializable category → assembly → component tree; caller-owned labels and categories.
export const title = (value: string): string =>
  value.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
export const componentOf = (part: Part): string =>
  part.tags.component ?? "default";
export const assemblyPath = (assembly: Assembly): string =>
  `${assembly.category}/${assembly.name}`;
export const componentPath = (assembly: Assembly, part: Part): string =>
  `${assemblyPath(assembly)}/${componentOf(part)}`;
export function visibilityTree(
  assemblies: Assembly[],
  categories: readonly string[] = [
    ...new Set(assemblies.map((a) => a.category)),
  ],
  labels: Readonly<Record<string, string>> = {},
): VisibilityNode[] {
  const entry = (a: Assembly): VisibilityNode => ({
    id: assemblyPath(a),
    label: a.label ?? labels[assemblyPath(a)] ?? title(a.name),
    children: [...new Set(a.parts.map(componentOf))].map((component) => ({
      id: `${assemblyPath(a)}/${component}`,
      label: labels[`${assemblyPath(a)}/${component}`] ?? title(component),
      children: [],
    })),
  });
  const allCategories = [
    ...new Set([...categories, ...assemblies.map((a) => a.category)]),
  ];
  return allCategories.map((category) => ({
    id: category,
    label: labels[category] ?? title(category),
    children: assemblies.filter((a) => a.category === category).map(entry),
  }));
}
// Missing keys are visible, so existing category-only states remain supported.
export function isVisible(visibility: Visibility, path: string): boolean {
  const segments = path.split("/");
  return segments.every(
    (_, i) => visibility[segments.slice(0, i + 1).join("/")] !== false,
  );
}
export function visibilityStatus(
  visibility: Visibility,
  node: VisibilityNode,
): { checked: boolean; indeterminate: boolean } {
  if (!node.children.length)
    return { checked: isVisible(visibility, node.id), indeterminate: false };
  const children = node.children.map((child) =>
    visibilityStatus(visibility, child),
  );
  const checked = children.every((child) => child.checked);
  return {
    checked,
    indeterminate:
      !checked &&
      children.some((child) => child.checked || child.indeterminate),
  };
}
export function invertVisibility(
  visibility: Visibility,
  tree: VisibilityNode[],
): void {
  const leaves: [VisibilityNode, boolean][] = [];
  function collect(nodes: VisibilityNode[]) {
    for (const node of nodes) {
      if (node.children.length) collect(node.children);
      else leaves.push([node, !isVisible(visibility, node.id)]);
    }
  }
  // Snapshot effective visibility before enabling any hidden ancestor gates.
  collect(tree);
  for (const [node, checked] of leaves)
    setVisibility(visibility, node, checked);
}
export function setVisibility(
  visibility: Visibility,
  node: VisibilityNode,
  checked: boolean,
): void {
  visibility[node.id] = checked;
  for (const child of node.children) setVisibility(visibility, child, checked);
  // Enabling a descendant must also release any hidden ancestor gates.
  if (checked) {
    const segments = node.id.split("/");
    for (let i = 1; i < segments.length; i++)
      visibility[segments.slice(0, i).join("/")] = true;
  }
}
