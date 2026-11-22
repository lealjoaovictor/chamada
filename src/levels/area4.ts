import type { BlockData, DecorData, LampData, LevelData } from "./types";

const START = 117;
const RAMP_END = 123;
const GALLERY_Y = 3.5;
const END = 166;
const CEILING = 3;
const HALL_CEILING = 6.5;
const LANE_Z = -0.65;
const LANE_DEPTH = 2.7;
const BACK_Z = 2.6;
const GAP = 1.1;
const BAR_X = 134;
const BARRIER_X = 143;
const GATE_X = 152;

function laneBlock(x: number, y: number, width: number, height: number, material: BlockData["material"]): BlockData {
  return { x, y, width, height, z: LANE_Z, depth: LANE_DEPTH, material };
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

const lamps: LampData[] = [
  { x: 126, y: 2.75 },
  { x: 133, y: 2.75, flicker: true },
  { x: 140, y: 2.75 },
  { x: 147, y: 2.75, flicker: true },
  { x: 156, y: 2.75 },
];

export const area4Level: LevelData = {
  checkpoints: [
    { x: 124, y: 1.2 },
    { x: 160, y: 1.2 },
  ],
  killY: -5,
  bounds: { minX: START, maxX: END },
  depth: 4,
  ground: [{ x: (START + END + 1) / 2, y: -0.5, width: END + 1 - START, height: 1, material: "asfalto" }],
  walls: [
    { x: (START + RAMP_END) / 2, y: HALL_CEILING + 0.2, width: RAMP_END - START, height: 0.4, material: "concreto" },
    { x: (RAMP_END + END) / 2, y: CEILING + 0.2, width: END - RAMP_END, height: 0.4, material: "concreto" },
  ],
  platforms: [],
  obstacles: [
    laneBlock(BAR_X, (GAP + CEILING) / 2, 0.25, CEILING - GAP, "listrado"),
    laneBlock(BARRIER_X, 0.5, 0.6, 1, "concreto"),
  ],
  ramps: [{ x0: START, y0: GALLERY_Y, x1: RAMP_END, y1: 0, material: "concreto" }],
  boxes: [],
  lamps,
  plates: [],
  doors: [{ x: GATE_X, y: CEILING / 2, width: 0.25, height: CEILING, openHeight: GAP, closeAfterX: GATE_X + 0.6 }],
  vigias: [
    {
      mode: "perseguicao",
      triggerX: 128,
      x0: 123,
      x1: GATE_X - 0.6,
      y: 0,
      z: 1.4,
      speed: 4.3,
      pause: 0,
      aimAhead: 5,
      aimY: 0.9,
      coneAngle: 0.45,
      range: 9,
    },
  ],
  elevators: [],
  decor: [
    { x: (START + RAMP_END) / 2, y: GALLERY_Y / 2 - 0.2, z: 0, width: RAMP_END - START, height: GALLERY_Y - 0.4, depth: 4, material: "concreto" },
    { x: (RAMP_END + END) / 2, y: CEILING + 2.2, z: 0, width: END - RAMP_END, height: 3.6, depth: 4.6, material: "concreto" },
    { x: RAMP_END - 0.2, y: (CEILING + HALL_CEILING) / 2 + 0.2, z: 0, width: 0.4, height: HALL_CEILING - CEILING, depth: 4.6, material: "concreto" },

    { x: (RAMP_END + END) / 2, y: 0.45, z: BACK_Z, width: END - RAMP_END, height: 0.9, depth: 0.1, material: "concreto" },
    { x: (RAMP_END + END) / 2, y: 1.95, z: BACK_Z + 0.03, width: END - RAMP_END, height: 2.1, depth: 0.1, material: "parede" },
    ...[125, 130, 135, 140, 145, 150, 155, 160].flatMap(column),
    ...[132.5, 147.5, 157.5].flatMap(cobogo),
    { x: 123.3, y: 1.1, z: BACK_Z - 0.06, width: 1.2, height: 2.2, depth: 0.08, material: "metal" },

    ...[127, 131, 137, 141, 146, 150, 155, 159].map((x): DecorData => ({
      x, y: 0.005, z: -1, width: 0.12, height: 0.01, depth: 1.8, material: "listrado",
    })),
    ...stripes(BAR_X, (GAP + CEILING) / 2, CEILING - GAP, 0.25),
    ...stripes(BARRIER_X, 0.5, 1, 0.6),
    { x: BAR_X, y: CEILING - 0.02, z: LANE_Z, width: 0.08, height: 0.04, depth: LANE_DEPTH, material: "metal" },
    { x: GATE_X, y: CEILING / 2, z: BACK_Z - 0.1, width: 0.6, height: CEILING, depth: 0.2, material: "concreto" },

    ...lamps.map((lamp): DecorData => ({
      x: lamp.x, y: (lamp.y + CEILING) / 2, z: 1.4, width: 0.6, height: CEILING - lamp.y, depth: 0.08, material: "metal",
    })),
  ],
};
