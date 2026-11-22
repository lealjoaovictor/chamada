import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import type { PhysicsEngine } from "@babylonjs/core/Physics/v2/physicsEngine";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/glTF";
import type { VigiaData } from "../../levels/types";

const MODEL_URL = `${import.meta.env.BASE_URL}models/vigia.glb`;
const MODEL_COLOR = new Color3(0.03, 0.03, 0.035);
const MODEL_SCALE = 1.1;
const WALK_CLIP_SPEED = 1.68;
const BLEND_TIME = 0.25;
const LIGHT_COLOR = new Color3(1, 0.82, 0.55);
const LIGHT_INTENSITY = 9;
const HAND_HEIGHT = 1.3;
const HAND_FORWARD = 0.35;
const LENS_SIZE = 0.12;
const SHADOW_MAP_SIZE = 1024;
const SIGHT_MARGIN = 0.4;

type Phase = "andando" | "parado";

export class Vigia {
  private readonly scene: Scene;
  private readonly data: VigiaData;
  private readonly visual: TransformNode;
  private readonly walk?: AnimationGroup;
  private readonly idle?: AnimationGroup;
  private readonly light: SpotLight;
  private readonly lens: Mesh;
  private readonly shadows: ShadowGenerator;
  private readonly ray = new PhysicsRaycastResult();
  private readonly lamp = new Vector3();
  private readonly dir = new Vector3();
  private readonly toPoint = new Vector3();
  private readonly cosHalf: number;
  private x = 0;
  private heading = 1;
  private facing = 1;
  private phase: Phase = "andando";
  private timer = 0;

  private constructor(scene: Scene, data: VigiaData, visual: TransformNode, anims: Map<string, AnimationGroup>) {
    this.scene = scene;
    this.data = data;
    this.visual = visual;
    this.walk = anims.get("andar");
    this.idle = anims.get("parado");
    this.walk?.start(true);
    this.idle?.start(true);
    this.cosHalf = Math.cos(data.coneAngle);

    this.light = new SpotLight("vigia-luz", new Vector3(), new Vector3(1, 0, 0), data.coneAngle * 2, 2, scene);
    this.light.diffuse = LIGHT_COLOR;
    this.light.specular = Color3.Black();
    this.light.intensity = LIGHT_INTENSITY;
    this.light.range = data.range;
    this.shadows = new ShadowGenerator(SHADOW_MAP_SIZE, this.light);
    this.shadows.usePercentageCloserFiltering = true;
    this.shadows.bias = 0.0005;

    this.lens = CreateSphere("vigia-lente", { diameter: LENS_SIZE, segments: 8 }, scene);
    const lensMaterial = new StandardMaterial("vigia-lente-mat", scene);
    lensMaterial.emissiveColor = LIGHT_COLOR;
    lensMaterial.disableLighting = true;
    this.lens.material = lensMaterial;
    this.lens.isPickable = false;

    this.reset();
  }

  static async create(scene: Scene, data: VigiaData): Promise<Vigia> {
    const result = await ImportMeshAsync(MODEL_URL, scene);
    const visual = new TransformNode("vigia-visual", scene);
    visual.scaling.setAll(MODEL_SCALE);
    const material = new StandardMaterial("vigia-mat", scene);
    material.diffuseColor = MODEL_COLOR;
    material.specularColor = Color3.Black();
    for (const mesh of result.meshes) {
      if (!mesh.parent) mesh.parent = visual;
      if (mesh.material) {
        mesh.material.dispose();
        mesh.material = material;
      }
    }
    const anims = new Map<string, AnimationGroup>();
    for (const group of result.animationGroups) {
      group.stop();
      anims.set(group.name, group);
    }
    return new Vigia(scene, data, visual, anims);
  }

  addShadowCasters(meshes: readonly AbstractMesh[]): void {
    for (const mesh of meshes) this.shadows.addShadowCaster(mesh, true);
  }

  reset(): void {
    this.x = this.data.x0;
    this.heading = 1;
    this.facing = 1;
    this.phase = "andando";
    this.timer = 0;
    if (this.walk) this.walk.weight = 1;
    if (this.idle) this.idle.weight = 0;
    this.syncVisual();
  }

  update(dt: number): void {
    if (this.phase === "andando") {
      this.x += this.heading * this.data.speed * dt;
      const end = this.heading > 0 ? this.data.x1 : this.data.x0;
      if ((end - this.x) * this.heading <= 0) {
        this.x = end;
        this.phase = "parado";
        this.timer = 0;
      }
    } else {
      this.timer += dt;
      const turnStart = this.data.pause * 0.4;
      const t = Math.min(Math.max((this.timer - turnStart) / (this.data.pause - turnStart), 0), 1);
      this.facing = this.heading * Math.cos(Math.PI * smooth(t));
      if (this.timer >= this.data.pause) {
        this.heading = -this.heading;
        this.facing = this.heading;
        this.phase = "andando";
      }
    }

    const walking = this.phase === "andando";
    const step = dt / BLEND_TIME;
    if (this.walk) {
      this.walk.weight = approach(this.walk.weight, walking ? 1 : 0, step);
      this.walk.speedRatio = this.data.speed / WALK_CLIP_SPEED;
    }
    if (this.idle) this.idle.weight = approach(this.idle.weight, walking ? 0 : 1, step);
    this.syncVisual();
  }

  sees(points: readonly Vector3[]): boolean {
    const engine = this.scene.getPhysicsEngine() as PhysicsEngine | null;
    for (const point of points) {
      point.subtractToRef(this.lamp, this.toPoint);
      const distance = this.toPoint.length();
      if (distance > this.data.range || distance < 0.01) continue;
      if (Vector3.Dot(this.toPoint, this.dir) / distance < this.cosHalf) continue;
      if (!engine) return true;
      engine.raycastToRef(this.lamp, point, this.ray);
      if (!this.ray.hasHit || this.ray.hitDistance > distance - SIGHT_MARGIN) return true;
    }
    return false;
  }

  private syncVisual(): void {
    const side = Math.sqrt(Math.max(0, 1 - this.facing * this.facing));
    const yaw = Math.atan2(this.facing, -side);
    this.visual.rotation.y = yaw;
    this.visual.position.set(this.x, this.data.y, this.data.z);

    this.lamp.set(
      this.x + this.facing * HAND_FORWARD,
      this.data.y + HAND_HEIGHT,
      this.data.z - side * HAND_FORWARD,
    );
    this.dir.set(this.facing * this.data.aimAhead, this.data.aimY - this.lamp.y, -this.data.z);
    this.dir.normalize();
    this.light.position.copyFrom(this.lamp);
    this.light.direction.copyFrom(this.dir);

    this.lens.position.copyFrom(this.lamp);
  }
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function approach(value: number, target: number, maxDelta: number): number {
  if (value < target) return Math.min(value + maxDelta, target);
  return Math.max(value - maxDelta, target);
}
