import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { Scene } from "@babylonjs/core/scene";
import type { HintAction } from "../levels/types";

const KEYBOARD: Record<HintAction, string> = {
  empurrar: "D →",
  deslizar: "S",
  pular: "␣",
};

const GAMEPAD: Record<HintAction, string> = {
  empurrar: "→",
  deslizar: "↓",
  pular: "A",
};

export class HintIcon {
  private readonly element: HTMLDivElement;
  private readonly world = new Vector3();
  private readonly screen = new Vector3();
  private visible = false;

  constructor() {
    this.element = document.createElement("div");
    this.element.className = "dica";
    document.body.appendChild(this.element);
  }

  show(action: HintAction, x: number, y: number): void {
    this.element.textContent = gamepadConnected() ? GAMEPAD[action] : KEYBOARD[action];
    this.world.set(x, y, 0);
    if (!this.visible) this.element.classList.add("visivel");
    this.visible = true;
  }

  hide(): void {
    if (this.visible) this.element.classList.remove("visivel");
    this.visible = false;
  }

  update(scene: Scene, camera: Camera): void {
    if (!this.visible) return;
    const engine = scene.getEngine();
    const width = engine.getRenderWidth();
    const height = engine.getRenderHeight();
    Vector3.ProjectToRef(
      this.world,
      Matrix.IdentityReadOnly,
      scene.getTransformMatrix(),
      camera.viewport.toGlobal(width, height),
      this.screen,
    );
    const scale = engine.getHardwareScalingLevel();
    this.element.style.transform = `translate(${this.screen.x * scale}px, ${this.screen.y * scale}px) translate(-50%, -50%)`;
  }
}

function gamepadConnected(): boolean {
  if (typeof navigator.getGamepads !== "function") return false;
  return navigator.getGamepads().some((pad) => pad?.connected);
}
