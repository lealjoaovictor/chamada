import type { StickerData, DecorData, LampData, LevelData, PropData } from "./types";
import { fluorescent, moonWindow } from "./kits.ts";

const START = 166;
const STAIRS_START = 166.5;
const STAIRS_END = 170.5;
const FLOOR = 1.5;
const CEILING = FLOOR + 3.2;
// Corredor do segundo andar, longo e sem repetição: cada lâmpada apaga quando o jogador passa (o prédio fechando
// atrás dele). No fim, a sala 204 (a de sempre) está vazia: hoje a aula foi para o Lab. 3 do bloco C.
const CORRIDOR_LAMPS = [175, 183, 191.5, 199, 207, 214.5, 221];
const SHIFT = 19;
const DOOR_X = 207 + SHIFT;
const DOOR_HEIGHT = 2.6;
const END = 219 + SHIFT;
const BACK_Z = 2.1;
// Saída da 204: a porta do fundo, aberta, dá para a passarela coberta que liga ao bloco C (área 6).
const BACK_DOOR_TOP = FLOOR + 2.6;
/** Segurança cochilando no banco do corredor (no meio do trecho agachado). */
const NAP_X = 196;
const NAP_SEAT = FLOOR + 0.02;
const FURTIVO_MIN = 189.5;
const FURTIVO_MAX = 202.5;
const STEPS = 8;
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

const WINDOWS = [178.5, 188, 211, 218];
const CLASS_DOORS = [181.5, 203.5];
const BOARDS = [192.5, 216];

/** Altura do assento da cadeira pronta (a cadeira virada encosta o assento no tampo da carteira). */
const CHAIR_SEAT = 0.46;
const CHAIR_HEIGHT = 0.86;

/** Fim de aula: a cadeira vai de cabeça para baixo em cima da carteira (para a limpeza da manhã). */
function deskWithChairUp(x: number, z: number, turn = 0): PropData[] {
  return [
    { model: "SchoolDesk_01", x, y: FLOOR, z, rotY: 180 + turn },
    { model: "SchoolChair_01", x: x + 0.02, y: FLOOR + DESK_TOP + CHAIR_HEIGHT - CHAIR_SEAT, z: z - 0.05, rotY: turn * 2, virada: true },
  ];
}

const lamps: LampData[] = [
  // Corredor: fluorescente cada vez mais fraco, apagando atrás do jogador.
  ...CORRIDOR_LAMPS.map((x, i): LampData => ({
    x, y: FLOOR + 2.6, tom: "fluorescente", forca: 0.85 - i * 0.06, flicker: i === 2, zumbido: i === 2, diesWhenPassed: true,
  })),
  // A 204: luzes apagadas (a aula não foi aqui). Só o luar da janela.
  { x: 210.3 + SHIFT, y: FLOOR + 2.8, tom: "sala", desligada: true },
  { x: 215.2 + SHIFT, y: FLOOR + 2.6, moonlight: true, forca: 0.55 },
];

export const area5Level: LevelData = {
  checkpoints: [{ x: 172, y: FLOOR + 1.2 }],
  // A sala de sempre: a porta abre para uma sala escura, com as cadeiras em cima das carteiras.
  salaVazia: {
    porta: { x: DOOR_X, floorY: FLOOR, height: DOOR_HEIGHT, depth: 1.6, triggerX: 206.4 + SHIFT, walkToX: 209.6 + SHIFT },
    quadroX: 213 + SHIFT,
  },
  furtivo: [{ minX: FURTIVO_MIN, maxX: FURTIVO_MAX }],
  killY: -5,
  bounds: { minX: START, maxX: END },
  // Corredor do 2º andar: placa do bloco, números das salas, cartazes perto dos murais, umidade e marcas.
  adesivos: [
    { kind: "placa", x: 173.4, y: FLOOR + 2.75, z: BACK_Z - 0.07, width: 1.5, height: 0.34, color: "#262626", ink: "#d9d2bf", glow: 0.24, text: ["BLOCO B • 2º ANDAR"] },
    { kind: "placa", x: 186, y: FLOOR + 2.75, z: BACK_Z - 0.07, width: 1.6, height: 0.36, color: "#1f3a34", ink: "#e6e0cc", glow: 0.24, text: ["SALAS 201–204  →"] },
    ...[["201", CLASS_DOORS[0]], ["203", CLASS_DOORS[1]], ["204", DOOR_X]].map(([text, x]): StickerData => ({
      kind: "placa", x: (x as number) + 0.85, y: FLOOR + 1.6, z: BACK_Z - 0.07, width: 0.32, height: 0.22, color: "#d8d2c0", ink: "#1a1a1a", glow: 0.24, text: [text as string],
    })),
    { kind: "cartaz", x: BOARDS[0] - 1.1, y: FLOOR + 1.75, z: BACK_Z - 0.06, width: 0.55, height: 0.75, rot: -0.03, color: "#ebe6d8", ink: "#b3201a", glow: 0.45, text: ["ASSEMBLEIA", "QUINTA • 18H", "AUDITÓRIO B"] },
    { kind: "cartaz", x: BOARDS[1] + 1.1, y: FLOOR + 1.7, z: BACK_Z - 0.06, width: 0.55, height: 0.78, rot: 0.04, color: "#f0c63a", ink: "#2a1a10", glow: 0.45, text: ["ESTÁGIO", "VAGAS", "MURAL DO CA"] },
    { kind: "rachadura", x: 200.5, y: FLOOR + 2.4, z: BACK_Z - 0.06, width: 1.6, height: 0.5 },
    { kind: "umidade", x: 185, y: FLOOR + 0.55, z: BACK_Z - 0.06, width: 5, height: 1.1 },
    { kind: "umidade", x: 222, y: FLOOR + 0.55, z: BACK_Z - 0.06, width: 4, height: 1.1 },
    { kind: "mancha", x: 188.4, y: FLOOR + 0.02, z: -0.3, width: 2.4, height: 1.4, chao: true },
    { kind: "mancha", x: 213.4, y: FLOOR + 0.02, z: 0.7, width: 1.8, height: 1.2, chao: true },
  ],
  primeiroPlano: [
    { x0: START, x1: STAIRS_START, y0: 0, material: "asfalto" },
    { x0: STAIRS_START, x1: STAIRS_END, y0: 0, y1: FLOOR, material: "concreto" },
    { x0: STAIRS_END, x1: END, y0: FLOOR },
  ],
  ambiente: [
    { minX: START, maxX: DOOR_X - 1.5, intensidade: 0.28, cor: [0.5, 0.55, 0.6] },
    { minX: DOOR_X - 1.5, maxX: END + 1, intensidade: 0.2, cor: [0.42, 0.5, 0.66] },
  ],
  depth: 4,
  ground: [{ x: (STAIRS_END + END + 1) / 2, y: (FLOOR - 1) / 2, width: END + 1 - STAIRS_END, height: FLOOR + 1, material: "piso" }],
  walls: [
    // Parede do fundo da 204, com a porta dos fundos (a saída para a passarela).
    { x: END + 0.5, y: FLOOR / 2, width: 1, height: FLOOR, material: "parede" },
    { x: END + 0.5, y: (BACK_DOOR_TOP + 8) / 2, width: 1, height: 8 - BACK_DOOR_TOP, material: "pedra" },
    { x: (START + END) / 2, y: CEILING + 0.2, width: END - START, height: 0.4, material: "concreto" },
  ],
  platforms: [],
  obstacles: [],
  ramps: [{ x0: STAIRS_START, y0: 0, x1: STAIRS_END, y1: FLOOR, steps: STEPS, stepDepth: 4 }],
  boxes: [],
  lamps,
  // Relógio do corredor: quase dez da noite.
  vida: [{ minX: START, maxX: END, relogios: [{ x: 185, y: FLOOR + 2.5, z: BACK_Z }] }],
  plates: [],
  doors: [],
  vigias: [
    {
      habito: { tipo: "cochilo" },
      x0: NAP_X,
      x1: NAP_X,
      y: NAP_SEAT,
      z: 1.45,
      speed: 1,
      pause: 0,
      startHeading: -1,
      aimAhead: 2.2,
      aimY: FLOOR + 0.5,
      coneAngle: 0.55,
      range: 7.5,
      reacao: 0.6,
    },
  ],
  elevators: [],
  decor: [
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
    // O recado do professor no quadro: o que conta a história sem nenhuma palavra na tela.
    {
      x: 213.5 + SHIFT,
      y: FLOOR + 2,
      z: BACK_Z - 0.06,
      width: 3.2,
      height: 1.3,
      depth: 0.05,
      material: "quadro",
      giz: "Turma de quinta:\nHOJE A AULA É NO\nLAB. 3 - BLOCO C\n(projetor queimado)",
    },
    // Porta dos fundos: batente, a folha aberta para dentro da sala e a placa de saída para a passarela.
    { x: END + 0.5, y: BACK_DOOR_TOP + 0.06, z: 0, width: 1.04, height: 0.12, depth: 1.7, material: "moldura" },
    { x: END + 0.5, y: FLOOR + 1.3, z: -0.85, width: 1.04, height: 2.6, depth: 0.1, material: "moldura" },
    { x: END + 0.5, y: FLOOR + 1.3, z: 0.85, width: 1.04, height: 2.6, depth: 0.1, material: "moldura" },
    { x: END - 0.48, y: FLOOR + 1.2, z: 0.95, width: 0.92, height: 2.4, depth: 0.05, material: "madeira" },
    { x: END - 0.6, y: BACK_DOOR_TOP + 0.3, z: BACK_Z - 0.06, width: 0.42, height: 0.16, depth: 0.04, material: "saida" },
    { x: 213.5 + SHIFT, y: FLOOR + 1.3, z: BACK_Z - 0.12, width: 3.3, height: 0.06, depth: 0.12, material: "moldura" },
    { x: 217.6 + SHIFT, y: FLOOR + 2.06, z: BACK_Z - 0.04, width: 0.95, height: 1.6, depth: 0.02, material: "luar" },
  ],
  props: [
    // Corredor: janelas, bancos, lixeira e a placa de piso molhado do faxineiro.
    ...WINDOWS.flatMap((x) => moonWindow(x, FLOOR + 1.15, BACK_Z)),
    ...[178.5, 211].map((x): PropData => ({ model: "painted_wooden_bench", x, y: FLOOR, z: 1.75, rotY: 180, scale: 1.25 })),
    // O segurança cochilando: cadeira de plástico encostada na parede, com a lanterna apagada no chão.
    { model: "SchoolChair_01", x: NAP_X, y: FLOOR, z: 1.6, rotY: 180 },
    { model: "metal_trash_can", part: "metal_trash_can|metal_trash_can_handle_(left|right)|metal_trash_can_lid", x: 185.6, y: FLOOR, z: 1.8, scale: 0.8 },
    { model: "WetFloorSign_01", x: 207.5, y: FLOOR, z: 1.4, rotY: 160 },
    // Trechos que eram parede lisa: extintor e quadro de luz no começo, mudança de carteiras e caixas antes da 204.
    { model: "fire_hydrant", x: 174.3, y: FLOOR, z: 1.9, fitHeight: 0.6 },
    { model: "power_box_01", x: 176.2, y: FLOOR + 1.5, z: BACK_Z - 0.02, rotY: 180 },
    ...deskWithChairUp(220.2, 1.55, 0.5),
    ...deskWithChairUp(221.3, 1.6, -0.4),
    { model: "cardboard_box_01", x: 222.6, y: FLOOR, z: 1.75, rotY: 12, fitWidth: 0.5 },
    { model: "cardboard_box_01", x: 222.65, y: FLOOR + 0.36, z: 1.78, rotY: -8, fitWidth: 0.45 },
    { model: "plastic_crate_01", x: 223.5, y: FLOOR, z: 1.7, rotY: 4, fitWidth: 0.55 },
    { model: "security_camera_01", x: 190, y: CEILING - 0.05, z: BACK_Z - 0.05, rotY: 200 },
    ...lamps.filter((lamp) => !lamp.moonlight).map((lamp) => fluorescent(lamp.x, CEILING - 0.01)),
    // A 204 no fim do dia: cadeiras em cima das carteiras, mesa do professor vazia, porta do fundo aberta.
    ...[209.8, 212.2, 214.6].map((x) => x + SHIFT).flatMap((x, i) => [...deskWithChairUp(x, -1.45, i - 1), ...deskWithChairUp(x, 1.0, 1 - i)]),
    { model: "metal_office_desk", x: 216.8 + SHIFT, y: FLOOR, z: 1.45, rotY: 180, scale: 0.8 },
    { model: "SchoolChair_01", x: 217.7 + SHIFT, y: FLOOR, z: 1.85, rotY: 35 },
    ...moonWindow(217.6 + SHIFT, FLOOR + 1.2, BACK_Z),
  ],
};
