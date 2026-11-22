import { CREDITOS } from "./creditos";

const CONTROLES = "A / D andar · ESPAÇO pular · S deslizar (correndo) · ande contra a caixa para empurrar · controle: analógico, A pula, ↓ desliza";

function element(className: string, text?: string): HTMLDivElement {
  const div = document.createElement("div");
  div.className = className;
  if (text) div.textContent = text;
  return div;
}

class Screen {
  protected readonly root: HTMLDivElement;

  constructor(className: string) {
    this.root = element(`tela ${className}`);
    document.body.appendChild(this.root);
  }

  show(): void {
    this.root.classList.add("visivel");
  }

  hide(): void {
    this.root.classList.remove("visivel");
  }
}

export class MenuScreen extends Screen {
  constructor() {
    super("menu");
    this.root.append(
      element("titulo", "chamada"),
      element("aperte", "pressione qualquer botão"),
      element("controles", CONTROLES),
    );
  }
}

export class EndScreen extends Screen {
  constructor() {
    super("fim");
    const credits = element("creditos");
    for (const line of CREDITOS) credits.append(line ? element("", line) : document.createElement("br"));
    this.root.append(
      element("titulo", "chamada"),
      credits,
      element("aperte", "pressione qualquer botão para recomeçar"),
    );
  }
}

export class LateScreen extends Screen {
  constructor() {
    super("fim");
    this.root.append(element("titulo", "chamada"), element("aperte", "pressione qualquer botão para recomeçar"));
  }
}
