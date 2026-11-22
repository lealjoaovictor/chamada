import { Engine } from "@babylonjs/core/Engines/engine";
import { Game } from "./game/Game";

async function main(): Promise<void> {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  const engine = new Engine(canvas, true, { stencil: true }, true);
  const game = await Game.create(engine);
  engine.runRenderLoop(() => game.render());
  window.addEventListener("resize", () => engine.resize());
}

main().catch((error: unknown) => console.error(error));
