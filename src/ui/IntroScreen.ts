// Introdução: as mensagens do Davi no celular (o mesmo card da ligação, no jeito de uma notificação de conversa)
// e o título do jogo sobre a rua. Tudo some quando a ligação começa.
export class IntroScreen {
  private readonly card: HTMLDivElement;
  private readonly lines: HTMLDivElement;
  private readonly title: HTMLDivElement;

  constructor(contato: string, hora: string) {
    this.card = document.createElement("div");
    this.card.className = "ligacao mensagens";
    const photo = document.createElement("div");
    photo.className = "lig-foto";
    const avatar = document.createElement("div");
    avatar.className = "lig-avatar";
    avatar.textContent = contato.trim().charAt(0).toUpperCase();
    photo.append(avatar);
    const body = document.createElement("div");
    body.className = "lig-corpo";
    const top = document.createElement("div");
    top.className = "lig-topo";
    const name = document.createElement("span");
    name.className = "lig-nome";
    name.textContent = contato;
    const time = document.createElement("span");
    time.className = "msg-hora";
    time.textContent = hora;
    top.append(name, time);
    this.lines = document.createElement("div");
    body.append(top, this.lines);
    this.card.append(photo, body);

    this.title = document.createElement("div");
    this.title.className = "tela intro";
    const text = document.createElement("div");
    text.className = "titulo";
    text.textContent = "chamada";
    this.title.append(text);
    document.body.append(this.card, this.title);
  }

  /** Mais uma mensagem chegando (a primeira mostra o card). */
  message(text: string): void {
    const line = document.createElement("div");
    line.className = "msg-linha";
    line.textContent = text;
    this.lines.append(line);
    this.card.classList.add("visivel");
    requestAnimationFrame(() => line.classList.add("visivel"));
  }

  showTitle(): void {
    this.title.classList.add("visivel");
  }

  hideTitle(): void {
    this.title.classList.remove("visivel");
  }

  hideMessages(): void {
    this.card.classList.remove("visivel");
  }

  /** Pulou a introdução: some tudo de uma vez, sem transição. */
  clear(): void {
    for (const el of [this.card, this.title]) {
      el.style.transition = "none";
      el.classList.remove("visivel");
    }
  }
}
