import type { DecorData, LampData, LevelData, PropData } from "./types";
import { fluorescent, moonWindow } from "./kits.ts";

const START = 166;
const STAIRS_START = 166.5;
const STAIRS_END = 170.5;
const FLOOR = 1.5;
const CEILING = FLOOR + 3.2;
// Corredor final, longo e sem repetição: cada lâmpada apaga quando o jogador passa (o prédio fechando atrás dele).
const CORRIDOR_LAMPS = [175, 183, 191.5, 199, 207, 214.5, 221];
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

/** Porta de outra sala, já fechada e apagada, com o visor de vidro escuro. */
function classDoor(x: number): DecorData[] {
  return [
    { x, y: FLOOR + 1.1, z: BACK_Z - 0.03, width: 1.0, height: 2.2, depth: 0.05, material: "madeira" },
    { x: x + 0.18, y: FLOOR + 1.55, z: BACK_Z - 0.06, width: 0.3, height: 0.5, depth: 0.02, material: "janela" },
    { x, y: FLOOR + 2.35, z: BACK_Z - 0.05, width: 1.16, height: 0.12, depth: 0.08, material: "moldura" },
  ];
}

/** Mural de avisos com folhas presas. */
function noticeBoard(x: number): DecorData[] {
  return [
    { x, y: FLOOR + 1.6, z: BACK_Z - 0.04, width: 1.4, height: 0.9, depth: 0.03, material: "madeira" },
    ...[[-0.4, 0.15], [-0.05, 0.08], [0.3, 0.18], [-0.25, -0.2], [0.2, -0.17]].map(([dx, dy]): DecorData => ({
      x: x + dx, y: FLOOR + 1.6 + dy, z: BACK_Z - 0.06, width: 0.21, height: 0.29, depth: 0.005, material: "papel",
    })),
  ];
}

const WINDOWS = [178.5, 188, 196, 211, 218];
const CLASS_DOORS = [181.5, 203.5];
const BOARDS = [192.5, 216];

/** Carteira escolar pronta com a cadeira atrás, viradas para o quadro (no fundo). */
function desk(x: number, z: number, turn = 0): PropData[] {
  return [
    { model: "SchoolDesk_01", x, y: FLOOR, z, rotY: 180 + turn },
    { model: "SchoolChair_01", x: x + 0.04, y: FLOOR, z: z - 0.55, rotY: 180 + turn * 2 },
  ];
}

const lamps: LampData[] = [
  // Corredor: fluorescente cada vez mais fraco, apagando atrás do jogador.
  ...CORRIDOR_LAMPS.map((x, i): LampData => ({
    x, y: FLOOR + 2.6, tom: "fluorescente", forca: 0.85 - i * 0.06, flicker: i % 3 === 2, diesWhenPassed: true,
  })),
  // A sala de aula: a única luz quente do jogo, vazando pela porta.
  { x: 208.4 + SHIFT, y: FLOOR + 2.6, tom: "sala", forca: 1.25 },
  { x: 212.3 + SHIFT, y: FLOOR + 2.8, tom: "sala", forca: 1.1 },
  { x: 216.4 + SHIFT, y: FLOOR + 2.8, tom: "sala", forca: 1.1 },
];

export const area5Level: LevelData = {
  checkpoints: [{ x: 172, y: FLOOR + 1.2 }],
  killY: -5,
  bounds: { minX: START, maxX: END },
  ambiente: [
    { minX: START, maxX: DOOR_X - 1.5, intensidade: 0.28, cor: [0.5, 0.55, 0.6] },
    { minX: DOOR_X - 1.5, maxX: END + 1, intensidade: 0.9, cor: [0.95, 0.76, 0.52] },
  ],
  // O professor em pé na mesa, com a lista, e o colega sentado numa carteira com o celular na mão.
  figurantes: [
    { modelo: "professor", x: 216.4 + SHIFT, y: FLOOR, z: 1.98, rotY: 180, pose: "em-pe", tom: [0.75, 0.72, 0.68], segura: "lista" },
    { modelo: "aluno", x: 212.25 + SHIFT, y: FLOOR, z: 0.42, rotY: 0, pose: "sentado", tom: [0.7, 0.7, 0.74], segura: "celular" },
  ],
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
    // Corredor: janelas, portas de outras salas já fechadas, murais e uma placa de saída.
    ...WINDOWS.flatMap(archWindow),
    ...CLASS_DOORS.flatMap(classDoor),
    ...BOARDS.flatMap(noticeBoard),
    { x: 199.5, y: CEILING - 0.35, z: BACK_Z - 0.06, width: 0.42, height: 0.16, depth: 0.04, material: "saida" },

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
    // Corredor: janelas, bancos, lixeira e a placa de piso molhado do faxineiro.
    ...WINDOWS.flatMap((x) => moonWindow(x, FLOOR + 1.15, BACK_Z)),
    ...[178.5, 196, 211].map((x): PropData => ({ model: "painted_wooden_bench", x, y: FLOOR, z: 1.75, rotY: 180, scale: 1.25 })),
    { model: "metal_trash_can", part: "metal_trash_can|metal_trash_can_handle_(left|right)|metal_trash_can_lid", x: 185.6, y: FLOOR, z: 1.8, scale: 0.8 },
    { model: "WetFloorSign_01", x: 207.5, y: FLOOR, z: 1.4, rotY: 160 },
    { model: "security_camera_01", x: 190, y: CEILING - 0.05, z: BACK_Z - 0.05, rotY: 200 },
    ...lamps.filter((lamp) => !lamp.moonlight).map((lamp) => fluorescent(lamp.x, CEILING - 0.01)),
    // Sala de aula: carteiras, mesa do professor e a janela do fundo.
    ...[209.8, 212.2, 214.6].map((x) => x + SHIFT).flatMap((x, i) => [...desk(x, -1.45, i - 1), ...desk(x, 1.0, 1 - i)]),
    { model: "metal_office_desk", x: 216.8 + SHIFT, y: FLOOR, z: 1.45, rotY: 180, scale: 0.8 },
    { model: "SchoolChair_01", x: 217.7 + SHIFT, y: FLOOR, z: 1.85, rotY: 35 },
    ...moonWindow(217.6 + SHIFT, FLOOR + 1.2, BACK_Z),
  ],
};
