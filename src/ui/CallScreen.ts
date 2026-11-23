// A tela da ligação: um card no canto inferior direito, no jeito de uma notificação de chamada do sistema. Mostra quem está na linha, o sinal,
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

  private readonly avatar: HTMLDivElement;
  private readonly status: HTMLDivElement;

  constructor(contato: string) {
    this.root = document.createElement("div");
    this.root.className = "ligacao";
    // Foto do contato (a inicial num círculo) com o selo verde de telefone, como uma notificação do sistema.
    this.avatar = document.createElement("div");
    this.avatar.className = "lig-avatar";
    const badge = document.createElement("span");
    badge.className = "lig-selo";
    badge.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';
    const avatarWrap = document.createElement("div");
    avatarWrap.className = "lig-foto";
    avatarWrap.append(this.avatar, badge);

    const body = document.createElement("div");
    body.className = "lig-corpo";
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
    this.contact = name;
    top.append(name, signal);
    this.status = document.createElement("div");
    this.status.className = "lig-status";
    this.status.textContent = "Em ligação";
    this.colegaLine = document.createElement("div");
    this.colegaLine.className = "lig-colega";
    this.professorLine = document.createElement("div");
    this.professorLine.className = "lig-prof";
    body.append(top, this.status, this.colegaLine, this.professorLine);
    this.root.append(avatarWrap, body);
    document.body.appendChild(this.root);
    this.setContact(contato);
  }

  setContact(contato: string): void {
    this.contact.textContent = contato;
    this.avatar.textContent = contato.trim().charAt(0).toUpperCase();
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
    this.status.classList.add("oculto");
    window.clearTimeout(this.colegaTimer);
    this.colegaTimer = window.setTimeout(() => {
      this.colegaLine.classList.remove("visivel");
      this.status.classList.remove("oculto");
    }, seconds * 1000);
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
