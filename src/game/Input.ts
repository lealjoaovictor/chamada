export type Action = "left" | "right" | "jump" | "slide";

const KEYBOARD_MAP: Record<string, Action> = {
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "jump",
  KeyS: "slide",
  ArrowDown: "slide",
};

export class Input {
  private readonly held = new Set<Action>();
  private readonly pressed = new Set<Action>();
  private readonly heldKeys = new Set<string>();

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const action = KEYBOARD_MAP[e.code];
    if (!action) return;
    e.preventDefault();
    if (this.heldKeys.has(e.code)) return;
    this.heldKeys.add(e.code);
    if (!this.held.has(action)) this.pressed.add(action);
    this.held.add(action);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    const action = KEYBOARD_MAP[e.code];
    if (!action) return;
    this.heldKeys.delete(e.code);
    const stillHeld = [...this.heldKeys].some((code) => KEYBOARD_MAP[code] === action);
    if (!stillHeld) this.held.delete(action);
  };

  private readonly onBlur = (): void => {
    this.heldKeys.clear();
    this.held.clear();
    this.pressed.clear();
  };

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  isDown(action: Action): boolean {
    return this.held.has(action);
  }

  wasPressed(action: Action): boolean {
    return this.pressed.has(action);
  }

  axisX(): number {
    return (this.isDown("right") ? 1 : 0) - (this.isDown("left") ? 1 : 0);
  }

  endFrame(): void {
    this.pressed.clear();
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
  }
}
