import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Node } from "@babylonjs/core/node";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { rotateToward } from "./HandIK";

/**
 * Ajuste fino dos pés: por cima de qualquer animação (correr, parado, agachado), cada pé pisa no piso que
 * está embaixo dele (degrau, rampa, caixa). O quadril desce ou sobe para a perna de apoio alcançar o chão,
 * a outra perna dobra o joelho, e o pé fica com a mesma pose da animação (plano no degrau, inclinado na rampa).
 *
 * Por baixo, escadas são rampas: o corpo sobe liso pela rampa e só as pernas mostram os degraus.
 */

/** O que o pé precisa saber do cenário. */
export interface FootGround {
  /** Altura do piso sob `x` (mundo), ou nulo (nada perto: o pé fica como na animação). */
  heightAt(x: number): number | null;
  /** Piso de referência da animação: onde o corpo "acha" que está o chão (sob a cápsula). */
  rootGround: number;
  /** Para onde o personagem olha (+1 direita, -1 esquerda). */
  facing: number;
}

interface Leg {
  upper: TransformNode;
  lower: TransformNode;
  foot: TransformNode;
  toe: TransformNode | null;
  chain: TransformNode[];
  upperLength: number;
  lowerLength: number;
  /** Diferença suavizada entre o piso sob o pé e o piso de referência. */
  lift: number;
  planted: number;
  ready: boolean;
}

// Tornozelo acima do chão com o pé apoiado (medido no Bryce parado e no apoio da corrida: 0,13 a 0,16 m).
const ANKLE_REST = 0.14;
// Abaixo disso (acima do apoio) o pé conta como apoiado; acima do segundo, como no ar.
const PLANT_LOW = 0.05;
const PLANT_HIGH = 0.16;
// Até onde a pegada do pé vai, a partir do tornozelo: calcanhar para trás e ponta além do dedão.
const HEEL_BACK = 0.07;
const TOE_AHEAD = 0.07;
// O pé no ar olha um pouco à frente para levantar antes do espelho do degrau.
const SWING_LOOKAHEAD = 0.18;
// Degrau maior que isso para cima (parede, caixa) ou para baixo (beirada) não é piso: o pé fica como na animação.
const MAX_STEP_UP = 0.5;
const MAX_STEP_DOWN = 0.45;
// Quadril: quanto pode descer/subir e com que rapidez acompanha.
const PELVIS_MIN = -0.4;
const PELVIS_MAX = 0.35;
const PELVIS_RATE_DOWN = 30;
const PELVIS_RATE_UP = 12;
// Suavização do piso de cada pé: rápida no apoio, mais lenta no ar (o pé desce o degrau sem pular).
const LIFT_RATE_PLANTED = 70;
const LIFT_RATE_SWING = 13;
// Penalidade do pé no ar na escolha do quadril (o quadril segue o pé de apoio).
const SWING_PENALTY = 0.6;
const BLEND_IN = 7;
const BLEND_OUT = 9;
// Inclinação máxima do pé numa rampa.
const MAX_FOOT_PITCH = (32 * Math.PI) / 180;

const tmpM = new Matrix();
const tmpN = new Matrix();
const tmpS = new Vector3();
const tmpT = new Vector3();
const tmpQ = new Quaternion();
const Z_AXIS = new Vector3(0, 0, 1);

export class FootIK {
  private readonly legs: Leg[];
  private readonly root: TransformNode;
  private weight = 0;
  private pelvis = 0;
  private readonly saved = new Matrix();
  /** Para testes e capturas: o quanto o quadril foi deslocado e o erro dos pés ao alvo. */
  lastPelvis = 0;
  lastError = 0;
  /** Para testes: altura do piso sob cada pé e altura do pé (sola) depois do ajuste. */
  readonly debug: { ground: number; sole: number; planted: number; toe: number }[] = [];

  private constructor(root: TransformNode, legs: Leg[]) {
    this.root = root;
    this.legs = legs;
  }

  static create(root: TransformNode, nodes: readonly TransformNode[]): FootIK | null {
    const byName = new Map(nodes.map((n) => [n.name, n]));
    const legs: Leg[] = [];
    for (const side of ["Left", "Right"]) {
      const upper = byName.get(`mixamorig:${side}UpLeg`);
      const lower = byName.get(`mixamorig:${side}Leg`);
      const foot = byName.get(`mixamorig:${side}Foot`);
      if (!upper || !lower || !foot) return null;
      const chain: TransformNode[] = [];
      for (let n: Node | null = upper.parent; n; n = n.parent) chain.unshift(n as TransformNode);
      const toe = byName.get(`mixamorig:${side}ToeBase`) ?? null;
      legs.push({ upper, lower, foot, toe, chain, upperLength: 0, lowerLength: 0, lift: 0, planted: 1, ready: false });
    }
    return new FootIK(root, legs);
  }

  /** Esquece a suavização (renascer, teletransporte). */
  reset(): void {
    this.weight = 0;
    this.pelvis = 0;
    for (const leg of this.legs) leg.ready = false;
  }

  /**
   * Chamar depois da animação e do posicionamento do corpo, antes do IK das mãos.
   * `enabled` falso (no ar, deslizando, escorregando a rampa) solta os pés aos poucos.
   */
  apply(dt: number, ground: FootGround, enabled: boolean): void {
    this.weight = enabled ? Math.min(1, this.weight + BLEND_IN * dt) : Math.max(0, this.weight - BLEND_OUT * dt);
    this.debug.length = 0;
    if (this.weight <= 0.001) {
      this.pelvis = 0;
      this.lastPelvis = 0;
      for (const leg of this.legs) leg.ready = false;
      return;
    }
    const w = smooth(this.weight);
    const rootY = this.root.position.y;
    this.updateMatrices();

    // 1. Piso sob cada pé e quanto ele difere do piso da animação.
    const needs: number[] = [];
    for (const leg of this.legs) {
      const ankle = leg.foot.getAbsolutePosition();
      const toeX = leg.toe ? leg.toe.getAbsolutePosition().x : ankle.x + ground.facing * 0.12;
      const height = ankle.y - rootY - ANKLE_REST;
      const planted = 1 - smoothstep(PLANT_LOW, PLANT_HIGH, height);
      leg.planted = planted;
      const ahead = (1 - planted) * SWING_LOOKAHEAD;
      const target = this.footprintHeight(ground, ankle.x, toeX, ahead);
      const now = this.footprintHeight(ground, ankle.x, toeX, 0);
      const wanted = target === null ? 0 : target - ground.rootGround;
      if (!leg.ready) {
        leg.lift = wanted;
        leg.ready = true;
      } else {
        const rate = LIFT_RATE_SWING + (LIFT_RATE_PLANTED - LIFT_RATE_SWING) * planted;
        leg.lift += (wanted - leg.lift) * (1 - Math.exp(-rate * dt));
      }
      // Nunca atravessar o degrau: com o pé baixo, a sola fica no mínimo em cima do piso de agora.
      if (now !== null) leg.lift = Math.max(leg.lift, now - ground.rootGround - Math.max(height, 0));
      needs.push(leg.lift + (1 - planted) * SWING_PENALTY);
    }

    // 2. Quadril: acompanha o pé que precisa descer mais entre os apoiados; o outro dobra o joelho.
    // Com os dois no ar (fase de voo da corrida), segue o mais baixo.
    const mostPlanted = Math.max(...this.legs.map((leg) => leg.planted));
    const target = clamp(Math.min(...needs) - (1 - mostPlanted) * SWING_PENALTY, PELVIS_MIN, PELVIS_MAX);
    // Descer é mais rápido que subir: a perna de apoio não pode ficar sem alcançar o chão.
    const rate = target < this.pelvis ? PELVIS_RATE_DOWN : PELVIS_RATE_UP;
    this.pelvis += (target - this.pelvis) * (1 - Math.exp(-rate * dt));
    const pelvis = this.pelvis * w;
    this.lastPelvis = pelvis;
    if (pelvis !== 0) {
      this.root.position.y = rootY + pelvis;
      this.updateMatrices();
    }

    // 3. Pernas: tornozelo até o alvo, joelho no plano da animação, pé com a pose de antes (ou inclinado na rampa).
    let error = 0;
    for (const leg of this.legs) {
      const hip = leg.upper.getAbsolutePosition().clone();
      const knee = leg.lower.getAbsolutePosition().clone();
      const ankle = leg.foot.getAbsolutePosition().clone();
      if (leg.upperLength === 0) {
        leg.upperLength = Vector3.Distance(hip, knee);
        leg.lowerLength = Vector3.Distance(knee, ankle);
      }
      const goal = ankle.clone();
      goal.y += leg.lift * w - pelvis;
      this.saved.copyFrom(leg.foot.getWorldMatrix());
      this.pitchFoot(leg, ground, ankle, w);
      this.solveLeg(leg, hip, knee, goal, ground.facing);
      this.restoreFoot(leg);
      const end = leg.foot.getAbsolutePosition();
      error = Math.max(error, Vector3.Distance(end, goal));
      const floor = this.footprintHeight(ground, end.x, leg.toe ? leg.toe.getAbsolutePosition().x : end.x, 0);
      this.debug.push({ ground: floor ?? NaN, sole: end.y - ANKLE_REST, planted: leg.planted, toe: leg.toe ? leg.toe.getAbsolutePosition().y : NaN });
    }
    this.lastError = error;
  }

  private updateMatrices(): void {
    this.root.computeWorldMatrix(true);
    for (const leg of this.legs) {
      for (const node of leg.chain) node.computeWorldMatrix(true);
      leg.upper.computeWorldMatrix(true);
      leg.lower.computeWorldMatrix(true);
      leg.foot.computeWorldMatrix(true);
      leg.toe?.computeWorldMatrix(true);
    }
  }

  /** Piso mais alto sob a pegada do pé (calcanhar até a ponta, mais `ahead` à frente). */
  private footprintHeight(ground: FootGround, ankleX: number, toeX: number, ahead: number): number | null {
    const dir = Math.sign(toeX - ankleX) || ground.facing;
    const back = ankleX - dir * HEEL_BACK;
    const front = toeX + dir * (TOE_AHEAD + ahead);
    let best: number | null = null;
    for (let i = 0; i <= 4; i++) {
      const y = ground.heightAt(back + ((front - back) * i) / 4);
      if (y === null) continue;
      const d = y - ground.rootGround;
      if (d > MAX_STEP_UP || d < -MAX_STEP_DOWN) continue;
      if (best === null || y > best) best = y;
    }
    return best;
  }

  /** Numa rampa (sem degraus), o pé apoiado acompanha a inclinação do piso. */
  private pitchFoot(leg: Leg, ground: FootGround, ankle: Vector3, w: number): void {
    if (leg.planted < 0.01) return;
    const a = ground.heightAt(ankle.x - 0.12);
    const b = ground.heightAt(ankle.x + 0.12);
    if (a === null || b === null || Math.abs(b - a) > 0.2) return;
    // Degrau (piso plano em cada lado, salto no meio) não inclina o pé: só rampa contínua.
    const mid = ground.heightAt(ankle.x);
    if (mid === null || Math.abs(mid - (a + b) / 2) > 0.01) return;
    const angle = clamp(Math.atan2(b - a, 0.24), -MAX_FOOT_PITCH, MAX_FOOT_PITCH) * leg.planted * w;
    if (Math.abs(angle) < 1e-3) return;
    // Gira a pose salva do pé em torno do eixo Z do mundo, passando pelo tornozelo.
    Matrix.TranslationToRef(-ankle.x, -ankle.y, -ankle.z, tmpM);
    Matrix.RotationAxisToRef(Z_AXIS, angle, tmpN);
    tmpM.multiplyToRef(tmpN, tmpM);
    Matrix.TranslationToRef(ankle.x, ankle.y, ankle.z, tmpN);
    tmpM.multiplyToRef(tmpN, tmpM);
    this.saved.multiplyToRef(tmpM, this.saved);
  }

  private solveLeg(leg: Leg, hip: Vector3, knee: Vector3, goal: Vector3, facing: number): void {
    const a = leg.upperLength;
    const b = leg.lowerLength;
    const toGoal = goal.subtract(hip);
    const reach = clamp(toGoal.length(), Math.abs(a - b) + 0.01, a + b - 0.002);
    const dir = toGoal.normalize();
    // Joelho: no plano da animação; com a perna esticada, para a frente.
    const bend = knee.subtract(hip);
    bend.subtractInPlace(dir.scale(Vector3.Dot(bend, dir)));
    if (bend.lengthSquared() < 1e-5) bend.set(facing, 0, 0).subtractInPlace(dir.scale(dir.x * facing));
    if (bend.lengthSquared() < 1e-8) bend.set(facing, 0, 0);
    bend.normalize();
    const cosA = clamp((a * a + reach * reach - b * b) / (2 * a * reach), -1, 1);
    const sinA = Math.sqrt(1 - cosA * cosA);
    const newKnee = hip.add(dir.scale(a * cosA)).addInPlace(bend.scale(a * sinA));
    rotateToward(leg.upper, knee.subtract(hip), newKnee.subtract(hip));
    leg.upper.computeWorldMatrix(true);
    leg.lower.computeWorldMatrix(true);
    const kneeNow = leg.lower.getAbsolutePosition().clone();
    leg.foot.computeWorldMatrix(true);
    const ankleNow = leg.foot.getAbsolutePosition().clone();
    rotateToward(leg.lower, ankleNow.subtract(kneeNow), goal.subtract(kneeNow));
    leg.lower.computeWorldMatrix(true);
    leg.foot.computeWorldMatrix(true);
  }

  /** Devolve ao pé a orientação de antes do IK (no mundo), para ele não girar junto com a canela. */
  private restoreFoot(leg: Leg): void {
    const parent = leg.foot.parent as TransformNode | null;
    if (!parent) return;
    parent.getWorldMatrix().invertToRef(tmpM);
    this.saved.multiplyToRef(tmpM, tmpN);
    tmpN.decompose(tmpS, tmpQ, tmpT);
    if (leg.foot.rotationQuaternion) leg.foot.rotationQuaternion.copyFrom(tmpQ);
    else leg.foot.rotationQuaternion = tmpQ.clone();
    leg.foot.computeWorldMatrix(true);
    leg.toe?.computeWorldMatrix(true);
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function smoothstep(a: number, b: number, v: number): number {
  return smooth(clamp((v - a) / (b - a), 0, 1));
}
