import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import {
  CharacterSupportedState,
  PhysicsCharacterController,
} from "@babylonjs/core/Physics/v2/characterController";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Scene } from "@babylonjs/core/scene";
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
const CAPSULE_HEIGHT = 1.0;
const CAPSULE_RADIUS = 0.4;
const VISUAL_SIZE = 0.8;

const JUMP_SPEED = Math.sqrt(2 * -GRAVITY.y * JUMP_HEIGHT);
const DOWN = new Vector3(0, -1, 0);

export class Player {
  readonly mesh: Mesh;
  private readonly controller: PhysicsCharacterController;
  private readonly velocity = new Vector3();
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private grounded = false;

  constructor(scene: Scene, spawn: { x: number; y: number }) {
    this.mesh = CreateBox("player", { size: VISUAL_SIZE }, scene);
    const material = new StandardMaterial("player-mat", scene);
    material.diffuseColor = new Color3(0.12, 0.12, 0.14);
    material.specularColor = Color3.Black();
    this.mesh.material = material;

    const start = new Vector3(spawn.x, spawn.y, 0);
    this.controller = new PhysicsCharacterController(
      start,
      { capsuleHeight: CAPSULE_HEIGHT, capsuleRadius: CAPSULE_RADIUS },
      scene,
    );
    this.mesh.position.copyFrom(start);
  }

  get position(): Vector3 {
    return this.mesh.position;
  }

  update(dt: number, input: Input): void {
    if (dt <= 0) return;

    const support = this.controller.checkSupport(dt, DOWN);
    this.grounded = support.supportedState === CharacterSupportedState.SUPPORTED;

    this.coyoteTimer = this.grounded ? COYOTE_TIME : Math.max(0, this.coyoteTimer - dt);
    this.jumpBufferTimer = input.wasPressed("jump")
      ? JUMP_BUFFER
      : Math.max(0, this.jumpBufferTimer - dt);

    const current = this.controller.getVelocity();
    const targetX = input.axisX() * MOVE_SPEED;
    const accel = this.grounded ? (targetX !== 0 ? GROUND_ACCEL : GROUND_DECEL) : AIR_ACCEL;
    this.velocity.x = approach(current.x, targetX, accel * dt);

    if (this.grounded && current.y <= 0) {
      this.velocity.y = 0;
    } else {
      this.velocity.y = Math.max(current.y + GRAVITY.y * dt, -MAX_FALL_SPEED);
    }

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.velocity.y = JUMP_SPEED;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
    }

    this.velocity.z = 0;
    this.controller.setVelocity(this.velocity);
    this.controller.integrate(dt, support, GRAVITY);

    const pos = this.controller.getPosition();
    if (Math.abs(pos.z) > 0.001) {
      pos.z = 0;
      this.controller.setPosition(pos);
    }
    this.mesh.position.set(pos.x, pos.y - (CAPSULE_HEIGHT - VISUAL_SIZE) / 2, 0);
  }
}

function approach(value: number, target: number, maxDelta: number): number {
  if (value < target) return Math.min(value + maxDelta, target);
  return Math.max(value - maxDelta, target);
}
