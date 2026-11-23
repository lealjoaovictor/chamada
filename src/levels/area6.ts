import type { BlockData, DecorData, LampData, LevelData, PropData } from "./types";
import { CARDBOARD_VISUAL, fluorescent, moonWindow } from "./kits.ts";

// Área 6: do bloco B ao bloco C. A aula de hoje está no Lab. 3 (o projetor da 204 queimou).
// O Zacarias sai pela porta do fundo da 204 para a passarela coberta (meio fechada pelo zelador), entra no bloco C
// pela porta que o Davi deixou encostada com o tênis, passa pela portaria (o segurança vê o jogo na TV)
// e chega ao Lab. 3, onde o professor ainda está fazendo a chamada.

const START = 238;
const FLOOR = 1.5;
const PASS_START = 239;
/** A passarela: piso de concreto entre os dois blocos, coberta, com guarda-corpo dos dois lados. */
const PASS_END = 268;
const ROOF = FLOOR + 3.1;
const RAIL_Z = 1.75;
const RAIL_HEIGHT = 1.05;
/** Andaime da reforma da cobertura, montado no meio da passarela: só passa deslizando por baixo. */
const SCAFFOLD_X0 = 246.4;
const SCAFFOLD_X1 = 248.8;
const SCAFFOLD_GAP = 1.1;
/** Carteiras do laboratório empilhadas na passarela (mudança de sala): passa pulando. */
const STACK_X = 256.5;
const STACK_HEIGHT = 0.95;
/** Bloco C: a porta de vidro da entrada, encostada com o tênis do Davi. */
const ENTRY_X = 268;
const CEILING = FLOOR + 3.2;
const BACK_Z = 2.1;
/** Portaria: o segurança sentado no balcão, com a TV do lado direito. */
const DESK_X = 274.5;
const GUARD_Z = 1.62;
const TV_X = DESK_X + 1.25;
/** Caixas da mudança do laboratório: esconderijo entre o balcão e o jogador. */
const COVER_X = 279;
const COVER_Z = 0.95;
const COVER_DEPTH = 0.6;
const COVER_HEIGHT = 1.45;
const LAB_DOOR_X = 296;
const DOOR_HEIGHT = 2.6;
const END = 308;
const DESK_TOP = 0.77;

const lamps: LampData[] = [
  // Passarela: postes de sódio do pátio lá embaixo e uma luminária fraca na cobertura.
  { x: 244, y: ROOF - 0.25, tom: "sodio", forca: 0.75 },
  { x: 258, y: ROOF - 0.25, tom: "sodio", forca: 0.65, flicker: true },
  // Portaria: a luz da TV (fria, piscando com as imagens) e uma lâmpada fraca no teto.
  { x: TV_X, y: FLOOR + 1.35, tom: "fluorescente", forca: 0.35, flicker: true },
  { x: 271, y: CEILING - 0.4, tom: "fluorescente", forca: 0.5 },
  // Corredor do bloco C: fluorescente fraco, apagando atrás do jogador.
  { x: 285, y: CEILING - 0.4, tom: "fluorescente", forca: 0.6, diesWhenPassed: true },
  { x: 291, y: CEILING - 0.4, tom: "fluorescente", forca: 0.5, flicker: true, diesWhenPassed: true },
  // O Lab. 3: a única luz quente do jogo, vazando pela porta.
  { x: 298.4, y: FLOOR + 2.6, tom: "sala", forca: 1.25 },
  { x: 302.3, y: FLOOR + 2.8, tom: "sala", forca: 1.1 },
  { x: 306.4, y: FLOOR + 2.8, tom: "sala", forca: 1.1 },
];

/** Guarda-corpo da passarela: corrimão, travessa do meio e montantes a cada 1,5 m. */
function railing(z: number): DecorData[] {
  const length = PASS_END - PASS_START;
  const posts = Math.floor(length / 1.5) + 1;
  return [
    { x: (PASS_START + PASS_END) / 2, y: FLOOR + RAIL_HEIGHT, z, width: length, height: 0.06, depth: 0.06, material: "metal" },
    { x: (PASS_START + PASS_END) / 2, y: FLOOR + RAIL_HEIGHT * 0.5, z, width: length, height: 0.04, depth: 0.04, material: "metal" },
    ...Array.from({ length: posts }, (_, i): DecorData => ({
      x: PASS_START + i * 1.5, y: FLOOR + RAIL_HEIGHT / 2, z, width: 0.05, height: RAIL_HEIGHT, depth: 0.05, material: "metal",
    })),
  ];
}

/** Bloco C ao fundo, visto da passarela: prédio apagado e só as janelas do Lab. 3 acesas. */
function farBuilding(): DecorData[] {
  const windows: DecorData[] = [];
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row < 3; row++) {
      const lit = row === 1 && (col === 4 || col === 5);
      windows.push({
        x: 262 + col * 2.4, y: 1.2 + row * 3.1, z: 13.7, width: 1.5, height: 1.4, depth: 0.05, material: lit ? "janela-acesa" : "janela",
      });
    }
  }
  return [{ x: 269, y: 4.5, z: 14, width: 20, height: 11, depth: 0.5, material: "concreto" }, ...windows];
}

/** Carteira do laboratório com o computador desligado em cima. */
function labDesk(x: number, z: number): PropData[] {
  return [
    { model: "SchoolDesk_01", x, y: FLOOR, z, rotY: 180 },
    { model: "SchoolChair_01", x: x + 0.04, y: FLOOR, z: z - 0.55, rotY: 180 },
  ];
}

function monitor(x: number, z: number): DecorData[] {
  return [
    { x, y: FLOOR + DESK_TOP + 0.2, z: z + 0.12, width: 0.42, height: 0.28, depth: 0.04, material: "tela" },
    { x, y: FLOOR + DESK_TOP + 0.04, z: z + 0.16, width: 0.08, height: 0.08, depth: 0.08, material: "metal" },
  ];
}

const stack: BlockData = { x: STACK_X, y: FLOOR + STACK_HEIGHT / 2, width: 0.9, height: STACK_HEIGHT, z: 0, depth: 3, hidden: true };
const scaffold: BlockData = {
  x: (SCAFFOLD_X0 + SCAFFOLD_X1) / 2,
  y: (FLOOR + SCAFFOLD_GAP + ROOF) / 2,
  width: SCAFFOLD_X1 - SCAFFOLD_X0,
  height: ROOF - FLOOR - SCAFFOLD_GAP,
  z: 0,
  depth: 3.6,
  hidden: true,
};

/** O andaime: tubos, dois pisos de tábua, lona e o material da obra em cima (visto de lado, dá para ler na hora). */
function scaffolding(): DecorData[] {
  const mid = (SCAFFOLD_X0 + SCAFFOLD_X1) / 2;
  const length = SCAFFOLD_X1 - SCAFFOLD_X0;
  const deck1 = FLOOR + SCAFFOLD_GAP + 0.04;
  const deck2 = FLOOR + 2.3;
  const pole = (x: number, z: number): DecorData => ({ x, y: (FLOOR + ROOF) / 2, z, width: 0.06, height: ROOF - FLOOR, depth: 0.06, material: "metal" });
  return [
    ...[SCAFFOLD_X0 + 0.05, SCAFFOLD_X1 - 0.05].flatMap((x) => [pole(x, -1.2), pole(x, 1.2)]),
    // Pisos de tábua e as travessas.
    { x: mid, y: deck1, z: 0, width: length + 0.2, height: 0.08, depth: 2.5, material: "madeira" },
    { x: mid, y: deck2, z: 0, width: length + 0.2, height: 0.08, depth: 2.5, material: "madeira" },
    { x: mid, y: deck1 - 0.1, z: -1.2, width: length, height: 0.05, depth: 0.05, material: "metal" },
    { x: mid, y: deck2 - 0.1, z: -1.2, width: length, height: 0.05, depth: 0.05, material: "metal" },
    // Lona azul da obra pendurada entre os dois pisos (fecha a passagem por cima).
    { x: mid, y: (deck1 + deck2) / 2, z: -1.24, width: length - 0.15, height: deck2 - deck1 - 0.12, depth: 0.02, material: "tatil" },
    // Faixa zebrada na borda de baixo: avisa onde bater a cabeça.
    { x: mid, y: deck1 - 0.02, z: -1.27, width: length + 0.2, height: 0.1, depth: 0.02, material: "listrado" },
  ];
}

const cover: BlockData = { x: COVER_X, y: FLOOR + COVER_HEIGHT / 2, width: 1, height: COVER_HEIGHT, z: COVER_Z, depth: COVER_DEPTH, hidden: true };

export const area6Level: LevelData = {
  checkpoints: [{ x: 241, y: FLOOR + 1.2 }],
  killY: -6,
  bounds: { minX: START, maxX: END },
  // Só o bloco C: a passarela é suspensa, e embaixo dela fica o pátio.
  primeiroPlano: [{ x0: ENTRY_X, x1: END, y0: FLOOR }],
  depth: 4,
  ambiente: [
    { minX: START, maxX: ENTRY_X, intensidade: 0.34, cor: [0.55, 0.5, 0.45] },
    { minX: ENTRY_X, maxX: LAB_DOOR_X - 1.5, intensidade: 0.26, cor: [0.5, 0.55, 0.62] },
    { minX: LAB_DOOR_X - 1.5, maxX: END + 1, intensidade: 0.9, cor: [0.95, 0.76, 0.52] },
  ],
  // O professor em pé na mesa, com a lista, e o Davi sentado numa carteira com o celular na mão.
  figurantes: [
    { modelo: "professor", x: 306.4, y: FLOOR, z: 1.98, rotY: 180, pose: "em-pe", tom: [0.75, 0.72, 0.68], segura: "lista" },
    { modelo: "aluno", x: 302.25, y: FLOOR, z: 0.42, rotY: 0, pose: "sentado", tom: [0.7, 0.7, 0.74], segura: "celular" },
  ],
  ground: [
    // Passarela (laje fina, com o vão do pátio embaixo) e o piso do bloco C.
    { x: (START + PASS_END) / 2, y: FLOOR - 0.2, width: PASS_END - START, height: 0.4, material: "concreto" },
    { x: (PASS_END + END + 1) / 2, y: (FLOOR - 1) / 2, width: END + 1 - PASS_END, height: FLOOR + 1, material: "piso" },
  ],
  walls: [
    { x: END + 0.5, y: 4, width: 1, height: 8, material: "pedra" },
    { x: (ENTRY_X + END) / 2, y: CEILING + 0.2, width: END - ENTRY_X, height: 0.4, material: "concreto" },
  ],
  platforms: [],
  obstacles: [scaffold, stack, cover],
  ramps: [],
  boxes: [],
  lamps,
  plates: [],
  doors: [],
  vigias: [
    {
      // Portaria do bloco C: sentado no balcão, dividido entre a entrada e o jogo na TV.
      habito: { tipo: "futebol", tvLado: 1 },
      x0: DESK_X,
      x1: DESK_X,
      y: FLOOR,
      z: GUARD_Z,
      speed: 1,
      pause: 0,
      startHeading: -1,
      aimAhead: 4,
      aimY: FLOOR + 0.6,
      coneAngle: 0.6,
      range: 9,
      reacao: 0.5,
    },
  ],
  elevators: [],
  finalDoor: { x: LAB_DOOR_X, floorY: FLOOR, height: DOOR_HEIGHT, depth: 1.6, triggerX: LAB_DOOR_X - 0.6, walkToX: 301.5 },
  decor: [
    // Passarela: cobertura, pilares do lado de trás, guarda-corpos e o pátio escuro lá embaixo.
    { x: (PASS_START + PASS_END) / 2, y: ROOF + 0.08, z: 0, width: PASS_END - PASS_START + 0.6, height: 0.16, depth: 4.2, material: "concreto" },
    ...[241, 246, 251, 256, 261, 266].map((x): DecorData => ({ x, y: (FLOOR + ROOF) / 2, z: 1.95, width: 0.22, height: ROOF - FLOOR, depth: 0.22, material: "concreto" })),
    ...railing(RAIL_Z),
    ...railing(-RAIL_Z),
    { x: (PASS_START + PASS_END) / 2, y: -3.2, z: 4, width: PASS_END - PASS_START + 20, height: 0.2, depth: 16, material: "vegetacao" },
    ...[244, 252, 263].map((x): DecorData => ({ x, y: (FLOOR - 0.4 - 3.1) / 2, z: 0.2, width: 0.45, height: FLOOR - 0.4 + 3.1, depth: 0.45, material: "concreto" })),
    ...farBuilding(),
    // O andaime da obra.
    ...scaffolding(),

    // Fachada do bloco C e a porta de vidro aberta, presa pelo tênis do Davi.
    { x: ENTRY_X, y: (FLOOR + DOOR_HEIGHT + CEILING + 0.6) / 2, z: 0, width: 0.4, height: CEILING + 0.6 - FLOOR - DOOR_HEIGHT, depth: 4.2, material: "concreto" },
    { x: ENTRY_X, y: FLOOR + DOOR_HEIGHT / 2, z: 1.55, width: 0.4, height: DOOR_HEIGHT, depth: 1.1, material: "concreto" },
    { x: ENTRY_X, y: FLOOR + DOOR_HEIGHT / 2, z: -1.75, width: 0.4, height: DOOR_HEIGHT, depth: 0.5, material: "concreto" },
    { x: ENTRY_X + 0.55, y: FLOOR + 1.1, z: -1.05, width: 1.0, height: 2.2, depth: 0.04, material: "vidro" },
    { x: ENTRY_X + 0.55, y: FLOOR + 1.1, z: -1.08, width: 1.06, height: 2.24, depth: 0.02, material: "moldura" },
    // O tênis: sola branca e cabedal escuro, calçando a porta.
    { x: ENTRY_X + 1.08, y: FLOOR + 0.025, z: -0.92, width: 0.29, height: 0.05, depth: 0.11, material: "papel" },
    { x: ENTRY_X + 1.06, y: FLOOR + 0.085, z: -0.92, width: 0.22, height: 0.08, depth: 0.1, material: "tecido" },
    { x: ENTRY_X - 0.22, y: FLOOR + DOOR_HEIGHT + 0.35, z: -0.3, width: 1.1, height: 0.32, depth: 0.04, material: "moldura", giz: "BLOCO C" },

    // Portaria: balcão, a TV pequena e o quadro de chaves.
    { x: (ENTRY_X + END) / 2, y: (FLOOR + CEILING) / 2 + 0.3, z: BACK_Z + 0.05, width: END - ENTRY_X, height: CEILING - FLOOR, depth: 0.1, material: "parede" },
    { x: DESK_X + 0.3, y: FLOOR + 0.42, z: 0.95, width: 2.6, height: 0.84, depth: 0.12, material: "madeira" },
    { x: DESK_X + 0.3, y: FLOOR + 0.86, z: 1.2, width: 2.7, height: 0.05, depth: 0.6, material: "madeira" },
    { x: TV_X, y: FLOOR + 1.08, z: 1.35, width: 0.5, height: 0.34, depth: 0.12, material: "metal" },
    { x: TV_X - 0.03, y: FLOOR + 1.08, z: 1.28, width: 0.42, height: 0.27, depth: 0.01, material: "tela", id: "tv-tela" },
    { x: DESK_X - 1.4, y: FLOOR + 1.6, z: BACK_Z - 0.03, width: 0.5, height: 0.6, depth: 0.04, material: "madeira" },
    { x: 272, y: FLOOR + 1.9, z: BACK_Z - 0.04, width: 1.2, height: 0.5, depth: 0.03, material: "quadro", giz: "Portaria\nBloco C" },

    // Corredor do bloco C: portas de outras salas fechadas e um mural.
    ...[285.5, 290.5].flatMap((x): DecorData[] => [
      { x, y: FLOOR + 1.1, z: BACK_Z - 0.03, width: 1.0, height: 2.2, depth: 0.05, material: "madeira" },
      { x: x + 0.18, y: FLOOR + 1.55, z: BACK_Z - 0.06, width: 0.3, height: 0.5, depth: 0.02, material: "janela" },
    ]),
    { x: 293.5, y: CEILING - 0.35, z: BACK_Z - 0.06, width: 0.42, height: 0.16, depth: 0.04, material: "saida" },
    { x: 294.6, y: FLOOR + 1.85, z: BACK_Z - 0.05, width: 0.6, height: 0.22, depth: 0.03, material: "quadro", giz: "LAB. 3" },

    // Porta do Lab. 3 e o laboratório.
    { x: LAB_DOOR_X, y: (FLOOR + DOOR_HEIGHT + CEILING) / 2, z: 0, width: 0.3, height: CEILING - FLOOR - DOOR_HEIGHT, depth: 4, material: "parede" },
    { x: LAB_DOOR_X, y: FLOOR + DOOR_HEIGHT / 2, z: -1.85, width: 0.35, height: DOOR_HEIGHT, depth: 0.5, material: "moldura" },
    { x: LAB_DOOR_X, y: FLOOR + DOOR_HEIGHT / 2, z: 1.2, width: 0.35, height: DOOR_HEIGHT, depth: 1.8, material: "parede" },
    { x: (LAB_DOOR_X + END) / 2, y: FLOOR + 0.6, z: BACK_Z, width: END - LAB_DOOR_X, height: 1.2, depth: 0.1, material: "madeira" },
    { x: 303.5, y: FLOOR + 2, z: BACK_Z - 0.06, width: 3.2, height: 1.3, depth: 0.05, material: "quadro" },
    { x: 303.5, y: FLOOR + 1.3, z: BACK_Z - 0.12, width: 3.3, height: 0.06, depth: 0.12, material: "moldura" },
    { x: 307.6, y: FLOOR + 2.06, z: BACK_Z - 0.04, width: 0.95, height: 1.6, depth: 0.02, material: "luar" },
    // Narrativa: a prova esperando na carteira vazia do Zacarias, e a mochila do Davi.
    { x: 302.2, y: FLOOR + DESK_TOP, z: -1.45, width: 0.3, height: 0.005, depth: 0.22, material: "papel" },
    { x: 302.62, y: FLOOR + 0.21, z: -1.95, width: 0.34, height: 0.42, depth: 0.2, material: "tecido" },
    ...[299.8, 302.2, 304.6].flatMap((x) => [...monitor(x, -1.45), ...monitor(x, 1.0)]),
  ],
  props: [
    // Passarela: as carteiras empilhadas e as caixas da mudança.
    { model: "plastic_crate_01", x: SCAFFOLD_X0 + 0.6, y: FLOOR + SCAFFOLD_GAP + 0.08, z: 0.3, rotY: 12, fitWidth: 0.5 },
    { model: "cardboard_box_01", x: SCAFFOLD_X1 - 0.5, y: FLOOR + 2.34, z: 0.2, rotY: -15, fitWidth: 0.45 },
    { model: "SchoolDesk_01", x: STACK_X, y: FLOOR, z: -0.5, rotY: 90 },
    { model: "SchoolDesk_01", x: STACK_X - 0.05, y: FLOOR, z: 0.55, rotY: 95 },
    { model: "SchoolChair_01", x: STACK_X + 0.05, y: FLOOR + DESK_TOP, z: -0.4, rotY: 80 },
    { model: "plastic_crate_01", x: STACK_X, y: FLOOR + DESK_TOP, z: 0.6, rotY: 8, fitWidth: 0.55 },
    { model: "cardboard_box_01", x: SCAFFOLD_X0 - 1.4, y: FLOOR, z: 1.2, rotY: 20, fitWidth: 0.5 },
    // Portaria: cadeira do segurança, caixas da mudança (esconderijo) e o extintor.
    { model: "SchoolChair_01", x: DESK_X, y: FLOOR, z: GUARD_Z + 0.08, rotY: 0 },
    ...CARDBOARD_VISUAL.map((prop): PropData => ({ ...prop, x: COVER_X + prop.x * 2, z: COVER_Z + prop.z, fitWidth: (prop.fitWidth ?? 0.48) * 1.0, y: FLOOR + prop.y * 1.45 })),
    { model: "fire_hydrant", x: 283, y: FLOOR, z: 1.85, fitHeight: 0.6 },
    ...[271, 285, 291].map((x) => fluorescent(x, CEILING - 0.01)),
    // Lab. 3: carteiras com computador, mesa do professor e a janela do fundo.
    ...[299.8, 302.2, 304.6].flatMap((x) => [...labDesk(x, -1.45), ...labDesk(x, 1.0)]),
    { model: "metal_office_desk", x: 306.8, y: FLOOR, z: 1.45, rotY: 180, scale: 0.8 },
    { model: "SchoolChair_01", x: 307.7, y: FLOOR, z: 1.85, rotY: 35 },
    ...moonWindow(307.6, FLOOR + 1.2, BACK_Z),
  ],
};
