import type { BlockData, DecorData, LampData, LevelData, PropData } from "./types";
import { CART_VISUAL, HAND_TRUCK_GRIP, HAND_TRUCK_VISUAL, TOOL_CART_GRIP, TOOL_CART_VISUAL, fluorescent, moonWindow } from "./kits.ts";

const START = 48;
const END = 88;
// Trecho do segurança (entre a porta do corredor e a zeladoria): ele faz a ronda apagando as luzes, num recuo
// do corredor com pilares. O jogador vai de pilar em pilar quando ele está de costas.
const HALL_X0 = 76;
const HALL_X1 = 88;
const HALL_BACK_Z = 3.4;
const PILLAR_XS = [77.4, 85.6];
const PILLAR_WIDTH = 1.1;
const PILLAR_Z = 2.0;
const PILLAR_DEPTH = 0.6;
const CEILING = 3.2;
const BACK_Z = 2.1;
const RECESS_X = 63;
const RECESS_WIDTH = 1.3;
const RECESS_DEPTH = 0.2;
const DOOR_X = 67;
const ARM_HEIGHT = 1.1;
const ROOM1_END = END + 4;

// Sala 2 (zeladoria): um palco alto com uma caixa e uma placa em cima; a caixa do chão vira degrau.
const ROOM2_CEILING = 5.4;
const STAGE_X0 = 96;
const STAGE_X1 = 103;
const STAGE_TOP = 2.0;
const STAGE_PLATE_X = 101;
const STAGE_PLATE_WIDTH = 1.4;
const STAGE_PLATE_DEPTH = 0.2;
const GATE2_X = 105;
const GATE2_OPEN = 2.2;
const ROOM2_END = 107;

// Sala 3 (sala escura): três vãos no piso que só aparecem nos lampejos das lâmpadas.
const PITS: [number, number][] = [
  [111.5, 113.1],
  [116.5, 118.3],
  [121.8, 123.6],
];
const END2 = 130;

/** Luar atrás do vidro da janela pronta (a moldura vem de `moonWindow`). */
function archWindow(x: number): DecorData[] {
  return [{ x, y: 2.05, z: BACK_Z - 0.04, width: 0.9, height: 1.6, depth: 0.02, material: "luar" }];
}

function hangingLamp(lamp: LampData): DecorData {
  const length = CEILING - lamp.y;
  return { x: lamp.x, y: lamp.y + length / 2, z: 1.4, width: 0.03, height: length, depth: 0.03, shape: "cylinder", material: "metal" };
}

const lamps: LampData[] = [
  { x: 51, y: 2.7 },
  { x: 57.5, y: 2.7, flicker: true },
  { x: 62, y: 2.7 },
  { x: 66, y: 2.7, flicker: true },
  // Alguém já começou a apagar o corredor.
  { x: 71.5, y: 2.7, desligada: true },
  { x: 80.4, y: 2.7, forca: 0.8 },
  { x: 84, y: 2.7, desligada: true },
  { x: 87.6, y: 2.7, desligada: true },
  { x: 93, y: 4.4 },
  { x: 101, y: 4.4, flicker: true },
  { x: 112.3, y: 2.7, flicker: "escuro" },
  { x: 117.4, y: 2.7, flicker: "escuro" },
  { x: 122.7, y: 2.7, flicker: "escuro" },
  { x: 128, y: 2.7 },
];

// Piso da sala escura: blocos entre os vãos.
function darkFloor(): BlockData[] {
  const edges = [ROOM2_END, ...PITS.flat(), END2];
  const blocks: BlockData[] = [];
  for (let i = 0; i < edges.length; i += 2) {
    const [a, b] = [edges[i], edges[i + 1]];
    blocks.push({ x: (a + b) / 2, y: -0.5, width: b - a, height: 1, material: "piso" });
  }
  return blocks;
}

function stage(): BlockData[] {
  const a = STAGE_PLATE_X - STAGE_PLATE_WIDTH / 2;
  const b = STAGE_PLATE_X + STAGE_PLATE_WIDTH / 2;
  const low = STAGE_TOP - STAGE_PLATE_DEPTH;
  return [
    { x: (STAGE_X0 + a) / 2, y: STAGE_TOP / 2, width: a - STAGE_X0, height: STAGE_TOP, material: "madeira" },
    { x: STAGE_PLATE_X, y: low / 2, width: STAGE_PLATE_WIDTH, height: low, material: "concreto" },
    { x: (b + STAGE_X1) / 2, y: STAGE_TOP / 2, width: STAGE_X1 - b, height: STAGE_TOP, material: "madeira" },
  ];
}

export const area2Level: LevelData = {
  checkpoints: [{ x: 71, y: 1.2 }, { x: 108.5, y: 1.2 }],
  killY: -5,
  bounds: { minX: START, maxX: END2 },
  ambiente: [
    { minX: START, maxX: ROOM1_END, intensidade: 0.62, cor: [0.66, 0.72, 0.7] },
    { minX: ROOM1_END, maxX: END2, intensidade: 0.5, cor: [0.6, 0.66, 0.66] },
  ],
  vultos: [{ x: 114.8, y: 0, z: 0.8, facing: 1 }],
  escuro: [{ minX: ROOM2_END + 1, maxX: 126.5 }],
  depth: 4,
  ground: [
    { x: (START + RECESS_X - RECESS_WIDTH / 2) / 2, y: -0.5, width: RECESS_X - RECESS_WIDTH / 2 - START, height: 1, material: "piso" },
    { x: RECESS_X, y: -0.5 - RECESS_DEPTH, width: RECESS_WIDTH, height: 1, material: "concreto" },
    { x: (RECESS_X + RECESS_WIDTH / 2 + ROOM2_END) / 2, y: -0.5, width: ROOM2_END - RECESS_X - RECESS_WIDTH / 2, height: 1, material: "piso" },
    ...darkFloor(),
  ],
  walls: [
    { x: (START + ROOM1_END) / 2, y: CEILING + 0.2, width: ROOM1_END - START, height: 0.4, material: "concreto" },
    { x: (ROOM1_END + ROOM2_END) / 2, y: ROOM2_CEILING + 0.2, width: ROOM2_END - ROOM1_END, height: 0.4, material: "concreto" },
    { x: (ROOM2_END + END2) / 2, y: CEILING + 0.2, width: END2 - ROOM2_END, height: 0.4, material: "concreto" },
    { x: ROOM2_END, y: (CEILING + ROOM2_CEILING) / 2 + 0.2, width: 0.6, height: ROOM2_CEILING - CEILING, material: "concreto" },
  ],
  platforms: [],
  obstacles: [
    { x: 55, y: (ARM_HEIGHT + CEILING) / 2, width: 0.12, height: CEILING - ARM_HEIGHT, material: "vidro" },
    // Pilares do recuo: escondem quem está na frente e cortam a luz da lanterna.
    ...PILLAR_XS.map((x): BlockData => ({ x, y: CEILING / 2, z: PILLAR_Z, depth: PILLAR_DEPTH, width: PILLAR_WIDTH, height: CEILING, material: "concreto" })),
    ...stage(),
    // Rodapé na borda do palco: segura a caixa de cima para ela não cair de volta.
    { x: STAGE_X0 + 0.1, y: STAGE_TOP + 0.12, width: 0.2, height: 0.24, material: "madeira" },
  ],
  ramps: [],
  boxes: [
    { x: 59.5, y: 0.5, size: 1, mass: 20, material: "carrinho", visual: CART_VISUAL },
    { x: 92.5, y: 0.5, size: 1, mass: 20, material: "metal", visual: TOOL_CART_VISUAL, pegada: TOOL_CART_GRIP },
    { x: 98.2, y: STAGE_TOP + 0.5, size: 1, mass: 20, material: "metal", visual: HAND_TRUCK_VISUAL, pegada: HAND_TRUCK_GRIP },
  ],
  lamps,
  plates: [
    { x: RECESS_X, y: -RECESS_DEPTH, width: RECESS_WIDTH, door: 0 },
    // Zeladoria: a porta de enrolar tem um contrapeso; a caixa no estrado puxa a corda e segura a porta aberta.
    { x: STAGE_PLATE_X, y: STAGE_TOP - STAGE_PLATE_DEPTH, width: STAGE_PLATE_WIDTH, door: 1, tipo: "contrapeso", topo: ROOM2_CEILING, portaX: GATE2_X },
  ],
  doors: [
    { x: DOOR_X, y: CEILING / 2, width: 0.25, height: CEILING, openHeight: ARM_HEIGHT },
    { x: GATE2_X, y: ROOM2_CEILING / 2, width: 0.25, height: ROOM2_CEILING, openHeight: GATE2_OPEN },
  ],
  vigias: [
    {
      x0: 79.5,
      x1: 87,
      y: 0,
      z: 2.9,
      speed: 1,
      pause: 1.5,
      pauseMax: 3,
      startHeading: -1,
      aimAhead: 3.5,
      aimY: 0.6,
      coneAngle: 0.65,
      range: 8.5,
      reacao: 0.5,
    },
  ],
  elevators: [],
  props: [
    // Janelas (molduras prontas) e luminárias fluorescentes.
    ...[58.5, 61, 70, 72.8, 114.8, 120, 125.5].flatMap((x) => moonWindow(x, 1.25, BACK_Z)),
    ...[94, 99.5].flatMap((x) => moonWindow(x, 2.25, BACK_Z)),
    ...lamps.map((l) => fluorescent(l.x, l.y + 0.12)),
    // Corredor da catraca.
    { model: "SchoolChair_01", x: 48.9, y: 0, z: 1.55, rotY: 160 },
    { model: "SchoolChair_01", x: 49.6, y: 0, z: 1.6, rotY: 200 },
    { model: "painted_wooden_bench", x: 64.3, y: 0, z: 1.75, rotY: 180, scale: 1.25 },
    { model: "painted_wooden_bench", x: 69.5, y: 0, z: 1.75, rotY: 180, scale: 1.25 },
    { model: "metal_trash_can", part: "metal_trash_can|metal_trash_can_handle_(left|right)|metal_trash_can_lid", x: 75.3, y: 0, z: 1.65, scale: 0.8 },
    { model: "WetFloorSign_01", x: 61.6, y: 0, z: -1.3, rotY: 20 },
    { model: "security_camera_01", x: 56, y: 2.75, z: 1.85, rotY: 220 },
    { model: "power_box_01", x: 67.8, y: 1.6, z: BACK_Z - 0.02, rotY: 180 },
    // Zeladoria: estantes de aço, tambores, caixas e dutos.
    { model: "steel_frame_shelves_01", x: 93.6, y: 0, z: 1.75, rotY: 180, fitHeight: 2.2 },
    { model: "steel_frame_shelves_01", x: 104.1, y: 0, z: 1.75, rotY: 180, fitHeight: 2.2 },
    { model: "plastic_crate_01", x: 93.2, y: 0.95, z: 1.75, rotY: 90 },
    { model: "plastic_crate_01", x: 93.9, y: 1.85, z: 1.75, rotY: 85 },
    { model: "cardboard_box_01", x: 104, y: 0.95, z: 1.75, rotY: 90 },
    { model: "cardboard_box_01", x: 103.7, y: 1.85, z: 1.75, rotY: 96 },
    { model: "barrel_03", x: 102.3, y: STAGE_TOP, z: 1.55 },
    { model: "barrel_03", x: 96.9, y: STAGE_TOP, z: 1.6, rotY: 40 },
    { model: "hand_truck", x: 95.4, y: STAGE_TOP, z: 1.5, rotY: 200 },
    { model: "trashbag", x: 105.9, y: 0, z: 1.7 },
    { model: "plastic_crate_01", x: 91.2, y: 0, z: 1.6, rotY: 20 },
    ...[93.4, 95.2, 97, 98.8, 100.6, 102.4, 104.2].map((x): PropData => ({
      model: "modular_airduct_rectangular_01", part: "modular_airduct_rectangular_01_tripple_01", x, y: 4.55, z: 1.3, rotY: 90, origin: false,
    })),
    // Sala escura: carteiras largadas.
    ...([
      [109.6, 1.3, 180], [110.5, 1.2, 160], [115, 1.4, 195], [119.6, 1.3, 170], [124.6, 1.3, 185], [127, 1.35, 150],
    ] as const).flatMap(([x, z, r]): PropData[] => [
      { model: "SchoolDesk_01", x, y: 0, z, rotY: r },
      { model: "SchoolChair_01", x: x + 0.1, y: 0, z: z - 0.55, rotY: r + 15 },
    ]),
    { model: "SchoolChair_01", x: 118.9, y: 0, z: -1.3, rotY: 75 },
  ],
  decor: [
    // Narrativa: mochila largada perto da catraca.
    { x: 53.6, y: 0.22, z: -1.1, width: 0.36, height: 0.44, depth: 0.2, material: "tecido" },
    { x: 53.6, y: 0.36, z: -0.98, width: 0.28, height: 0.18, depth: 0.06, material: "tecido" },
    { x: 54.4, y: 0.01, z: -0.6, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    { x: 55.6, y: 0.01, z: -1.3, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    { x: 102.2, y: 0.01, z: -0.8, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    { x: START, y: CEILING + 1.9, z: 0, width: 0.8, height: 3.4, depth: 4.4, material: "pedra" },
    { x: (START + ROOM1_END) / 2, y: CEILING + 2.1, z: 0, width: ROOM1_END - START, height: 3.4, depth: 4.6, material: "pedra" },

    { x: 51, y: 0.8, z: BACK_Z, width: 6, height: 1.6, depth: 0.1, material: "madeira" },
    { x: 51, y: 2.4, z: BACK_Z + 0.05, width: 6, height: 1.6, depth: 0.1, material: "parede" },
    { x: 50, y: 1.25, z: BACK_Z - 0.06, width: 1.3, height: 2.5, depth: 0.1, material: "moldura" },
    { x: 50, y: 1.2, z: BACK_Z - 0.1, width: 1.1, height: 2.4, depth: 0.1, material: "madeira" },
    { x: 52.6, y: 1.25, z: BACK_Z - 0.06, width: 1.3, height: 2.5, depth: 0.1, material: "moldura" },
    { x: 52.6, y: 1.2, z: BACK_Z - 0.1, width: 1.1, height: 2.4, depth: 0.1, material: "madeira" },

    ...([[54, HALL_X0, BACK_Z], [HALL_X0, HALL_X1, HALL_BACK_Z], [HALL_X1, ROOM1_END, BACK_Z]] as const).flatMap(([a, b, z]): DecorData[] => [
      { x: (a + b) / 2, y: 0.55, z, width: b - a, height: 1.1, depth: 0.1, material: "pedra" },
      { x: (a + b) / 2, y: 2.15, z: z + 0.05, width: b - a, height: 2.1, depth: 0.1, material: "parede" },
    ]),
    // Recuo do corredor: paredes dos lados e o teto por cima.
    ...[HALL_X0, HALL_X1].map((x): DecorData => ({ x, y: CEILING / 2, z: (BACK_Z + HALL_BACK_Z) / 2, width: 0.2, height: CEILING, depth: HALL_BACK_Z - BACK_Z, material: "parede" })),
    { x: (HALL_X0 + HALL_X1) / 2, y: CEILING + 0.2, z: (BACK_Z + HALL_BACK_Z) / 2 + 0.2, width: HALL_X1 - HALL_X0, height: 0.4, depth: HALL_BACK_Z - BACK_Z + 0.6, material: "concreto" },
    // Um quadro de avisos e folhas caídas no recuo.
    { x: 83.9, y: 1.6, z: HALL_BACK_Z - 0.04, width: 1.4, height: 0.9, depth: 0.03, material: "madeira" },
    ...[[-0.4, 0.15], [-0.05, 0.08], [0.3, 0.18], [-0.25, -0.2]].map(([dx, dy]): DecorData => ({
      x: 83.9 + dx, y: 1.6 + dy, z: HALL_BACK_Z - 0.06, width: 0.21, height: 0.29, depth: 0.005, material: "papel",
    })),
    { x: 80.9, y: 0.01, z: -1.1, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    ...[58.5, 61, 70, 72.8].flatMap(archWindow),

    { x: (START + RECESS_X - RECESS_WIDTH / 2) / 2, y: 0.005, z: -0.9, width: RECESS_X - RECESS_WIDTH / 2 - START, height: 0.01, depth: 0.35, material: "tatil" },
    { x: (RECESS_X + RECESS_WIDTH / 2 + ROOM1_END) / 2, y: 0.005, z: -0.9, width: ROOM1_END - RECESS_X - RECESS_WIDTH / 2, height: 0.01, depth: 0.35, material: "tatil" },

    { x: 55, y: 0.5, z: 1.3, width: 0.35, height: 1, depth: 0.5, material: "metal" },
    { x: 55, y: 0.5, z: -1.3, width: 0.35, height: 1, depth: 0.5, material: "metal" },
    { x: 55, y: ARM_HEIGHT - 0.03, z: 0, width: 0.08, height: 0.06, depth: 2.6, material: "metal" },
    { x: 55, y: CEILING - 0.05, z: 0, width: 0.2, height: 0.1, depth: 4, material: "metal" },
    { x: 55, y: ARM_HEIGHT + 0.04, z: 0, width: 0.18, height: 0.08, depth: 4, material: "metal" },
    { x: 55, y: (ARM_HEIGHT + CEILING) / 2, z: -1.97, width: 0.18, height: CEILING - ARM_HEIGHT, depth: 0.06, material: "metal" },
    { x: 55, y: (ARM_HEIGHT + CEILING) / 2, z: 0, width: 0.05, height: 0.04, depth: 4, material: "moldura" },

    { x: DOOR_X, y: CEILING / 2, z: BACK_Z - 0.05, width: 0.6, height: CEILING, depth: 0.2, material: "concreto" },
    { x: DOOR_X - 0.25, y: CEILING / 2, z: -1.95, width: 0.25, height: CEILING, depth: 0.15, material: "concreto" },

    ...lamps.filter((l) => l.x < ROOM1_END || l.x > ROOM2_END).map(hangingLamp),
    ...lamps.filter((l) => l.x > ROOM1_END && l.x < ROOM2_END).map((l): DecorData => ({
      x: l.x, y: (l.y + ROOM2_CEILING) / 2, z: 1.4, width: 0.03, height: ROOM2_CEILING - l.y, depth: 0.03, shape: "cylinder", material: "metal",
    })),

    // Sala 2: zeladoria de pé-direito alto.
    { x: (ROOM1_END + ROOM2_END) / 2, y: ROOM2_CEILING + 1.5, z: 0, width: ROOM2_END - ROOM1_END, height: 2.6, depth: 4.6, material: "pedra" },
    { x: (ROOM1_END + ROOM2_END) / 2, y: 0.55, z: BACK_Z, width: ROOM2_END - ROOM1_END, height: 1.1, depth: 0.1, material: "pedra" },
    { x: (ROOM1_END + ROOM2_END) / 2, y: (1.1 + ROOM2_CEILING) / 2, z: BACK_Z + 0.05, width: ROOM2_END - ROOM1_END, height: ROOM2_CEILING - 1.1, depth: 0.1, material: "parede" },
    { x: ROOM1_END, y: (CEILING + ROOM2_CEILING) / 2 + 0.2, z: 0, width: 0.6, height: ROOM2_CEILING - CEILING, depth: 4.4, material: "concreto" },
    { x: (STAGE_X0 + STAGE_X1) / 2, y: STAGE_TOP + 0.01, z: -0.6, width: STAGE_X1 - STAGE_X0, height: 0.02, depth: 2, material: "listrado" },
    ...[94, 99.5].flatMap(archWindow).map((d) => ({ ...d, y: d.y + 1 })),
    { x: GATE2_X, y: ROOM2_CEILING / 2, z: BACK_Z - 0.05, width: 0.6, height: ROOM2_CEILING, depth: 0.2, material: "concreto" },
    { x: GATE2_X - 0.25, y: ROOM2_CEILING / 2, z: -1.95, width: 0.25, height: ROOM2_CEILING, depth: 0.15, material: "concreto" },

    // Sala 3: sala escura.
    { x: (ROOM2_END + END2) / 2, y: CEILING + 2.1, z: 0, width: END2 - ROOM2_END, height: 3.4, depth: 4.6, material: "pedra" },
    { x: (ROOM2_END + END2) / 2, y: 0.55, z: BACK_Z, width: END2 - ROOM2_END, height: 1.1, depth: 0.1, material: "pedra" },
    { x: (ROOM2_END + END2) / 2, y: 2.15, z: BACK_Z + 0.05, width: END2 - ROOM2_END, height: 2.1, depth: 0.1, material: "parede" },
    ...[114.8, 120, 125.5].flatMap(archWindow),
  ],
};
