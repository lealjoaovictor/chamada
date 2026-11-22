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

  get focusing(): boolean {
    return this.focusTimer > 0;
  }

  update(dt: number, target: CameraTarget): void {
    if (this.focusTimer > 0) {
      this.focusTimer -= dt;
      this.x += (this.focusX - this.x) * smoothing(FOCUS_SHARPNESS, dt);
      this.apply();
      return;
    }
    if (target.grounded || target.feetY < this.groundY - FALL_THRESHOLD) {
      this.groundY = target.feetY;
    }
    this.lookahead += (target.facing * LOOKAHEAD - this.lookahead) * smoothing(LOOKAHEAD_SHARPNESS, dt);
    this.x += (target.x + this.lookahead - this.x) * smoothing(FOLLOW_SHARPNESS, dt);
    this.y += (this.groundY - this.y) * smoothing(VERTICAL_SHARPNESS, dt);
    this.apply();
  }

  private apply(): void {
    const x = this.clampX(this.x);
    this.camera.position.set(x, this.y + HEIGHT, -DISTANCE);
    this.lookTarget.set(x, this.y + LOOK_HEIGHT, 0);
    this.camera.setTarget(this.lookTarget);
  }

  private clampX(x: number): number {
    const engine = this.camera.getScene().getEngine();
    const aspect = engine.getAspectRatio(this.camera);
    const halfWidth = DISTANCE * Math.tan(FOV / 2) * aspect;
    const min = this.bounds.minX + halfWidth;
    const max = this.bounds.maxX - halfWidth;
    if (min > max) return (this.bounds.minX + this.bounds.maxX) / 2;
    return Math.min(Math.max(x, min), max);
  }
}

function smoothing(sharpness: number, dt: number): number {
  return 1 - Math.exp(-sharpness * dt);
}
