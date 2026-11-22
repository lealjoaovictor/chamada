import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import type { Scene } from "@babylonjs/core/scene";

const DISTANCE = 12;
const HEIGHT = 2.5;
const LOOK_HEIGHT = 1.2;
const FOLLOW_SHARPNESS = 5;

export class CameraRig {
  readonly camera: FreeCamera;
  private x: number;

  constructor(scene: Scene, startX: number) {
    this.x = startX;
    this.camera = new FreeCamera("camera", new Vector3(startX, HEIGHT, -DISTANCE), scene);
    this.camera.fov = 0.7;
    this.camera.setTarget(new Vector3(startX, LOOK_HEIGHT, 0));
  }

  snap(x: number): void {
    this.x = x;
    this.camera.position.x = x;
  }

  update(dt: number, targetX: number): void {
    const t = 1 - Math.exp(-FOLLOW_SHARPNESS * dt);
    this.x += (targetX - this.x) * t;
    this.camera.position.x = this.x;
  }
}
