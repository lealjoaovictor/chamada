import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import type { PhysicsEngine } from "@babylonjs/core/Physics/v2/physicsEngine";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/glTF";
import { MODEL_OPTIONS, modelFile } from "../modelFile";
import { dressCharacter } from "../characterLook";
import type { HabitoVigia, VigiaData } from "../../levels/types";
import { TUNING } from "../Tuning";
import { Lanterna } from "./Lanterna";
import { coverBlocks, type CoverBox } from "../sightCover";
import { HabitBadge, type BadgeKind } from "./HabitBadge";

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
// Cena antes da perseguição: a porta abre de supetão (mais rápido, passa do ponto e volta).
const SLAM_OPEN_TIME = 0.16;
const SLAM_OVERSHOOT = 0.12;
const SLAM_SETTLE = 0.35;
/** Luz da sala de segurança vazando por baixo da porta (amarelada, de lâmpada velha). */
const DOOR_LEAK_COLOR = new Color3(1, 0.72, 0.38);
const DOOR_LEAK_POOL = 1.8;
/** A mancha no chão soma luz (aditiva): mais forte que a cor da fresta para aparecer no piso iluminado. */
const DOOR_LEAK_POOL_GAIN = 1.8;
// Perseguição: o facho mira o chão um pouco à frente do jogador (a sombra dele corre na frente).
const CHASE_AIM_AHEAD = 1.6;
const CHASE_AIM_SHARPNESS = 6;
/** Na grade: o tempo do gesto de raiva antes de ele ficar parado olhando. */
const GATE_ANGER_TIME = 2.6;

type Phase = "andando" | "parado" | "escondido" | "entrando";

// Hábitos (cada segurança tem o seu): o que muda é a animação, a lanterna e quando ele presta atenção.
/** Sem a lanterna acesa, ele só percebe quem chega quase encostado. */
const UNLIT_NOTICE = 1.1;
/** Celular: andando mexendo no celular, mais devagar. */
const PHONE_WALK = 0.7;
const LOOK_AROUND_TIME = 3.2;
/** Celular: no meio do trecho distraído, de vez em quando ele levanta os olhos (com aviso antes). */
const PHONE_GLANCE_EVERY: [number, number] = [3.5, 6];
const PHONE_GLANCE_TIME = 1.9;
/** Aviso ("!") antes de a lanterna acender: tempo para o jogador parar ou se esconder. */
const WARN_TIME = 1.0;
/** Futebol: quanto tempo vigiando a entrada e quanto tempo de olho na TV. */
const WATCH_TIME: [number, number] = [4.5, 7];
const TV_TIME: [number, number] = [3.5, 5.5];
/** Chance de, no fim de um trecho de TV, sair um lance (senão ele volta a olhar a entrada). */
const PLAY_CHANCE = 0.5;
const PLAY_WARNING = 1.4;
const REACTION_TIME = 3.2;
const SEAT_TURN = 2.2;
/** Cochilo: janela de quadros da animação "cabeça nas mãos" onde ele dorme, e o ritmo da respiração. */
const NAP_FROM = 0.34;
const NAP_TO = 0.5;
const NAP_BREATH = 0.55;
const SNORE_EVERY = 3.4;
const NAP_HEAR = 6.5;
const STARTLE_TIME = 1.1;
const AWAKE_TIME = 6;
/** Cochilo: de tempos em tempos ele se mexe, levanta a cabeça e passa a lanterna no corredor. */
const NAP_PEEK_EVERY: [number, number] = [7, 11];
const PEEK_TIME = 2.8;
/** Duração das animações de uma vez só (levantar, sentar), em segundos de clipe. */
const CLIP_FPS = 30;

/** O que a cena precisa fazer por causa de um segurança (som, fala). O Game lê e esvazia a lista. */
export type VigiaEvento =
  | "lanterna-liga"
  | "lanterna-desliga"
  | "notificacao"
  | "lance"
  | "gol"
  | "perdeu"
  | "reclama"
  | "ronco"
  | "susto"
  | "volta-a-dormir"
  | "remexe"
  | "grade";

type FaseHabito =
  | "celular" // andando ou parado mexendo no celular
  | "atento" // celular guardado, lanterna acesa
  | "olhando" // olhando em volta, lanterna acesa (fim do trecho do celular)
  | "erguendo" // celular: guardando o celular para olhar em volta (aviso)
  | "vigiando" // futebol: de olho na entrada
  | "virando" // futebol: tirando o olho da TV (aviso)
  | "tv" // futebol: de olho na TV
  | "lance" // futebol: lance perigoso (torcida subindo)
  | "reacao" // futebol: gol, chance perdida ou reclamação
  | "dormindo"
  | "remexendo" // cochilo: se mexendo, vai abrir o olho (aviso)
  | "espiando" // cochilo: cabeça erguida, lanterna no corredor
  | "susto"
  | "levantando"
  | "acordado"
  | "sentando";

export class Vigia {
  private readonly scene: Scene;
  private data: VigiaData;
  private readonly visual: TransformNode;
  private readonly anims: Map<string, AnimationGroup>;
  /** Clipe que está entrando (os outros saem aos poucos). */
  private clip = "parado";
  private readonly phone: AbstractMesh | null;
  /** Lanterna acesa (na mão, apontando) ou apagada (guardada: o braço fica livre para a animação). */
  private lit = true;
  private habitPhase: FaseHabito | null = null;
  private habitTimer = 0;
  private habitLength = 0;
  /** Trecho da ronda com o celular na mão (alterna a cada volta). */
  private phoneLeg = true;
  private reaction = "torcer";
  private snoreTimer = 0;
  /** Cochilo: quanto falta para ele espiar; celular: quanto falta para levantar os olhos. */
  private peekTimer = 0;
  private glancing = false;
  private readonly badge: HabitBadge;
  private napTime = 0;
  private wakeX = 0;
  readonly events: VigiaEvento[] = [];
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
  private doorLeak: StandardMaterial[] = [];
  /** A perseguição espera a deixa do jogo (a cena na porta ou o apagão) em vez do `triggerX`. */
  held = false;
  private slam = false;
  private chaseTargetX: number | null = null;
  private aimX = 0;
  private gateTimer = -1;
  /** O facho começa neste x e corre até o jogador (o "ele me achou" do apagão). */
  private sweepFrom: number | null = null;
  private timer = 0;
  private pause = 0;

  private constructor(
    scene: Scene,
    data: VigiaData,
    visual: TransformNode,
    anims: Map<string, AnimationGroup>,
    lanterna: Lanterna,
    phone: AbstractMesh | null,
    head: TransformNode | null,
  ) {
    this.scene = scene;
    this.data = data;
    this.visual = visual;
    this.anims = anims;
    this.phone = phone;
    for (const group of anims.values()) {
      group.start(true);
      group.weight = 0;
    }
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

    this.badge = new HabitBadge(scene, "vigia", head, () => new Vector3(this.x, this.data.y + 1.7, this.zNow));
    this.lanterna = lanterna;
    if (data.porta) this.door = this.createDoor(scene, data);
    if (data.porta && data.cena?.tipo === "porta") this.createDoorLeak(scene, data);
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
    const phone = data.habito?.tipo === "celular" ? createPhone(scene, result.transformNodes) : null;
    const head = result.transformNodes.find((node) => node.name === "mixamorig:Head") ?? null;
    return new Vigia(scene, data, visual, anims, lanterna, phone, head);
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

  /** Fresta de luz por baixo da porta e a mancha que ela faz no chão. */
  private createDoorLeak(scene: Scene, data: VigiaData): void {
    const porta = data.porta!;
    const width = porta.largura ?? DOOR_WIDTH;
    const strip = CreateBox("vigia-fresta", { width: width - 0.1, height: 0.06, depth: 0.02 }, scene);
    strip.position.set(data.x0, data.y + 0.03, porta.z - 0.1 - DOOR_THICKNESS);
    const stripMat = new StandardMaterial("vigia-fresta-mat", scene);
    stripMat.disableLighting = true;
    stripMat.emissiveColor = DOOR_LEAK_COLOR.clone();
    strip.material = stripMat;
    strip.isPickable = false;
    const pool = CreatePlane("vigia-fresta-chao", { width: width + 0.8, height: DOOR_LEAK_POOL }, scene);
    pool.rotation.x = Math.PI / 2;
    pool.position.set(data.x0, data.y + 0.03, porta.z - 0.12 - DOOR_LEAK_POOL / 2);
    const tex = new DynamicTexture("vigia-fresta-tex", { width: 128, height: 128 }, scene, true);
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    // Mais forte junto da porta (alto da textura) e sumindo para o lado da câmera, mais estreita nas pontas.
    const fall = ctx.createLinearGradient(0, 0, 0, 128);
    fall.addColorStop(0, "rgba(255,255,255,1)");
    fall.addColorStop(0.3, "rgba(255,255,255,0.4)");
    fall.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = fall;
    ctx.fillRect(0, 0, 128, 128);
    ctx.globalCompositeOperation = "destination-in";
    const sides = ctx.createLinearGradient(0, 0, 128, 0);
    sides.addColorStop(0, "rgba(0,0,0,0)");
    sides.addColorStop(0.25, "rgba(0,0,0,1)");
    sides.addColorStop(0.75, "rgba(0,0,0,1)");
    sides.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sides;
    ctx.fillRect(0, 0, 128, 128);
    tex.hasAlpha = true;
    tex.update();
    const poolMat = new StandardMaterial("vigia-fresta-chao-mat", scene);
    poolMat.disableLighting = true;
    poolMat.emissiveColor = DOOR_LEAK_COLOR.scale(DOOR_LEAK_POOL_GAIN);
    poolMat.opacityTexture = tex;
    poolMat.alphaMode = Constants.ALPHA_ADD;
    poolMat.disableDepthWrite = true;
    poolMat.backFaceCulling = false;
    pool.material = poolMat;
    pool.isPickable = false;
    this.doorLeak = [stripMat, poolMat];
  }

  /** Brilho da fresta (0 apagada, 1 normal): a cena faz a sombra dos pés passar por ela. */
  setDoorLight(level: number): void {
    const [strip, pool] = this.doorLeak;
    if (!strip || !pool) return;
    strip.emissiveColor.copyFrom(DOOR_LEAK_COLOR).scaleInPlace(level);
    pool.emissiveColor.copyFrom(DOOR_LEAK_COLOR).scaleInPlace(DOOR_LEAK_POOL_GAIN * level);
  }

  /** A perseguição começa agora (a deixa da cena): a porta abre de supetão, ou a lanterna acende no escuro. */
  burst(fromX?: number): void {
    if (this.phase !== "escondido") return;
    this.held = false;
    this.slam = true;
    // Sem porta (apagão), ele pode surgir mais perto do jogador do que o ponto de partida.
    if (fromX !== undefined && !this.data.porta) this.x = Math.min(fromX, this.data.x1);
    this.startChase();
    // Apagão: o facho começa lá atrás e corre pelo chão até achar o jogador.
    if (!this.data.porta) this.sweepFrom = this.x;
  }

  private startChase(): void {
    if (this.data.porta) {
      this.phase = "entrando";
      this.timer = 0;
      this.currentSpeed = 0;
    } else {
      this.phase = "andando";
      this.setShown(true);
      this.events.push("lanterna-liga");
    }
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

  /** Perseguição em andamento: saindo pela porta ou correndo (não antes de aparecer, nem depois de parar). */
  get chasing(): boolean {
    return this.chases && (this.phase === "andando" || this.phase === "entrando");
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
    // Depois da primeira vez, a porta da cena continua abrindo de supetão (sem a cena antes).
    this.slam = this.data.cena?.tipo === "porta";
    this.chaseTargetX = null;
    this.gateTimer = -1;
    this.sweepFrom = null;
    this.setDoorLight(1);
    this.events.length = 0;
    this.resetHabit();
    const first = this.chases ? "correr" : this.habitClip() ?? "andar";
    for (const [name, group] of this.anims) group.weight = name === first ? 1 : 0;
    this.clip = first;
    this.setShown(!this.chases);
    this.setLit(this.lit, true);
    this.syncVisual();
  }

  get debugState(): { x: number; facing: number } {
    return { x: +this.x.toFixed(2), facing: +this.facing.toFixed(2) };
  }

  catches(x: number): boolean {
    return this.chases && this.phase === "andando" && Math.abs(x - this.x) < CATCH_DISTANCE;
  }

  update(dt: number, playerX: number): void {
    this.updateBadge(dt);
    if (this.chases) {
      this.updateChase(dt, playerX);
      return;
    }
    const guard = this.data.x0 === this.data.x1;
    const habit = this.data.habito;
    if (habit && habit.tipo !== "celular" && !this.investigate) {
      // Sentados (futebol, cochilo): não andam; o hábito decide tudo.
      this.updateSeated(dt, habit);
      this.syncVisual();
      return;
    }
    if (this.suspicious) {
      // Desconfiado: para e encara até perder o jogador de vista.
    } else if (this.investigate) {
      this.updateInvestigate(dt);
    } else if (this.phase === "andando") {
      this.x += this.heading * this.walkSpeed * dt;
      const end = this.heading > 0 ? this.data.x1 : this.data.x0;
      if ((end - this.x) * this.heading <= 0) {
        this.x = end;
        this.phase = "parado";
        this.timer = 0;
        const max = this.data.pauseMax ?? this.data.pause;
        this.pause = this.data.pause + Math.random() * (max - this.data.pause);
        this.endOfLeg();
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
    if (habit?.tipo === "celular") this.updatePhoneHabit(dt, walking);
    else {
      this.blend(walking ? "andar" : "parado", dt);
      this.setSpeed("andar", this.data.speed / WALK_CLIP_SPEED);
    }
    this.syncVisual();
  }

  // ---------- Hábitos ----------

  /** Símbolo em cima da cabeça: "?" desconfiado, "!" vai olhar, "z Z" dormindo, "GOL!" comemorando. */
  private updateBadge(dt: number): void {
    let kind: BadgeKind | null = null;
    if (this.suspicious) kind = this.alert > 0.55 ? "alerta" : "duvida";
    else if (this.habitPhase === "virando" || this.habitPhase === "remexendo" || this.habitPhase === "erguendo") kind = "alerta";
    else if (this.habitPhase === "celular" && this.phase === "andando" && this.legEndsSoon()) kind = "alerta";
    else if (this.habitPhase === "dormindo" || this.habitPhase === "sentando") kind = "zzz";
    else if (this.habitPhase === "reacao" && this.reaction === "torcer") kind = "gol";
    else if (this.habitPhase === "celular") kind = "celular";
    this.badge.set(kind);
    this.badge.update(dt, this.phase !== "escondido" && !this.chases);
  }

  /** Celular: o fim do trecho distraído está perto (lá ele guarda o celular e olha em volta). */
  private legEndsSoon(): boolean {
    const end = this.heading > 0 ? this.data.x1 : this.data.x0;
    return Math.abs(end - this.x) < this.walkSpeed * WARN_TIME;
  }

  private get walkSpeed(): number {
    if (this.data.habito?.tipo !== "celular") return this.data.speed;
    if (this.habitPhase === "erguendo" || (this.habitPhase === "olhando" && this.glancing)) return 0;
    return this.habitPhase === "celular" ? this.data.speed * PHONE_WALK : this.data.speed;
  }

  private resetHabit(): void {
    const habit = this.data.habito;
    this.habitTimer = 0;
    this.snoreTimer = SNORE_EVERY * 0.5;
    this.glancing = false;
    this.peekTimer = habit?.tipo === "celular" ? rand(PHONE_GLANCE_EVERY) : rand(NAP_PEEK_EVERY);
    if (!habit) {
      this.habitPhase = null;
      this.lit = true;
      return;
    }
    if (habit.tipo === "celular") {
      // Começa a ronda atento (lanterna acesa); o celular sai no fim do primeiro trecho.
      this.phoneLeg = false;
      this.enterHabit("atento", 0);
    } else if (habit.tipo === "futebol") {
      this.facing = habit.tvLado;
      this.enterHabit("tv", rand(TV_TIME));
    } else {
      this.facing = 0;
      this.enterHabit("dormindo", 0);
    }
  }

  private enterHabit(phase: FaseHabito, length: number): void {
    this.habitPhase = phase;
    this.habitTimer = 0;
    this.habitLength = length;
    const lit =
      phase === "atento" || phase === "olhando" || phase === "vigiando" || phase === "acordado" || phase === "levantando" || phase === "espiando";
    this.setLit(lit);
    if (this.phone) this.phone.setEnabled(phase === "celular");
  }

  /** Clipe que o hábito pede agora (ou null: o de sempre). */
  private habitClip(): string | null {
    switch (this.habitPhase) {
      case "celular":
        return this.phase === "andando" ? "celular_andar" : "celular_parado";
      case "olhando":
        return "olhar_em_volta";
      case "erguendo":
        return "parado";
      case "espiando":
      case "remexendo":
      case "virando":
      case "vigiando":
      case "tv":
      case "lance":
        return "sentado";
      case "reacao":
        return this.reaction;
      case "dormindo":
        return "cochilando";
      case "susto":
        return "susto";
      case "levantando":
        return "levantar";
      case "acordado":
        return this.investigate ? null : "olhar_em_volta";
      case "sentando":
        return "sentar";
      default:
        return null;
    }
  }

  /** Fim de um trecho da ronda: o segurança do celular alterna entre o celular e a ronda atenta. */
  private endOfLeg(): void {
    if (this.data.habito?.tipo !== "celular") return;
    this.phoneLeg = !this.phoneLeg;
    this.glancing = false;
    if (this.phoneLeg) {
      this.peekTimer = rand(PHONE_GLANCE_EVERY);
      // Pega o celular de novo: a notificação avisa que ele vai se distrair.
      this.enterHabit("celular", 0);
      this.events.push("notificacao", "lanterna-desliga");
    } else {
      // Guarda o celular, acende a lanterna e olha em volta antes de seguir.
      this.enterHabit("olhando", LOOK_AROUND_TIME);
      this.pause = Math.max(this.pause, LOOK_AROUND_TIME);
      this.events.push("lanterna-liga");
    }
  }

  private updatePhoneHabit(dt: number, walking: boolean): void {
    this.habitTimer += dt;
    if (this.investigate || this.suspicious) {
      // Barulho ou alguém na luz: o celular vai para o bolso na hora.
      if (this.habitPhase === "celular") {
        this.enterHabit("atento", 0);
        this.events.push("lanterna-liga");
      }
      this.glancing = false;
    } else if (this.habitPhase === "celular" && walking) {
      // No meio do trecho, às vezes ele levanta os olhos do celular: para, guarda e olha em volta.
      this.peekTimer -= dt;
      if (this.peekTimer <= 0 && !this.legEndsSoon()) {
        this.enterHabit("erguendo", WARN_TIME);
        this.glancing = true;
      }
    } else if (this.habitPhase === "erguendo" && this.habitTimer >= this.habitLength) {
      this.enterHabit("olhando", PHONE_GLANCE_TIME);
      this.events.push("lanterna-liga");
    } else if (this.habitPhase === "olhando" && this.habitTimer >= this.habitLength) {
      if (this.glancing) {
        // Não viu nada: volta para o celular e segue a ronda.
        this.glancing = false;
        this.peekTimer = rand(PHONE_GLANCE_EVERY);
        this.enterHabit("celular", 0);
        this.events.push("lanterna-desliga");
      } else this.enterHabit("atento", 0);
    }
    if (this.habitPhase === "olhando") {
      // Olha para um lado e para o outro com a lanterna, parado.
      const t = this.habitTimer / this.habitLength;
      this.facing = this.heading * Math.cos(Math.PI * smooth(Math.min(t * 1.3, 1)));
    }
    const stopped = this.habitPhase === "erguendo" || (this.habitPhase === "olhando" && this.glancing);
    const clip = this.habitClip() ?? (walking && !stopped ? "andar" : "parado");
    this.blend(clip, dt);
    this.setSpeed("andar", this.data.speed / WALK_CLIP_SPEED);
    this.setSpeed("celular_andar", (this.data.speed * PHONE_WALK) / WALK_CLIP_SPEED);
  }

  /** Futebol e cochilo: sentado no posto. */
  private updateSeated(dt: number, habit: HabitoVigia): void {
    this.habitTimer += dt;
    if (habit.tipo === "futebol") this.updateFootball(dt, habit.tvLado);
    else this.updateNap(dt);
    this.blend(this.habitClip() ?? "parado", dt);
  }

  private updateFootball(dt: number, tvSide: number): void {
    const t = this.habitTimer;
    switch (this.habitPhase) {
      case "vigiando": {
        // Vigia a entrada: a lanterna varre devagar de um lado para o outro.
        const sweep = Math.sin(t * 0.9) * 0.55;
        this.facing = approach(this.facing, sweep, dt * SEAT_TURN);
        if (t >= this.habitLength && !this.suspicious) {
          this.enterHabit("tv", rand(TV_TIME));
          this.events.push("lanterna-desliga");
        }
        break;
      }
      case "tv":
        this.facing = approach(this.facing, tvSide, dt * SEAT_TURN);
        if (t >= this.habitLength) {
          // Às vezes sai um lance; senão ele tira o olho da TV e volta a vigiar.
          if (Math.random() < PLAY_CHANCE) {
            this.enterHabit("lance", PLAY_WARNING);
            this.events.push("lance");
          } else this.enterHabit("virando", WARN_TIME);
        }
        break;
      case "virando":
        // Aviso: vira a cabeça para a entrada antes de acender a lanterna.
        this.facing = approach(this.facing, 0, dt * SEAT_TURN * 0.6);
        if (t >= this.habitLength) {
          this.enterHabit("vigiando", rand(WATCH_TIME));
          this.events.push("lanterna-liga");
        }
        break;
      case "lance":
        this.facing = approach(this.facing, tvSide, dt * SEAT_TURN);
        if (t >= this.habitLength) {
          const roll = Math.random();
          this.reaction = roll < 0.45 ? "torcer" : roll < 0.8 ? "mao_na_cabeca" : "reclamar";
          this.restart(this.reaction);
          this.enterHabit("reacao", REACTION_TIME);
          this.events.push(this.reaction === "torcer" ? "gol" : this.reaction === "mao_na_cabeca" ? "perdeu" : "reclama");
        }
        break;
      case "reacao":
        // Depois do lance, ele lembra da entrada e dá uma olhada.
        if (t >= this.habitLength) this.enterHabit("virando", WARN_TIME);
        break;
      default:
        this.enterHabit("tv", rand(TV_TIME));
    }
  }

  private updateNap(dt: number): void {
    const t = this.habitTimer;
    switch (this.habitPhase) {
      case "dormindo": {
        this.facing = approach(this.facing, 0, dt);
        // Respira devagar, com a cabeça entre as mãos: segura a animação numa janela de quadros.
        this.napTime += dt;
        const group = this.anims.get("cochilando");
        if (group) {
          const k = NAP_FROM + (NAP_TO - NAP_FROM) * (0.5 + 0.5 * Math.sin(this.napTime * NAP_BREATH * Math.PI * 2 * 0.25));
          group.goToFrame(group.from + (group.to - group.from) * k);
        }
        this.snoreTimer -= dt;
        if (this.snoreTimer <= 0) {
          this.snoreTimer = SNORE_EVERY * (0.85 + Math.random() * 0.3);
          this.events.push("ronco");
        }
        this.peekTimer -= dt;
        if (this.peekTimer <= 0) {
          // Um ronco engasgado, ele se mexe na cadeira... e vai abrir o olho.
          this.enterHabit("remexendo", WARN_TIME * 1.1);
          this.events.push("remexe");
        }
        break;
      }
      case "remexendo":
        this.facing = approach(this.facing, -0.75, dt * 1.5);
        if (t >= this.habitLength) {
          this.enterHabit("espiando", PEEK_TIME);
          this.events.push("lanterna-liga");
        }
        break;
      case "espiando": {
        // Passa a lanterna de um lado do corredor para o outro e volta a dormir.
        const k = smooth(Math.min(t / PEEK_TIME, 1));
        this.facing = approach(this.facing, -0.75 + 1.5 * k, dt * 3);
        if (t >= this.habitLength && !this.suspicious) {
          this.peekTimer = rand(NAP_PEEK_EVERY);
          this.napTime = 0;
          this.enterHabit("dormindo", 0);
          this.events.push("lanterna-desliga");
        }
        break;
      }
      case "susto":
        if (t >= STARTLE_TIME) {
          this.restart("levantar");
          this.enterHabit("levantando", this.clipLength("levantar") * 0.85);
          this.events.push("lanterna-liga");
        }
        break;
      case "levantando":
        this.facing = approach(this.facing, Math.sign(this.wakeX - this.x) * 0.6, dt);
        if (t >= this.habitLength) this.enterHabit("acordado", AWAKE_TIME);
        break;
      case "acordado": {
        // De pé, olha para onde veio o barulho e depois em volta.
        const toward = Math.sign(this.wakeX - this.x) || 1;
        const look = t < 2 ? toward * 0.7 : toward * 0.7 * Math.cos((t - 2) * 1.1);
        this.facing = approach(this.facing, look, dt * 1.8);
        if (t >= this.habitLength && !this.suspicious) {
          this.restart("sentar");
          this.enterHabit("sentando", this.clipLength("sentar") * 0.9);
          this.events.push("lanterna-desliga", "volta-a-dormir");
        }
        break;
      }
      case "sentando":
        this.facing = approach(this.facing, 0, dt);
        if (t >= this.habitLength) {
          this.napTime = 0;
          this.peekTimer = rand(NAP_PEEK_EVERY);
          this.enterHabit("dormindo", 0);
        }
        break;
      default:
        this.enterHabit("dormindo", 0);
    }
  }

  /** Cochilo: barulho perto ou alguém encostando acorda o segurança. */
  private wake(x: number): boolean {
    const resting = this.habitPhase === "dormindo" || this.habitPhase === "sentando";
    if (!resting && this.habitPhase !== "remexendo" && this.habitPhase !== "espiando") return false;
    this.wakeX = x;
    this.restart("susto");
    this.enterHabit("susto", STARTLE_TIME);
    this.events.push("susto");
    return true;
  }

  /** O Zacarias fez barulho (pulo, deslize) em `x`: só o cochilo ouve passos. */
  hearPlayer(x: number, y: number, loud: number): boolean {
    if (this.data.habito?.tipo !== "cochilo") return false;
    if (Math.abs(y - this.data.y) > HEAR_HEIGHT || Math.abs(x - this.x) > NAP_HEAR * loud) return false;
    return this.wake(x);
  }

  get asleep(): boolean {
    return this.habitPhase === "dormindo";
  }

  private clipLength(name: string): number {
    const group = this.anims.get(name);
    return group ? (group.to - group.from) / CLIP_FPS : 1;
  }

  /** Recomeça um clipe de uma vez só (levantar, susto, gol) do primeiro quadro. */
  private restart(name: string): void {
    const group = this.anims.get(name);
    if (group) group.goToFrame(group.from);
  }

  /** Mistura para `name`: ele sobe até 1 e todos os outros descem a 0. */
  private blend(name: string, dt: number): void {
    const target = this.anims.has(name) ? name : "parado";
    this.clip = target;
    const step = dt / BLEND_TIME;
    for (const [clip, group] of this.anims) group.weight = approach(group.weight, clip === target ? 1 : 0, step);
    const nap = this.anims.get("cochilando");
    if (nap) nap.speedRatio = this.habitPhase === "dormindo" ? 0 : 1;
  }

  private setSpeed(name: string, ratio: number): void {
    const group = this.anims.get(name);
    if (group) group.speedRatio = ratio;
  }

  /** Acende ou apaga a lanterna: apagada, ela some da mão e o braço fica livre para a animação. */
  private setLit(on: boolean, force = false): void {
    if (this.lit === on && !force) return;
    this.lit = on;
    const shown = this.phase !== "escondido" && this.visual.isEnabled();
    this.lanterna.setEnabled(on && shown);
    this.lanterna.setModelVisible(on);
    this.light.intensity = on && shown ? LIGHT_INTENSITY * (1 - 0.25 * this.alert) : 0;
    if (!on) this.lensReady = false;
  }

  /** Clipe principal agora (sala de teste e capturas). */
  get currentClip(): string {
    return this.clip;
  }

  get lanternLit(): boolean {
    return this.lit;
  }

  private chaseSpeed(playerX: number): number {
    const e = this.data.elastico;
    if (!e) return this.data.speed;
    const factor = 1 + (playerX - this.x - e.distancia) * e.ganho;
    return this.data.speed * Math.min(Math.max(factor, e.min), e.max);
  }

  private updateChase(dt: number, playerX: number): void {
    if (this.phase === "escondido") {
      if (this.held || playerX < (this.data.triggerX ?? this.data.x0)) return;
      // Voltou num checkpoint depois desta perseguição: ela não recomeça lá atrás.
      if (playerX > this.data.x1 + 2) return;
      this.startChase();
    }
    if (this.phase === "entrando") this.updateEntrance(dt);
    else if (this.phase === "andando") {
      this.currentSpeed = this.chaseSpeed(playerX);
      this.x = Math.min(this.x + this.currentSpeed * dt, this.data.x1);
      if (this.x >= this.data.x1) {
        // Chegou à grade que o jogador passou por baixo: bate nela e grita.
        this.phase = "parado";
        this.currentSpeed = 0;
        this.gateTimer = 0;
        this.restart("reclamar");
        this.events.push("grade");
      }
    }
    // O facho corre no chão um pouco à frente do jogador.
    const target = playerX + CHASE_AIM_AHEAD;
    if (this.chaseTargetX === null) this.aimX = this.sweepFrom ?? target;
    else this.aimX += (target - this.aimX) * Math.min(1, CHASE_AIM_SHARPNESS * dt);
    this.sweepFrom = null;
    this.chaseTargetX = this.phase === "andando" ? this.aimX : null;
    const running = this.phase === "andando" || this.phase === "entrando";
    let clip = running ? "correr" : "parado";
    if (this.gateTimer >= 0) {
      this.gateTimer += dt;
      if (this.gateTimer < GATE_ANGER_TIME) clip = "reclamar";
    }
    this.blend(clip, dt);
    this.setSpeed("correr", this.currentSpeed / RUN_CLIP_SPEED);
    this.syncVisual();
  }

  /** Abertura da porta: normal ou de supetão (passa do ponto e volta um pouco). */
  private doorAmount(): number {
    if (!this.slam) return smooth(Math.min(this.timer / DOOR_OPEN_TIME, 1));
    if (this.timer < SLAM_OPEN_TIME) {
      const k = this.timer / SLAM_OPEN_TIME;
      return (1 + SLAM_OVERSHOOT) * k * k;
    }
    const k = Math.min((this.timer - SLAM_OPEN_TIME) / SLAM_SETTLE, 1);
    return 1 + SLAM_OVERSHOOT * Math.cos(k * Math.PI * 1.5) * (1 - k);
  }

  /** A porta abre; o segurança sai do vão encarando a câmera, vira para a direita e começa a correr. */
  private updateEntrance(dt: number): void {
    const porta = this.data.porta!;
    this.timer += dt;
    this.setDoorOpen(this.doorAmount());
    if (this.timer < (this.slam ? SLAM_OPEN_TIME * 0.5 : SHOW_AT)) {
      this.visual.setEnabled(false);
      this.lanterna.setEnabled(false);
      this.light.intensity = 0;
      return;
    }
    if (!this.visual.isEnabled()) this.setShown(true);
    const k = Math.min((this.timer - (this.slam ? SLAM_OPEN_TIME * 0.5 : SHOW_AT)) / STEP_OUT_TIME, 1);
    const eased = smooth(k);
    this.zNow = porta.z - DOORWAY_INSET + (this.data.z - (porta.z - DOORWAY_INSET)) * eased;
    this.x = this.data.x0 + STEP_OUT_X * eased * eased;
    this.facing = smooth(Math.min(k * 1.4, 1));
    this.currentSpeed = this.data.speed * 0.7 * k;
    if (k >= 1) this.phase = "andando";
  }

  private setShown(shown: boolean): void {
    this.visual.setEnabled(shown);
    this.lanterna.setEnabled(shown && this.lit);
    this.light.intensity = shown && this.lit ? LIGHT_INTENSITY : 0;
  }

  /** Barulho (caixa caindo): o segurança de ronda vai até lá olhar e depois volta. Devolve true se ouviu. */
  hear(x: number, y: number): boolean {
    if (this.chases || this.phase === "escondido") return false;
    if (Math.abs(x - this.x) > HEAR_RANGE || Math.abs(y - this.data.y) > HEAR_HEIGHT) return false;
    const habit = this.data.habito?.tipo;
    if (habit === "cochilo") return Math.abs(x - this.x) <= NAP_HEAR * 1.6 && this.wake(x);
    if (habit === "futebol") {
      // Sentado no posto: não levanta, mas larga a TV e aponta a lanterna para o barulho.
      if (this.habitPhase !== "vigiando") this.events.push("lanterna-liga");
      this.enterHabit("vigiando", rand(WATCH_TIME));
      this.facing = Math.max(-0.8, Math.min(0.8, Math.sign(x - this.x) * 0.7));
      return true;
    }
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
    if (this.phase !== "escondido" && this.lit) this.light.intensity = LIGHT_INTENSITY * (1 - 0.25 * this.alert);
    return this.alert >= 1;
  }

  sees(points: readonly Vector3[]): boolean {
    if (!this.lit) {
      // Sem lanterna (celular, TV, dormindo): no máximo nota quem passa encostado.
      // Vendo o jogo, atrás do balcão: só percebe barulho (ver `hear`), não quem passa quieto.
      if (this.data.habito?.tipo === "futebol") return false;
      const near = Math.abs(points[0].x - this.x) < UNLIT_NOTICE;
      // Dormindo, não vê ninguém: só acorda com barulho (pulo, deslize, ver `hearPlayer`).
      return near && this.habitPhase !== "dormindo" && this.habitPhase !== "susto";
    }
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
    if (this.chaseTargetX !== null) {
      // Perseguição: mira o chão à frente do jogador (no plano do jogo, z = 0).
      this.dir.set(Math.max(0.5, this.chaseTargetX - this.handGuess.x), -this.handGuess.y, -this.handGuess.z);
    } else this.dir.set(this.facing * this.data.aimAhead, this.data.aimY - this.handGuess.y, -this.zNow);
    this.dir.normalize();
    if (!this.lensReady) this.lamp.copyFrom(this.handGuess);
    this.light.position.copyFrom(this.lamp);
    this.light.direction.copyFrom(this.dir);
  }

  /** Mão e lanterna seguem a mira; a luz e a visão saem da lente de verdade. */
  private aimFlashlight(): void {
    if (!this.visual.isEnabled() || !this.lit) return;
    this.lanterna.aim(this.dir, this.lamp);
    this.lensReady = true;
    this.light.position.copyFrom(this.lamp);
    this.light.direction.copyFrom(this.dir);
  }
}

function rand([min, max]: [number, number]): number {
  return min + Math.random() * (max - min);
}

/** Celular na mão direita, com a tela acesa (o segurança do celular). */
function createPhone(scene: Scene, nodes: readonly TransformNode[]): AbstractMesh | null {
  const hand = nodes.find((node) => node.name === "mixamorig:RightHand");
  if (!hand) return null;
  const phone = CreateBox("vigia-celular", { width: 7.2, height: 14.6, depth: 0.9 }, scene);
  const material = new StandardMaterial("vigia-celular-mat", scene);
  material.diffuseColor = new Color3(0.02, 0.02, 0.025);
  material.emissiveColor = new Color3(0.6, 0.75, 0.95);
  material.specularColor = Color3.Black();
  phone.material = material;
  phone.parent = hand;
  // Na palma, de pé, com a tela virada para o rosto.
  phone.position.set(-1.5, 9.5, 3.5);
  phone.rotation.set(-0.35, 0, 0);
  phone.isPickable = false;
  // O brilho da tela no rosto: um halo azulado que se vê de longe, no escuro.
  const glow = CreatePlane("vigia-celular-brilho", { size: 70 }, scene);
  const halo = new DynamicTexture("vigia-celular-halo", { width: 128, height: 128 }, scene, true);
  const ctx = halo.getContext() as CanvasRenderingContext2D;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(150, 190, 255, 0.75)");
  gradient.addColorStop(0.35, "rgba(110, 150, 230, 0.28)");
  gradient.addColorStop(1, "rgba(80, 110, 200, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  halo.hasAlpha = true;
  halo.update();
  const glowMat = new StandardMaterial("vigia-celular-brilho-mat", scene);
  glowMat.disableLighting = true;
  glowMat.emissiveTexture = halo;
  glowMat.opacityTexture = halo;
  glowMat.alphaMode = Constants.ALPHA_ADD;
  glowMat.fogEnabled = false;
  glow.material = glowMat;
  glow.parent = phone;
  glow.position.set(0, 2, 6);
  glow.billboardMode = Mesh.BILLBOARDMODE_ALL;
  glow.isPickable = false;
  phone.setEnabled(false);
  return phone;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function approach(value: number, target: number, maxDelta: number): number {
  if (value < target) return Math.min(value + maxDelta, target);
  return Math.max(value - maxDelta, target);
}
