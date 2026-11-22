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

const STICK_DEADZONE = 0.35;
const PAD_JUMP = 0;
const PAD_DOWN = 13;
const PAD_LEFT = 14;
const PAD_RIGHT = 15;

export class Input {
  private readonly held = new Set<Action>();
  private readonly pressed = new Set<Action>();
  private readonly heldKeys = new Set<string>();
  private readonly padHeld = new Set<Action>();
  private readonly padPrevious = new Set<Action>();
  private autopilot: number | null = null;

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const action = KEYBOARD_MAP[e.code];
    if (!action) return;
    e.preventDefault();
    if (this.heldKeys.has(e.code)) return;
    this.heldKeys.add(e.code);
    if (!this.isDown(action)) this.pressed.add(action);
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
    this.padHeld.clear();
  };

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  update(): void {
    this.padPrevious.clear();
    this.padHeld.forEach((action) => this.padPrevious.add(action));
    this.padHeld.clear();

    const pads = typeof navigator.getGamepads === "function" ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad || !pad.connected) continue;
      const button = (i: number): boolean => pad.buttons[i]?.pressed ?? false;
      const x = pad.axes[0] ?? 0;
      const y = pad.axes[1] ?? 0;
      if (x < -STICK_DEADZONE || button(PAD_LEFT)) this.padHeld.add("left");
      if (x > STICK_DEADZONE || button(PAD_RIGHT)) this.padHeld.add("right");
      if (y > STICK_DEADZONE || button(PAD_DOWN)) this.padHeld.add("slide");
      if (button(PAD_JUMP)) this.padHeld.add("jump");
    }

    this.padHeld.forEach((action) => {
      if (!this.padPrevious.has(action) && !this.held.has(action)) this.pressed.add(action);
    });
  }

  setAutopilot(axis: number | null): void {
    this.autopilot = axis;
  }

  isDown(action: Action): boolean {
    if (this.autopilot !== null) return false;
    return this.held.has(action) || this.padHeld.has(action);
  }

  wasPressed(action: Action): boolean {
    if (this.autopilot !== null) return false;
    return this.pressed.has(action);
  }

  axisX(): number {
    if (this.autopilot !== null) return this.autopilot;
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
