import type { BlockData, DecorData, LampData, LevelData, ModelName, PropData } from "./types";
import { CART_VISUAL, CRATE_VISUAL, fluorescent, moonWindow } from "./kits.ts";

const START = 80;
const HALL_START = 84;
const SHAFT_X = 105.5;
const SHAFT_WIDTH = 2;
const GALLERY_Y = 3.5;
const END = 117;

// Sala 2 (sala de leitura), no nível da galeria: um segurança faz a ronda entre o pé do mezanino e o meio da sala.
// O jogador entra quando ele vai para a direita, sobe no mezanino e espera escondido; quando o segurança volta
// e passa por baixo, desce pelo lado direito, já atrás dele. Derrubar o carrinho faz barulho e adianta a volta.
const READING_END = 141;
const READING_CEILING = 8.6;
const STEP_X = 117.9;
const MEZZ_X0 = 120.5;
const MEZZ_X1 = 125.5;
const MEZZ_TOP = GALLERY_Y + 2;
const GUARD_X0 = 120;
const GUARD_X1 = 133;
const CORRIDOR_CEILING = 3.2;
const HALL_CEILING = 6.5;
const SHELF_Z = 1.45;
const SHELF_DEPTH = 1.1;
const SHELF_HEIGHT = 2.6;
const SHELF_WIDTH = 1.4;
const SHELF_XS = [86.5, 89.5, 92.5, 95.5, 98.5, 101.5];
const BACK_Z = 4.6;

const SHELF_MODELS: ModelName[] = ["estante-1", "estante-2", "estante-3"];

function shelf(x: number, i: number): BlockData {
  return { x, y: SHELF_HEIGHT / 2, z: SHELF_Z, depth: SHELF_DEPTH, width: SHELF_WIDTH, height: SHELF_HEIGHT, material: "madeira", model: SHELF_MODELS[i % SHELF_MODELS.length] };
}

/** Luar atrás da janela alta (a moldura pronta vem de `moonWindow`). */
function tallWindow(x: number): DecorData[] {
  return [{ x, y: 2.85, z: BACK_Z - 0.04, width: 1.45, height: 3.45, depth: 0.02, material: "luar" }];
}

const HALL_WINDOWS = [85.5, 88, 91, 94, 97, 100];
const READING_WINDOWS = [122, 130, 136];

const lamps: LampData[] = [
  { x: 82, y: 2.7, forca: 0.85 },
  { x: 111, y: 5.6, flicker: true, forca: 0.8 },
  { x: 89, y: 5, moonlight: true },
  { x: 98, y: 5, moonlight: true },
  { x: 127, y: 7.4, forca: 0.8 },
  { x: 137, y: 7.4, flicker: true, forca: 0.8 },
  { x: 122, y: 7.6, moonlight: true },
];

export const area3Level: LevelData = {
  checkpoints: [{ x: 110, y: GALLERY_Y + 1.2 }],
  killY: -5,
  bounds: { minX: START, maxX: READING_END },
  ambiente: [{ minX: START, maxX: READING_END, intensidade: 0.4, cor: [0.5, 0.56, 0.66] }],
  vultos: [],
  depth: 4,
  ground: [{ x: (START + SHAFT_X + SHAFT_WIDTH / 2) / 2, y: -0.5, width: SHAFT_X + SHAFT_WIDTH / 2 - START, height: 1, material: "piso" }],
  walls: [
    { x: (START + HALL_START) / 2, y: CORRIDOR_CEILING + 0.2, width: HALL_START - START, height: 0.4, material: "concreto" },
    { x: (HALL_START + END) / 2, y: HALL_CEILING + 0.2, width: END - HALL_START, height: 0.4, material: "concreto" },
    { x: (END + READING_END) / 2, y: READING_CEILING + 0.2, width: READING_END - END, height: 0.4, material: "concreto" },
    { x: END, y: (HALL_CEILING + READING_CEILING) / 2 + 0.2, width: 0.6, height: READING_CEILING - HALL_CEILING, material: "concreto" },
  ],
  platforms: [],
  obstacles: [
    { x: HALL_START + 0.5, y: HALL_CEILING / 2, z: SHELF_Z, depth: SHELF_DEPTH, width: 0.9, height: HALL_CEILING, material: "pedra" },
    ...SHELF_XS.map(shelf),
    {
      x: (SHAFT_X + SHAFT_WIDTH / 2 + READING_END) / 2,
      y: GALLERY_Y / 2,
      width: READING_END - SHAFT_X - SHAFT_WIDTH / 2,
      height: GALLERY_Y,
      material: "pedra",
    },
    // Degrau (caixote fixo) e mezanino de leitura.
    { x: STEP_X, y: GALLERY_Y + 0.5, width: 1, height: 1, material: "madeira", hidden: true },
    { x: (MEZZ_X0 + MEZZ_X1) / 2, y: (GALLERY_Y + MEZZ_TOP) / 2, width: MEZZ_X1 - MEZZ_X0, height: MEZZ_TOP - GALLERY_Y, material: "madeira" },
    // Mureta na borda direita do mezanino: esconde quem está em cima.
    { x: MEZZ_X1 - 0.1, y: MEZZ_TOP + 0.3, width: 0.2, height: 0.6, material: "madeira" },
  ],
  ramps: [],
  furtivo: [{ minX: HALL_START + 1, maxX: 102.6 }],
  boxes: [{ x: 122.2, y: MEZZ_TOP + 0.5, size: 1, mass: 20, material: "carrinho", visual: CART_VISUAL }],
  lamps,
  plates: [],
  doors: [],
  vigias: [
    {
      x0: 86,
      x1: 100,
      y: 0,
      z: 3.2,
      speed: 1.1,
      pause: 1.2,
      pauseMax: 3.2,
      aimAhead: 2.5,
      aimY: 0.4,
      coneAngle: 0.5,
      range: 10,
    },
    {
      x0: GUARD_X0,
      x1: GUARD_X1,
      y: GALLERY_Y,
      z: 3,
      speed: 1.3,
      pause: 1.5,
      pauseMax: 2.5,
      startHeading: 1,
      aimAhead: 2.5,
      aimY: GALLERY_Y + 0.4,
      coneAngle: 0.5,
      range: 10,
    },
  ],
  elevators: [
    { x: SHAFT_X, width: SHAFT_WIDTH, bottomY: 0, topY: GALLERY_Y, buttonX: 103.4, buttonY: 1 },
  ],
  props: [
    // Janelas altas prontas, com o luar atrás.
    ...HALL_WINDOWS.flatMap((x) => moonWindow(x, 1.12, BACK_Z, true)),
    ...READING_WINDOWS.flatMap((x) => moonWindow(x, 1.12 + GALLERY_Y - 0.6, BACK_Z, true)),
    ...lamps.filter((lamp) => !lamp.moonlight).map((lamp) => fluorescent(lamp.x, lamp.y + 0.12)),
    // Degrau: caixotes empilhados.
    ...CRATE_VISUAL.map((c): PropData => ({ ...c, x: STEP_X + c.x, y: GALLERY_Y + c.y, z: c.z })),
    // Sala de leitura: estantes, mesa da bibliotecária e cadeiras.
    { model: "metal_office_desk", x: 139.6, y: GALLERY_Y, z: 1.7, rotY: 180, scale: 0.85 },
    { model: "SchoolChair_01", x: 139.4, y: GALLERY_Y, z: 2.4, rotY: 170 },
    { model: "SchoolChair_01", x: 126.6, y: GALLERY_Y, z: 1.9, rotY: 120 },
    { model: "cardboard_box_01", x: 127.2, y: GALLERY_Y, z: 2.2, rotY: 80 },
    { model: "WetFloorSign_01", x: 108.6, y: GALLERY_Y, z: 2.6, rotY: 200 },
    { model: "security_camera_01", x: 116.2, y: 5.7, z: BACK_Z - 0.05, rotY: 200 },
    // Térreo do salão: carrinho de livros, lixeira e caixas perto do elevador.
    { model: "metal_trash_can", part: "metal_trash_can|metal_trash_can_handle_(left|right)|metal_trash_can_lid", x: 103.9, y: 0, z: 2.6, scale: 0.8 },
    { model: "plastic_crate_01", x: 82.6, y: 0, z: 1.6, rotY: 10 },
    { model: "plastic_crate_01", x: 82.65, y: 0.3, z: 1.6, rotY: 2 },
    { model: "power_box_01", x: 80.9, y: 1.4, z: 2.08, rotY: 180 },
  ],
  decor: [
    // Narrativa: livros abertos e folhas na sala de leitura.
    { x: 127.4, y: GALLERY_Y + 0.01, z: -0.7, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    { x: 128.1, y: GALLERY_Y + 0.01, z: -1.2, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    { x: 129.6, y: GALLERY_Y + 0.01, z: -0.5, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    { x: 134.2, y: GALLERY_Y + 0.01, z: -1.0, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    { x: 122.9, y: MEZZ_TOP + 0.04, z: -1.2, width: 0.42, height: 0.06, depth: 0.3, material: "livros" },
    { x: (START + HALL_START) / 2, y: CORRIDOR_CEILING + 2.1, z: 0, width: HALL_START - START, height: 3.4, depth: 4.6, material: "pedra" },
    { x: (START + HALL_START) / 2, y: 0.55, z: 2.1, width: HALL_START - START, height: 1.1, depth: 0.1, material: "pedra" },
    { x: (START + HALL_START) / 2, y: 2.15, z: 2.15, width: HALL_START - START, height: 2.1, depth: 0.1, material: "parede" },

    { x: (HALL_START + SHAFT_X) / 2, y: -0.5, z: 3.4, width: SHAFT_X - HALL_START, height: 1, depth: 2.8, material: "piso" },
    { x: (HALL_START + END) / 2, y: 0.6, z: BACK_Z, width: END - HALL_START, height: 1.2, depth: 0.1, material: "madeira" },
    // Sala de leitura.
    { x: (END + READING_END) / 2, y: READING_CEILING + 2, z: 0, width: READING_END - END, height: 3.4, depth: 4.6, material: "pedra" },
    { x: (END + READING_END) / 2, y: GALLERY_Y + 0.6, z: BACK_Z, width: READING_END - END, height: 1.2, depth: 0.1, material: "madeira" },
    { x: (END + READING_END) / 2, y: (GALLERY_Y + 1.2 + READING_CEILING) / 2, z: BACK_Z + 0.05, width: READING_END - END, height: READING_CEILING - GALLERY_Y - 1.2, depth: 0.1, material: "parede" },
    { x: END, y: (HALL_CEILING + READING_CEILING) / 2 + 0.2, z: 0, width: 0.6, height: READING_CEILING - HALL_CEILING, depth: 4.4, material: "concreto" },
    // Estantes cheias da sala de leitura, encostadas na parede do fundo (só visual, sem colisão).
    ...[128.5, 131, 135.5, 138].map((x, i): DecorData => ({ ...shelf(x, i + 1), y: GALLERY_Y + 1.1, z: 2.4, depth: 0.5, width: 1.6, height: 2.2 })),
    ...READING_WINDOWS.flatMap((x) => tallWindow(x).map((d) => ({ ...d, y: d.y + GALLERY_Y - 0.6 }))),
    { x: (MEZZ_X0 + MEZZ_X1) / 2, y: MEZZ_TOP + 0.95, z: -1.6, width: MEZZ_X1 - MEZZ_X0, height: 0.05, depth: 0.05, material: "metal" },
    { x: (HALL_START + END) / 2, y: 3.85, z: BACK_Z + 0.05, width: END - HALL_START, height: 5.3, depth: 0.1, material: "parede" },
    ...HALL_WINDOWS.flatMap(tallWindow),
    
    { x: SHAFT_X - SHAFT_WIDTH / 2 - 0.1, y: HALL_CEILING / 2, z: 1.9, width: 0.15, height: HALL_CEILING, depth: 0.15, material: "metal" },
    { x: SHAFT_X + SHAFT_WIDTH / 2 + 0.1, y: HALL_CEILING / 2, z: 1.9, width: 0.15, height: HALL_CEILING, depth: 0.15, material: "metal" },
    { x: SHAFT_X, y: HALL_CEILING - 0.3, z: 1.9, width: SHAFT_WIDTH + 0.35, height: 0.15, depth: 0.15, material: "metal" },
    { x: 103.4, y: 1, z: 1.98, width: 0.5, height: 0.6, depth: 0.05, material: "metal" },

    { x: (SHAFT_X + END) / 2 + 1, y: GALLERY_Y + 0.55, z: -1.6, width: END - SHAFT_X - 2, height: 0.05, depth: 0.05, material: "metal" },
    ...[108, 111, 114].map((x): DecorData => ({ x, y: GALLERY_Y + 0.3, z: -1.6, width: 0.05, height: 0.6, depth: 0.05, material: "metal" })),
    ...lamps.filter((lamp) => !lamp.moonlight).map((lamp): DecorData => ({
      x: lamp.x, y: (lamp.y + (lamp.x < HALL_START ? CORRIDOR_CEILING : HALL_CEILING)) / 2, z: 1.4,
      width: 0.03, height: (lamp.x < HALL_START ? CORRIDOR_CEILING : HALL_CEILING) - lamp.y, depth: 0.03,
      shape: "cylinder", material: "metal",
    })),
  ],
};
