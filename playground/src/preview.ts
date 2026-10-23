import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Description } from "../../src/types.js";
import { createObject, disposeObject } from "../../src/three-adapter.js";

const BACKGROUND = 0x111827;
const GRID_DIVISIONS = 20;
const FIT_MARGIN = 1.35;
const DEFAULT_VIEW = new THREE.Vector3(1, -1.4, 0.85).normalize();
const KEY_DIRECTION = new THREE.Vector3(1, -1.25, 1.7).normalize();
const FILL_DIRECTION = new THREE.Vector3(-1.3, 1, 0.7).normalize();

function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const exponent = Math.floor(Math.log10(raw));
  const base = 10 ** exponent;
  const value = raw / base;
  const multiple = value <= 1 ? 1 : value <= 2 ? 2 : value <= 5 ? 5 : 10;
  return multiple * base;
}

export class Preview {
  private readonly host: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly hemisphere: THREE.HemisphereLight;
  private readonly key: THREE.DirectionalLight;
  private readonly fill: THREE.DirectionalLight;
  private readonly lightTarget = new THREE.Object3D();

  private grid: THREE.GridHelper | null = null;
  private gridStep = 0;
  private model: THREE.Group | null = null;
  private wireframe = false;

  private observer: ResizeObserver | null = null;
  private frame = 0;
  private width = 0;
  private height = 0;
  private disposed = false;

  constructor(host: HTMLElement) {
    this.host = host;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(this.pixelRatio());
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.touchAction = "none";
    this.renderer.domElement.setAttribute("aria-label", "3D model preview");
    host.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BACKGROUND);

    // The model format and the whole scene use Z as up.
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
    this.camera.up.set(0, 0, 1);
    this.camera.position.copy(DEFAULT_VIEW).multiplyScalar(4);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = true;
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    this.hemisphere = new THREE.HemisphereLight(0xc7d2fe, 0x0f172a, 1.4);
    this.key = new THREE.DirectionalLight(0xffffff, 2.5);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.bias = -0.0005;
    this.key.target = this.lightTarget;
    this.fill = new THREE.DirectionalLight(0x93c5fd, 1);
    this.fill.target = this.lightTarget;
    this.scene.add(this.hemisphere, this.key, this.fill, this.lightTarget);

    this.resize();
    this.fit();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", this.resize);
    } else {
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(host);
    }

    this.frame = requestAnimationFrame(this.animate);
  }

  setModel(description: Description): void {
    this.assertUsable();
    const next = createObject(description);
    this.clearModel();
    this.model = next;
    this.scene.add(next);
    this.applyWireframe();
    this.resize();
    this.fit();
  }

  fit(): void {
    this.assertUsable();

    const bounds = new THREE.Box3();
    const center = new THREE.Vector3();
    let radius = 1;
    let groundZ = 0;

    if (this.model) {
      bounds.setFromObject(this.model);
      if (!bounds.isEmpty()) {
        const sphere = bounds.getBoundingSphere(new THREE.Sphere());
        bounds.getCenter(center);
        if (Number.isFinite(sphere.radius) && sphere.radius > 0)
          radius = sphere.radius;
        if (Number.isFinite(bounds.min.z)) groundZ = bounds.min.z;
      }
    }

    if (![center.x, center.y, center.z].every(Number.isFinite))
      center.set(0, 0, 0);

    const aspect = Math.max(this.camera.aspect, 1e-6);
    const halfVertical = THREE.MathUtils.degToRad(this.camera.fov) / 2;
    const halfHorizontal = Math.atan(Math.tan(halfVertical) * aspect);
    const distance =
      Math.max(
        radius / Math.sin(halfVertical),
        radius / Math.sin(halfHorizontal),
      ) * FIT_MARGIN;

    const direction = this.camera.position.clone().sub(this.controls.target);
    if (!Number.isFinite(direction.lengthSq()) || direction.lengthSq() < 1e-12)
      direction.copy(DEFAULT_VIEW);
    direction.normalize();

    this.controls.target.copy(center);
    this.controls.minDistance = Math.max(radius * 0.02, 1e-9);
    this.controls.maxDistance = Math.max(distance * 6, radius * 40);
    this.camera.position.copy(center).addScaledVector(direction, distance);
    this.camera.up.set(0, 0, 1);
    this.camera.lookAt(center);

    // Scale the clipping range with the model so tiny and huge models both work.
    this.camera.near = Math.max(radius * 0.002, 1e-9);
    this.camera.far = this.controls.maxDistance + radius * 8;
    this.camera.updateProjectionMatrix();

    this.updateLights(center, radius);
    this.updateGround(center, radius, groundZ);
    this.controls.update();
  }

  setWireframe(value: boolean): void {
    this.assertUsable();
    this.wireframe = value;
    this.applyWireframe();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    cancelAnimationFrame(this.frame);
    this.frame = 0;

    const observer = this.observer;
    this.observer = null;
    if (observer) observer.disconnect();
    else window.removeEventListener("resize", this.resize);

    this.controls.dispose();
    this.clearModel();
    this.disposeGrid();
    this.scene.clear();

    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }

  private readonly animate = (): void => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private readonly resize = (): void => {
    if (this.disposed) return;
    const width = Math.max(1, Math.floor(this.host.clientWidth));
    const height = Math.max(1, Math.floor(this.host.clientHeight));
    if (width === this.width && height === this.height) return;

    this.width = width;
    this.height = height;
    this.renderer.setPixelRatio(this.pixelRatio());
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  private pixelRatio(): number {
    return Math.min(window.devicePixelRatio || 1, 2);
  }

  private clearModel(): void {
    if (!this.model) return;
    this.model.removeFromParent();
    disposeObject(this.model);
    this.model = null;
  }

  private applyWireframe(): void {
    this.model?.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const material of materials) {
        const candidate = material as THREE.Material & {
          wireframe?: boolean;
        };
        if (
          typeof candidate.wireframe === "boolean" &&
          candidate.wireframe !== this.wireframe
        ) {
          candidate.wireframe = this.wireframe;
          candidate.needsUpdate = true;
        }
      }
    });
  }

  private updateLights(center: THREE.Vector3, radius: number): void {
    this.key.position.copy(center).addScaledVector(KEY_DIRECTION, radius * 3);
    this.fill.position.copy(center).addScaledVector(FILL_DIRECTION, radius * 3);
    this.lightTarget.position.copy(center);
    this.lightTarget.updateMatrixWorld();

    const shadow = this.key.shadow;
    const shadowCamera = shadow.camera;
    const extent = radius * 1.6;
    shadowCamera.left = -extent;
    shadowCamera.right = extent;
    shadowCamera.top = extent;
    shadowCamera.bottom = -extent;
    shadowCamera.near = Math.max(radius * 0.05, 1e-9);
    shadowCamera.far = Math.max(radius * 10, shadowCamera.near * 10);
    shadowCamera.updateProjectionMatrix();
    shadow.normalBias = Math.max(radius * 0.002, 1e-9);
  }

  private updateGround(
    center: THREE.Vector3,
    radius: number,
    groundZ: number,
  ): void {
    const step = niceStep(Math.max(radius * 4, 1e-6) / GRID_DIVISIONS);
    const sameStep =
      this.grid !== null &&
      Math.abs(step - this.gridStep) <= Math.max(this.gridStep, 1) * 1e-9;

    if (!sameStep) {
      this.disposeGrid();
      const grid = new THREE.GridHelper(
        step * GRID_DIVISIONS,
        GRID_DIVISIONS,
        0x64748b,
        0x334155,
      );
      grid.rotation.x = Math.PI / 2;
      grid.material.transparent = true;
      grid.material.opacity = 0.75;
      grid.material.depthWrite = false;
      grid.renderOrder = -1;
      this.scene.add(grid);
      this.grid = grid;
      this.gridStep = step;
    }

    this.grid?.position.set(center.x, center.y, groundZ);
  }

  private disposeGrid(): void {
    if (!this.grid) return;
    this.grid.removeFromParent();
    this.grid.dispose();
    this.grid = null;
    this.gridStep = 0;
  }

  private assertUsable(): void {
    if (this.disposed) throw new Error("Preview has already been disposed");
  }
}
