import type { BlockData, DecorData, LampData, LevelData, PropData } from "./types";
import { GAS_CART_GRIP, GAS_CART_VISUAL, fluorescent } from "./kits.ts";

const START = 117;
const RAMP_END = 123;
const GALLERY_Y = 3.5;
const END = 200;
const CEILING = 3;
const HALL_CEILING = 6.5;
const LANE_Z = -0.65;
const LANE_DEPTH = 2.7;
const BACK_Z = 2.6;
const GAP = 1.1;
const BAR_X = 134;
const BARRIER_X = 143;
const GATE_X = 152;
const BARRIER2_X = 138.3;

// Depósito: pausa entre as duas perseguições. Caixa sobre a placa abre o portão de saída.
const DEPOT_BOX_X = 156.5;
const DEPOT_PLATE_X = 163.5;
const DEPOT_PLATE_WIDTH = 1.4;
const DEPOT_PLATE_DEPTH = 0.2;
const DEPOT_GATE_X = 167;

// Segunda perseguição, com obstáculos em ritmo irregular.
const CHASE2_TRIGGER = 169.5;
const SLIDES2 = [174.5, 183.2];
const BARRIERS2 = [177.6, 186.1, 188.4];
const GATE2_X = 193;
// O segurança para antes do portão: com o braço esticado, a lanterna não pode atravessar a grade.
const GATE_STOP = 1.2;
// Portas de serviço na parede do fundo: é por elas que os seguranças entram na perseguição.
const DOOR1_X = 123.3;
const DOOR2_X = 165;

const ELASTICO = { distancia: 5, ganho: 0.12, min: 0.8, max: 1.4 };

function laneBlock(x: number, y: number, width: number, height: number, material: BlockData["material"]): BlockData {
  return { x, y, width, height, z: LANE_Z, depth: LANE_DEPTH, material };
}

/** Barreira de concreto: o bloco de colisão fica escondido e duas barreiras prontas ocupam a faixa. */
function barrier(x: number, height: number): BlockData {
  return { ...laneBlock(x, height / 2, 0.6, height, "concreto"), hidden: true };
}

function barrierVisual(x: number, height: number): PropData[] {
  const s = height / 0.83;
  return [-0.65, 0.65].map((dz, i): PropData => ({
    model: "concrete_road_barrier",
    x: x + (i ? 0.03 : -0.02),
    y: 0,
    z: LANE_Z + dz,
    rotY: 90 + (i ? 2 : -1),
    scale: s,
    stretch: [1.4 / (1.54 * s), 1, 0.62 / (0.63 * s)],
  }));
}


function column(x: number): DecorData[] {
  return [
    { x, y: CEILING / 2, z: 2.25, width: 0.5, height: CEILING, depth: 0.5, material: "concreto" },
    { x, y: 0.4, z: 2.0, width: 0.52, height: 0.8, depth: 0.02, material: "listrado" },
  ];
}

function cobogo(x: number): DecorData[] {
  const decor: DecorData[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      decor.push({
        x: x - 0.8 + col * 0.4,
        y: 1.0 + row * 0.4,
        z: BACK_Z - 0.06,
        width: 0.28,
        height: 0.28,
        depth: 0.05,
        material: "janela",
      });
    }
  }
  return decor;
}

function stripes(x: number, y: number, height: number, width: number): DecorData[] {
  const count = Math.round(height / 0.3);
  return Array.from({ length: count }, (_, i): DecorData => ({
    x,
    y: y - height / 2 + 0.15 + i * 0.3,
    z: LANE_Z - LANE_DEPTH / 2 - 0.02,
    width: width + 0.02,
    height: 0.15,
    depth: 0.02,
    material: i % 2 === 0 ? "listrado" : "janela",
  }));
}

// Subsolo: tubos fluorescentes velhos, esverdeados; o primeiro é o poste de sódio da rampa.
const lamps: LampData[] = ([
  { x: 126, y: 2.75, tom: "sodio" },
  { x: 133, y: 2.75, flicker: true },
  { x: 140, y: 2.75 },
  { x: 147, y: 2.75, flicker: true },
  { x: 156, y: 2.75 },
  { x: 162, y: 2.75, flicker: true },
  { x: 172, y: 2.75 },
  { x: 180, y: 2.75, flicker: true },
  { x: 188, y: 2.75 },
  { x: 196, y: 2.75 },
] as LampData[]).map((lamp) => ({ tom: "subsolo", ...lamp }));

function groundWithRecess(): BlockData[] {
  const a = DEPOT_PLATE_X - DEPOT_PLATE_WIDTH / 2;
  const b = DEPOT_PLATE_X + DEPOT_PLATE_WIDTH / 2;
  return [
    { x: (START + a) / 2, y: -0.5, width: a - START, height: 1, material: "asfalto" },
    { x: DEPOT_PLATE_X, y: -0.5 - DEPOT_PLATE_DEPTH, width: DEPOT_PLATE_WIDTH, height: 1, material: "concreto" },
    { x: (b + END + 1) / 2, y: -0.5, width: END + 1 - b, height: 1, material: "asfalto" },
  ];
}

export const area4Level: LevelData = {
  checkpoints: [
    { x: 124, y: 1.2 },
    { x: 154, y: 1.2 },
    { x: 168.6, y: 1.2 },
  ],
  killY: -5,
  bounds: { minX: START, maxX: END },
  ambiente: [{ minX: START, maxX: END, intensidade: 0.36, cor: [0.56, 0.62, 0.44] }],
  vultos: [],
  depth: 4,
  ground: groundWithRecess(),
  walls: [
    { x: (START + RAMP_END) / 2, y: HALL_CEILING + 0.2, width: RAMP_END - START, height: 0.4, material: "concreto" },
    { x: (RAMP_END + END) / 2, y: CEILING + 0.2, width: END - RAMP_END, height: 0.4, material: "concreto" },
  ],
  platforms: [],
  obstacles: [
    laneBlock(BAR_X, (GAP + CEILING) / 2, 0.25, CEILING - GAP, "listrado"),
    barrier(BARRIER_X, 1),
    barrier(BARRIER2_X, 0.8),
    ...SLIDES2.map((x) => laneBlock(x, (GAP + CEILING) / 2, 0.25, CEILING - GAP, "listrado")),
    ...BARRIERS2.map((x) => barrier(x, 0.9)),
  ],
  ramps: [{ x0: START, y0: GALLERY_Y, x1: RAMP_END, y1: 0, material: "concreto" }],
  boxes: [{ x: DEPOT_BOX_X, y: 0.5, size: 1, mass: 20, material: "metal", visual: GAS_CART_VISUAL, pegada: GAS_CART_GRIP }],
  lamps,
  plates: [{ x: DEPOT_PLATE_X, y: -DEPOT_PLATE_DEPTH, width: DEPOT_PLATE_WIDTH, door: 1 }],
  doors: [
    { x: GATE_X, y: CEILING / 2, width: 0.25, height: CEILING, openHeight: GAP, closeAfterX: GATE_X + 0.6 },
    { x: DEPOT_GATE_X, y: CEILING / 2, width: 0.25, height: CEILING, openHeight: 2.3 },
    { x: GATE2_X, y: CEILING / 2, width: 0.25, height: CEILING, openHeight: GAP, closeAfterX: GATE2_X + 0.6 },
  ],
  vigias: [
    {
      mode: "perseguicao",
      triggerX: 128,
      x0: DOOR1_X,
      porta: { z: BACK_Z },
      x1: GATE_X - GATE_STOP,
      y: 0,
      z: 1.4,
      speed: 4.3,
      elastico: ELASTICO,
      pause: 0,
      aimAhead: 5,
      aimY: 0.9,
      coneAngle: 0.45,
      range: 9,
    },
    {
      mode: "perseguicao",
      triggerX: CHASE2_TRIGGER,
      x0: DOOR2_X,
      porta: { z: BACK_Z },
      x1: GATE2_X - GATE_STOP,
      y: 0,
      z: 1.4,
      speed: 4.3,
      elastico: ELASTICO,
      pause: 0,
      aimAhead: 5,
      aimY: 0.9,
      coneAngle: 0.45,
      range: 9,
    },
  ],
  elevators: [],
  decor: [
    // Narrativa: mochila esquecida no depósito.
    { x: 159.2, y: 0.22, z: 1.3, width: 0.36, height: 0.44, depth: 0.2, material: "tecido" },
    { x: 158.4, y: 0.01, z: 1.0, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    { x: 160.3, y: 0.01, z: 0.7, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    ...SLIDES2.flatMap((x) => [
      ...stripes(x, (GAP + CEILING) / 2, CEILING - GAP, 0.25),
      { x, y: CEILING - 0.02, z: LANE_Z, width: 0.08, height: 0.04, depth: LANE_DEPTH, material: "metal" } as DecorData,
    ]),
    ...[DEPOT_GATE_X, GATE2_X].map((x): DecorData => ({ x, y: CEILING / 2, z: BACK_Z - 0.1, width: 0.6, height: CEILING, depth: 0.2, material: "concreto" })),
    ...[164, 170, 175, 180, 185, 190, 195].flatMap(column),
    ...[172.5, 187.5].flatMap(cobogo),
    { x: (START + RAMP_END) / 2, y: GALLERY_Y / 2 - 0.2, z: 0, width: RAMP_END - START, height: GALLERY_Y - 0.4, depth: 4, material: "concreto" },
    { x: (RAMP_END + END) / 2, y: CEILING + 2.2, z: 0, width: END - RAMP_END, height: 3.6, depth: 4.6, material: "concreto" },
    { x: RAMP_END - 0.2, y: (CEILING + HALL_CEILING) / 2 + 0.2, z: 0, width: 0.4, height: HALL_CEILING - CEILING, depth: 4.6, material: "concreto" },

    { x: (RAMP_END + END) / 2, y: 0.45, z: BACK_Z, width: END - RAMP_END, height: 0.9, depth: 0.1, material: "concreto" },
    { x: (RAMP_END + END) / 2, y: 1.95, z: BACK_Z + 0.03, width: END - RAMP_END, height: 2.1, depth: 0.1, material: "parede" },
    ...[125, 130, 135, 140, 145, 150, 155, 160].flatMap(column),
    ...[132.5, 147.5].flatMap(cobogo),

    ...[127, 131, 137, 141, 146, 150, 155, 159].map((x): DecorData => ({
      x, y: 0.005, z: -1, width: 0.12, height: 0.01, depth: 1.8, material: "listrado",
    })),
    ...stripes(BAR_X, (GAP + CEILING) / 2, CEILING - GAP, 0.25),
    { x: BAR_X, y: CEILING - 0.02, z: LANE_Z, width: 0.08, height: 0.04, depth: LANE_DEPTH, material: "metal" },
    { x: GATE_X, y: CEILING / 2, z: BACK_Z - 0.1, width: 0.6, height: CEILING, depth: 0.2, material: "concreto" },

  ],
  props: [
    // Barreiras de concreto prontas na faixa de corrida.
    ...barrierVisual(BARRIER_X, 1),
    ...barrierVisual(BARRIER2_X, 0.8),
    ...BARRIERS2.flatMap((x) => barrierVisual(x, 0.9)),
    // Luminárias fluorescentes no teto baixo.
    ...lamps.map((lamp) => fluorescent(lamp.x, CEILING - 0.01)),
    // Canos descendo pela parede do fundo, ao lado de algumas colunas.
    ...[125, 140, 155, 170, 185].map((x): PropData => ({ model: "modular_pipes", part: "pipe_200cm_metal", x: x + 0.55, y: 0, z: BACK_Z - 0.12, scale: 1.5 })),
    ...[130, 175].map((x): PropData => ({ model: "modular_pipes", part: "pipe_200cm_metal", x: x - 0.5, y: 0, z: BACK_Z - 0.12, scale: 2.4, stretch: [1, 0.625, 1] })),
    // Depósito: prateleiras de aço com caixas, tambores e pneus velhos.
    ...[157.5, 160.5].map((x): PropData => ({ model: "steel_frame_shelves_01", x, y: 0, z: BACK_Z - 0.35, rotY: 180, fitHeight: 2.2 })),
    { model: "cardboard_box_01", x: 157.1, y: 0.95, z: BACK_Z - 0.35, rotY: 92 },
    { model: "cardboard_box_01", x: 157.8, y: 0.95, z: BACK_Z - 0.35, rotY: 86 },
    { model: "plastic_crate_01", x: 160.2, y: 0.95, z: BACK_Z - 0.35, rotY: 90 },
    { model: "cardboard_box_01", x: 160.7, y: 1.85, z: BACK_Z - 0.35, rotY: 95 },
    { model: "plastic_crate_01", x: 157.4, y: 1.85, z: BACK_Z - 0.35, rotY: 88 },
    { model: "barrel_03", x: 154.2, y: 0, z: 2.15 },
    { model: "barrel_03", x: 154.85, y: 0, z: 2.2, rotY: 70 },
    // Garagem: pneus, sacos de lixo e caixas de força.
    ...[0, 1, 2].map((i): PropData => ({ model: "old_tyre", x: 128.3 + i * 0.12, y: 0, z: 2.05 + i * 0.17, rotY: 25 - i * 8 })),
    { model: "trashbag", x: 136.6, y: 0, z: 2.25 },
    { model: "trashbag", x: 137.1, y: 0, z: 2.3, rotY: 60 },
    { model: "utility_box_01", x: 144.2, y: 0, z: 2.3, rotY: 180 },
    { model: "power_box_01", x: 126.4, y: 1.5, z: BACK_Z - 0.04, rotY: 180 },
    { model: "security_camera_01", x: 165.4, y: 2.75, z: BACK_Z - 0.1, rotY: 220 },
    { model: "trashbag", x: 178.4, y: 0, z: 2.25, rotY: 20 },
    { model: "utility_box_02", x: 182.2, y: 0, z: 2.3, rotY: 180 },
    { model: "barrel_03", x: 191.2, y: 0, z: 2.2, rotY: 15 },
    { model: "old_tyre", x: 197.4, y: 0, z: 2.3, rotY: 8 },
  ],
};
