import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateDisc } from "@babylonjs/core/Meshes/Builders/discBuilder";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Constants } from "@babylonjs/core/Engines/constants";
import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Node } from "@babylonjs/core/node";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/glTF";
import { MODEL_OPTIONS, modelFile } from "../modelFile";

// Lanterna dos seguranças: o modelo "Small Plastic Torch" (Poly Haven, CC0) preso ao osso da mão direita
// do boneco do Mixamo. Depois de cada quadro da animação, o braço é levantado e o pulso girado para a
// lanterna apontar exatamente para onde o segurança olha, e o facho visível sai da lente.

const MODEL_URL = modelFile("lanterna");
/** Posição da lente no espaço da mão (centímetros do Mixamo): à frente do indicador, do lado da palma. */
const GRIP_OFFSET = new Vector3(12.5, 7, 3.2);
/** De quantos centímetros (da mão) para metros (do modelo). */
const HAND_UNITS = 100;
/** Cor do corpo da lanterna: plástico preto, sem o amarelo do modelo original. */
const BODY_TINT = new Color3(0.05, 0.05, 0.055);
/** Braço: quanto o braço de cima desce em relação à mira, e quanto da pose final vale sobre a animação. */
const UPPER_ARM_DROP = 1.25;
const FOREARM_DROP = 0.15;
const ARM_WEIGHT = 0.92;
/** Facho visível. */
const BEAM_ALPHA = 0.16;
const BEAM_LENGTH = 0.8;
const LENS_GLOW = 0.022;
const MAX_OCCLUDERS = 12;

export interface OccluderBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

const BEAM_VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
uniform mat4 world;
uniform mat4 viewProjection;
varying vec3 vNormal;
varying vec3 vPos;
varying float vAlong;
void main() {
  vec4 p = world * vec4(position, 1.0);
  vPos = p.xyz;
  vNormal = normalize(mat3(world) * normal);
  vAlong = position.z;
  gl_Position = viewProjection * p;
}`;

const BEAM_FRAGMENT = `
precision highp float;
uniform vec3 color;
uniform vec3 eye;
uniform float strength;
uniform vec3 lens;
uniform vec3 boxMin[MAX_OCCLUDERS];
uniform vec3 boxMax[MAX_OCCLUDERS];
uniform float boxCount;
varying vec3 vNormal;
varying vec3 vPos;
varying float vAlong;
void main() {
  // Mais denso junto da lente, sumindo até o fim do alcance; bordas suaves (de lado o cone some na silhueta).
  float t = clamp(vAlong, 0.0, 1.0);
  float along = pow(1.0 - t, 2.2) * smoothstep(0.0, 0.04, t);
  float facing = abs(dot(normalize(eye - vPos), normalize(vNormal)));
  float edge = pow(facing, 1.6);
  // Depois de uma estante (as mesmas caixas que fazem sombra e bloqueiam a visão), o facho some.
  float lit = 1.0;
  vec3 delta = vPos - lens;
  vec3 inv = 1.0 / (delta + vec3(1e-6));
  for (int i = 0; i < MAX_OCCLUDERS; i++) {
    if (float(i) >= boxCount) break;
    vec3 a = (boxMin[i] - lens) * inv;
    vec3 b = (boxMax[i] - lens) * inv;
    vec3 lo = min(a, b);
    vec3 hi = max(a, b);
    float enter = max(max(lo.x, lo.y), max(lo.z, 0.0));
    float leave = min(min(hi.x, hi.y), min(hi.z, 1.0));
    if (enter <= leave) { lit = 0.0; break; }
  }
  gl_FragColor = vec4(color * strength * along * edge * lit, 1.0);
}`;

export class Lanterna {
  /** Força do facho visível (a sala de teste ajusta ao vivo). */
  static beamStrength = BEAM_ALPHA;
  /** Facho cortado pelo mapa de sombra (desligável para comparar). */
  static beamOcclusion = true;

  private readonly scene: Scene;
  private readonly arm: TransformNode;
  private readonly forearm: TransformNode;
  private readonly hand: TransformNode;
  private readonly lens: TransformNode;
  private readonly tail: TransformNode;
  private readonly beam: Mesh;
  private readonly beamMaterial: ShaderMaterial;
  private readonly glow: Mesh;
  private readonly glowMaterial: StandardMaterial;
  readonly meshes: AbstractMesh[];
  private readonly target = new Vector3();
  private readonly down = new Vector3(0, -1, 0);
  private readonly tmpA = new Vector3();
  private readonly tmpB = new Vector3();
  private readonly tmpQ = new Quaternion();
  private readonly tmpM = new Matrix();
  private readonly tmpM2 = new Matrix();
  private readonly tmpM3 = new Matrix();
  private readonly beamColor = new Color3();
  private strength = 1;
  private occluders: readonly OccluderBox[] = [];
  private readonly lensWorld = new Vector3();
  private readonly boxMin = new Array<number>(MAX_OCCLUDERS * 3).fill(0);
  private readonly boxMax = new Array<number>(MAX_OCCLUDERS * 3).fill(0);
  private boxCount = 0;
  private range = 10;
  private halfAngle = 0.5;

  private constructor(scene: Scene, bones: Map<string, TransformNode>, model: AbstractMesh[]) {
    this.scene = scene;
    const bone = (name: string): TransformNode => {
      const node = bones.get(`mixamorig:${name}`);
      if (!node) throw new Error(`osso ${name} não encontrado no segurança`);
      return node;
    };
    this.arm = bone("RightArm");
    this.forearm = bone("RightForeArm");
    this.hand = bone("RightHand");

    // Suporte preso à mão: a lente fica à frente do punho e o corpo atravessa a mão fechada.
    const holder = new TransformNode("lanterna-suporte", scene);
    holder.parent = this.hand;
    holder.position.copyFrom(GRIP_OFFSET);
    holder.rotation.y = Math.PI / 2;
    holder.scaling.setAll(HAND_UNITS);
    const root = model[0];
    root.parent = holder;
    root.position.setAll(0);

    const body = model.find((mesh) => mesh.getTotalVertices() > 0) ?? root;
    this.lens = new TransformNode("lanterna-lente", scene);
    this.lens.parent = body;
    this.tail = new TransformNode("lanterna-cabo", scene);
    this.tail.parent = body;
    this.tail.position.set(0, 0, -0.2);
    for (const mesh of model) {
      mesh.isPickable = false;
      // Plástico preto: tira a cor amarela da textura e mantém o relevo e o desgaste (normal e rugosidade).
      const material = mesh.material as { albedoColor?: Color3; albedoTexture?: unknown; name?: string } | null;
      if (material?.albedoColor && !material.name?.endsWith("glass")) {
        material.albedoTexture = null;
        material.albedoColor = BODY_TINT;
      }
    }
    this.meshes = model.filter((mesh) => mesh.getTotalVertices() > 0);

    // Brilho da lente (o bloom transforma num ponto quente) e o facho, que sai dali.
    this.glow = CreateDisc("lanterna-brilho", { radius: LENS_GLOW, tessellation: 16, sideOrientation: 2 }, scene);
    this.glowMaterial = new StandardMaterial("lanterna-brilho-mat", scene);
    this.glowMaterial.disableLighting = true;
    this.glowMaterial.backFaceCulling = false;
    this.glow.material = this.glowMaterial;
    this.glow.isPickable = false;

    this.beam = CreateCylinder("lanterna-facho", { height: 1, diameterTop: 0, diameterBottom: 2, tessellation: 32, subdivisions: 6, cap: 0 }, scene);
    // Cone com a ponta na origem, abrindo ao longo de +Z até z = 1.
    this.beam.rotation.x = -Math.PI / 2;
    this.beam.position.z = 0.5;
    this.beam.bakeCurrentTransformIntoVertices();
    this.beam.isPickable = false;
    this.beam.rotationQuaternion = new Quaternion();
    this.beamMaterial = new ShaderMaterial(
      "lanterna-facho-mat",
      scene,
      { vertexSource: BEAM_VERTEX, fragmentSource: BEAM_FRAGMENT },
      {
        attributes: ["position", "normal", "uv"],
        uniforms: ["world", "viewProjection", "color", "eye", "strength", "lens", "boxMin", "boxMax", "boxCount"],
        defines: [`#define MAX_OCCLUDERS ${MAX_OCCLUDERS}`],
        needAlphaBlending: true,
      },
    );
    this.beamMaterial.backFaceCulling = false;
    this.beamMaterial.alphaMode = Constants.ALPHA_ONEONE;
    this.beamMaterial.disableDepthWrite = true;
    this.beamMaterial.onBindObservable.add(() => {
      const camera = scene.activeCamera;
      const effect = this.beamMaterial.getEffect();
      if (camera) effect?.setVector3("eye", camera.globalPosition);
      effect?.setFloat("strength", Lanterna.beamStrength * this.strength);
      if (!effect) return;
      effect.setVector3("lens", this.lensWorld);
      effect.setArray3("boxMin", this.boxMin);
      effect.setArray3("boxMax", this.boxMax);
      effect.setFloat("boxCount", Lanterna.beamOcclusion ? this.boxCount : 0);
    });
    this.beam.material = this.beamMaterial;
    this.beam.alphaIndex = 10;
    this.setColor(new Color3(1, 1, 1), 1);
  }

  static async create(scene: Scene, bones: readonly TransformNode[]): Promise<Lanterna> {
    const result = await ImportMeshAsync(MODEL_URL, scene, MODEL_OPTIONS);
    const map = new Map<string, TransformNode>();
    for (const node of bones) map.set(node.name, node);
    return new Lanterna(scene, map, result.meshes);
  }

  /** Caixas que cortam o facho visível (as mesmas estantes e paredes que fazem sombra na lanterna). */
  setOccluders(boxes: readonly OccluderBox[]): void {
    this.occluders = boxes;
  }

  /** As caixas mais perto da lente vão para o shader (no máximo MAX_OCCLUDERS). */
  private pickOccluders(lens: Vector3): void {
    const reach = this.range + 1;
    const near = this.occluders
      .filter((box) => box.maxX > lens.x - reach && box.minX < lens.x + reach)
      .sort((a, b) => boxDistance(a, lens) - boxDistance(b, lens))
      .slice(0, MAX_OCCLUDERS);
    near.forEach((box, i) => {
      this.boxMin.splice(i * 3, 3, box.minX, box.minY, box.minZ);
      this.boxMax.splice(i * 3, 3, box.maxX, box.maxY, box.maxZ);
    });
    this.boxCount = near.length;
  }

  setCone(range: number, halfAngle: number): void {
    this.range = range;
    this.halfAngle = halfAngle;
  }

  setColor(color: Color3, strength: number): void {
    this.beamColor.copyFrom(color);
    this.strength = strength;
    this.glowMaterial.emissiveColor.copyFrom(color).scaleInPlace(2.5 * strength);
    this.beamMaterial.setColor3("color", this.beamColor);
    this.beamMaterial.setFloat("strength", Lanterna.beamStrength * strength);
  }

  setEnabled(shown: boolean): void {
    this.beam.setEnabled(shown);
    this.glow.setEnabled(shown);
  }

  /**
   * Depois da animação: levanta o braço, gira o pulso para a lanterna seguir `dir` e devolve a posição
   * da lente em `lensOut` (de onde a luz e a visão do segurança saem).
   */
  aim(dir: Vector3, lensOut: Vector3): void {
    refreshChain(this.arm);
    // Braço de cima desce do ombro, antebraço quase na direção da mira.
    this.target.copyFrom(dir).addInPlace(this.tmpA.copyFrom(this.down).scaleInPlace(UPPER_ARM_DROP)).normalize();
    this.pointBone(this.arm, this.target, ARM_WEIGHT);
    this.target.copyFrom(dir).addInPlace(this.tmpA.copyFrom(this.down).scaleInPlace(FOREARM_DROP)).normalize();
    this.pointBone(this.forearm, this.target, ARM_WEIGHT);
    // Pulso: o eixo da lanterna (cabo para a lente) vai exatamente na direção da mira.
    this.beamAxis(this.tmpB);
    this.rotateBone(this.hand, this.tmpB, dir, 1);
    this.lens.computeWorldMatrix(true);
    this.tail.computeWorldMatrix(true);
    lensOut.copyFrom(this.lens.getAbsolutePosition());
    this.lensWorld.copyFrom(lensOut);
    this.pickOccluders(lensOut);

    // Facho e brilho saem da lente, ao longo da mira.
    const radius = this.range * BEAM_LENGTH * Math.tan(this.halfAngle);
    this.beam.position.copyFrom(lensOut);
    this.beam.scaling.set(radius, radius, this.range * BEAM_LENGTH);
    Quaternion.FromUnitVectorsToRef(Vector3.Forward(), dir, this.beam.rotationQuaternion!);
    this.glow.position.copyFrom(dir).scaleInPlace(0.012).addInPlace(lensOut);
    const camera = this.scene.activeCamera;
    if (camera) this.glow.lookAt(camera.globalPosition);
  }

  private beamAxis(out: Vector3): void {
    this.lens.computeWorldMatrix(true);
    this.tail.computeWorldMatrix(true);
    out.copyFrom(this.lens.getAbsolutePosition()).subtractInPlace(this.tail.getAbsolutePosition()).normalize();
  }

  /** Gira o osso para o seu eixo +Y (o comprimento dele, no Mixamo) apontar para `target`. */
  private pointBone(bone: TransformNode, target: Vector3, weight: number): void {
    bone.computeWorldMatrix(true);
    Vector3.TransformNormalToRef(Vector3.Up(), bone.getWorldMatrix(), this.tmpA);
    this.tmpA.normalize();
    this.rotateBone(bone, this.tmpA, target, weight);
  }

  /** Aplica no osso a rotação (no mundo) que leva `from` até `to`, misturada com a pose da animação. */
  private rotateBone(bone: TransformNode, from: Vector3, to: Vector3, weight: number): void {
    Quaternion.FromUnitVectorsToRef(from, to, this.tmpQ);
    if (weight < 1) Quaternion.SlerpToRef(Quaternion.Identity(), this.tmpQ, weight, this.tmpQ);
    // Rotação do mundo levada para o espaço do pai: M = P * R * P⁻¹ (só a parte 3x3, sem escala).
    const parent = bone.parent as TransformNode;
    const p = this.tmpM.copyFrom(parent.getWorldMatrix());
    p.setTranslationFromFloats(0, 0, 0);
    const scale = Math.cbrt(Math.abs(p.determinant()));
    scaleMatrix(p, 1 / scale);
    Matrix.FromQuaternionToRef(this.tmpQ, this.tmpM2);
    const inv = this.tmpM3;
    p.transposeToRef(inv);
    // Para uma matriz ortogonal (com ou sem espelho), a inversa é a transposta.
    p.multiplyToRef(this.tmpM2, this.tmpM2);
    this.tmpM2.multiplyToRef(inv, this.tmpM2);
    const local = bone.rotationQuaternion ?? Quaternion.FromEulerVector(bone.rotation);
    Matrix.FromQuaternionToRef(local, this.tmpM);
    this.tmpM.multiplyToRef(this.tmpM2, this.tmpM);
    bone.rotationQuaternion = Quaternion.FromRotationMatrixToRef(this.tmpM, local);
    refreshSubtree(bone);
  }
}

function boxDistance(box: OccluderBox, p: Vector3): number {
  const dx = Math.max(box.minX - p.x, 0, p.x - box.maxX);
  const dy = Math.max(box.minY - p.y, 0, p.y - box.maxY);
  const dz = Math.max(box.minZ - p.z, 0, p.z - box.maxZ);
  return dx * dx + dy * dy + dz * dz;
}

function scaleMatrix(m: Matrix, k: number): void {
  const a = m.asArray().slice() as number[];
  for (const i of [0, 1, 2, 4, 5, 6, 8, 9, 10]) a[i] *= k;
  Matrix.FromArrayToRef(a, 0, m);
}

/** Recalcula as matrizes do mundo de cima para baixo até o nó (a animação acabou de mudar os ossos). */
function refreshChain(node: Node): void {
  const chain: TransformNode[] = [];
  for (let n: Node | null = node; n; n = n.parent) if (n instanceof TransformNode) chain.push(n);
  for (let i = chain.length - 1; i >= 0; i--) chain[i].computeWorldMatrix(true);
}

function refreshSubtree(node: TransformNode): void {
  node.computeWorldMatrix(true);
  for (const child of node.getChildTransformNodes(false)) child.computeWorldMatrix(true);
}
