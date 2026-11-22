import type { DecorData, LampData, LevelData } from "./types";

const START = 166;
const STAIRS_START = 166.5;
const STAIRS_END = 170.5;
const FLOOR = 1.5;
const CEILING = FLOOR + 3.2;
const DOOR_X = 207;
const DOOR_HEIGHT = 2.6;
const END = 219;
const BACK_Z = 2.1;
const STEPS = 6;

function archWindow(x: number): DecorData[] {
  return [
    { x, y: FLOOR + 2.05, z: BACK_Z - 0.05, width: 1.1, height: 1.5, depth: 0.1, material: "moldura" },
    { x, y: FLOOR + 2.75, z: BACK_Z - 0.05, width: 1.1, height: 0.55, depth: 0.1, shape: "disc", material: "moldura" },
    { x, y: FLOOR + 2.0, z: BACK_Z - 0.1, width: 0.85, height: 1.3, depth: 0.1, material: "janela" },
  ];
}

function speaker(x: number, scale: number): DecorData[] {
  return [
    { x, y: FLOOR + 2.75, z: BACK_Z - 0.2, width: 0.45 * scale, height: 0.35 * scale, depth: 0.3, material: "metal" },
    { x, y: FLOOR + 2.75, z: BACK_Z - 0.36, width: 0.36 * scale, height: 0.26 * scale, depth: 0.02, material: "janela" },
  ];
}

function desk(x: number, z: number): DecorData[] {
  return [
    { x, y: FLOOR + 0.74, z, width: 1, height: 0.05, depth: 0.55, material: "madeira" },
    { x, y: FLOOR + 0.36, z: z + 0.22, width: 0.9, height: 0.72, depth: 0.04, material: "metal" },
    { x: x - 0.55, y: FLOOR + 0.45, z, width: 0.42, height: 0.05, depth: 0.42, material: "madeira" },
    { x: x - 0.78, y: FLOOR + 0.7, z, width: 0.05, height: 0.5, depth: 0.42, material: "madeira" },
    { x: x - 0.55, y: FLOOR + 0.22, z, width: 0.38, height: 0.44, depth: 0.04, material: "metal" },
  ];
}

const lamps: LampData[] = [
  { x: 174, y: FLOOR + 2.6, flicker: true },
  { x: 188, y: FLOOR + 2.6, flicker: true, diesWhenPassed: true },
  { x: 205.8, y: FLOOR + 2.6 },
  { x: 213, y: FLOOR + 3, moonlight: true },
];

export const area5Level: LevelData = {
  checkpoints: [{ x: 172, y: FLOOR + 1.2 }],
  killY: -5,
  bounds: { minX: START, maxX: END },
  depth: 4,
  ground: [{ x: (STAIRS_END + END + 1) / 2, y: (FLOOR - 1) / 2, width: END + 1 - STAIRS_END, height: FLOOR + 1, material: "piso" }],
  walls: [
    { x: END + 0.5, y: 4, width: 1, height: 8, material: "pedra" },
    { x: (START + END) / 2, y: CEILING + 0.2, width: END - START, height: 0.4, material: "concreto" },
  ],
  platforms: [],
  obstacles: [],
  ramps: [{ x0: STAIRS_START, y0: 0, x1: STAIRS_END, y1: FLOOR, hidden: true }],
  boxes: [],
  lamps,
  plates: [],
  doors: [],
  vigias: [],
  elevators: [],
  finalDoor: { x: DOOR_X, floorY: FLOOR, height: DOOR_HEIGHT, depth: 1.6, triggerX: 206.4, walkToX: 211.5 },
  decor: [
    ...Array.from({ length: STEPS }, (_, i): DecorData => {
      const step = (STAIRS_END - STAIRS_START) / STEPS;
      const height = ((i + 1) * FLOOR) / STEPS;
      return { x: STAIRS_START + step * (i + 0.5), y: height / 2, z: 0, width: step, height, depth: 4, material: "pedra" };
    }),
    { x: START + 0.5, y: (3 + CEILING + 0.4) / 2, z: 0, width: 1, height: CEILING + 0.4 - 3, depth: 4.6, material: "concreto" },
    { x: (START + END) / 2, y: CEILING + 2, z: 0, width: END - START, height: 3.2, depth: 4.6, material: "pedra" },

    { x: (STAIRS_END + DOOR_X) / 2, y: FLOOR + 0.55, z: BACK_Z, width: DOOR_X - STAIRS_END, height: 1.1, depth: 0.1, material: "pedra" },
    { x: (START + DOOR_X) / 2, y: (FLOOR + CEILING) / 2 + 0.3, z: BACK_Z + 0.05, width: DOOR_X - START, height: CEILING - FLOOR, depth: 0.1, material: "parede" },
    ...[177, 183, 195, 201].flatMap(archWindow),
    ...speaker(180, 1),
    ...speaker(189, 1.1),
    ...speaker(195.5 + 1.5, 1.25),
    ...speaker(201.5 + 1, 1.4),
    ...speaker(205, 1.6),

    { x: DOOR_X, y: (FLOOR + DOOR_HEIGHT + CEILING) / 2, z: 0, width: 0.3, height: CEILING - FLOOR - DOOR_HEIGHT, depth: 4, material: "parede" },
    { x: DOOR_X, y: FLOOR + DOOR_HEIGHT + 0.25, z: -0.8, width: 0.4, height: 0.5, depth: 1.8, shape: "disc", material: "moldura" },
    { x: DOOR_X, y: FLOOR + DOOR_HEIGHT / 2, z: -1.85, width: 0.35, height: DOOR_HEIGHT, depth: 0.5, material: "moldura" },
    { x: DOOR_X, y: FLOOR + DOOR_HEIGHT / 2, z: 1.2, width: 0.35, height: DOOR_HEIGHT, depth: 1.8, material: "parede" },

    { x: (DOOR_X + END) / 2, y: FLOOR + 0.6, z: BACK_Z, width: END - DOOR_X, height: 1.2, depth: 0.1, material: "madeira" },
    { x: (DOOR_X + END) / 2, y: (FLOOR + CEILING) / 2 + 0.3, z: BACK_Z + 0.05, width: END - DOOR_X, height: CEILING - FLOOR, depth: 0.1, material: "parede" },
    { x: 213.5, y: FLOOR + 2, z: BACK_Z - 0.06, width: 3.2, height: 1.3, depth: 0.05, material: "quadro" },
    { x: 213.5, y: FLOOR + 1.3, z: BACK_Z - 0.12, width: 3.3, height: 0.06, depth: 0.12, material: "moldura" },
    { x: 217.6, y: FLOOR + 2.1, z: BACK_Z - 0.06, width: 1.2, height: 1.9, depth: 0.05, material: "moldura" },
    { x: 217.6, y: FLOOR + 2.1, z: BACK_Z - 0.1, width: 1, height: 1.7, depth: 0.05, material: "luar" },
    { x: 216.8, y: FLOOR + 0.42, z: 1.1, width: 1.6, height: 0.84, depth: 0.7, material: "madeira" },
    ...[209.8, 212.2, 214.6].flatMap((x) => [...desk(x, -1.45), ...desk(x, 1.0)]),
  ],
};
