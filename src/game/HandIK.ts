import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Node } from "@babylonjs/core/node";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";

/** Onde as mãos devem encostar (mundo). `z` vem da própria animação: cada mão fica do seu lado do corpo. */
export interface HandTarget {
  x: number;
  y: number;
}

interface Arm {
  upper: TransformNode;
  fore: TransformNode;
  hand: TransformNode;
  /** Pais até a raiz, de cima para baixo, para recalcular as matrizes depois da animação. */
  chain: TransformNode[];
  upperLength: number;
  foreLength: number;
}

// Distância lateral (Z) das mãos ao centro do corpo quando apoiadas.
const HAND_Z_MIN = 0.14;
const HAND_Z_MAX = 0.26;
const BLEND_IN = 9;
const BLEND_OUT = 6;
const ELBOW_PULL = 0.75;

const tmpA = new Vector3();
const tmpB = new Vector3();
const tmpC = new Vector3();
const tmpD = new Vector3();
const tmpM = new Matrix();
const tmpR = new Matrix();
const tmpQ = new Matrix();

/**
 * IK de dois ossos nos braços do Mixamo: leva as mãos até um ponto (alça do carrinho, borda da lixeira,
 * parede) por cima da animação que estiver tocando. Roda depois da animação, a cada quadro.
 */
export class HandIK {
  private readonly arms: Arm[];
  private weight = 0;
  private readonly last: HandTarget = { x: 0, y: 0 };
  /** Para testes e capturas: distância da última mão ao alvo. */
  lastError = 0;

  private constructor(arms: Arm[]) {
    this.arms = arms;
  }

  static create(nodes: readonly TransformNode[]): HandIK | null {
    const byName = new Map(nodes.map((n) => [n.name, n]));
    const arms: Arm[] = [];
    for (const side of ["Left", "Right"]) {
      const upper = byName.get(`mixamorig:${side}Arm`);
      const fore = byName.get(`mixamorig:${side}ForeArm`);
      const hand = byName.get(`mixamorig:${side}Hand`);
      if (!upper || !fore || !hand) return null;
      const chain: TransformNode[] = [];
      for (let n: Node | null = upper.parent; n; n = n.parent) chain.unshift(n as TransformNode);
      arms.push({ upper, fore, hand, chain, upperLength: 0, foreLength: 0 });
    }
    return new HandIK(arms);
  }

  get active(): boolean {
    return this.weight > 0.001;
  }

  /** Chamar depois da animação e do posicionamento do personagem. `target` nulo solta as mãos aos poucos. */
  apply(dt: number, target: HandTarget | null): void {
    if (target) {
      this.weight = Math.min(1, this.weight + BLEND_IN * dt);
      this.last.x = target.x;
      this.last.y = target.y;
    } else {
      this.weight = Math.max(0, this.weight - BLEND_OUT * dt);
    }
    if (this.weight <= 0.001) return;
    const w = smooth(this.weight);
    let error = 0;
    for (const arm of this.arms) {
      for (const node of arm.chain) node.computeWorldMatrix(true);
      arm.upper.computeWorldMatrix(true);
      arm.fore.computeWorldMatrix(true);
      arm.hand.computeWorldMatrix(true);
      const shoulder = arm.upper.getAbsolutePosition().clone();
      const elbow = arm.fore.getAbsolutePosition().clone();
      const hand = arm.hand.getAbsolutePosition().clone();
      // Comprimentos medidos uma vez (a animação não estica os ossos).
      if (arm.upperLength === 0) {
        arm.upperLength = Vector3.Distance(shoulder, elbow);
        arm.foreLength = Vector3.Distance(elbow, hand);
      }
      const side = Math.sign(shoulder.z) || 1;
      const goal = new Vector3(this.last.x, this.last.y, side * clamp(Math.abs(hand.z), HAND_Z_MIN, HAND_Z_MAX));
      Vector3.LerpToRef(hand, goal, w, goal);

      const a = arm.upperLength;
      const b = arm.foreLength;
      const toGoal = goal.subtract(shoulder);
      const reach = clamp(toGoal.length(), Math.abs(a - b) + 0.01, a + b - 0.005);
      const dir = toGoal.normalize();
      // Cotovelo: parte da animação, puxado para baixo, para trás e um pouco para fora (como quem empurra
      // ou se apoia de verdade). Só a animação deixava o cotovelo apontando para a frente nas pegadas baixas.
      const bend = elbow.subtract(shoulder).normalize().scaleInPlace(1 - ELBOW_PULL * w);
      const back = -Math.sign(toGoal.x) || 0;
      tmpA.set(back * 0.35, -1, side * 0.45).normalize().scaleInPlace(ELBOW_PULL * w);
      bend.addInPlace(tmpA);
      bend.subtractInPlace(dir.scale(Vector3.Dot(bend, dir)));
      if (bend.lengthSquared() < 1e-6) bend.set(0, -1, 0);
      bend.normalize();
      const cosA = clamp((a * a + reach * reach - b * b) / (2 * a * reach), -1, 1);
      const sinA = Math.sqrt(1 - cosA * cosA);
      const newElbow = shoulder.add(dir.scale(a * cosA)).addInPlace(bend.scale(a * sinA));

      rotateToward(arm.upper, elbow.subtract(shoulder), newElbow.subtract(shoulder));
      arm.upper.computeWorldMatrix(true);
      arm.fore.computeWorldMatrix(true);
      const elbowNow = arm.fore.getAbsolutePosition().clone();
      arm.hand.computeWorldMatrix(true);
      const handNow = arm.hand.getAbsolutePosition().clone();
      rotateToward(arm.fore, handNow.subtract(elbowNow), goal.subtract(elbowNow));
      arm.fore.computeWorldMatrix(true);
      arm.hand.computeWorldMatrix(true);
      error = Math.max(error, Vector3.Distance(arm.hand.getAbsolutePosition(), goal));
    }
    this.lastError = error;
  }
}

/**
 * Gira o osso `node` (no espaço do pai) para que a direção `from` (mundo) passe a apontar para `to`.
 * Feito com matrizes porque a raiz do glTF espelha o eixo Z (escala negativa).
 */
export function rotateToward(node: TransformNode, from: Vector3, to: Vector3): void {
  const parent = node.parent as TransformNode | null;
  if (!parent) return;
  parent.getWorldMatrix().invertToRef(tmpM);
  Vector3.TransformNormalToRef(from, tmpM, tmpA).normalize();
  Vector3.TransformNormalToRef(to, tmpM, tmpB).normalize();
  const dot = clamp(Vector3.Dot(tmpA, tmpB), -1, 1);
  if (dot > 0.99999) return;
  Vector3.CrossToRef(tmpA, tmpB, tmpC);
  if (tmpC.lengthSquared() < 1e-10) return;
  tmpC.normalize();
  let angle = Math.acos(dot);
  Matrix.RotationAxisToRef(tmpC, angle, tmpQ);
  Vector3.TransformNormalToRef(tmpA, tmpQ, tmpD);
  // A convenção de sinal da rotação depende da mão do sistema: confere e inverte se preciso.
  if (Vector3.Dot(tmpD, tmpB) < dot) {
    angle = -angle;
    Matrix.RotationAxisToRef(tmpC, angle, tmpQ);
  }
  const rotation = node.rotationQuaternion ?? Quaternion.FromEulerVector(node.rotation);
  rotation.toRotationMatrix(tmpR);
  tmpR.multiplyToRef(tmpQ, tmpM);
  const result = Quaternion.FromRotationMatrix(tmpM);
  if (node.rotationQuaternion) node.rotationQuaternion.copyFrom(result);
  else node.rotationQuaternion = result;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}
