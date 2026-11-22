export class Fade {
  private readonly element: HTMLDivElement;

  constructor() {
    this.element = document.createElement("div");
    Object.assign(this.element.style, {
      position: "fixed",
      inset: "0",
      background: "#000",
      opacity: "0",
      pointerEvents: "none",
    });
    document.body.appendChild(this.element);
  }

  set(alpha: number): void {
    this.element.style.opacity = String(Math.min(Math.max(alpha, 0), 1));
  }
}
