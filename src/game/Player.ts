import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";
import {
  CharacterSupportedState,
  PhysicsCharacterController,
} from "@babylonjs/core/Physics/v2/characterController";
import type { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/loaders/glTF";
import type { Input } from "./Input";
import { GRAVITY } from "./Physics";

const MOVE_SPEED = 4.5;
const GROUND_ACCEL = 45;
const GROUND_DECEL = 60;
const AIR_ACCEL = 25;
const JUMP_HEIGHT = 1.4;
const COYOTE_TIME = 0.1;
const JUMP_BUFFER = 0.1;
const MAX_FALL_SPEED = 20;
export const CAPSULE_HEIGHT = 1.7;
export const CAPSULE_RADIUS = 0.3;

const MODEL_URL = `${import.meta.env.BASE_URL}models/personagem.glb`;
const MODEL_COLOR = new Color3(0.06, 0.06, 0.07);
const TURN_SPEED = 14;
const BLEND_TIME = 0.15;
const WALK_CLIP_SPEED = 5.3;
const JUMP_CLIP_DURATION = 2.2;
const JUMP_AIR_START = 0.7;
const JUMP_AIR_END = 1.3;
const FALL_CLIP_START = 1.1;

const JUMP_SPEED = Math.sqrt(2 * -GRAVITY.y * JUMP_HEIGHT);
const AIR_TIME = (2 * JUMP_SPEED) / -GRAVITY.y;
const DOWN = new Vector3(0, -1, 0);

type AnimName = "parado" | "andar" | "pular" | "empurrar" | "deslizar";

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

  private constructor(
    scene: Scene,
    spawn: { x: number; y: number },
    visual: TransformNode,
    anims: Map<AnimName, AnimationGroup>,
  ) {
    this.visual = visual;
    this.anims = anims;
    this.position.set(spawn.x, spawn.y, 0);
    this.controller = new PhysicsCharacterController(
      this.position.clone(),
      { capsuleHeight: CAPSULE_HEIGHT, capsuleRadius: CAPSULE_RADIUS },
      scene,
    );
    for (const [name, group] of anims) {
      if (name !== "pular") group.start(true);
      group.weight = name === this.current ? 1 : 0;
    }
    this.syncVisual(0);
  }

  static async create(scene: Scene, spawn: { x: number; y: number }): Promise<Player> {
    const result = await ImportMeshAsync(MODEL_URL, scene);
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
    return new Player(scene, spawn, visual, anims);
  }

  get isGrounded(): boolean {
    return this.grounded;
  }

  get facingDirection(): number {
    return this.facing;
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
    const axis = input.axisX();
    if (axis !== 0) this.facing = axis;
    const targetX = axis * MOVE_SPEED;
    const accel = this.grounded ? (targetX !== 0 ? GROUND_ACCEL : GROUND_DECEL) : AIR_ACCEL;
    this.velocity.x = approach(current.x, targetX, accel * dt);

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

    this.updateAnimation(dt, jumped, pushing);
    this.syncVisual(dt);
  }

  private updateAnimation(dt: number, jumped: boolean, pushing: boolean): void {
    const speedX = Math.abs(this.velocity.x);
    let next: AnimName;
    if (jumped || !this.grounded) next = "pular";
    else if (pushing) next = "empurrar";
    else if (speedX > 0.2) next = "andar";
    else next = "parado";

    if (next === "pular" && (jumped || this.current !== "pular")) {
      this.playJump(jumped);
    }
    this.current = next;

    const walk = this.anims.get("andar");
    if (walk) walk.speedRatio = Math.max(speedX / WALK_CLIP_SPEED, 0.5);

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

  private syncVisual(dt: number): void {
    const targetYaw = this.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
    const t = dt > 0 ? 1 - Math.exp(-TURN_SPEED * dt) : 1;
    this.yaw += (targetYaw - this.yaw) * t;
    this.visual.rotation.y = this.yaw;
    this.visual.position.set(this.position.x, this.position.y - CAPSULE_HEIGHT / 2, 0);
  }
}

function approach(value: number, target: number, maxDelta: number): number {
  if (value < target) return Math.min(value + maxDelta, target);
  return Math.max(value - maxDelta, target);
}
