import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
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
import type { Input } from "./Input";
import { GRAVITY } from "./Physics";
import { TUNING } from "./Tuning";
import { MODEL_OPTIONS, modelFile } from "./modelFile";
import { HandIK, type HandTarget } from "./HandIK";

const MOVE_SPEED = 4.5;
const PUSH_SPEED = 1.2;
const PUSH_ANIM_RATIO = 1.5;
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
const MODEL_COLOR = new Color3(0.06, 0.06, 0.07);
const TURN_SPEED = 14;
const BLEND_TIME = 0.15;
const WALK_CLIP_SPEED = 5.3;
// Velocidade (m/s) em que os pés do "Crouched Walking" não escorregam, medida pela passada do clipe.
const CROUCH_WALK_CLIP_SPEED = 2.25;
const JUMP_CLIP_DURATION = 2.2;
const JUMP_AIR_START = 0.7;
const JUMP_AIR_END = 1.3;
const FALL_CLIP_START = 1.1;
const SLIDE_CLIP_DURATION = 1.57;
const SLIDE_CLIP_START = 0.15;
const SLIDE_CLIP_LOW = 0.75;

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

const JUMP_SPEED = Math.sqrt(2 * -GRAVITY.y * JUMP_HEIGHT);
const AIR_TIME = (2 * JUMP_SPEED) / -GRAVITY.y;
const DOWN = new Vector3(0, -1, 0);

type AnimName =
  | "parado"
  | "andar"
  | "pular"
  | "empurrar"
  | "deslizar"
  | "agachado"
  | "agachado_andar";

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
  private readonly scene: Scene;
  private readonly ray = new PhysicsRaycastResult();
  meshes: AbstractMesh[] = [];
  private readonly rayFrom = new Vector3();
  private readonly rayTo = new Vector3();
  private crouchWanted = false;
  private crouch = 0;
  private ik: HandIK | null = null;
  private grip: HandTarget | null = null;
  private brace: HandTarget | null = null;
  private lean = 0;
  private pushBack = 0;
  private leanSpeed = 0;

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
    const material = new StandardMaterial("player-mat", scene);
    material.diffuseColor = MODEL_COLOR;
    material.specularColor = Color3.Black();
    for (const mesh of result.meshes) {
      if (!mesh.parent) mesh.parent = visual;
      if (mesh.material) {
        mesh.material.dispose();
        mesh.material = material;
      }
    }
    const anims = new Map<AnimName, AnimationGroup>();
    for (const group of result.animationGroups) {
      group.stop();
      anims.set(group.name as AnimName, group);
    }
    const player = new Player(scene, spawn, visual, anims);
    player.meshes = result.meshes;
    player.ik = HandIK.create(result.transformNodes);
    return player;
  }

  get feetY(): number {
    return this.position.y - this.height / 2;
  }

  placeVisual(x: number, y: number): void {
    this.visual.position.set(x, y, 0);
  }

  get isSliding(): boolean {
    return this.sliding;
  }

  get isGrounded(): boolean {
    return this.grounded;
  }

  /** 0 = em pé, 1 = totalmente agachado. */
  get crouchAmount(): number {
    return this.crouch;
  }

  setCrouch(on: boolean): void {
    this.crouchWanted = on;
  }

  get facingDirection(): number {
    return this.facing;
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
      if (shouldEnd && this.canStand()) this.endSlide();
      else if (wantsJump) this.jumpBufferTimer = 0;
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
      const walkSpeed = MOVE_SPEED + (TUNING.agachadoVelocidade - MOVE_SPEED) * this.crouch;
      const targetX = axis * (pushing && this.grounded ? PUSH_SPEED : walkSpeed);
      const accel = this.grounded ? (targetX !== 0 ? GROUND_ACCEL : GROUND_DECEL) : AIR_ACCEL;
      this.velocity.x = approach(current.x, targetX, accel * dt);
    }

    if (this.grounded && current.y <= 0) {
      this.velocity.y = 0;
    } else {
      this.velocity.y = Math.max(current.y + GRAVITY.y * dt, -MAX_FALL_SPEED);
    }

    let jumped = false;
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.velocity.y = JUMP_SPEED;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      jumped = true;
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
    this.syncVisual(dt);
    this.ik?.apply(dt, pushingNow && this.grip ? this.grip : this.brace);
  }

  /** Andando contra uma parede: mãos na parede e um leve balanço do corpo, mais forte quanto mais rápido. */
  private updateBrace(dt: number, axis: number, pushing: boolean, speedBefore: number): void {
    const wasBracing = this.brace !== null;
    this.brace = null;
    if (axis !== 0 && axis === this.facing && this.grounded && !this.sliding && !pushing && this.crouch < 0.3) {
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
    this.facing = 1;
    this.crouch = 0;
    this.grip = null;
    this.brace = null;
    this.lean = 0;
    this.leanSpeed = 0;
    this.pushBack = 0;
    this.current = "parado";
    for (const [name, group] of this.anims) group.weight = name === "parado" ? 1 : 0;
    this.syncVisual(0);
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
    let next: AnimName;
    if (this.sliding) next = "deslizar";
    else if (jumped || !this.grounded) next = "pular";
    else if (pushing) next = "empurrar";
    else if (speedX > 0.2) next = crouched ? "agachado_andar" : "andar";
    else next = crouched ? "agachado" : "parado";

    if (next === "pular" && (jumped || this.current !== "pular")) {
      this.playJump(jumped);
    }
    this.current = next;

    const walk = this.anims.get("andar");
    if (walk) walk.speedRatio = Math.max(speedX / WALK_CLIP_SPEED, 0.5);
    const crouchWalk = this.anims.get("agachado_andar");
    if (crouchWalk) crouchWalk.speedRatio = Math.max(speedX / CROUCH_WALK_CLIP_SPEED, 0.5);
    const push = this.anims.get("empurrar");
    if (push) push.speedRatio = PUSH_ANIM_RATIO;

    const step = dt / BLEND_TIME;
    for (const [name, group] of this.anims) {
      const target = name === this.current ? 1 : 0;
      group.weight = approach(group.weight, target, step);
    }
  }

  private playJump(fromGround: boolean): void {
    const group = this.anims.get("pular");
    if (!group) return;
    const toFrame = (t: number): number =>
      group.from + (t / JUMP_CLIP_DURATION) * (group.to - group.from);
    const start = fromGround ? JUMP_AIR_START : FALL_CLIP_START;
    const ratio = (JUMP_AIR_END - JUMP_AIR_START) / AIR_TIME;
    group.start(false, ratio, toFrame(start), toFrame(JUMP_AIR_END));
  }

  private playSlide(): void {
    const group = this.anims.get("deslizar");
    if (!group) return;
    const toFrame = (t: number): number =>
      group.from + (t / SLIDE_CLIP_DURATION) * (group.to - group.from);
    const ratio = (SLIDE_CLIP_LOW - SLIDE_CLIP_START) / SLIDE_TIME;
    group.start(false, ratio, toFrame(SLIDE_CLIP_START), toFrame(SLIDE_CLIP_LOW));
  }

  private syncVisual(dt: number): void {
    const targetYaw = this.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
    const t = dt > 0 ? 1 - Math.exp(-TURN_SPEED * dt) : 1;
    this.yaw += (targetYaw - this.yaw) * t;
    this.visual.rotation.y = this.yaw;
    this.visual.rotation.x = this.lean;
    this.visual.position.set(this.position.x - this.facing * this.pushBack, this.position.y - this.height / 2, 0);
  }
}

function approach(value: number, target: number, maxDelta: number): number {
  if (value < target) return Math.min(value + maxDelta, target);
  return Math.max(value - maxDelta, target);
}
