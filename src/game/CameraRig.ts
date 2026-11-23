import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import type { Scene } from "@babylonjs/core/scene";

const DISTANCE = 12;
const HEIGHT = 2.5;
const LOOK_HEIGHT = 1.2;
const FOV = 0.7;
const FOLLOW_SHARPNESS = 5;
const VERTICAL_SHARPNESS = 3;
const LOOKAHEAD = 1.5;
const LOOKAHEAD_SHARPNESS = 2;
const FALL_THRESHOLD = 1;
const FOCUS_SHARPNESS = 2.5;
// Perseguição: a câmera abre um pouco, olha mais para a frente e treme quando o segurança encosta.
const CHASE_FOV = 0.8;
const CHASE_LOOKAHEAD = 2.2;
const CHASE_BLEND = 1.5;
const SHAKE_AMPLITUDE = 0.07;
/** Pancada (porta batendo, grade): tremida curta que some sozinha. */
const KICK_DECAY = 5;

export interface CameraTarget {
  x: number;
  feetY: number;
  grounded: boolean;
  facing: number;
}

export interface CameraBounds {
  minX: number;
  maxX: number;
}

export class CameraRig {
  readonly camera: FreeCamera;
  private readonly bounds: CameraBounds;
  private readonly lookTarget = new Vector3();
  private x: number;
  private y: number;
  private groundY: number;
  private lookahead = 0;
  private focusX = 0;
  private focusTimer = 0;
  private chase = 0;
  private chaseTarget = 0;
  private shake = 0;
  private kick = 0;
  private time = 0;

  constructor(scene: Scene, start: { x: number; feetY: number }, bounds: CameraBounds) {
    this.bounds = bounds;
    this.x = start.x;
    this.y = start.feetY;
    this.groundY = start.feetY;
    this.camera = new FreeCamera("camera", new Vector3(), scene);
    this.camera.fov = FOV;
    this.apply();
  }

  snap(x: number, feetY: number): void {
    this.x = x;
    this.y = feetY;
    this.groundY = feetY;
    this.lookahead = 0;
    this.apply();
  }

  /** Desloca a câmera junto com o jogador (corredor que se repete), sem suavização. */
  shift(dx: number): void {
    this.x += dx;
    this.apply();
  }

  focus(x: number, seconds: number): void {
    this.focusX = x;
    this.focusTimer = seconds;
  }

  /** Perseguição em andamento (`on`) e quanto o segurança está perto (0 longe, 1 encostando). */
  setChase(on: boolean, near: number): void {
    this.chaseTarget = on ? 1 : 0;
    this.shake = on ? Math.min(Math.max(near, 0), 1) : 0;
  }

  /** Uma pancada: a câmera treme forte e acalma em meio segundo. */
  punch(strength = 1): void {
    this.kick = Math.max(this.kick, strength);
  }

  get focusing(): boolean {
    return this.focusTimer > 0;
  }

  update(dt: number, target: CameraTarget): void {
    this.time += dt;
    this.chase += (this.chaseTarget - this.chase) * smoothing(CHASE_BLEND, dt);
    this.kick = Math.max(0, this.kick - this.kick * KICK_DECAY * dt - dt * 0.05);
    this.camera.fov = FOV + (CHASE_FOV - FOV) * this.chase;
    if (this.focusTimer > 0) {
      this.focusTimer -= dt;
      this.x += (this.focusX - this.x) * smoothing(FOCUS_SHARPNESS, dt);
      this.apply();
      return;
    }
    if (target.grounded || target.feetY < this.groundY - FALL_THRESHOLD) {
      this.groundY = target.feetY;
    }
    const ahead = LOOKAHEAD + (CHASE_LOOKAHEAD - LOOKAHEAD) * this.chase;
    this.lookahead += (target.facing * ahead - this.lookahead) * smoothing(LOOKAHEAD_SHARPNESS, dt);
    this.x += (target.x + this.lookahead - this.x) * smoothing(FOLLOW_SHARPNESS, dt);
    this.y += (this.groundY - this.y) * smoothing(VERTICAL_SHARPNESS, dt);
    this.apply();
  }

  private apply(): void {
    const x = this.clampX(this.x);
    // Tremida: duas senoides fora de fase (não repete) para a perseguição e para as pancadas.
    const amount = SHAKE_AMPLITUDE * (this.shake * this.shake * this.chase + this.kick * 2.5);
    const t = this.time;
    const sx = amount * (Math.sin(t * 31) * 0.6 + Math.sin(t * 53 + 1.7) * 0.4);
    const sy = amount * (Math.sin(t * 37 + 0.4) * 0.6 + Math.sin(t * 61 + 2.3) * 0.4);
    this.camera.position.set(x + sx, this.y + HEIGHT + sy, -DISTANCE);
    this.lookTarget.set(x + sx * 0.5, this.y + LOOK_HEIGHT + sy * 0.5, 0);
    this.camera.setTarget(this.lookTarget);
  }

  private clampX(x: number): number {
    const engine = this.camera.getScene().getEngine();
    const aspect = engine.getAspectRatio(this.camera);
    const halfWidth = DISTANCE * Math.tan(this.camera.fov / 2) * aspect;
    const min = this.bounds.minX + halfWidth;
    const max = this.bounds.maxX - halfWidth;
    if (min > max) return (this.bounds.minX + this.bounds.maxX) / 2;
    return Math.min(Math.max(x, min), max);
  }
}

function smoothing(sharpness: number, dt: number): number {
  return 1 - Math.exp(-sharpness * dt);
}
