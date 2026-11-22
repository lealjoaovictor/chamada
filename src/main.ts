import { Engine } from "@babylonjs/core/Engines/engine";
import { Game } from "./game/Game";

async function main(): Promise<void> {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  const engine = new Engine(canvas, true, { stencil: true }, true);
  const game = await Game.create(engine);
  engine.runRenderLoop(() => game.render());
  // Ao girar o celular o tamanho do canvas muda depois do evento "resize"; observar o próprio canvas evita a imagem esticada.
  const resize = (): void => engine.resize();
  new ResizeObserver(resize).observe(canvas);
  window.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 300));
}

main().catch((error: unknown) => console.error(error));
