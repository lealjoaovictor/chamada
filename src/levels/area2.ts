import type { BlockData, DecorData, LampData, LevelData } from "./types";

const START = 48;
const END = 76;
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
const STAGE_X0 = 84;
const STAGE_X1 = 91;
const STAGE_TOP = 2.0;
const STAGE_PLATE_X = 89;
const STAGE_PLATE_WIDTH = 1.4;
const STAGE_PLATE_DEPTH = 0.2;
const GATE2_X = 93;
const GATE2_OPEN = 2.2;
const ROOM2_END = 95;

// Sala 3 (sala escura): três vãos no piso que só aparecem nos lampejos das lâmpadas.
const PITS: [number, number][] = [
  [99.5, 101.1],
  [104.5, 106.3],
  [109.8, 111.6],
];
const END2 = 118;

function archWindow(x: number): DecorData[] {
  return [
    { x, y: 2.05, z: BACK_Z - 0.05, width: 1.1, height: 1.5, depth: 0.1, material: "moldura" },
    { x, y: 2.75, z: BACK_Z - 0.05, width: 1.1, height: 0.55, depth: 0.1, shape: "disc", material: "moldura" },
    { x, y: 2.0, z: BACK_Z - 0.1, width: 0.85, height: 1.3, depth: 0.1, material: "janela" },
  ];
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
  { x: 71.5, y: 2.7, flicker: true },
  { x: 81, y: 4.4 },
  { x: 89, y: 4.4, flicker: true },
  { x: 100.3, y: 2.7, flicker: "escuro" },
  { x: 105.4, y: 2.7, flicker: "escuro" },
  { x: 110.7, y: 2.7, flicker: "escuro" },
  { x: 116, y: 2.7 },
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
  checkpoints: [{ x: 74, y: 1.2 }, { x: 96.5, y: 1.2 }],
  killY: -5,
  bounds: { minX: START, maxX: END2 },
  escuro: [{ minX: ROOM2_END + 1, maxX: 114.5 }],
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
    ...stage(),
    // Rodapé na borda do palco: segura a caixa de cima para ela não cair de volta.
    { x: STAGE_X0 + 0.1, y: STAGE_TOP + 0.12, width: 0.2, height: 0.24, material: "madeira" },
  ],
  ramps: [],
  boxes: [
    { x: 59.5, y: 0.5, size: 1, mass: 20, material: "carrinho" },
    { x: 80.5, y: 0.5, size: 1, mass: 20, material: "caixa" },
    { x: 86.2, y: STAGE_TOP + 0.5, size: 1, mass: 20, material: "caixa" },
  ],
  lamps,
  plates: [
    { x: RECESS_X, y: -RECESS_DEPTH, width: RECESS_WIDTH, door: 0 },
    { x: STAGE_PLATE_X, y: STAGE_TOP - STAGE_PLATE_DEPTH, width: STAGE_PLATE_WIDTH, door: 1 },
  ],
  doors: [
    { x: DOOR_X, y: CEILING / 2, width: 0.25, height: CEILING, openHeight: ARM_HEIGHT },
    { x: GATE2_X, y: ROOM2_CEILING / 2, width: 0.25, height: ROOM2_CEILING, openHeight: GATE2_OPEN },
  ],
  vigias: [],
  elevators: [],
  decor: [
    { x: START, y: CEILING + 1.9, z: 0, width: 0.8, height: 3.4, depth: 4.4, material: "pedra" },
    { x: (START + ROOM1_END) / 2, y: CEILING + 2.1, z: 0, width: ROOM1_END - START, height: 3.4, depth: 4.6, material: "pedra" },

    { x: 51, y: 0.8, z: BACK_Z, width: 6, height: 1.6, depth: 0.1, material: "madeira" },
    { x: 51, y: 2.4, z: BACK_Z + 0.05, width: 6, height: 1.6, depth: 0.1, material: "parede" },
    { x: 50, y: 1.25, z: BACK_Z - 0.06, width: 1.3, height: 2.5, depth: 0.1, material: "moldura" },
    { x: 50, y: 1.2, z: BACK_Z - 0.1, width: 1.1, height: 2.4, depth: 0.1, material: "madeira" },
    { x: 52.6, y: 1.25, z: BACK_Z - 0.06, width: 1.3, height: 2.5, depth: 0.1, material: "moldura" },
    { x: 52.6, y: 1.2, z: BACK_Z - 0.1, width: 1.1, height: 2.4, depth: 0.1, material: "madeira" },

    { x: (54 + ROOM1_END) / 2, y: 0.55, z: BACK_Z, width: ROOM1_END - 54, height: 1.1, depth: 0.1, material: "pedra" },
    { x: (54 + ROOM1_END) / 2, y: 2.15, z: BACK_Z + 0.05, width: ROOM1_END - 54, height: 2.1, depth: 0.1, material: "parede" },
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
    ...[82, 87.5].flatMap(archWindow).map((d) => ({ ...d, y: d.y + 1 })),
    { x: GATE2_X, y: ROOM2_CEILING / 2, z: BACK_Z - 0.05, width: 0.6, height: ROOM2_CEILING, depth: 0.2, material: "concreto" },
    { x: GATE2_X - 0.25, y: ROOM2_CEILING / 2, z: -1.95, width: 0.25, height: ROOM2_CEILING, depth: 0.15, material: "concreto" },

    // Sala 3: sala escura.
    { x: (ROOM2_END + END2) / 2, y: CEILING + 2.1, z: 0, width: END2 - ROOM2_END, height: 3.4, depth: 4.6, material: "pedra" },
    { x: (ROOM2_END + END2) / 2, y: 0.55, z: BACK_Z, width: END2 - ROOM2_END, height: 1.1, depth: 0.1, material: "pedra" },
    { x: (ROOM2_END + END2) / 2, y: 2.15, z: BACK_Z + 0.05, width: END2 - ROOM2_END, height: 2.1, depth: 0.1, material: "parede" },
    ...[102.8, 108, 113.5].flatMap(archWindow),
  ],
};
