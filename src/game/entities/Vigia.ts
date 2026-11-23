import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import type { PhysicsEngine } from "@babylonjs/core/Physics/v2/physicsEngine";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/glTF";
import { MODEL_OPTIONS, modelFile } from "../modelFile";
import { dressCharacter } from "../characterLook";
import type { VigiaData } from "../../levels/types";
import { TUNING } from "../Tuning";
import { Lanterna } from "./Lanterna";
import { coverBlocks, type CoverBox } from "../sightCover";

const MODEL_URL = modelFile("vigia");
/** Escurece a textura do Alex (seguranças): a farda já é escura. */
const MODEL_TINT = new Color3(0.7, 0.7, 0.74);
const MODEL_SCALE = 1.1;
const WALK_CLIP_SPEED = 1.68;
const RUN_CLIP_SPEED = 5.33;
const CATCH_DISTANCE = 0.55;
const BLEND_TIME = 0.25;
// Lanterna LED dos seguranças: branca e fria (#E6EEF5), para nunca se confundir com a luz quente da sala.
const LIGHT_COLOR = new Color3(0.9, 0.94, 1);
const ALERT_COLOR = new Color3(1, 0.1, 0.03);
const SUSPICIOUS_AT = 0.12;
const HEAR_RANGE = 16;
const HEAR_HEIGHT = 2.5;
const INVESTIGATE_STOP = 2;
const INVESTIGATE_LOOK = 4;
const INVESTIGATE_SPEED = 1.3;
const LIGHT_INTENSITY = 22;
const HAND_HEIGHT = 1.3;
const HAND_FORWARD = 0.35;
const SHADOW_MAP_SIZE = 1024;
const SIGHT_MARGIN = 0.4;
const SHADOW_NEAR = 0.1;
// Entrada pela porta na perseguição: a porta abre, o segurança sai do vão escuro, vira e começa a correr.
const DOOR_OPEN_TIME = 0.45;
const DOOR_OPEN_ANGLE = 1.35;
const DOOR_WIDTH = 1.2;
const DOOR_HEIGHT = 2.2;
const DOOR_THICKNESS = 0.06;
const SHOW_AT = 0.2;
const STEP_OUT_TIME = 0.7;
const STEP_OUT_X = 0.6;
const DOORWAY_INSET = 0.3;
const DOOR_COLOR = new Color3(0.2, 0.21, 0.22);
const DOORWAY_COLOR = new Color3(0.16, 0.17, 0.19);

type Phase = "andando" | "parado" | "escondido" | "entrando";

export class Vigia {
  private readonly scene: Scene;
  private data: VigiaData;
  private readonly visual: TransformNode;
  private readonly walk?: AnimationGroup;
  private readonly idle?: AnimationGroup;
  private readonly run?: AnimationGroup;
  private readonly light: SpotLight;
  private readonly lanterna: Lanterna;
  /** A lente já foi posicionada pela mão animada (antes disso, a posição é estimada). */
  private lensReady = false;
  private readonly shadows: ShadowGenerator;
  private readonly ray = new PhysicsRaycastResult();
  private readonly lamp = new Vector3();
  private readonly handGuess = new Vector3();
  private covers: readonly CoverBox[] = [];
  private readonly dir = new Vector3();
  private readonly toPoint = new Vector3();
  private cosHalf: number;
  private x = 0;
  private heading = 1;
  private facing = 1;
  private currentSpeed = 0;
  private alert = 0;
  private investigate: { x: number; looking: boolean; timer: number } | null = null;
  private readonly lightColor = new Color3();
  private phase: Phase = "andando";
  /** Profundidade atual (muda só enquanto o segurança sai pela porta). */
  private zNow = 0;
  private door: TransformNode | null = null;
  private timer = 0;
  private pause = 0;

  private constructor(scene: Scene, data: VigiaData, visual: TransformNode, anims: Map<string, AnimationGroup>, lanterna: Lanterna) {
    this.scene = scene;
    this.data = data;
    this.visual = visual;
    this.walk = anims.get("andar");
    this.idle = anims.get("parado");
    this.run = anims.get("correr");
    this.walk?.start(true);
    this.idle?.start(true);
    this.run?.start(true);
    this.cosHalf = Math.cos(data.coneAngle);

    this.light = new SpotLight("vigia-luz", new Vector3(), new Vector3(1, 0, 0), data.coneAngle * 2, 2, scene);
    this.light.diffuse = LIGHT_COLOR.clone();
    this.light.specular = Color3.Black();
    this.light.intensity = LIGHT_INTENSITY;
    this.light.range = data.range;
    // Sombra de perto (as estantes ficam a menos de 1 m da lente) até um pouco além do alcance.
    this.light.shadowMinZ = SHADOW_NEAR;
    this.light.shadowMaxZ = data.range + 2;
    this.shadows = new ShadowGenerator(SHADOW_MAP_SIZE, this.light);
    this.shadows.usePercentageCloserFiltering = true;
    this.shadows.bias = 0.0005;

    this.lanterna = lanterna;
    if (data.porta) this.door = this.createDoor(scene, data);
    this.lanterna.setCone(data.range, data.coneAngle);
    // Depois da animação e da lógica do quadro, antes das sombras: mão, lanterna, luz e facho no lugar.
    scene.onBeforeActiveMeshesEvaluationObservable.add(() => this.aimFlashlight());

    this.reset();
  }

  static async create(scene: Scene, data: VigiaData): Promise<Vigia> {
    const result = await ImportMeshAsync(MODEL_URL, scene, MODEL_OPTIONS);
    const visual = new TransformNode("vigia-visual", scene);
    visual.scaling.setAll(MODEL_SCALE);
    for (const mesh of result.meshes) if (!mesh.parent) mesh.parent = visual;
    dressCharacter(result.meshes, scene, "vigia", MODEL_TINT);
    const anims = new Map<string, AnimationGroup>();
    for (const group of result.animationGroups) {
      group.stop();
      anims.set(group.name, group);
    }
    const lanterna = await Lanterna.create(scene, result.transformNodes);
    return new Vigia(scene, data, visual, anims, lanterna);
  }

  /** Porta de serviço na parede do fundo: vão escuro e uma folha de metal com dobradiça à esquerda. */
  private createDoor(scene: Scene, data: VigiaData): TransformNode {
    const porta = data.porta!;
    const width = porta.largura ?? DOOR_WIDTH;
    const height = porta.altura ?? DOOR_HEIGHT;
    const doorway = CreateBox("vigia-vao", { width: width - 0.04, height: height - 0.02, depth: 0.1 }, scene);
    doorway.position.set(data.x0, data.y + height / 2, porta.z);
    // Corredor de serviço mal iluminado atrás da porta: escuro, mas claro o bastante para a silhueta aparecer.
    const dark = new StandardMaterial("vigia-vao-mat", scene);
    dark.emissiveColor = DOORWAY_COLOR;
    dark.diffuseColor = Color3.Black();
    dark.specularColor = Color3.Black();
    dark.disableLighting = true;
    doorway.material = dark;
    doorway.isPickable = false;
    doorway.freezeWorldMatrix();

    const hinge = new TransformNode("vigia-dobradica", scene);
    hinge.position.set(data.x0 - width / 2, data.y, porta.z - 0.06 - DOOR_THICKNESS / 2);
    const leaf = CreateBox("vigia-porta", { width, height, depth: DOOR_THICKNESS }, scene);
    leaf.parent = hinge;
    leaf.position.set(width / 2, height / 2, 0);
    const metal = new StandardMaterial("vigia-porta-mat", scene);
    metal.diffuseColor = DOOR_COLOR;
    metal.specularColor = new Color3(0.15, 0.15, 0.15);
    leaf.material = metal;
    leaf.receiveShadows = true;
    leaf.isPickable = false;
    return hinge;
  }

  private setDoorOpen(amount: number): void {
    if (this.door) this.door.rotation.y = DOOR_OPEN_ANGLE * amount;
  }

  /** Sala de teste: muda alcance, ângulo do cone e velocidade ao vivo. */
  tune(changes: Partial<Pick<VigiaData, "range" | "coneAngle" | "speed">>): void {
    this.data = { ...this.data, ...changes };
    this.cosHalf = Math.cos(this.data.coneAngle);
    this.light.angle = this.data.coneAngle * 2;
    this.light.range = this.data.range;
    this.light.shadowMaxZ = this.data.range + 2;
    this.lanterna.setCone(this.data.range, this.data.coneAngle);
  }

  get settings(): VigiaData {
    return this.data;
  }

  get alertLevel(): number {
    return this.alert;
  }

  /** Estantes e outros obstáculos atrás do jogador que escondem quem está "atrás" deles na tela. */
  setCovers(covers: readonly CoverBox[], solids: readonly CoverBox[], moving?: () => readonly CoverBox[]): void {
    this.covers = covers;
    this.lanterna.setOccluders(solids, moving);
  }

  addShadowCasters(meshes: readonly AbstractMesh[]): void {
    for (const mesh of meshes) this.shadows.addShadowCaster(mesh, true);
  }

  placeVisual(x: number, y: number): void {
    this.visual.position.set(x, y, this.data.z);
    this.setShown(true);
  }

  /** Malhas do boneco (sem a lanterna, que tem material próprio). */
  get meshes(): AbstractMesh[] {
    const flashlight = new Set(this.lanterna.meshes);
    return this.visual.getChildMeshes().filter((mesh) => !flashlight.has(mesh));
  }

  /** Posição da lente da lanterna (sala de teste: câmera de perto). */
  get lensPosition(): Vector3 {
    return this.lamp;
  }

  get scene3d(): Scene {
    return this.scene;
  }

  get positionX(): number {
    return this.x;
  }

  get walking(): boolean {
    return this.phase === "andando";
  }

  get shown(): boolean {
    return this.phase !== "escondido";
  }

  get chases(): boolean {
    return this.data.mode === "perseguicao";
  }

  reset(): void {
    this.alert = 0;
    this.investigate = null;
    this.updateAlert(0, false);
    this.heading = this.data.startHeading ?? 1;
    this.x = this.heading > 0 ? this.data.x0 : this.data.x1;
    this.facing = this.heading;
    this.phase = this.chases ? "escondido" : "andando";
    this.timer = 0;
    this.zNow = this.data.z;
    this.setDoorOpen(0);
    if (this.walk) this.walk.weight = this.chases ? 0 : 1;
    if (this.idle) this.idle.weight = 0;
    if (this.run) this.run.weight = this.chases ? 1 : 0;
    this.setShown(!this.chases);
    this.syncVisual();
  }

  get debugState(): { x: number; facing: number } {
    return { x: +this.x.toFixed(2), facing: +this.facing.toFixed(2) };
  }

  catches(x: number): boolean {
    return this.chases && this.phase === "andando" && Math.abs(x - this.x) < CATCH_DISTANCE;
  }

  update(dt: number, playerX: number): void {
    if (this.chases) {
      this.updateChase(dt, playerX);
      return;
    }
    const guard = this.data.x0 === this.data.x1;
    if (this.suspicious) {
      // Desconfiado: para e encara até perder o jogador de vista.
    } else if (this.investigate) {
      this.updateInvestigate(dt);
    } else if (this.phase === "andando") {
      this.x += this.heading * this.data.speed * dt;
      const end = this.heading > 0 ? this.data.x1 : this.data.x0;
      if ((end - this.x) * this.heading <= 0) {
        this.x = end;
        this.phase = "parado";
        this.timer = 0;
        const max = this.data.pauseMax ?? this.data.pause;
        this.pause = this.data.pause + Math.random() * (max - this.data.pause);
      }
    } else if (guard) {
      // Guarda parado no posto, sempre olhando para o mesmo lado.
      const look = this.data.startHeading ?? 1;
      this.facing = approach(this.facing, look, dt * 1.5);
      this.heading = look;
    } else {
      this.timer += dt;
      const turnStart = this.pause * 0.4;
      const t = Math.min(Math.max((this.timer - turnStart) / (this.pause - turnStart), 0), 1);
      this.facing = this.heading * Math.cos(Math.PI * smooth(t));
      if (this.timer >= this.pause) {
        this.heading = -this.heading;
        this.facing = this.heading;
        this.phase = "andando";
      }
    }

    const walking = !this.suspicious && (this.investigate ? !this.investigate.looking : this.phase === "andando");
    const step = dt / BLEND_TIME;
    if (this.walk) {
      this.walk.weight = approach(this.walk.weight, walking ? 1 : 0, step);
      this.walk.speedRatio = this.data.speed / WALK_CLIP_SPEED;
    }
    if (this.idle) this.idle.weight = approach(this.idle.weight, walking ? 0 : 1, step);
    this.syncVisual();
  }

  private chaseSpeed(playerX: number): number {
    const e = this.data.elastico;
    if (!e) return this.data.speed;
    const factor = 1 + (playerX - this.x - e.distancia) * e.ganho;
    return this.data.speed * Math.min(Math.max(factor, e.min), e.max);
  }

  private updateChase(dt: number, playerX: number): void {
    if (this.phase === "escondido") {
      if (playerX < (this.data.triggerX ?? this.data.x0)) return;
      if (this.data.porta) {
        this.phase = "entrando";
        this.timer = 0;
        this.currentSpeed = 0;
      } else {
        this.phase = "andando";
        this.setShown(true);
      }
    }
    if (this.phase === "entrando") this.updateEntrance(dt);
    else if (this.phase === "andando") {
      this.currentSpeed = this.chaseSpeed(playerX);
      this.x = Math.min(this.x + this.currentSpeed * dt, this.data.x1);
      if (this.x >= this.data.x1) this.phase = "parado";
    }
    const running = this.phase === "andando" || this.phase === "entrando";
    const step = dt / BLEND_TIME;
    if (this.run) {
      this.run.weight = approach(this.run.weight, running ? 1 : 0, step);
      this.run.speedRatio = this.currentSpeed / RUN_CLIP_SPEED;
    }
    if (this.idle) this.idle.weight = approach(this.idle.weight, running ? 0 : 1, step);
    this.syncVisual();
  }

  /** A porta abre; o segurança sai do vão encarando a câmera, vira para a direita e começa a correr. */
  private updateEntrance(dt: number): void {
    const porta = this.data.porta!;
    this.timer += dt;
    this.setDoorOpen(smooth(Math.min(this.timer / DOOR_OPEN_TIME, 1)));
    if (this.timer < SHOW_AT) {
      this.visual.setEnabled(false);
      this.lanterna.setEnabled(false);
      this.light.intensity = 0;
      return;
    }
    if (!this.visual.isEnabled()) this.setShown(true);
    const k = Math.min((this.timer - SHOW_AT) / STEP_OUT_TIME, 1);
    const eased = smooth(k);
    this.zNow = porta.z - DOORWAY_INSET + (this.data.z - (porta.z - DOORWAY_INSET)) * eased;
    this.x = this.data.x0 + STEP_OUT_X * eased * eased;
    this.facing = smooth(Math.min(k * 1.4, 1));
    this.currentSpeed = this.data.speed * 0.7 * k;
    if (k >= 1) this.phase = "andando";
  }

  private setShown(shown: boolean): void {
    this.visual.setEnabled(shown);
    this.lanterna.setEnabled(shown);
    this.light.intensity = shown ? LIGHT_INTENSITY : 0;
  }

  /** Barulho (caixa caindo): o segurança de ronda vai até lá olhar e depois volta. Devolve true se ouviu. */
  hear(x: number, y: number): boolean {
    if (this.chases || this.phase === "escondido") return false;
    if (Math.abs(x - this.x) > HEAR_RANGE || Math.abs(y - this.data.y) > HEAR_HEIGHT) return false;
    this.investigate = { x, looking: false, timer: 0 };
    return true;
  }

  private updateInvestigate(dt: number): void {
    const inv = this.investigate;
    if (!inv) return;
    if (!inv.looking) {
      const dir = Math.sign(inv.x - this.x) || this.heading;
      const stopAt = inv.x - dir * INVESTIGATE_STOP;
      this.heading = dir;
      this.facing = dir;
      if ((stopAt - this.x) * dir > 0.05) {
        this.x += dir * this.data.speed * INVESTIGATE_SPEED * dt;
        return;
      }
      inv.looking = true;
      inv.timer = 0;
      return;
    }
    inv.timer += dt;
    if (inv.timer < INVESTIGATE_LOOK) return;
    this.investigate = null;
    const center = (this.data.x0 + this.data.x1) / 2;
    this.heading = this.x < center ? 1 : -1;
    if (this.x >= this.data.x0 && this.x <= this.data.x1 && this.data.x0 !== this.data.x1) this.heading = this.facing > 0 ? 1 : -1;
    this.facing = this.heading;
    this.phase = "andando";
  }

  get suspicious(): boolean {
    return this.alert > SUSPICIOUS_AT;
  }

  /** Sobe enquanto vê o jogador, desce quando perde; devolve true quando chega ao máximo (pegou). */
  updateAlert(dt: number, seeing: boolean): boolean {
    this.alert = seeing ? Math.min(1, this.alert + dt / (this.data.reacao ?? TUNING.reacao)) : Math.max(0, this.alert - TUNING.esquecer * dt);
    Color3.LerpToRef(LIGHT_COLOR, ALERT_COLOR, this.alert, this.lightColor);
    this.light.diffuse.copyFrom(this.lightColor);
    this.lanterna.setColor(this.lightColor, 1 + 0.6 * this.alert);
    if (this.phase !== "escondido") this.light.intensity = LIGHT_INTENSITY * (1 - 0.25 * this.alert);
    return this.alert >= 1;
  }

  sees(points: readonly Vector3[]): boolean {
    const engine = this.scene.getPhysicsEngine() as PhysicsEngine | null;
    for (const point of points) {
      point.subtractToRef(this.lamp, this.toPoint);
      const distance = this.toPoint.length();
      if (distance > this.data.range || distance < 0.01) continue;
      if (Vector3.Dot(this.toPoint, this.dir) / distance < this.cosHalf) continue;
      if (coverBlocks(this.lamp, point, this.covers)) continue;
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
    this.visual.position.set(this.x, this.data.y, this.zNow);

    // A mira parte de um ponto estável na altura da mão (sem o balanço do passo), para o facho não tremer.
    this.handGuess.set(this.x + this.facing * HAND_FORWARD, this.data.y + HAND_HEIGHT, this.zNow - side * HAND_FORWARD);
    this.dir.set(this.facing * this.data.aimAhead, this.data.aimY - this.handGuess.y, -this.zNow);
    this.dir.normalize();
    if (!this.lensReady) this.lamp.copyFrom(this.handGuess);
    this.light.position.copyFrom(this.lamp);
    this.light.direction.copyFrom(this.dir);
  }

  /** Mão e lanterna seguem a mira; a luz e a visão saem da lente de verdade. */
  private aimFlashlight(): void {
    if (!this.visual.isEnabled()) return;
    this.lanterna.aim(this.dir, this.lamp);
    this.lensReady = true;
    this.light.position.copyFrom(this.lamp);
    this.light.direction.copyFrom(this.dir);
  }
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function approach(value: number, target: number, maxDelta: number): number {
  if (value < target) return Math.min(value + maxDelta, target);
  return Math.max(value - maxDelta, target);
}
