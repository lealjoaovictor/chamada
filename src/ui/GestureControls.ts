import type { Input } from "../game/Input";

// Controle por gestos, como no INSIDE: sem botões na tela.
// Metade esquerda: encostar e arrastar para os lados anda (um analógico invisível que acompanha o dedo).
// Metade direita: deslizar o dedo para cima pula, para baixo desliza.

const MOVE_DEADZONE = 14;
const MOVE_FOLLOW = 70;
const SWIPE_DISTANCE = 28;
const SWIPE_MAX_TIME = 450;
const JUMP_HOLD_MS = 140;

interface MoveTouch {
  id: number;
  originX: number;
}

interface ActionTouch {
  id: number;
  x: number;
  y: number;
  time: number;
  fired: "jump" | "slide" | null;
}

export class GestureControls {
  private move: MoveTouch | null = null;
  private readonly actions = new Map<number, ActionTouch>();
  private readonly ring: HTMLDivElement;
  private readonly input: Input;

  constructor(input: Input) {
    this.input = input;
    this.ring = document.createElement("div");
    this.ring.className = "gesto-anel";
    document.body.append(this.ring);
    const opts = { passive: false } as const;
    window.addEventListener("pointerdown", (e) => this.down(e), opts);
    window.addEventListener("pointermove", (e) => this.moveTo(e), opts);
    window.addEventListener("pointerup", (e) => this.up(e));
    window.addEventListener("pointercancel", (e) => this.up(e));
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private down(e: PointerEvent): void {
    if (e.pointerType === "mouse") return;
    e.preventDefault();
    if (e.clientX < window.innerWidth / 2) {
      if (this.move) return;
      this.move = { id: e.pointerId, originX: e.clientX };
      this.showRing(e.clientX, e.clientY);
    } else {
      this.actions.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY, time: performance.now(), fired: null });
    }
  }

  private moveTo(e: PointerEvent): void {
    if (this.move && e.pointerId === this.move.id) {
      e.preventDefault();
      let dx = e.clientX - this.move.originX;
      // A origem acompanha o dedo: inverter a direção responde na hora.
      if (Math.abs(dx) > MOVE_FOLLOW) {
        this.move.originX = e.clientX - Math.sign(dx) * MOVE_FOLLOW;
        dx = Math.sign(dx) * MOVE_FOLLOW;
      }
      this.input.setTouch("right", dx > MOVE_DEADZONE);
      this.input.setTouch("left", dx < -MOVE_DEADZONE);
      this.ring.style.transform = `translate(${this.move.originX}px, ${e.clientY}px)`;
      return;
    }
    const touch = this.actions.get(e.pointerId);
    if (!touch || touch.fired) return;
    e.preventDefault();
    const dy = e.clientY - touch.y;
    const dx = e.clientX - touch.x;
    if (performance.now() - touch.time > SWIPE_MAX_TIME) {
      touch.time = performance.now();
      touch.x = e.clientX;
      touch.y = e.clientY;
      return;
    }
    if (Math.abs(dy) < SWIPE_DISTANCE || Math.abs(dy) < Math.abs(dx)) return;
    if (dy < 0) {
      touch.fired = "jump";
      this.input.setTouch("jump", true);
      window.setTimeout(() => this.input.setTouch("jump", false), JUMP_HOLD_MS);
    } else {
      touch.fired = "slide";
      this.input.setTouch("slide", true);
    }
  }

  private up(e: PointerEvent): void {
    if (this.move && e.pointerId === this.move.id) {
      this.move = null;
      this.input.setTouch("left", false);
      this.input.setTouch("right", false);
      this.ring.classList.remove("visivel");
      return;
    }
    const touch = this.actions.get(e.pointerId);
    if (!touch) return;
    this.actions.delete(e.pointerId);
    if (touch.fired === "slide") this.input.setTouch("slide", false);
  }

  private showRing(x: number, y: number): void {
    this.ring.style.transform = `translate(${x}px, ${y}px)`;
    this.ring.classList.add("visivel");
  }
}
