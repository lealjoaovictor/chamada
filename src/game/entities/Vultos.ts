import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/glTF";
import { MODEL_OPTIONS, modelFile } from "../modelFile";
import type { VultoData } from "../../levels/types";

// Vultos: silhuetas de outros alunos indo para a aula, que somem quando o jogador chega perto.
// Contam sem palavras que todo mundo já está lá dentro.

const COLOR = new Color3(0.02, 0.02, 0.025);
const ALPHA = 0.55;
const WAKE_DISTANCE = 9;
const FADE_DISTANCE = 3.5;
const FADE_SPEED = 0.9;
const WALK_SPEED = 1.3;
const WALK_CLIP_SPEED = 5.3;

interface Vulto {
  data: VultoData;
  root: TransformNode;
  meshes: AbstractMesh[];
  walk?: AnimationGroup;
  idle?: AnimationGroup;
  x: number;
  awake: boolean;
  fading: boolean;
  alpha: number;
}

export class Vultos {
  private readonly vultos: Vulto[] = [];
  private readonly material: StandardMaterial;

  private constructor(scene: Scene) {
    this.material = new StandardMaterial("vulto-mat", scene);
    this.material.diffuseColor = COLOR;
    this.material.specularColor = Color3.Black();
    this.material.emissiveColor = new Color3(0.03, 0.035, 0.05);
  }

  static async create(scene: Scene, list: readonly VultoData[]): Promise<Vultos> {
    const manager = new Vultos(scene);
    if (list.length === 0) return manager;
    const container = await LoadAssetContainerAsync(modelFile("personagem"), scene, MODEL_OPTIONS);
    list.forEach((data, i) => {
      const entries = container.instantiateModelsToScene((name) => `vulto-${i}-${name}`, false, { doNotInstantiate: true });
      const root = new TransformNode(`vulto-${i}`, scene);
      const meshes: AbstractMesh[] = [];
      for (const node of entries.rootNodes) {
        node.parent = root;
        for (const mesh of node.getChildMeshes(false)) meshes.push(mesh);
        if ("material" in node) meshes.push(node as AbstractMesh);
      }
      const material = manager.material.clone(`vulto-mat-${i}`);
      material.alpha = ALPHA;
      for (const mesh of meshes) {
        mesh.material = material;
        mesh.isPickable = false;
      }
      const walk = entries.animationGroups.find((g) => g.name.endsWith("andar"));
      const idle = entries.animationGroups.find((g) => g.name.endsWith("parado"));
      for (const group of entries.animationGroups) group.stop();
      idle?.start(true);
      root.position.set(data.x, data.y, data.z ?? 0.6);
      root.rotation.y = (data.facing ?? 1) > 0 ? Math.PI / 2 : -Math.PI / 2;
      manager.vultos.push({ data, root, meshes, walk, idle, x: data.x, awake: false, fading: false, alpha: ALPHA });
    });
    return manager;
  }

  update(dt: number, playerX: number): void {
    for (const v of this.vultos) {
      if (v.alpha <= 0) continue;
      const distance = Math.abs(v.x - playerX);
      if (!v.awake && distance < WAKE_DISTANCE && v.data.anda) {
        v.awake = true;
        v.idle?.stop();
        v.walk?.start(true, WALK_SPEED / WALK_CLIP_SPEED);
      }
      if (v.awake) {
        v.x += (v.data.facing ?? 1) * WALK_SPEED * dt;
        v.root.position.x = v.x;
      }
      if (distance < FADE_DISTANCE) v.fading = true;
      if (!v.fading) continue;
      v.alpha = Math.max(0, v.alpha - FADE_SPEED * dt);
      const material = v.meshes[0]?.material as StandardMaterial | undefined;
      if (material) material.alpha = v.alpha;
      if (v.alpha === 0) {
        v.root.setEnabled(false);
        v.walk?.stop();
        v.idle?.stop();
      }
    }
  }

}
