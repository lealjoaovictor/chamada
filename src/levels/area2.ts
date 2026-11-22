import type { DecorData, LampData, LevelData } from "./types";

const START = 48;
const END = 76;
const CEILING = 3.2;
const BACK_Z = 2.1;
const RECESS_X = 63;
const RECESS_WIDTH = 1.3;
const RECESS_DEPTH = 0.2;
const DOOR_X = 67;
const ARM_HEIGHT = 1.1;

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
];

export const area2Level: LevelData = {
  checkpoints: [{ x: 74, y: 1.2 }],
  killY: -5,
  bounds: { minX: START, maxX: END + 4 },
  depth: 4,
  ground: [
    { x: (START + RECESS_X - RECESS_WIDTH / 2) / 2, y: -0.5, width: RECESS_X - RECESS_WIDTH / 2 - START, height: 1, material: "piso" },
    { x: RECESS_X, y: -0.5 - RECESS_DEPTH, width: RECESS_WIDTH, height: 1, material: "concreto" },
    { x: (RECESS_X + RECESS_WIDTH / 2 + END + 4) / 2, y: -0.5, width: END + 4 - RECESS_X - RECESS_WIDTH / 2, height: 1, material: "piso" },
  ],
  walls: [
    { x: END + 4.5, y: 4, width: 1, height: 8, material: "pedra" },
    { x: (START + END + 4) / 2, y: CEILING + 0.2, width: END + 4 - START, height: 0.4, material: "concreto" },
  ],
  platforms: [],
  obstacles: [{ x: 55, y: (ARM_HEIGHT + CEILING) / 2, width: 0.12, height: CEILING - ARM_HEIGHT, material: "vidro" }],
  ramps: [],
  boxes: [{ x: 59.5, y: 0.5, size: 1, mass: 20, material: "carrinho" }],
  lamps,
  plates: [{ x: RECESS_X, y: -RECESS_DEPTH, width: RECESS_WIDTH, door: 0 }],
  doors: [{ x: DOOR_X, y: CEILING / 2, width: 0.25, height: CEILING, openHeight: ARM_HEIGHT }],
  decor: [
    { x: START, y: CEILING + 1.9, z: 0, width: 0.8, height: 3.4, depth: 4.4, material: "pedra" },
    { x: (START + END + 4) / 2, y: CEILING + 2.1, z: 0, width: END + 4 - START, height: 3.4, depth: 4.6, material: "pedra" },

    { x: 51, y: 0.8, z: BACK_Z, width: 6, height: 1.6, depth: 0.1, material: "madeira" },
    { x: 51, y: 2.4, z: BACK_Z + 0.05, width: 6, height: 1.6, depth: 0.1, material: "parede" },
    { x: 50, y: 1.25, z: BACK_Z - 0.06, width: 1.3, height: 2.5, depth: 0.1, material: "moldura" },
    { x: 50, y: 1.2, z: BACK_Z - 0.1, width: 1.1, height: 2.4, depth: 0.1, material: "madeira" },
    { x: 52.6, y: 1.25, z: BACK_Z - 0.06, width: 1.3, height: 2.5, depth: 0.1, material: "moldura" },
    { x: 52.6, y: 1.2, z: BACK_Z - 0.1, width: 1.1, height: 2.4, depth: 0.1, material: "madeira" },

    { x: (54 + END + 4) / 2, y: 0.55, z: BACK_Z, width: END + 4 - 54, height: 1.1, depth: 0.1, material: "pedra" },
    { x: (54 + END + 4) / 2, y: 2.15, z: BACK_Z + 0.05, width: END + 4 - 54, height: 2.1, depth: 0.1, material: "parede" },
    ...[58.5, 61, 70, 72.8].flatMap(archWindow),

    { x: (START + RECESS_X - RECESS_WIDTH / 2) / 2, y: 0.005, z: -0.9, width: RECESS_X - RECESS_WIDTH / 2 - START, height: 0.01, depth: 0.35, material: "tatil" },
    { x: (RECESS_X + RECESS_WIDTH / 2 + END + 4) / 2, y: 0.005, z: -0.9, width: END + 4 - RECESS_X - RECESS_WIDTH / 2, height: 0.01, depth: 0.35, material: "tatil" },

    { x: 55, y: 0.5, z: 1.3, width: 0.35, height: 1, depth: 0.5, material: "metal" },
    { x: 55, y: 0.5, z: -1.3, width: 0.35, height: 1, depth: 0.5, material: "metal" },
    { x: 55, y: ARM_HEIGHT - 0.03, z: 0, width: 0.08, height: 0.06, depth: 2.6, material: "metal" },
    { x: 55, y: CEILING - 0.05, z: 0, width: 0.2, height: 0.1, depth: 4, material: "metal" },

    { x: DOOR_X, y: CEILING / 2, z: BACK_Z - 0.05, width: 0.6, height: CEILING, depth: 0.2, material: "concreto" },
    { x: DOOR_X - 0.25, y: CEILING / 2, z: -1.95, width: 0.25, height: CEILING, depth: 0.15, material: "concreto" },

    ...lamps.map(hangingLamp),
  ],
};
