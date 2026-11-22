import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/glTF";
import { MODEL_OPTIONS, modelFile } from "./modelFile";
import type { BlockData, ModelName } from "../levels/types";

export class Props {
  private readonly sources = new Map<ModelName, Mesh>();
  private readonly scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async load(names: readonly ModelName[]): Promise<void> {
    const material = new StandardMaterial("props-mat", this.scene);
    material.specularColor = Color3.Black();
    await Promise.all(
      [...new Set(names)].map(async (name) => {
        const result = await ImportMeshAsync(modelFile(name), this.scene, MODEL_OPTIONS);
        const mesh = result.meshes.find((candidate): candidate is Mesh => candidate instanceof Mesh && candidate.getTotalVertices() > 0);
        if (!mesh) throw new Error(`modelo sem malha: ${name}`);
        mesh.setParent(null);
        mesh.bakeCurrentTransformIntoVertices();
        for (const other of result.meshes) if (other !== mesh) other.dispose();
        mesh.material = material;
        mesh.receiveShadows = true;
        mesh.isPickable = false;
        mesh.setEnabled(false);
        this.sources.set(name, mesh);
      }),
    );
  }

  place(block: BlockData, name: ModelName, size: { width: number; height: number; depth: number }): InstancedMesh {
    const source = this.sources.get(name);
    if (!source) throw new Error(`modelo não carregado: ${name}`);
    if (!source.isEnabled()) source.setEnabled(true);
    source.isVisible = false;
    const bounds = source.getBoundingInfo().boundingBox.extendSize;
    const instance = source.createInstance(`${name}-${block.x}`);
    instance.position.set(block.x, block.y, block.z ?? 0);
    instance.scaling.set(size.width / (bounds.x * 2), size.height / (bounds.y * 2), size.depth / (bounds.z * 2));
    instance.isPickable = false;
    instance.freezeWorldMatrix();
    return instance;
  }
}
