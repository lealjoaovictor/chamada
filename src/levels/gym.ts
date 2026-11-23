import type { BlockData, LevelData } from "./types";
import { CART_VISUAL, TOOL_CART_GRIP, TOOL_CART_VISUAL } from "./kits.ts";

// Sala de teste (`?gym`): só para ajustar a furtividade, sem atravessar o jogo.
// Da esquerda para a direita: caixa para empurrar, plataforma com um caixote para derrubar (barulho),
// e o trecho agachado com estantes de cobertura e um segurança de ronda com lanterna.
const SHELF_Z = 1.45;

function shelf(x: number, i: number): BlockData {
  const models = ["estante-1", "estante-2", "estante-3"] as const;
  return { x, y: 1.3, z: SHELF_Z, depth: 1.1, width: 1.4, height: 2.6, material: "madeira", model: models[i % models.length] };
}

export const gymLevel: LevelData = {
  checkpoints: [{ x: 0, y: 1.2 }],
  killY: -5,
  bounds: { minX: -4, maxX: 36 },
  depth: 4,
  ambiente: [{ minX: -6, maxX: 40, intensidade: 0.45, cor: [0.5, 0.56, 0.66] }],
  furtivo: [{ minX: 15, maxX: 33 }],
  ground: [{ x: 16, y: -0.5, width: 42, height: 1, material: "piso" }],
  walls: [
    { x: -4.5, y: 3, width: 1, height: 8, material: "pedra" },
    { x: 36.5, y: 3, width: 1, height: 8, material: "pedra" },
    { x: 16, y: 6.2, width: 42, height: 0.4, material: "concreto" },
  ],
  platforms: [],
  obstacles: [
    // Parede para testar o apoio das mãos (andar para a esquerda até encostar).
    { x: -2.4, y: 1.6, width: 0.4, height: 3.2, material: "parede" },
    // Degrau e plataforma de onde se derruba o caixote.
    { x: 8.4, y: 0.4, width: 0.8, height: 0.8, material: "madeira" },
    { x: 10.5, y: 0.8, width: 3, height: 1.6, material: "madeira" },
    // Estantes na faixa do meio: bloqueiam a visão do segurança, não o jogador.
    ...[18, 21.5, 25, 28.5].map(shelf),
  ],
  ramps: [],
  boxes: [
    { x: 4, y: 0.5, size: 1, mass: 20, material: "metal", visual: TOOL_CART_VISUAL, pegada: TOOL_CART_GRIP },
    { x: 11.4, y: 2.1, size: 1, mass: 20, material: "carrinho", visual: CART_VISUAL },
  ],
  lamps: [
    { x: 4, y: 4.6, tom: "fluorescente" },
    { x: 23, y: 4.6, tom: "fluorescente", flicker: true, forca: 0.8 },
  ],
  plates: [],
  doors: [],
  vigias: [
    {
      x0: 17,
      x1: 32,
      y: 0,
      z: 3.2,
      speed: 1.1,
      pause: 1.2,
      pauseMax: 3.2,
      startHeading: -1,
      aimAhead: 2.5,
      aimY: 0.4,
      coneAngle: 0.5,
      range: 10,
    },
  ],
  elevators: [],
  decor: [
    { x: 16, y: 3, z: 4.6, width: 42, height: 6, depth: 0.1, material: "parede" },
  ],
};
