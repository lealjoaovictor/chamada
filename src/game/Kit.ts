import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Material } from "@babylonjs/core/Materials/material";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Meshes/instancedMesh";
import "@babylonjs/loaders/glTF";
import { MODEL_OPTIONS, modelFile } from "./modelFile";
import type { PropData } from "../levels/types";

/** Tom geral aplicado às cores dos modelos prontos, para casarem com a paleta fria e dessaturada do jogo. */
const TINT = new Color3(0.54, 0.55, 0.6);

function isModular(model: string): boolean {
  return model.startsWith("modular_");
}

interface Source {
  meshes: Mesh[];
  modular: boolean;
  min: Vector3;
  max: Vector3;
}

/**
 * Modelos prontos (glTF do Poly Haven, CC0) colocados por dados da fase.
 * Cada modelo é carregado uma vez; cada uso cria instâncias que compartilham geometria e material.
 * Um modelo com várias peças aceita `part`: expressão regular (inteira) com os nomes das malhas a usar.
 */
export class Kit {
  private readonly scene: Scene;
  private readonly raw = new Map<string, Mesh[]>();
  private readonly sources = new Map<string, Source>();
  private readonly materials = new Map<Material, StandardMaterial>();
  private readonly textures: Texture[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async load(models: readonly string[]): Promise<void> {
    await Promise.all([...new Set(models)].map((name) => this.loadModel(name)));
  }

  /** Espera as texturas dos modelos (para o pré-aquecimento não mostrar objetos sem cor). */
  async whenReady(): Promise<void> {
    await Promise.all(
      this.textures.map(
        (texture) => new Promise<void>((resolve) => (texture.isReady() ? resolve() : texture.onLoadObservable.addOnce(() => resolve()))),
      ),
    );
  }

  place(prop: PropData, name: string): TransformNode {
    const source = this.source(prop.model, prop.part);
    const root = new TransformNode(name, this.scene);
    const size = source.max.subtract(source.min);
    let scale = prop.scale ?? 1;
    if (prop.fitHeight) scale = prop.fitHeight / size.y;
    else if (prop.fitWidth) scale = prop.fitWidth / size.x;
    const stretch = prop.stretch ?? [1, 1, 1];
    root.scaling.set(scale * stretch[0], scale * stretch[1], scale * stretch[2]);
    root.rotation.y = ((prop.rotY ?? 0) * Math.PI) / 180;
    // A origem do objeto colocado é o centro da base: (x, y, z) da fase = onde ele encosta no chão.
    // Peças de kits modulares mantêm a origem própria do kit, para encaixarem umas nas outras.
    const center = (prop.origin ?? source.modular)
      ? Vector3.Zero()
      : new Vector3((source.min.x + source.max.x) / 2, source.min.y, (source.min.z + source.max.z) / 2);
    const pivot = new TransformNode(`${name}-pivot`, this.scene);
    pivot.parent = root;
    pivot.position.copyFrom(center.scale(-1));
    root.position.set(prop.x, prop.y, prop.z);
    for (const mesh of source.meshes) {
      const instance = mesh.createInstance(`${name}-${mesh.name}`);
      instance.parent = pivot;
      instance.isPickable = false;
    }
    root.computeWorldMatrix(true);
    pivot.computeWorldMatrix(true);
    for (const child of pivot.getChildMeshes()) {
      child.computeWorldMatrix(true);
      child.freezeWorldMatrix();
    }
    return root;
  }

  /** Malhas colocadas que devem projetar sombra (ex.: na lanterna do Vigia). */
  meshesOf(root: TransformNode): AbstractMesh[] {
    return root.getChildMeshes();
  }

  private source(model: string, part?: string): Source {
    const key = `${model}|${part ?? ""}`;
    const cached = this.sources.get(key);
    if (cached) return cached;
    const all = this.raw.get(model);
    if (!all) throw new Error(`modelo não carregado: ${model}`);
    const pattern = part ? new RegExp(`^(?:${part})$`) : null;
    const meshes = pattern ? all.filter((mesh) => pattern.test(mesh.name)) : all;
    if (meshes.length === 0) throw new Error(`peça não encontrada: ${model}/${part}`);
    const min = new Vector3(Infinity, Infinity, Infinity);
    const max = new Vector3(-Infinity, -Infinity, -Infinity);
    for (const mesh of meshes) {
      const box = mesh.getBoundingInfo().boundingBox;
      min.minimizeInPlace(box.minimum);
      max.maximizeInPlace(box.maximum);
    }
    const source = { meshes, min, max, modular: isModular(model) };
    this.sources.set(key, source);
    return source;
  }

  private async loadModel(name: string): Promise<void> {
    const container = await LoadAssetContainerAsync(modelFile(`kit/${name}`), this.scene, MODEL_OPTIONS);
    container.addAllToScene();
    const meshes: Mesh[] = [];
    for (const mesh of container.meshes) {
      if (!(mesh instanceof Mesh) || mesh.getTotalVertices() === 0) continue;
      // Num kit modular cada peça vem espalhada pela vitrine do arquivo; zerar a posição a traz para a origem do kit.
      if (isModular(name)) {
        let node: TransformNode = mesh;
        while (node.parent instanceof TransformNode && node.parent.name !== "__root__") node = node.parent;
        node.position.setAll(0);
      }
      mesh.setParent(null);
      mesh.bakeCurrentTransformIntoVertices();
      mesh.name = mesh.name.replace(/_primitive\d+$/, "");
      mesh.material = this.convert(mesh.material);
      mesh.receiveShadows = true;
      mesh.isPickable = false;
      mesh.isVisible = false;
      mesh.alwaysSelectAsActiveMesh = false;
      meshes.push(mesh);
    }
    // Só agora descarta os PBR originais: descartar antes tira o material das outras malhas que o compartilham.
    for (const original of container.materials) if (this.materials.has(original)) original.dispose(false, false);
    for (const node of container.transformNodes) node.dispose();
    for (const mesh of container.meshes) if (!meshes.includes(mesh as Mesh)) mesh.dispose();
    this.raw.set(name, meshes);
  }

  /** Troca o material PBR do glTF por um StandardMaterial, para responder à mesma luz e névoa do resto do cenário. */
  private convert(material: Material | null): StandardMaterial {
    if (!material) return new StandardMaterial("kit-vazio", this.scene);
    const cached = this.materials.get(material);
    if (cached) return cached;
    const standard = new StandardMaterial(`kit-${material.name}`, this.scene);
    standard.specularColor = new Color3(0.04, 0.04, 0.05);
    standard.specularPower = 24;
    if (material instanceof PBRMaterial) {
      standard.diffuseColor = material.albedoColor.multiply(TINT);
      if (material.albedoTexture) {
        standard.diffuseTexture = material.albedoTexture;
        this.textures.push(material.albedoTexture as Texture);
      }
      if (material.bumpTexture) {
        standard.bumpTexture = material.bumpTexture;
        standard.bumpTexture.level = 0.8;
        standard.invertNormalMapX = material.invertNormalMapX;
        standard.invertNormalMapY = material.invertNormalMapY;
        this.textures.push(material.bumpTexture as Texture);
      }
      if (material.transparencyMode === Material.MATERIAL_ALPHATEST || material.needAlphaTesting()) {
        standard.transparencyMode = Material.MATERIAL_ALPHATEST;
        standard.alphaCutOff = material.alphaCutOff;
        standard.useAlphaFromDiffuseTexture = true;
        if (standard.diffuseTexture) standard.diffuseTexture.hasAlpha = true;
      }
      if (material.transparencyMode === Material.MATERIAL_ALPHABLEND || material.alpha < 1) {
        // Vidro: meio transparente, para ver o interior escuro e as janelas acesas.
        standard.alpha = 0.55;
        standard.specularColor = new Color3(0.25, 0.27, 0.3);
        standard.specularPower = 64;
      }
      standard.backFaceCulling = material.backFaceCulling;
      standard.twoSidedLighting = !material.backFaceCulling;
    }
    this.materials.set(material, standard);
    return standard;
  }
}
