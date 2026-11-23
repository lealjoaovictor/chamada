import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { MODEL_OPTIONS, modelFile } from "../modelFile";
import type { FiguranteData } from "../../levels/types";

/**
 * Ângulos (graus) em torno do eixo lateral do boneco, na ordem do osso pai para o filho:
 * positivo leva o membro para a frente. Medidos com o modelo parado: coxa na horizontal e canela na vertical.
 */
const SEATED: [string, number][] = [
  ["mixamorig:LeftUpLeg", 62],
  ["mixamorig:RightUpLeg", 62],
  ["mixamorig:LeftLeg", -66],
  ["mixamorig:RightLeg", -66],
];
/** Quanto o quadril desce para o boneco sentado encostar no assento da cadeira. */
export const SEATED_DROP = 0.39;

/** Antebraço direito dobrado para a frente, segurando algo (a lista do professor, o celular do colega). */
const HOLDING: [string, number][] = [["mixamorig:RightForeArm", 75]];

/**
 * Pessoa parada em cena (o professor e o colega na sala do final): o mesmo boneco do Mixamo,
 * num tom diferente do Zacarias e dos seguranças, numa pose fixa.
 */
export class Figurante {
  readonly root: TransformNode;

  private constructor(root: TransformNode) {
    this.root = root;
  }

  static async create(scene: Scene, data: FiguranteData, name: string): Promise<Figurante> {
    const result = await ImportMeshAsync(modelFile(data.modelo), scene, MODEL_OPTIONS);
    const root = new TransformNode(name, scene);
    root.position.set(data.x, data.y - (data.pose === "sentado" ? SEATED_DROP : 0), data.z);
    root.rotation.y = ((data.rotY ?? 0) * Math.PI) / 180;
    const material = new StandardMaterial(`${name}-mat`, scene);
    material.diffuseColor = new Color3(...data.tom);
    material.specularColor = Color3.Black();
    for (const mesh of result.meshes) {
      if (!mesh.parent) mesh.parent = root;
      if (mesh.material) {
        mesh.material.dispose();
        mesh.material = material;
      }
      mesh.isPickable = false;
    }
    // Pose de partida: um quadro da animação parada (braços abaixados), congelado.
    for (const group of result.animationGroups) group.stop();
    const idle = result.animationGroups.find((group) => group.name === "parado");
    if (idle) {
      idle.start(false);
      idle.goToFrame(idle.from + 12);
      idle.pause();
    }
    const nodes = new Map(result.transformNodes.map((node) => [node.name, node]));
    // Gira cada osso em torno do eixo lateral do boneco (X do modelo), convertido para o espaço local do osso.
    const bend = (angles: [string, number][]) => {
      for (const [bone, degrees] of angles) {
        const node = nodes.get(bone);
        if (!node) continue;
        for (const other of result.transformNodes) other.computeWorldMatrix(true);
        const world = new Quaternion();
        node.getWorldMatrix().decompose(undefined, world);
        const rootRotation = Quaternion.FromEulerAngles(0, root.rotation.y, 0);
        const axis = Vector3.Right().applyRotationQuaternion(rootRotation).applyRotationQuaternion(Quaternion.Inverse(world)).normalize();
        const extra = Quaternion.RotationAxis(axis, (degrees * Math.PI) / 180);
        node.rotationQuaternion = (node.rotationQuaternion ?? Quaternion.FromEulerVector(node.rotation)).multiply(extra);
      }
    };
    if (data.pose === "sentado") bend(SEATED);
    if (data.segura) {
      bend(HOLDING);
      const hand = nodes.get("mixamorig:RightHand");
      if (hand) {
        const held = CreateBox(`${name}-${data.segura}`, data.segura === "celular" ? { width: 7, height: 14, depth: 1 } : { width: 22, height: 30, depth: 1 }, scene);
        const heldMaterial = new StandardMaterial(`${name}-${data.segura}-mat`, scene);
        if (data.segura === "celular") {
          // Tela acesa do celular: a ligação ainda aberta.
          heldMaterial.diffuseColor = new Color3(0.02, 0.02, 0.03);
          heldMaterial.emissiveColor = new Color3(0.35, 0.45, 0.55);
        } else {
          heldMaterial.diffuseColor = new Color3(0.72, 0.7, 0.63);
        }
        held.material = heldMaterial;
        held.parent = hand;
        held.position.set(0, 10, 4);
        held.isPickable = false;
      }
    }
    return new Figurante(root);
  }
}
