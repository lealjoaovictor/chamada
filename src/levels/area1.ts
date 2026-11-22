import type { BlockData, DecorData, LampData, LevelData } from "./types";

const FACADE_FRONT = 4;

function windowRow(y: number, fromX: number, toX: number, step: number, skip: number[] = []): DecorData[] {
  const decor: DecorData[] = [];
  for (let x = fromX; x <= toX; x += step) {
    if (skip.some((s) => Math.abs(s - x) < 0.01)) continue;
    decor.push({ x, y, z: FACADE_FRONT - 0.04, width: 1.1, height: 1.9, depth: 0.1, material: "moldura" });
    decor.push({ x, y: y - 0.05, z: FACADE_FRONT - 0.1, width: 0.85, height: 1.6, depth: 0.1, material: "janela" });
  }
  return decor;
}

function lampPost(x: number, height: number): DecorData {
  return { x, y: height / 2, z: 1.4, width: 0.12, height, depth: 0.12, shape: "cylinder", material: "metal" };
}

function tree(x: number, z: number, height: number): DecorData[] {
  return [
    { x, y: height / 2, z, width: 0.3, height, depth: 0.3, shape: "cylinder", material: "madeira" },
    { x, y: height, z, width: 3, height: 2.4, depth: 3, shape: "sphere", material: "vegetacao" },
  ];
}

// Sala 2 (garagem): o caixote está na doca de carga; empurrado para fora, cai na placa e o portão abre.
const DOCK_X = 51.5;
const DOCK_WIDTH = 3;
const DOCK_HEIGHT = 1;
const PLATE_X = 53.85;
const PLATE_WIDTH = 1.6;
const PLATE_DEPTH = 0.2;
const GATE_X = 58;
const GATE_HEIGHT = 3.2;
const GATE_OPEN = 2.4;
// Sala 3 (guarita): primeiro encontro com o Vigia, com vans estacionadas como cobertura.
const COVER_Z = 1.45;
const COVER_DEPTH = 1.4;
const VAN_HEIGHT = 2;
const VAN_XS = [76];
const GUARITA_X = 68.6;
const GUARITA_WIDTH = 4;
const VAN_WIDTH = 4.4;
const END = 92;

const lamps: LampData[] = [
  { x: 7, y: 3.4 },
  { x: 13.5, y: 3.4 },
  { x: 26.5, y: 3.4 },
  { x: 36, y: 5.2 },
  { x: 52, y: 3.4 },
  { x: 57, y: 3.4, flicker: true },
  { x: 70, y: 3.4 },
  { x: 86, y: 3.4 },
];

function van(x: number): BlockData {
  return { x, y: VAN_HEIGHT / 2, z: COVER_Z, depth: COVER_DEPTH, width: VAN_WIDTH, height: VAN_HEIGHT, material: "metal" };
}

function vanDetails(x: number): DecorData[] {
  return [
    { x: x + 1.5, y: 1.35, z: COVER_Z - COVER_DEPTH / 2 - 0.02, width: 0.9, height: 0.55, depth: 0.04, material: "janela" },
    { x: x - 1.4, y: 0.25, z: COVER_Z - COVER_DEPTH / 2 - 0.05, width: 0.55, height: 0.55, depth: 0.1, shape: "cylinder", material: "asfalto" },
    { x: x + 1.4, y: 0.25, z: COVER_Z - COVER_DEPTH / 2 - 0.05, width: 0.55, height: 0.55, depth: 0.1, shape: "cylinder", material: "asfalto" },
  ];
}

export const area1Level: LevelData = {
  checkpoints: [
    { x: 1, y: 1.2 },
    { x: 44, y: 1.2 },
    { x: 65, y: 1.2 },
  ],
  killY: -5,
  bounds: { minX: -5, maxX: END },
  depth: 4,
  ground: [
    { x: 1, y: -0.5, width: 14, height: 1, material: "asfalto" },
    { x: 28, y: -0.5, width: 40, height: 1, material: "concreto" },
    { x: (48 + PLATE_X - PLATE_WIDTH / 2) / 2, y: -0.5, width: PLATE_X - PLATE_WIDTH / 2 - 48, height: 1, material: "concreto" },
    { x: PLATE_X, y: -0.5 - PLATE_DEPTH, width: PLATE_WIDTH, height: 1, material: "concreto" },
    { x: (PLATE_X + PLATE_WIDTH / 2 + END) / 2, y: -0.5, width: END - PLATE_X - PLATE_WIDTH / 2, height: 1, material: "asfalto" },
  ],
  walls: [
    { x: -5.5, y: 4, width: 1, height: 8, material: "pedra" },
    { x: GATE_X, y: GATE_HEIGHT + 1.5, width: 0.6, height: 3, material: "concreto" },
  ],
  platforms: [
    { x: 21, y: 0.75, width: 4, height: 1.5, material: "pedra" },
    { x: DOCK_X, y: DOCK_HEIGHT / 2, width: DOCK_WIDTH, height: DOCK_HEIGHT, material: "concreto" },
  ],
  obstacles: [
    { x: 4.5, y: 0.45, width: 0.25, height: 0.9, material: "listrado" },
    { x: 10.5, y: 0.5, width: 1.6, height: 1, material: "pedra" },
    { x: 34.5, y: 1.1, width: 7, height: 2.2, material: "pedra" },
    { x: GUARITA_X, y: 1.3, z: COVER_Z, depth: COVER_DEPTH, width: GUARITA_WIDTH, height: 2.6, material: "parede" },
    ...VAN_XS.map(van),
  ],
  ramps: [
    { x0: 15, y0: 0, x1: 19, y1: 1.5, hidden: true },
    { x0: 38, y0: 2.2, x1: 42, y1: 0, material: "metal" },
  ],
  boxes: [
    { x: 28, y: 0.5, size: 1, mass: 20, material: "lixeira" },
    { x: DOCK_X + 0.8, y: DOCK_HEIGHT + 0.5, size: 1, mass: 20, material: "caixa" },
  ],
  lamps,
  plates: [{ x: PLATE_X, y: -PLATE_DEPTH, width: PLATE_WIDTH, door: 0 }],
  doors: [{ x: GATE_X, y: GATE_HEIGHT / 2, width: 0.25, height: GATE_HEIGHT, openHeight: GATE_OPEN }],
  vigias: [
    {
      x0: 72,
      x1: 86,
      y: 0,
      z: 3,
      speed: 0.9,
      pause: 1.8,
      pauseMax: 3.5,
      startHeading: -1,
      aimAhead: 2.5,
      aimY: 0.4,
      coneAngle: 0.5,
      range: 9,
    },
  ],
  elevators: [],
  decor: [
    ...[0, 1, 2, 3, 4, 5].map((i): DecorData => ({
      x: 15 + 0.333 + i * 0.667,
      y: (i + 1) * 0.125,
      width: 0.667,
      height: (i + 1) * 0.25,
      z: 0,
      depth: 4,
      material: "pedra",
    })),

    { x: 2.5, y: 0.006, z: -0.6, width: 0.5, height: 0.01, depth: 0.9, material: "moldura" },
    { x: 1.4, y: 0.006, z: -0.6, width: 0.5, height: 0.01, depth: 0.9, material: "moldura" },
    { x: 6.5, y: 0.3, z: -1.2, width: 0.3, height: 0.6, depth: 0.3, shape: "cylinder", material: "listrado" },
    { x: 8.2, y: 0.3, z: 1.5, width: 0.3, height: 0.6, depth: 0.3, shape: "cylinder", material: "listrado" },

    { x: 12.2, y: 0.6, z: 2.8, width: 0.6, height: 1.2, depth: 0.6, material: "moldura" },
    { x: 12.2, y: 1.45, z: 2.8, width: 0.5, height: 0.6, depth: 0.45, shape: "sphere", material: "pedra" },
    { x: 8.5, y: 0.25, z: 2.6, width: 1.8, height: 0.5, depth: 0.5, material: "concreto" },
    ...tree(3, 3, 3.6),
    ...tree(9.5, 3.5, 4.2),

    { x: 21, y: 5, z: FACADE_FRONT + 1.5, width: 19, height: 10, depth: 3, material: "pedra" },
    { x: 21, y: 4.75, z: FACADE_FRONT - 0.1, width: 19.2, height: 0.25, depth: 0.3, material: "moldura" },
    { x: 21, y: 10.1, z: FACADE_FRONT - 0.1, width: 19.4, height: 0.3, depth: 0.4, material: "moldura" },
    { x: 21, y: 11.2, z: FACADE_FRONT + 1, width: 3.2, height: 2.2, depth: 2, material: "pedra" },
    { x: 21, y: 11.3, z: FACADE_FRONT - 0.05, width: 1.2, height: 1.2, depth: 0.1, shape: "disc", material: "moldura" },
    ...windowRow(3, 12.8, 29.2, 2.05, [21]),
    ...windowRow(7.3, 12.8, 29.2, 2.05),
    { x: 21, y: 2.9, z: 2.3, width: 2.2, height: 3, depth: 0.3, material: "moldura" },
    { id: "porta-principal", x: 21, y: 2.85, z: 2.2, width: 1.7, height: 2.7, depth: 0.3, material: "madeira" },

    { x: 34.5, y: 2.22, z: 0, width: 7, height: 0.04, depth: 1.6, material: "metal" },
    { x: 34.5, y: 3.15, z: 1.6, width: 7, height: 0.06, depth: 0.06, material: "metal" },
    ...[31.2, 33.4, 35.6, 37.8].map((x): DecorData => ({
      x, y: 2.7, z: 1.6, width: 0.06, height: 1, depth: 0.06, material: "metal",
    })),
    { x: 40, y: 2.2, z: 1.6, width: 4.5, height: 0.06, depth: 0.06, material: "metal" },

    { x: 43, y: 1.6, z: 1.8, width: 0.4, height: 3.2, depth: 0.4, material: "pedra" },
    { x: 46, y: 1.6, z: 1.8, width: 0.4, height: 3.2, depth: 0.4, material: "pedra" },
    { x: 44.5, y: 3.1, z: 1.8, width: 3.4, height: 0.15, depth: 0.15, material: "metal" },
    { x: 46.6, y: 1.3, z: 0.6, width: 0.08, height: 2.4, depth: 2.2, material: "metal" },

    ...lamps.map((lamp) => lampPost(lamp.x, lamp.y)),

    { x: 58, y: 4, z: 5.5, width: 14, height: 8, depth: 2, material: "concreto" },
    { x: GATE_X, y: GATE_HEIGHT / 2, z: 2.3, width: 0.6, height: GATE_HEIGHT, depth: 0.3, material: "concreto" },
    { x: GATE_X, y: GATE_HEIGHT / 2, z: -2.1, width: 0.6, height: GATE_HEIGHT, depth: 0.3, material: "concreto" },
    { x: DOCK_X, y: DOCK_HEIGHT + 0.02, z: -0.3, width: DOCK_WIDTH, height: 0.04, depth: 2.6, material: "listrado" },
    { x: 80, y: 3.5, z: 5.2, width: 24, height: 7, depth: 2, material: "parede" },
    ...[74, 78, 82, 86].flatMap((x) => windowRow(3, x, x, 2.05).map((d) => ({ ...d, z: 4.15 }))),
    { x: GUARITA_X, y: 1.7, z: COVER_Z - COVER_DEPTH / 2 - 0.02, width: 1.2, height: 0.7, depth: 0.04, material: "janela" },
    { x: GUARITA_X, y: 2.68, z: COVER_Z, width: GUARITA_WIDTH + 0.4, height: 0.16, depth: COVER_DEPTH + 0.4, material: "concreto" },
    ...VAN_XS.flatMap(vanDetails),
    ...tree(31, 5, 5),

    { x: -6, y: 7, z: 18, width: 8, height: 14, depth: 6, material: "concreto" },
    { x: 4, y: 5, z: 20, width: 6, height: 10, depth: 6, material: "concreto" },
    { x: 41, y: 8, z: 18, width: 9, height: 16, depth: 6, material: "concreto" },
    { x: 54, y: 6, z: 20, width: 7, height: 12, depth: 6, material: "concreto" },
  ],
};
