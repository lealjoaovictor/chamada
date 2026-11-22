import type { BlockData, DecorData, LampData, LevelData } from "./types";

const START = 80;
const HALL_START = 84;
const SHAFT_X = 105.5;
const SHAFT_WIDTH = 2;
const GALLERY_Y = 3.5;
const END = 117;
const CORRIDOR_CEILING = 3.2;
const HALL_CEILING = 6.5;
const SHELF_Z = 1.45;
const SHELF_DEPTH = 1.1;
const SHELF_HEIGHT = 2.6;
const SHELF_WIDTH = 1.4;
const SHELF_XS = [86.5, 89.5, 92.5, 95.5, 98.5, 101.5];
const BACK_Z = 4.6;

function shelf(x: number): BlockData {
  return { x, y: SHELF_HEIGHT / 2, z: SHELF_Z, depth: SHELF_DEPTH, width: SHELF_WIDTH, height: SHELF_HEIGHT, material: "madeira" };
}

function books(x: number): DecorData[] {
  const front = SHELF_Z - SHELF_DEPTH / 2 - 0.02;
  return [0.35, 0.95, 1.55, 2.15].map((y) => ({
    x, y, z: front, width: SHELF_WIDTH - 0.2, height: 0.38, depth: 0.04, material: "livros",
  }));
}

function tallWindow(x: number): DecorData[] {
  return [
    { x, y: 2.9, z: BACK_Z - 0.05, width: 1.3, height: 3.8, depth: 0.1, material: "moldura" },
    { x, y: 4.8, z: BACK_Z - 0.05, width: 1.3, height: 0.65, depth: 0.1, shape: "disc", material: "moldura" },
    { x, y: 2.85, z: BACK_Z - 0.1, width: 1.05, height: 3.5, depth: 0.1, material: "luar" },
  ];
}

const lamps: LampData[] = [
  { x: 82, y: 2.7 },
  { x: 111, y: 5.6, flicker: true },
  { x: 89, y: 5, moonlight: true },
  { x: 98, y: 5, moonlight: true },
];

export const area3Level: LevelData = {
  checkpoints: [{ x: 110, y: GALLERY_Y + 1.2 }],
  killY: -5,
  bounds: { minX: START, maxX: END },
  depth: 4,
  ground: [{ x: (START + SHAFT_X + SHAFT_WIDTH / 2) / 2, y: -0.5, width: SHAFT_X + SHAFT_WIDTH / 2 - START, height: 1, material: "piso" }],
  walls: [
    { x: (START + HALL_START) / 2, y: CORRIDOR_CEILING + 0.2, width: HALL_START - START, height: 0.4, material: "concreto" },
    { x: (HALL_START + END) / 2, y: HALL_CEILING + 0.2, width: END - HALL_START, height: 0.4, material: "concreto" },
  ],
  platforms: [],
  obstacles: [
    ...SHELF_XS.map(shelf),
    {
      x: (SHAFT_X + SHAFT_WIDTH / 2 + END) / 2,
      y: GALLERY_Y / 2,
      width: END - SHAFT_X - SHAFT_WIDTH / 2,
      height: GALLERY_Y,
      material: "pedra",
    },
  ],
  ramps: [],
  boxes: [],
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
      pause: 2.2,
      aimAhead: 2.5,
      aimY: 0.4,
      coneAngle: 0.5,
      range: 10,
    },
  ],
  elevators: [
    { x: SHAFT_X, width: SHAFT_WIDTH, bottomY: 0, topY: GALLERY_Y, buttonX: 103.4, buttonY: 1 },
  ],
  decor: [
    { x: (START + HALL_START) / 2, y: CORRIDOR_CEILING + 2.1, z: 0, width: HALL_START - START, height: 3.4, depth: 4.6, material: "pedra" },
    { x: (START + HALL_START) / 2, y: 0.55, z: 2.1, width: HALL_START - START, height: 1.1, depth: 0.1, material: "pedra" },
    { x: (START + HALL_START) / 2, y: 2.15, z: 2.15, width: HALL_START - START, height: 2.1, depth: 0.1, material: "parede" },

    { x: (HALL_START + SHAFT_X) / 2, y: -0.5, z: 3.4, width: SHAFT_X - HALL_START, height: 1, depth: 2.8, material: "piso" },
    { x: (HALL_START + END) / 2, y: 0.6, z: BACK_Z, width: END - HALL_START, height: 1.2, depth: 0.1, material: "madeira" },
    { x: (HALL_START + END) / 2, y: 3.85, z: BACK_Z + 0.05, width: END - HALL_START, height: 5.3, depth: 0.1, material: "parede" },
    ...[85.5, 88, 91, 94, 97, 100].flatMap(tallWindow),
    ...SHELF_XS.flatMap(books),
    
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
