import type { Action, Input } from "../game/Input";

const BUTTONS: { action: Action; icon: string; side: "esquerda" | "direita" }[] = [
  { action: "left", icon: "◀", side: "esquerda" },
  { action: "right", icon: "▶", side: "esquerda" },
  { action: "slide", icon: "▼", side: "direita" },
  { action: "jump", icon: "▲", side: "direita" },
];

export function touchControlsEnabled(): boolean {
  return import.meta.env.VITE_TOQUE === "1" || new URLSearchParams(location.search).get("toque") === "1";
}

export class TouchControls {
  constructor(input: Input) {
    const root = document.createElement("div");
    root.className = "toque";
    for (const side of ["esquerda", "direita"] as const) {
      const group = document.createElement("div");
      group.className = `toque-grupo ${side}`;
      for (const button of BUTTONS.filter((b) => b.side === side)) {
        const el = document.createElement("div");
        el.className = "toque-botao";
        el.textContent = button.icon;
        const pointers = new Set<number>();
        const release = (e: PointerEvent): void => {
          if (!pointers.delete(e.pointerId)) return;
          if (pointers.size === 0) {
            el.classList.remove("ativo");
            input.setTouch(button.action, false);
          }
        };
        el.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          el.setPointerCapture(e.pointerId);
          pointers.add(e.pointerId);
          el.classList.add("ativo");
          input.setTouch(button.action, true);
        });
        el.addEventListener("pointerup", release);
        el.addEventListener("pointercancel", release);
        el.addEventListener("lostpointercapture", release);
        group.append(el);
      }
      root.append(group);
    }
    document.body.append(root);
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  }
}
