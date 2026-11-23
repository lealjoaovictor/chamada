import type { DecorData, LampData, LevelData, PropData } from "./types";
import { fluorescent, moonWindow } from "./kits.ts";

const START = 166;
const STAIRS_START = 166.5;
const STAIRS_END = 170.5;
const FLOOR = 1.5;
const CEILING = FLOOR + 3.2;
// O corredor se repete: ao cruzar LOOP_X o jogador volta LOOP_BACK metros sem perceber,
// porque o trecho é periódico. A cada volta um grupo de lâmpadas apaga.
const LOOP_X = 206;
const LOOP_BACK = 18;
const LOOP_LAMPS = [179, 188, 197, 206, 215];
const LOOP_DARKEN = [[188, 206], [179, 197, 215]];
const LOOP_END = 218;
const SHIFT = 19;
const DOOR_X = 207 + SHIFT;
const DOOR_HEIGHT = 2.6;
const END = 219 + SHIFT;
const BACK_Z = 2.1;
const STEPS = 6;
/** Altura do tampo da carteira pronta. */
const DESK_TOP = 0.77;

/** Vidro escuro atrás da janela pronta (a moldura vem de `moonWindow`). */
function archWindow(x: number): DecorData[] {
  return [{ x, y: FLOOR + 2.0, z: BACK_Z - 0.04, width: 0.95, height: 1.55, depth: 0.02, material: "janela" }];
}

function speaker(x: number, scale: number): DecorData[] {
  return [
    { x, y: FLOOR + 2.75, z: BACK_Z - 0.2, width: 0.45 * scale, height: 0.35 * scale, depth: 0.3, material: "metal" },
    { x, y: FLOOR + 2.75, z: BACK_Z - 0.36, width: 0.36 * scale, height: 0.26 * scale, depth: 0.02, material: "janela" },
  ];
}

/** Carteira escolar pronta com a cadeira atrás, viradas para o quadro (no fundo). */
function desk(x: number, z: number, turn = 0): PropData[] {
  return [
    { model: "SchoolDesk_01", x, y: FLOOR, z, rotY: 180 + turn },
    { model: "SchoolChair_01", x: x + 0.04, y: FLOOR, z: z - 0.55, rotY: 180 + turn * 2 },
  ];
}

const lamps: LampData[] = [
  ...LOOP_LAMPS.map((x): LampData => ({ x, y: FLOOR + 2.6, flicker: true })),
  { x: 221, y: FLOOR + 2.6, flicker: true, diesWhenPassed: true },
  { x: 205.8 + SHIFT, y: FLOOR + 2.6 },
  { x: 213 + SHIFT, y: FLOOR + 3, moonlight: true },
];

export const area5Level: LevelData = {
  checkpoints: [{ x: 172, y: FLOOR + 1.2 }],
  killY: -5,
  bounds: { minX: START, maxX: END },
  vultos: [{ x: LOOP_END + 3, y: FLOOR, z: 0.7, facing: 1, anda: true }, { x: DOOR_X - 1.4, y: FLOOR, z: 1.2, facing: 1 }],
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
  finalDoor: { x: DOOR_X, floorY: FLOOR, height: DOOR_HEIGHT, depth: 1.6, triggerX: 206.4 + SHIFT, walkToX: 211.5 + SHIFT },
  laco: { gatilhoX: LOOP_X, recuo: LOOP_BACK, apagar: LOOP_DARKEN },
  decor: [
    // Narrativa: na sala vazia, uma prova esperando na carteira do meio.
    { x: 212.2 + SHIFT, y: FLOOR + DESK_TOP, z: -1.45, width: 0.3, height: 0.005, depth: 0.22, material: "papel" },
    { x: 212.2 + SHIFT + 0.42, y: FLOOR + 0.21, z: -1.95, width: 0.34, height: 0.42, depth: 0.2, material: "tecido" },
    ...Array.from({ length: STEPS }, (_, i): DecorData => {
      const step = (STAIRS_END - STAIRS_START) / STEPS;
      const height = ((i + 1) * FLOOR) / STEPS;
      return { x: STAIRS_START + step * (i + 0.5), y: height / 2, z: 0, width: step, height, depth: 4, material: "pedra" };
    }),
    { x: START + 0.5, y: (3 + CEILING + 0.4) / 2, z: 0, width: 1, height: CEILING + 0.4 - 3, depth: 4.6, material: "concreto" },
    { x: (START + END) / 2, y: CEILING + 2, z: 0, width: END - START, height: 3.2, depth: 4.6, material: "pedra" },

    { x: (STAIRS_END + DOOR_X) / 2, y: FLOOR + 0.55, z: BACK_Z, width: DOOR_X - STAIRS_END, height: 1.1, depth: 0.1, material: "pedra" },
    { x: (START + DOOR_X) / 2, y: (FLOOR + CEILING) / 2 + 0.3, z: BACK_Z + 0.05, width: DOOR_X - START, height: CEILING - FLOOR, depth: 0.1, material: "parede" },
    // Trecho periódico (janelas a cada 6 m, alto-falantes iguais) para a repetição não aparecer.
    ...Array.from({ length: 8 }, (_, i) => 177 + i * 6).flatMap(archWindow),
    ...Array.from({ length: 7 }, (_, i) => 180 + i * 6).flatMap((x) => speaker(x, 1)),
    ...speaker(LOOP_END + 2.5, 1.15),
    ...speaker(LOOP_END + 4.5, 1.3),
    ...speaker(LOOP_END + 6.6, 1.6),

    { x: DOOR_X, y: (FLOOR + DOOR_HEIGHT + CEILING) / 2, z: 0, width: 0.3, height: CEILING - FLOOR - DOOR_HEIGHT, depth: 4, material: "parede" },
    { x: DOOR_X, y: FLOOR + DOOR_HEIGHT + 0.25, z: -0.8, width: 0.4, height: 0.5, depth: 1.8, shape: "disc", material: "moldura" },
    { x: DOOR_X, y: FLOOR + DOOR_HEIGHT / 2, z: -1.85, width: 0.35, height: DOOR_HEIGHT, depth: 0.5, material: "moldura" },
    { x: DOOR_X, y: FLOOR + DOOR_HEIGHT / 2, z: 1.2, width: 0.35, height: DOOR_HEIGHT, depth: 1.8, material: "parede" },

    { x: (DOOR_X + END) / 2, y: FLOOR + 0.6, z: BACK_Z, width: END - DOOR_X, height: 1.2, depth: 0.1, material: "madeira" },
    { x: (DOOR_X + END) / 2, y: (FLOOR + CEILING) / 2 + 0.3, z: BACK_Z + 0.05, width: END - DOOR_X, height: CEILING - FLOOR, depth: 0.1, material: "parede" },
    { x: 213.5 + SHIFT, y: FLOOR + 2, z: BACK_Z - 0.06, width: 3.2, height: 1.3, depth: 0.05, material: "quadro" },
    { x: 213.5 + SHIFT, y: FLOOR + 1.3, z: BACK_Z - 0.12, width: 3.3, height: 0.06, depth: 0.12, material: "moldura" },
    { x: 217.6 + SHIFT, y: FLOOR + 2.06, z: BACK_Z - 0.04, width: 0.95, height: 1.6, depth: 0.02, material: "luar" },
  ],
  props: [
    // Corredor: janelas e bancos a cada 6 m (o trecho é periódico, então tudo se repete igual).
    ...Array.from({ length: 8 }, (_, i) => 177 + i * 6).flatMap((x) => moonWindow(x, FLOOR + 1.15, BACK_Z)),
    ...Array.from({ length: 8 }, (_, i) => 177 + i * 6).map((x): PropData => ({ model: "painted_wooden_bench", x, y: FLOOR, z: 1.75, rotY: 180, scale: 1.25 })),
    ...lamps.filter((lamp) => !lamp.moonlight).map((lamp) => fluorescent(lamp.x, CEILING - 0.01)),
    // Sala de aula: carteiras, mesa do professor e a janela do fundo.
    ...[209.8, 212.2, 214.6].map((x) => x + SHIFT).flatMap((x, i) => [...desk(x, -1.45, i - 1), ...desk(x, 1.0, 1 - i)]),
    { model: "metal_office_desk", x: 216.8 + SHIFT, y: FLOOR, z: 1.45, rotY: 180, scale: 0.8 },
    { model: "SchoolChair_01", x: 216.9 + SHIFT, y: FLOOR, z: 1.95, rotY: 10 },
    ...moonWindow(217.6 + SHIFT, FLOOR + 1.2, BACK_Z),
  ],
};
