import { Engine } from "@babylonjs/core/Engines/engine";
import { Game } from "./game/Game";

// Se algo der errado no carregamento, o jogo mostra o motivo em vez de deixar o ponto piscando para sempre.
const LOADING_TIMEOUT_MS = 120_000;
const loadErrors: string[] = [];

function showLoadingProblem(title: string, detail?: string): void {
  const dot = document.getElementById("carregando");
  if (!dot) return;
  dot.remove();
  const box = document.createElement("div");
  box.id = "erro-carregamento";
  box.style.cssText =
    "position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;" +
    "color:#eee;font:15px/1.5 -apple-system,'Segoe UI',sans-serif;text-align:center;z-index:50;background:#000";
  const head = document.createElement("div");
  head.style.cssText = "font-size:18px;color:#f0be78";
  head.textContent = title;
  const info = document.createElement("pre");
  info.style.cssText = "max-width:90vw;max-height:50vh;overflow:auto;white-space:pre-wrap;font:12px/1.4 ui-monospace,Consolas,monospace;color:#bbb";
  info.textContent = [detail, ...loadErrors.slice(-5), `Navegador: ${navigator.userAgent}`].filter(Boolean).join("\n\n");
  const tip = document.createElement("div");
  tip.style.cssText = "color:#999;font-size:13px";
  tip.textContent = "Tire um print desta tela e mande para o João (F12 > Console mostra mais detalhes).";
  box.append(head, info, tip);
  document.body.append(box);
}

window.addEventListener("error", (event) => loadErrors.push(String(event.message)));
window.addEventListener("unhandledrejection", (event) => loadErrors.push(String(event.reason)));
const watchdog = setTimeout(() => showLoadingProblem("O jogo está demorando demais para carregar."), LOADING_TIMEOUT_MS);

async function main(): Promise<void> {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  // `?webgl1`: só para capturas em navegador sem GPU (SwiftShader não aguenta os blocos de uniform do WebGL2).
  const webgl1 = new URLSearchParams(location.search).has("webgl1");
  const engine = new Engine(canvas, true, { stencil: true, disableWebGL2Support: webgl1 }, true);
  // Erros de shader do Babylon (ex.: placa de vídeo com limites menores) entram no relatório da tela de erro.
  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const text = args.map(String).join(" ");
    if (/error|exceeds|compil/i.test(text)) loadErrors.push(text.slice(0, 300));
    originalError(...args);
  };
  const game = await Game.create(engine);
  clearTimeout(watchdog);
  engine.runRenderLoop(() => game.render());
  // Ao girar o celular o tamanho do canvas muda depois do evento "resize"; observar o próprio canvas evita a imagem esticada.
  const resize = (): void => engine.resize();
  new ResizeObserver(resize).observe(canvas);
  window.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 300));
}

main().catch((error: unknown) => {
  console.error(error);
  clearTimeout(watchdog);
  showLoadingProblem("O jogo não conseguiu carregar.", error instanceof Error ? `${error.name}: ${error.message}` : String(error));
});
