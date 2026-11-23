// A tela da ligação: o celular do Zacarias, pequeno num canto. Mostra quem está na linha, o sinal,
// a legenda curta do colega e o nome que o professor está lendo (acessibilidade para quem joga sem som).
// Não é barra de tempo: só repete o que se ouve.
export class CallScreen {
  private readonly root: HTMLDivElement;
  private readonly bars: HTMLSpanElement[] = [];
  private readonly colegaLine: HTMLDivElement;
  private readonly professorLine: HTMLDivElement;
  private colegaTimer = 0;
  private professorTimer = 0;
  private signal = -1;
  private readonly contact: HTMLSpanElement;

  constructor(contato: string) {
    this.root = document.createElement("div");
    this.root.className = "ligacao";
    const top = document.createElement("div");
    top.className = "lig-topo";
    const signal = document.createElement("span");
    signal.className = "lig-sinal";
    for (let i = 0; i < 4; i++) {
      const bar = document.createElement("span");
      bar.style.height = `${4 + i * 3}px`;
      signal.append(bar);
      this.bars.push(bar);
    }
    const name = document.createElement("span");
    name.className = "lig-nome";
    name.textContent = contato;
    this.contact = name;
    const dot = document.createElement("span");
    dot.className = "lig-ponto";
    top.append(dot, name, signal);
    this.colegaLine = document.createElement("div");
    this.colegaLine.className = "lig-colega";
    this.professorLine = document.createElement("div");
    this.professorLine.className = "lig-prof";
    this.root.append(top, this.colegaLine, this.professorLine);
    document.body.appendChild(this.root);
  }

  setContact(contato: string): void {
    this.contact.textContent = contato;
  }

  show(): void {
    this.root.classList.add("visivel");
  }

  hide(): void {
    this.root.classList.remove("visivel");
  }

  /** Fala do colega, por alguns segundos. */
  colega(text: string, seconds: number): void {
    this.colegaLine.textContent = text;
    this.colegaLine.classList.add("visivel");
    window.clearTimeout(this.colegaTimer);
    this.colegaTimer = window.setTimeout(() => this.colegaLine.classList.remove("visivel"), seconds * 1000);
  }

  /** O que o professor está dizendo (o nome lido, "presente", "falta"); some depois de um tempo sem nada novo. */
  professor(text: string): void {
    this.professorLine.textContent = text;
    this.professorLine.classList.add("visivel");
    window.clearTimeout(this.professorTimer);
    this.professorTimer = window.setTimeout(() => this.professorLine.classList.remove("visivel"), 9000);
  }

  /** Força do sinal, de 0 a 1 (no subsolo, picota). */
  setSignal(level: number): void {
    const count = Math.round(Math.max(0, Math.min(1, level)) * 4);
    if (count === this.signal) return;
    this.signal = count;
    this.bars.forEach((bar, i) => bar.classList.toggle("on", i < count));
  }
}
