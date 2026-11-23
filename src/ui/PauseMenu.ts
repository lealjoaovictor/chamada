import type { Sfx, VolumeChannel } from "../game/Sfx";

const CONTROLES: [string, string][] = [
  ["A / D ou ← / →", "andar"],
  ["Espaço", "pular"],
  ["S ou ↓ (correndo)", "deslizar"],
  ["ande contra a caixa", "empurrar"],
  ["Esc ou P", "pausar"],
  ["controle", "analógico anda, A pula, ↓ desliza, Start pausa"],
];

const VOLUMES: [VolumeChannel, string][] = [
  ["geral", "volume geral"],
  ["musica", "música"],
  ["vozes", "vozes e ligação"],
  ["efeitos", "efeitos"],
];

export interface PauseActions {
  resume(): void;
  checkpoint(): void;
  restart(): void;
}

/** Menu de pausa: continuar, voltar ao último checkpoint, recomeçar, volumes e controles. */
export class PauseMenu {
  private readonly root = document.createElement("div");
  private readonly buttons: HTMLButtonElement[] = [];
  private openState = false;

  constructor(sfx: Sfx, actions: PauseActions) {
    this.root.className = "pausa";
    const panel = document.createElement("div");
    panel.className = "pausa-painel";
    const title = document.createElement("div");
    title.className = "pausa-titulo";
    title.textContent = "pausa";
    panel.append(title);

    const options = document.createElement("div");
    options.className = "pausa-opcoes";
    for (const [label, action] of [
      ["continuar", actions.resume],
      ["voltar ao último checkpoint", actions.checkpoint],
      ["recomeçar do início", actions.restart],
    ] as const) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => action());
      this.buttons.push(button);
      options.append(button);
    }
    panel.append(options);

    const volumes = document.createElement("div");
    volumes.className = "pausa-volumes";
    for (const [channel, label] of VOLUMES) {
      const row = document.createElement("label");
      const name = document.createElement("span");
      name.textContent = label;
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "100";
      slider.value = String(Math.round(sfx.volume(channel) * 100));
      slider.addEventListener("input", () => sfx.setVolume(channel, Number(slider.value) / 100));
      row.append(name, slider);
      volumes.append(row);
    }
    panel.append(volumes);

    const controls = document.createElement("div");
    controls.className = "pausa-controles";
    for (const [keys, what] of CONTROLES) {
      const k = document.createElement("b");
      k.textContent = keys;
      const w = document.createElement("span");
      w.textContent = what;
      controls.append(k, w);
    }
    panel.append(controls);

    this.root.append(panel);
    // O clique no menu não pode virar gesto nem "qualquer botão" do jogo.
    for (const type of ["pointerdown", "pointerup", "pointermove"] as const) {
      this.root.addEventListener(type, (e) => e.stopPropagation());
    }
    this.root.addEventListener("keydown", (e) => this.onKey(e));
    document.body.append(this.root);
  }

  get isOpen(): boolean {
    return this.openState;
  }

  open(): void {
    this.openState = true;
    this.root.classList.add("visivel");
    document.body.style.cursor = "";
    this.buttons[0]?.focus();
  }

  close(): void {
    this.openState = false;
    this.root.classList.remove("visivel");
    (document.activeElement as HTMLElement | null)?.blur();
  }

  /** Setas sobem e descem entre as opções; Enter (do próprio botão) escolhe. */
  private onKey(e: KeyboardEvent): void {
    const focused = this.buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (focused < 0) return;
    const step = e.code === "ArrowDown" || e.code === "KeyS" ? 1 : e.code === "ArrowUp" || e.code === "KeyW" ? -1 : 0;
    if (step !== 0) {
      e.preventDefault();
      e.stopPropagation();
      this.buttons[(focused + step + this.buttons.length) % this.buttons.length].focus();
    } else if (e.code === "Space") {
      // Espaço é "pular" no jogo (e o jogo cancela o padrão); aqui ele escolhe a opção.
      e.preventDefault();
      e.stopPropagation();
      this.buttons[focused].click();
    }
  }
}

/** Botão de pausa para quem joga no celular (sem tecla Esc). */
export function pauseButton(onPress: () => void): HTMLDivElement {
  const button = document.createElement("div");
  button.className = "pausa-botao";
  button.textContent = "II";
  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onPress();
  });
  document.body.append(button);
  return button;
}
