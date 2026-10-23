import type { Description, ModelState } from "./types.js";
import * as THREE from "three";
import { assemblyPath, componentPath, isVisible } from "./visibility.js";

// Optional renderer adapter. The core does not import Three.js.
export function createObject(description: Description) {
  const root = new THREE.Group();
  root.name = description.name;
  try {
    for (const a of description.assemblies) {
      const group = new THREE.Group();
      group.name = a.name;
      group.userData = {
        ...a.tags,
        category: a.category,
        visibilityPath: assemblyPath(a),
        explode: [...a.explode],
      };
      root.add(group);
      for (const p of a.parts) {
        if (!Object.hasOwn(description.materials, p.material))
          throw RangeError(`Unknown material: ${p.material}`);
        const geometry = new THREE.BufferGeometry();
        let material: THREE.MeshStandardMaterial | undefined;
        try {
          geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(p.geometry.vertices.flat(), 3),
          );
          geometry.setIndex(p.geometry.triangles.flat());
          geometry.computeVertexNormals();
          material = new THREE.MeshStandardMaterial({
            ...description.materials[p.material],
            flatShading: true,
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.name = p.name;
          mesh.userData = { ...p.tags, visibilityPath: componentPath(a, p) };
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          group.add(mesh);
        } catch (error) {
          geometry.dispose();
          material?.dispose();
          throw error;
        }
      }
    }
    return root;
  } catch (error) {
    disposeObject(root);
    throw error;
  }
}
export function applyState(root: THREE.Object3D, state: ModelState) {
  for (const a of root.children) {
    a.visible = isVisible(state.visibility, a.userData.visibilityPath);
    a.position.fromArray(a.userData.explode).multiplyScalar(state.explode);
    for (const mesh of a.children)
      mesh.visible = isVisible(state.visibility, mesh.userData.visibilityPath);
  }
}
export function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material)
      for (const m of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material])
        materials.add(m);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}
export function visibleTriangles(root: THREE.Object3D) {
  let count = 0;
  root.traverseVisible((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh)
      count +=
        (mesh.geometry.index?.count ??
          mesh.geometry.getAttribute("position").count) / 3;
  });
  return count;
}
