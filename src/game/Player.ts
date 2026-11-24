import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";
import {
  CharacterSupportedState,
  PhysicsCharacterController,
} from "@babylonjs/core/Physics/v2/characterController";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { PhysicsMotionType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import type { PhysicsEngine } from "@babylonjs/core/Physics/v2/physicsEngine";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/glTF";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Input } from "./Input";
import { GRAVITY } from "./Physics";
import { TUNING } from "./Tuning";
import { MODEL_OPTIONS, modelFile } from "./modelFile";
import { dressCharacter } from "./characterLook";
import { HandIK, type HandTarget } from "./HandIK";
import { FootIK, type FootGround } from "./FootIK";
import type { RampData } from "../levels/types";
import { treadHeightAt } from "../levels/stairs";

const MOVE_SPEED = 4.5;
const PUSH_SPEED = 1.2;
// "Pushing" anda 0,34 m/s no ritmo normal: o ritmo acompanha a velocidade real do carrinho (pesado anda menos).
// Parado contra algo que não sai do lugar, ele continua fazendo força no lugar.
const PUSH_CLIP_SPEED = 0.34;
const PUSH_RATIO_MIN = 0.8;
const PUSH_RATIO_MAX = 3.5;
const GROUND_ACCEL = 45;
const GROUND_DECEL = 60;
const AIR_ACCEL = 25;
const JUMP_HEIGHT = 1.4;
const COYOTE_TIME = 0.1;
const JUMP_BUFFER = 0.1;
const MAX_FALL_SPEED = 20;
export const CAPSULE_HEIGHT = 1.7;
export const CAPSULE_RADIUS = 0.3;
const SLIDE_SPEED = 6.5;
const SLIDE_DECEL = 4;
const SLIDE_MIN_SPEED = 2;
const SLIDE_TIME = 0.55;
const SLIDE_COOLDOWN = 0.25;
const SLIDE_HEIGHT = 0.8;
const CROUCH_BLEND = 4;
// Acima disso o personagem usa as animações agachadas do Mixamo (Crouch Idle e Crouched Walking).
const CROUCH_ANIM_THRESHOLD = 0.5;

const MODEL_URL = modelFile("personagem");
/** Escurece a textura do Bryce (Zacarias) para ele não brilhar mais que o cenário. */
const MODEL_TINT = new Color3(0.62, 0.62, 0.66);
// Introdução: andando devagar lendo o celular ("Walking While Texting" anda 0,76 m/s no clipe, medido pela passada).
const PHONE_WALK_SPEED = 0.9;
const PHONE_WALK_CLIP_SPEED = 0.76;
// O celular fica na palma: entre o pulso e a base do dedo médio, um pouco para dentro da mão.
const PHONE_ALONG = 0.75;
const TURN_SPEED = 14;
const BLEND_TIME = 0.15;
// Velocidades (m/s) em que os pés não escorregam, medidas pela passada de cada clipe: "Running" e "Sneaking Forward".
const WALK_CLIP_SPEED = 4.6;
const CROUCH_WALK_CLIP_SPEED = 1.85;
const JUMP_CLIP_DURATION = 2.2;
// Pulo ("Jump"): do impulso, com as pernas esticadas, até as pernas esticando de novo para o pouso, no tempo
// de um pulo em chão plano.
const JUMP_AIR_START = 0.78;
const JUMP_AIR_END = 1.28;
// Logo depois do pulo o controlador ainda acha chão por um ou dois quadros: o corpo já conta como no ar.
const JUMP_LIFTOFF = 0.15;
// O pulo segue a física: subindo, do impulso (0,78) às pernas recolhidas (1,08) conforme a velocidade cai; descendo,
// as pernas esticam para o pouso (até 1,28) no último REACH_TIME antes de tocar o chão. Descendo de algo alto,
// depois do ápice e longe do chão, passa para a pose de queda.
const JUMP_TUCK = 1.08;
const REACH_TIME = 0.18;
// Descendo, se ainda falta mais que isso para o chão (mais que a descida de um pulo em chão plano), cai.
const FALL_POSE_TTC = 0.45;
const GROUND_PROBE = 4;
// Pouso parado: o trecho do mesmo clipe em que os joelhos absorvem o impacto e ele se levanta.
const LAND_CLIP_START = 1.3;
const LAND_CLIP_END = 1.8;
const LAND_TIME = 0.45;
// Só pousa com o corpo dobrado depois de um tempo de verdade no ar (não num degrau) e se não estiver correndo.
const LAND_MIN_AIR = 0.25;
const LAND_MAX_SPEED = 1;
// Queda sem pulo (saiu de uma borda): "Falling Idle" depois de um instante caindo.
const FALL_DELAY = 0.1;
const FALL_MIN_SPEED = 2;
// No ar, os quadris do clipe não sobem acima da altura em pé (o "Jump" levanta o corpo sozinho até 0,27 m,
// e a física já faz o corpo subir): sem isso a cabeça passa do teto e os pés flutuam acima da cápsula.
const STAND_HIPS = 0.956;
const HIPS_SETTLE_SPEED = 1.5;
const SLIDE_CLIP_DURATION = 1.57;
const SLIDE_CLIP_START = 0.15;
const SLIDE_CLIP_LOW = 0.75;
// Quadros antes do fim em que pulo e deslize ficam parados (o grupo nunca chega a terminar).
const CLIP_HOLD_MARGIN = 0.5;
// Descida de rampa: Zacarias escorrega de pés por uma rampa íngreme (garagem, rampa de metal) usando o mesmo
// "Running Slide": entra na pose deitada, segura enquanto desce e, no fim da rampa, toca o trecho em que o
// clipe levanta e volta a correr. Escadas são rampas escondidas e não contam.
const RAMP_MIN_SLOPE = (20 * Math.PI) / 180;
const RAMP_FLAT_SLOPE = (8 * Math.PI) / 180;
const RAMP_MIN_SPEED = 1.5;
const RAMP_PROBE_UP = 0.25;
const RAMP_PROBE_DOWN = 0.9;
const RAMP_ENTER_CLIP_END = 0.5;
const RAMP_ENTER_TIME = 0.28;
const RAMP_GETUP_CLIP_START = 0.62;
const RAMP_GETUP_CLIP_END = 1.3;
const RAMP_GETUP_TIME = 0.55;
const RAMP_TILT_SPEED = 6;
// Fim do deslize: do instante em que ele apoia a mão para se erguer até voltar a correr.
const SLIDE_GETUP_CLIP_START = 0.8;
const SLIDE_GETUP_TIME = 0.42;

// Apoio na parede: ao andar contra uma parede, as mãos encostam nela e o corpo amortece o impacto.
const BRACE_HAND_HEIGHT = 1.3;
const BRACE_REACH = 0.42;
const BRACE_LEAN = 0.09;
const BRACE_IMPACT = 0.8;
const LEAN_SPRING = 140;
const LEAN_DAMPING = 15;
// Empurrando uma pegada baixa, o corpo recua até o ombro ficar a PUSH_ARM do ponto (braço quase esticado).
// Medidas no clipe "Pushing": ombro a ~1,12 m acima de `feetY` (que fica ~0,1 m acima do chão) e, sem recuo,
// praticamente em cima da pegada.
const PUSH_SHOULDER_HEIGHT = 1.12;
const PUSH_SHOULDER_AHEAD = 0.02;
const PUSH_ARM = 0.42;
const PUSH_BACK_MAX = 0.42;
const PUSH_BACK_SPEED = 1.5;

// Pés no chão: o corpo (pés da animação) fica este tanto acima do piso sob a cápsula (folga do controlador).
const FEET_CLEARANCE = 0.017;
// Até onde, acima e abaixo dos pés, procurar o piso sob cada pé.
const FOOT_PROBE_UP = 0.6;
const FOOT_PROBE_DOWN = 0.6;
// Correndo na escada o tronco inclina: para a frente subindo, um pouco para trás descendo (radianos).
const STAIR_LEAN_UP = 0.08;
const STAIR_LEAN_DOWN = -0.04;
const STAIR_LEAN_SPEED = 0.5;
// Começa a seguir a escada para baixo um pouco antes do primeiro degrau (a cápsula tem raio).
const STAIR_STICK_MARGIN = 0.3;

const JUMP_SPEED = Math.sqrt(2 * -GRAVITY.y * JUMP_HEIGHT);
const DOWN = new Vector3(0, -1, 0);

type AnimName =
  | "parado"
  | "andar"
  | "pular"
  | "empurrar"
  | "deslizar"
  | "agachado"
  | "agachado_andar"
  | "celular_andar"
  | "celular_parado"
  | "cair";

export class Player {
  readonly position = new Vector3();
  private readonly controller: PhysicsCharacterController;
  private readonly visual: TransformNode;
  private readonly anims: Map<AnimName, AnimationGroup>;
  private readonly velocity = new Vector3();
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private grounded = false;
  private facing = 1;
  private yaw = Math.PI / 2;
  private current: AnimName = "parado";
  private height = CAPSULE_HEIGHT;
  private sliding = false;
  private slideArmed = true;
  private slideTimer = 0;
  private slideCooldown = 0;
  private slideSpeed = 0;
  private slideDir = 1;
  private ramp: "nao" | "descendo" | "levantando" = "nao";
  private rampTimer = 0;
  private rampHeld = false;
  private rampSlope = 0;
  private rampSurfaceY = 0;
  private rampTilt = 0;
  // Quadro final de cada clipe de uma vez só (pulo e deslize), para segurar a pose quando ele acaba.
  private readonly clipEnds = new Map<AnimName, number>();
  private readonly scene: Scene;
  private readonly ray = new PhysicsRaycastResult();
  meshes: AbstractMesh[] = [];
  private readonly rayFrom = new Vector3();
  private readonly rayTo = new Vector3();
  private crouchWanted = false;
  private crouch = 0;
  private ik: HandIK | null = null;
  private feet: FootIK | null = null;
  private stairs: readonly RampData[] = [];
  private stairLean = 0;
  private readonly ground: FootGround = { heightAt: (x) => this.groundAt(x), rootGround: 0, facing: 1 };
  private grip: HandTarget | null = null;
  private brace: HandTarget | null = null;
  private lean = 0;
  private pushBack = 0;
  private leanSpeed = 0;
  private phone = false;
  private phoneMesh: Mesh | null = null;
  // No ar: "pulo" (apertou pular) ou "queda" (saiu de uma borda); tempo no ar, desde o pulo e de pouso.
  private airKind: "nao" | "pulo" | "queda" = "nao";
  private airTime = 0;
  private jumpTime = Infinity;
  private landTimer = 0;
  private jumpScrub = false;
  private fallPose = false;
  private hips: TransformNode | null = null;
  private hipsLift = 0;
  // Velocidade real no chão (o quanto o corpo andou), que empurrando um carrinho pesado é menor que a pedida.
  private lastX = 0;
  private movedSpeed = 0;

  private constructor(
    scene: Scene,
    spawn: { x: number; y: number },
    visual: TransformNode,
    anims: Map<AnimName, AnimationGroup>,
  ) {
    this.scene = scene;
    this.visual = visual;
    this.anims = anims;
    this.position.set(spawn.x, spawn.y, 0);
    this.controller = new PhysicsCharacterController(
      this.position.clone(),
      { capsuleHeight: CAPSULE_HEIGHT, capsuleRadius: CAPSULE_RADIUS },
      scene,
    );
    for (const [name, group] of anims) {
      if (name !== "pular" && name !== "deslizar") group.start(true);
      group.weight = name === this.current ? 1 : 0;
    }
    this.syncVisual(0);
  }

  static async create(scene: Scene, spawn: { x: number; y: number }): Promise<Player> {
    const result = await ImportMeshAsync(MODEL_URL, scene, MODEL_OPTIONS);
    const visual = new TransformNode("player-visual", scene);
    for (const mesh of result.meshes) if (!mesh.parent) mesh.parent = visual;
    dressCharacter(result.meshes, scene, "player", MODEL_TINT);
    const anims = new Map<AnimName, AnimationGroup>();
    for (const group of result.animationGroups) {
      group.stop();
      anims.set(group.name as AnimName, group);
    }
    const player = new Player(scene, spawn, visual, anims);
    player.meshes = result.meshes;
    player.ik = HandIK.create(result.transformNodes);
    player.feet = FootIK.create(visual, result.transformNodes);
    const node = (name: string) => result.transformNodes.find((n) => n.name === `mixamorig:${name}`) ?? null;
    player.phoneMesh = createPhone(scene, node("RightHand"), node("RightHandMiddle1"));
    player.hips = node("Hips");
    return player;
  }

  get feetY(): number {
    return this.position.y - this.height / 2;
  }

  placeVisual(x: number, y: number): void {
    this.visual.position.set(x, y, 0);
  }

  /** Deslizando (tecla) ou escorregando rampa abaixo: som de deslize e sem passos. */
  get isSliding(): boolean {
    return this.sliding || this.ramp === "descendo";
  }

  get isGrounded(): boolean {
    return this.grounded;
  }

  /** 0 = em pé, 1 = totalmente agachado. */
  get crouchAmount(): number {
    return this.crouch;
  }

  /** Introdução: anda devagar com o celular na mão, lendo as mensagens. */
  setPhone(on: boolean): void {
    this.phone = on;
  }

  setCrouch(on: boolean): void {
    this.crouchWanted = on;
  }

  /** Vira o boneco para um lado sem andar (cenas). */
  face(dir: 1 | -1): void {
    this.facing = dir;
  }

  get facingDirection(): number {
    return this.facing;
  }

  /**
   * Descendo escada correndo, o corpo acompanha a rampa escondida em vez de sair voando por cima dos degraus
   * (sem isso o controlador perde o chão e toca o pulo no meio da escada). Pulo e queda continuam livres.
   */
  private followStairsDown(): void {
    if (this.coyoteTimer <= 0 || this.velocity.y > 0 || this.ramp !== "nao") return;
    const x = this.position.x;
    for (const stair of this.stairs) {
      const left = Math.min(stair.x0, stair.x1) - STAIR_STICK_MARGIN;
      const right = Math.max(stair.x0, stair.x1) + STAIR_STICK_MARGIN;
      if (x < left || x > right) continue;
      const slope = (stair.y1 - stair.y0) / (stair.x1 - stair.x0);
      const follow = slope * this.velocity.x;
      if (follow < 0) this.velocity.y = Math.min(this.velocity.y, follow);
      return;
    }
  }

  /** Inclinação do tronco correndo na escada (some aos poucos ao parar ou sair dela). */
  private updateStairLean(dt: number): void {
    let target = 0;
    const speed = Math.abs(this.velocity.x);
    if (this.grounded && !this.sliding && this.ramp === "nao" && speed > 0.5) {
      const stair = this.stairs.find((s) => this.position.x >= Math.min(s.x0, s.x1) && this.position.x <= Math.max(s.x0, s.x1));
      if (stair) {
        const climbing = (stair.y1 - stair.y0) / (stair.x1 - stair.x0) * this.velocity.x > 0;
        target = (climbing ? STAIR_LEAN_UP : STAIR_LEAN_DOWN) * Math.min(speed / MOVE_SPEED, 1);
      }
    }
    this.stairLean = approach(this.stairLean, target, STAIR_LEAN_SPEED * dt);
  }

  /** Escadas da fase: os pés pisam no piso de cada degrau. */
  setStairs(stairs: readonly RampData[]): void {
    this.stairs = stairs;
  }

  /** Para testes e capturas: ajuste dos pés (quadril, erro e piso/sola de cada pé). */
  get footState(): { pelvis: number; error: number; feet: { ground: number; sole: number; planted: number; toe: number }[] } {
    return { pelvis: this.feet?.lastPelvis ?? 0, error: this.feet?.lastError ?? 0, feet: [...(this.feet?.debug ?? [])] };
  }

  /** Piso sob `x`: degrau de escada, ou o que um raio para baixo encontrar perto dos pés. */
  private groundAt(x: number): number | null {
    const tread = treadHeightAt(this.stairs, x);
    if (tread !== null) return tread;
    const engine = this.scene.getPhysicsEngine() as PhysicsEngine | null;
    if (!engine) return null;
    const base = this.feetY - FEET_CLEARANCE;
    this.rayFrom.set(x, base + FOOT_PROBE_UP, 0);
    this.rayTo.set(x, base - FOOT_PROBE_DOWN, 0);
    engine.raycastToRef(this.rayFrom, this.rayTo, this.ray);
    if (!this.ray.hasHit) return null;
    // Caixa sendo empurrada ou rolando não serve de piso para o pé (só para o corpo, quando em cima dela).
    if (this.ray.body?.getMotionType() === PhysicsMotionType.DYNAMIC && Math.abs(this.ray.hitPointWorld.y - base) > 0.05) return null;
    return this.ray.hitPointWorld.y;
  }

  /** Ponto de pegada do objeto que está sendo empurrado (mundo), ou nulo. */
  setGrip(target: HandTarget | null): void {
    this.grip = target;
  }

  /** Para testes: se as mãos estão presas a algo e o quanto erram o alvo. */
  get handState(): { grip: boolean; brace: boolean; error: number } {
    return { grip: this.grip !== null, brace: this.brace !== null, error: this.ik?.lastError ?? 0 };
  }

  update(dt: number, input: Input, pushing: boolean): void {
    if (dt <= 0) return;

    const support = this.controller.checkSupport(dt, DOWN);

    this.grounded = support.supportedState === CharacterSupportedState.SUPPORTED;

    this.coyoteTimer = this.grounded ? COYOTE_TIME : Math.max(0, this.coyoteTimer - dt);
    this.jumpBufferTimer = input.wasPressed("jump")
      ? JUMP_BUFFER
      : Math.max(0, this.jumpBufferTimer - dt);

    const current = this.controller.getVelocity();
    // `current` é a referência interna do controlador (muda no integrate); guarda a velocidade de chegada.
    const speedBefore = Math.abs(current.x);
    const axis = input.axisX();
    this.slideCooldown = Math.max(0, this.slideCooldown - dt);
    if (!input.isDown("slide")) this.slideArmed = true;

    if (this.sliding) {
      this.slideTimer += dt;
      const wantsJump = this.jumpBufferTimer > 0;
      const shouldEnd = this.slideTimer >= SLIDE_TIME || !this.grounded || wantsJump;
      if (shouldEnd && this.canStand()) {
        this.endSlide();
        // Fim do deslize no chão: levanta com o trecho do clipe em que ele se ergue (como no fim da rampa).
        if (!wantsJump && this.grounded && !this.crouchWanted) this.startGetUp();
      } else if (wantsJump) this.jumpBufferTimer = 0;
    } else if (
      this.grounded &&
      this.slideArmed &&
      this.slideCooldown === 0 &&
      axis !== 0 &&
      input.isDown("slide")
    ) {
      this.startSlide(axis, Math.abs(current.x));
    }

    if (this.sliding) {
      this.crouch = approach(this.crouch, 0, CROUCH_BLEND * dt);
      this.slideSpeed = Math.max(this.slideSpeed - SLIDE_DECEL * dt, SLIDE_MIN_SPEED);
      this.velocity.x = this.slideDir * this.slideSpeed;
    } else {
      if (axis !== 0) this.facing = axis;
      const crouchTarget = this.crouchWanted && this.grounded && !pushing ? 1 : 0;
      this.crouch = approach(this.crouch, crouchTarget, CROUCH_BLEND * dt);
      const walkSpeed = this.phone ? PHONE_WALK_SPEED : MOVE_SPEED + (TUNING.agachadoVelocidade - MOVE_SPEED) * this.crouch;
      const targetX = axis * (pushing && this.grounded ? PUSH_SPEED : walkSpeed);
      const accel = this.grounded ? (targetX !== 0 ? GROUND_ACCEL : GROUND_DECEL) : AIR_ACCEL;
      this.velocity.x = approach(current.x, targetX, accel * dt);
    }

    if (this.grounded && current.y <= 0) {
      this.velocity.y = 0;
    } else {
      this.velocity.y = Math.max(current.y + GRAVITY.y * dt, -MAX_FALL_SPEED);
    }
    this.updateRamp(dt, pushing);
    // Escorregando, o corpo acompanha a rampa em vez de sair voando da borda e cair no meio dela.
    if (this.ramp === "descendo") {
      this.velocity.y = Math.min(this.velocity.y, -Math.tan(this.rampSlope) * Math.abs(this.velocity.x));
    }

    this.followStairsDown();

    let jumped = false;
    if (this.jumpBufferTimer > 0 && (this.coyoteTimer > 0 || this.ramp === "descendo")) {
      this.velocity.y = JUMP_SPEED;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      jumped = true;
      this.endRamp(false);
    }

    this.velocity.z = 0;
    this.controller.setVelocity(this.velocity);
    this.controller.integrate(dt, support, GRAVITY);

    const pos = this.controller.getPosition();
    if (Math.abs(pos.z) > 0.001) {
      pos.z = 0;
      this.controller.setPosition(pos);
    }
    this.position.set(pos.x, pos.y, 0);
    this.movedSpeed += (Math.abs(pos.x - this.lastX) / dt - this.movedSpeed) * Math.min(1, dt * 12);
    this.lastX = pos.x;

    const pushingNow = pushing && !this.sliding;
    this.updateBrace(dt, axis, pushingNow, speedBefore);
    this.updateAnimation(dt, jumped, pushingNow);
    // Pegada mais baixa que as mãos da animação: o corpo recua para os braços se esticarem até ela,
    // em vez de dobrarem com as mãos embaixo do queixo.
    let back = 0;
    if (pushingNow && this.grip) {
      const drop = this.feetY + PUSH_SHOULDER_HEIGHT - this.grip.y;
      // Pegada na altura do ombro ou acima (carrinho de carga): sem recuo, o braço dobrado fica natural.
      const lowness = Math.min(Math.max((drop - 0.05) / 0.15, 0), 1);
      const reach = Math.sqrt(Math.max(PUSH_ARM * PUSH_ARM - drop * drop, 0));
      back = Math.min(Math.max(reach - PUSH_SHOULDER_AHEAD, 0), PUSH_BACK_MAX) * lowness;
    }
    this.pushBack = approach(this.pushBack, back, PUSH_BACK_SPEED * dt);
    this.updateStairLean(dt);
    this.syncVisual(dt);
    // Pés: com o corpo no chão (andando, parado, agachado ou empurrando), cada pé pisa no piso sob ele.
    this.ground.rootGround = this.feetY - FEET_CLEARANCE;
    this.ground.facing = this.facing;
    const feetOn = this.grounded && this.airKind === "nao" && !this.sliding && this.ramp === "nao";
    this.feet?.apply(dt, this.ground, feetOn);
    this.ik?.apply(dt, pushingNow && this.grip ? this.grip : this.brace);
  }

  /** Andando contra uma parede: mãos na parede e um leve balanço do corpo, mais forte quanto mais rápido. */
  private updateBrace(dt: number, axis: number, pushing: boolean, speedBefore: number): void {
    const wasBracing = this.brace !== null;
    this.brace = null;
    if (axis !== 0 && axis === this.facing && this.grounded && !this.sliding && this.ramp === "nao" && !pushing && this.crouch < 0.3) {
      const engine = this.scene.getPhysicsEngine() as PhysicsEngine | null;
      if (engine) {
        const y = this.feetY + BRACE_HAND_HEIGHT;
        this.rayFrom.set(this.position.x, y, 0);
        this.rayTo.set(this.position.x + this.facing * (CAPSULE_RADIUS + BRACE_REACH), y, 0);
        engine.raycastToRef(this.rayFrom, this.rayTo, this.ray);
        if (this.ray.hasHit && this.ray.body?.getMotionType() !== PhysicsMotionType.DYNAMIC) {
          this.brace = { x: this.ray.hitPointWorld.x - this.facing * 0.03, y };
        }
      }
    }
    if (this.brace && !wasBracing) this.leanSpeed += speedBefore * BRACE_IMPACT;
    const target = this.brace ? BRACE_LEAN : 0;
    const accel = LEAN_SPRING * (target - this.lean) - LEAN_DAMPING * this.leanSpeed;
    this.leanSpeed += accel * dt;
    this.lean += this.leanSpeed * dt;
    if (!this.brace && Math.abs(this.lean) < 1e-4 && Math.abs(this.leanSpeed) < 1e-3) {
      this.lean = 0;
      this.leanSpeed = 0;
    }
  }

  /** Move o jogador em X mantendo velocidade e estado (corredor que se repete). */
  shiftX(dx: number): void {
    const pos = this.controller.getPosition();
    pos.x += dx;
    this.controller.setPosition(pos);
    this.position.x += dx;
    this.lastX += dx;
    this.syncVisual(0);
  }

  respawn(point: { x: number; y: number }): void {
    if (this.sliding) {
      this.sliding = false;
      this.setHeight(CAPSULE_HEIGHT);
    }
    this.slideCooldown = 0;
    this.slideArmed = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.velocity.setAll(0);
    this.controller.setVelocity(this.velocity);
    this.controller.setPosition(new Vector3(point.x, point.y, 0));
    this.position.set(point.x, point.y, 0);
    this.lastX = point.x;
    this.movedSpeed = 0;
    this.facing = 1;
    this.crouch = 0;
    this.grip = null;
    this.brace = null;
    this.lean = 0;
    this.leanSpeed = 0;
    this.pushBack = 0;
    this.ramp = "nao";
    this.rampTilt = 0;
    this.feet?.reset();
    this.stairLean = 0;
    this.phone = false;
    this.airKind = "nao";
    this.airTime = 0;
    this.jumpTime = Infinity;
    this.landTimer = 0;
    this.hipsLift = 0;
    this.jumpScrub = false;
    this.fallPose = false;
    this.current = "parado";
    for (const [name, group] of this.anims) group.weight = name === "parado" ? 1 : 0;
    this.syncVisual(0);
  }

  /** Superfície visível logo abaixo dos pés: inclinação e altura, ou nulo. */
  private probeRamp(): { slope: number; downhill: number; y: number } | null {
    const engine = this.scene.getPhysicsEngine() as PhysicsEngine | null;
    if (!engine) return null;
    this.rayFrom.set(this.position.x, this.feetY + RAMP_PROBE_UP, 0);
    this.rayTo.set(this.position.x, this.feetY - RAMP_PROBE_DOWN, 0);
    engine.raycastToRef(this.rayFrom, this.rayTo, this.ray);
    if (!this.ray.hasHit) return null;
    const node = this.ray.body?.transformNode as AbstractMesh | undefined;
    if (node && node.isVisible === false) return null;
    const n = this.ray.hitNormalWorld;
    return { slope: Math.acos(Math.min(Math.max(n.y, -1), 1)), downhill: Math.sign(n.x), y: this.ray.hitPointWorld.y };
  }

  private updateRamp(dt: number, pushing: boolean): void {
    const speed = Math.abs(this.velocity.x);
    const dir = Math.sign(this.velocity.x);
    const hit = this.ramp === "levantando" ? null : this.probeRamp();
    const steepDown = hit !== null && hit.slope > RAMP_MIN_SLOPE && hit.downhill === dir && speed > RAMP_MIN_SPEED;
    if (this.ramp === "nao") {
      if (steepDown && !this.sliding && !pushing && this.crouch < 0.5 && hit) {
        this.ramp = "descendo";
        this.rampTimer = 0;
        this.rampHeld = false;
        this.rampSlope = hit.slope;
        this.rampSurfaceY = hit.y;
        this.facing = dir;
        this.playRampEnter();
      }
      return;
    }
    this.rampTimer += dt;
    if (this.ramp === "descendo") {
      if (this.sliding || pushing || speed < 0.5) {
        this.endRamp(false);
        return;
      }
      if (!this.rampHeld) this.holdRampPose();
      if (steepDown && hit) {
        this.rampSlope = hit.slope;
        this.rampSurfaceY = hit.y;
      } else if (this.grounded && (!hit || hit.slope < RAMP_FLAT_SLOPE)) {
        this.endRamp(true);
      } else if (hit) {
        this.rampSurfaceY = hit.y;
      }
    } else if (this.rampTimer >= RAMP_GETUP_TIME || this.sliding || pushing || (speed < 0.5 && this.rampTimer > RAMP_GETUP_TIME - 0.13)) {
      this.ramp = "nao";
    }
  }

  /** Fim da rampa: levanta com o fim do clipe (chão plano) ou só volta ao normal (pulo, parada, deslize). */
  private endRamp(getUp: boolean): void {
    if (this.ramp === "nao") return;
    if (getUp && this.ramp === "descendo") {
      this.ramp = "levantando";
      this.rampTimer = 0;
      this.playRampGetUp();
    } else {
      this.ramp = "nao";
    }
  }

  private startGetUp(): void {
    this.ramp = "levantando";
    // Conta como se já tivesse passado o começo do levantar da rampa: dura SLIDE_GETUP_TIME.
    this.rampTimer = RAMP_GETUP_TIME - SLIDE_GETUP_TIME;
    const group = this.anims.get("deslizar");
    if (!group) return;
    const ratio = (RAMP_GETUP_CLIP_END - SLIDE_GETUP_CLIP_START) / SLIDE_GETUP_TIME;
    this.playOnce("deslizar", group, ratio, this.slideFrame(group, SLIDE_GETUP_CLIP_START), this.slideFrame(group, RAMP_GETUP_CLIP_END));
  }

  private slideFrame(group: AnimationGroup, t: number): number {
    return group.from + (t / SLIDE_CLIP_DURATION) * (group.to - group.from);
  }

  /** Congela a pose deitada quando o clipe chega nela (pelo quadro do clipe, para não depender do ritmo do jogo). */
  private holdRampPose(): void {
    const group = this.anims.get("deslizar");
    if (!group) return;
    const hold = this.slideFrame(group, RAMP_ENTER_CLIP_END);
    const frame = group.animatables[0]?.masterFrame ?? hold;
    if (frame < hold && this.rampTimer < RAMP_ENTER_TIME && group.isPlaying) return;
    if (!group.isStarted) this.playOnce("deslizar", group, 1, hold, this.slideFrame(group, RAMP_GETUP_CLIP_END));
    group.goToFrame(hold);
    // Parado no quadro, mas ainda tocando: um grupo pausado deixa de entrar na mistura e o corpo volta à pose de bind.
    group.speedRatio = 0;
    this.rampHeld = true;
  }

  private playRampEnter(): void {
    const group = this.anims.get("deslizar");
    if (!group) return;
    const ratio = (RAMP_ENTER_CLIP_END - SLIDE_CLIP_START) / RAMP_ENTER_TIME;
    // Vai até o fim do clipe; `holdRampPose` congela a pose deitada enquanto a rampa durar.
    this.playOnce("deslizar", group, ratio, this.slideFrame(group, SLIDE_CLIP_START), this.slideFrame(group, RAMP_GETUP_CLIP_END));
  }

  private playRampGetUp(): void {
    const group = this.anims.get("deslizar");
    if (!group) return;
    const ratio = (RAMP_GETUP_CLIP_END - RAMP_GETUP_CLIP_START) / RAMP_GETUP_TIME;
    this.playOnce("deslizar", group, ratio, this.slideFrame(group, RAMP_GETUP_CLIP_START), this.slideFrame(group, RAMP_GETUP_CLIP_END));
  }

  private startSlide(dir: number, currentSpeed: number): void {
    this.sliding = true;
    this.slideArmed = false;
    this.slideTimer = 0;
    this.slideDir = dir;
    this.facing = dir;
    this.slideSpeed = Math.max(SLIDE_SPEED, currentSpeed);
    this.setHeight(SLIDE_HEIGHT);
    this.playSlide();
  }

  private endSlide(): void {
    this.sliding = false;
    this.slideCooldown = SLIDE_COOLDOWN;
    this.setHeight(CAPSULE_HEIGHT);
  }

  private setHeight(height: number): void {
    this.height = height;
    this.controller.setShapeOptions({ capsuleHeight: height, capsuleRadius: CAPSULE_RADIUS }, true);
  }

  private canStand(): boolean {
    const engine = this.scene.getPhysicsEngine() as PhysicsEngine | null;
    if (!engine) return true;
    const pos = this.controller.getPosition();
    const feet = pos.y - this.height / 2;
    for (const offset of [-CAPSULE_RADIUS * 0.9, 0, CAPSULE_RADIUS * 0.9]) {
      this.rayFrom.set(pos.x + offset, feet + this.height + 0.02, 0);
      this.rayTo.set(pos.x + offset, feet + CAPSULE_HEIGHT + 0.02, 0);
      engine.raycastToRef(this.rayFrom, this.rayTo, this.ray);
      if (this.ray.hasHit) return false;
    }
    return true;
  }

  private updateAnimation(dt: number, jumped: boolean, pushing: boolean): void {
    // Encostado na parede, o corpo para (sem correr no lugar).
    const speedX = this.brace ? 0 : Math.abs(this.velocity.x);
    const crouched = this.crouch > CROUCH_ANIM_THRESHOLD;
    this.updateAir(dt, jumped, speedX);
    let next: AnimName;
    if (this.sliding || this.ramp !== "nao") next = "deslizar";
    else if (this.airKind !== "nao") next = this.airPose();
    else if (this.landTimer > 0 && !pushing) next = "pular";
    else if (pushing) next = "empurrar";
    else if (this.phone) next = speedX > 0.2 ? "celular_andar" : "celular_parado";
    else if (speedX > 0.2) next = crouched ? "agachado_andar" : "andar";
    else next = crouched ? "agachado" : "parado";

    this.current = next;

    const walk = this.anims.get("andar");
    if (walk) walk.speedRatio = Math.max(speedX / WALK_CLIP_SPEED, 0.5);
    const crouchWalk = this.anims.get("agachado_andar");
    if (crouchWalk) crouchWalk.speedRatio = Math.max(speedX / CROUCH_WALK_CLIP_SPEED, 0.5);
    const push = this.anims.get("empurrar");
    if (push) push.speedRatio = Math.min(Math.max(this.movedSpeed / PUSH_CLIP_SPEED, PUSH_RATIO_MIN), PUSH_RATIO_MAX);
    const phoneWalk = this.anims.get("celular_andar");
    if (phoneWalk) phoneWalk.speedRatio = Math.max(speedX / PHONE_WALK_CLIP_SPEED, 0.5);

    if (this.phoneMesh) {
      const held = (this.anims.get("celular_andar")?.weight ?? 0) + (this.anims.get("celular_parado")?.weight ?? 0);
      this.phoneMesh.isVisible = held > 0.5;
    }
    this.holdClipEnds();
    const step = dt / BLEND_TIME;
    for (const [name, group] of this.anims) {
      const target = name === this.current ? 1 : 0;
      group.weight = approach(group.weight, target, step);
    }
  }

  /** Toca um trecho de clipe uma vez. `stop` antes: `start` num grupo que ainda está tocando é ignorado. */
  private playOnce(name: AnimName, group: AnimationGroup, ratio: number, from: number, to: number): void {
    if (name === "pular") this.jumpScrub = false;
    group.stop();
    group.start(false, ratio, from, to);
    this.clipEnds.set(name, to);
  }

  /**
   * Pulo e deslize tocam uma vez só. Um grupo que termina sai da mistura e, se ainda tem peso (queda mais longa
   * que o pulo, deslize que não pode levantar embaixo de algo, ou o fade de saída), o corpo volta à pose de bind.
   * Por isso, perto do fim, o grupo fica parado no último quadro, ainda tocando, até outro clipe o reiniciar.
   */
  private holdClipEnds(): void {
    for (const [name, end] of this.clipEnds) {
      const group = this.anims.get(name);
      if (!group) continue;
      const hold = end - CLIP_HOLD_MARGIN;
      const frame = group.animatables[0]?.masterFrame ?? hold;
      if (!group.isStarted) {
        if (group.weight <= 0.001) continue;
        group.start(true, 1, hold, end);
        group.goToFrame(hold);
        group.speedRatio = 0;
      } else if (group.speedRatio !== 0 && frame >= hold) {
        group.goToFrame(hold);
        group.speedRatio = 0;
      }
    }
  }

  /**
   * Estado no ar e pouso. Pulo: segue o clipe do pulo; queda sem pulo: "Falling Idle". Ao tocar o chão depois de um
   * tempo no ar, parado, toca o pouso (joelhos dobram e ele se levanta); correndo, segue correndo.
   */
  private updateAir(dt: number, jumped: boolean, speedX: number): void {
    this.jumpTime += dt;
    this.landTimer = Math.max(0, this.landTimer - dt);
    if (jumped) {
      this.fallPose = false;
      this.airKind = "pulo";
      this.jumpTime = 0;
      this.airTime = 0;
      this.landTimer = 0;
      return;
    }
    const airborne = !this.grounded || this.jumpTime < JUMP_LIFTOFF;
    if (airborne) {
      this.airTime += dt;
      const free = !this.sliding && this.ramp === "nao";
      if (this.airKind === "nao" && free && this.airTime > FALL_DELAY && this.velocity.y < -FALL_MIN_SPEED) this.airKind = "queda";
      return;
    }
    if (this.airKind !== "nao" && this.airTime > LAND_MIN_AIR && speedX < LAND_MAX_SPEED && !this.sliding && this.ramp === "nao") {
      this.playLanding();
    }
    this.airKind = "nao";
    this.fallPose = false;
    this.airTime = 0;
    // Voltou a correr (ou deslizou, empurrou) no meio do pouso: a corrida assume.
    if (speedX > 1.5 || this.sliding) this.landTimer = 0;
  }

  private jumpFrame(group: AnimationGroup, t: number): number {
    return group.from + (t / JUMP_CLIP_DURATION) * (group.to - group.from);
  }

  /** Distância dos pés até o chão logo abaixo (Infinity se não houver nada perto). */
  private groundBelow(): number {
    const engine = this.scene.getPhysicsEngine() as PhysicsEngine | null;
    if (!engine) return Infinity;
    this.rayFrom.set(this.position.x, this.feetY + 0.1, 0);
    this.rayTo.set(this.position.x, this.feetY - GROUND_PROBE, 0);
    engine.raycastToRef(this.rayFrom, this.rayTo, this.ray);
    return this.ray.hasHit ? Math.max(0, this.feetY - this.ray.hitPointWorld.y) : Infinity;
  }

  /** Pose no ar: o clipe do pulo posicionado pela física, ou a queda ("Falling Idle"). */
  private airPose(): AnimName {
    const vy = this.velocity.y;
    // Tempo até o chão em queda livre a partir da velocidade de agora.
    const g = -GRAVITY.y;
    const down = Math.max(-vy, 0);
    const ttc = vy <= 0 ? (-down + Math.sqrt(down * down + 2 * g * this.groundBelow())) / g : Infinity;
    if (this.airKind === "queda" || (vy <= 0 && ttc > FALL_POSE_TTC)) this.fallPose = true;
    let t: number;
    // Saindo de uma borda, nos primeiros instantes o raio ainda acha a beirada logo abaixo dos pés.
    const reach = ttc < REACH_TIME && (this.airKind === "pulo" || this.airTime > 0.2);
    if (reach) t = JUMP_TUCK + (1 - ttc / REACH_TIME) * (JUMP_AIR_END - JUMP_TUCK);
    else if (this.fallPose) return "cair";
    else if (vy > 0) t = JUMP_AIR_START + (1 - vy / JUMP_SPEED) * (JUMP_TUCK - JUMP_AIR_START);
    else t = JUMP_TUCK;
    this.scrubJump(t);
    return "pular";
  }

  /** Para o clipe do pulo num instante (tocando quase parado: um grupo com ritmo 0 não é aplicado ao corpo). */
  private scrubJump(t: number): void {
    const group = this.anims.get("pular");
    if (!group) return;
    if (!this.jumpScrub) {
      group.stop();
      group.start(true, 1e-6, group.from, group.to);
      this.clipEnds.delete("pular");
      this.jumpScrub = true;
    }
    group.goToFrame(this.jumpFrame(group, Math.min(Math.max(t, JUMP_AIR_START), JUMP_AIR_END)));
  }

  private playLanding(): void {
    const group = this.anims.get("pular");
    if (!group) return;
    const ratio = (LAND_CLIP_END - LAND_CLIP_START) / LAND_TIME;
    this.playOnce("pular", group, ratio, this.jumpFrame(group, LAND_CLIP_START), this.jumpFrame(group, LAND_CLIP_END));
    this.landTimer = LAND_TIME;
  }

  private playSlide(): void {
    const group = this.anims.get("deslizar");
    if (!group) return;
    const toFrame = (t: number): number =>
      group.from + (t / SLIDE_CLIP_DURATION) * (group.to - group.from);
    const ratio = (SLIDE_CLIP_LOW - SLIDE_CLIP_START) / SLIDE_TIME;
    this.playOnce("deslizar", group, ratio, toFrame(SLIDE_CLIP_START), toFrame(SLIDE_CLIP_LOW));
  }

  private syncVisual(dt: number): void {
    const targetYaw = this.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
    const t = dt > 0 ? 1 - Math.exp(-TURN_SPEED * dt) : 1;
    this.yaw += (targetYaw - this.yaw) * t;
    this.visual.rotation.y = this.yaw;
    // Na rampa o corpo deitado acompanha a inclinação e encosta na superfície.
    const tiltTarget = this.ramp === "descendo" ? this.rampSlope : 0;
    this.rampTilt = dt > 0 ? approach(this.rampTilt, tiltTarget, RAMP_TILT_SPEED * dt) : tiltTarget;
    const tiltAmount = this.rampSlope > 0 ? this.rampTilt / this.rampSlope : 0;
    this.visual.rotation.x = this.lean + this.rampTilt + this.stairLean;
    let y = this.position.y - this.height / 2;
    if (this.ramp === "descendo") y += (Math.min(this.rampSurfaceY, y) - y) * tiltAmount;
    // Altura dos quadris no último quadro desenhado, medida a partir do pé do boneco.
    const hipsHeight = this.hips ? this.hips.getAbsolutePosition().y - this.visual.position.y : STAND_HIPS;
    const lift = this.airKind !== "nao" ? Math.max(0, hipsHeight - STAND_HIPS) : 0;
    this.hipsLift = lift >= this.hipsLift || dt <= 0 ? lift : approach(this.hipsLift, lift, HIPS_SETTLE_SPEED * dt);
    y -= this.hipsLift;
    this.visual.position.set(this.position.x - this.facing * this.pushBack, y, 0);
  }
}

function approach(value: number, target: number, maxDelta: number): number {
  if (value < target) return Math.min(value + maxDelta, target);
  return Math.max(value - maxDelta, target);
}

/** Celular na mão direita (só na introdução): um retângulo escuro com a tela acesa, que brilha no escuro. */
function createPhone(scene: Scene, hand: TransformNode | null, finger: TransformNode | null): Mesh | null {
  if (!hand || !finger) return null;
  const phone = CreateBox("celular", { width: 0.075, height: 0.15, depth: 0.012 }, scene);
  const material = new StandardMaterial("celular-tela", scene);
  material.diffuseColor = new Color3(0, 0, 0);
  material.specularColor = new Color3(0, 0, 0);
  material.emissiveColor = new Color3(0.55, 0.7, 0.95);
  material.disableLighting = true;
  material.fogEnabled = false;
  phone.material = material;
  hand.computeWorldMatrix(true);
  phone.parent = hand;
  const s = hand.absoluteScaling;
  phone.scaling.set(1 / s.x, 1 / s.y, 1 / s.z);
  // No espaço da mão, a posição do dedo médio aponta do pulso para os dedos: o comprimento do celular segue essa linha.
  const along = finger.position.clone();
  phone.position.copyFrom(along.scale(PHONE_ALONG));
  const dir = along.normalize();
  const up = new Vector3(0, 1, 0);
  const axis = Vector3.Cross(up, dir);
  const angle = Math.acos(Math.min(Math.max(Vector3.Dot(up, dir), -1), 1));
  if (axis.lengthSquared() > 1e-8) phone.rotationQuaternion = Quaternion.RotationAxis(axis.normalize(), angle);
  phone.isPickable = false;
  phone.isVisible = false;
  return phone;
}
