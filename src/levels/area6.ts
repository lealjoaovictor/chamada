import type { BlockData, DecorData, LampData, LevelData, PropData } from "./types";
import { CARDBOARD_VISUAL, TOOL_CART_GRIP, TOOL_CART_VISUAL, fluorescent, moonWindow } from "./kits.ts";

// Área 6: do bloco B ao bloco C. A aula de hoje está no Lab. 3 (o projetor da 204 queimou).
// O Zacarias sai pela porta do fundo da 204 para a passarela coberta (meio fechada pelo zelador), entra no bloco C
// pela porta que o Davi deixou encostada com o tênis, passa pela portaria (o segurança vê o jogo na TV)
// sobe a escada para o segundo andar (o Lab. 3 é a janela acesa lá de cima), passa pela mudança do laboratório
// empilhada no corredor (usa o carrinho do zelador como degrau) e chega ao Lab. 3, onde o professor ainda está
// fazendo a chamada.

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
/** Escada para o segundo andar, no fim do corredor do térreo. */
const STAIR_X0 = 287.5;
const STAIR_X1 = 295;
const STAIR_STEPS = 15;
const FLOOR2 = FLOOR + 3;
/** O teto do térreo acaba no começo da escada (o vão da escada é aberto até o teto do segundo andar). */
const CEILING_END = STAIR_X0 + 2.5;
const CEILING2 = FLOOR2 + 4.2;
/** A mudança do Lab. 3 empilhada no corredor de cima: alta demais para o pulo, passa subindo no carrinho. */
const CART_X = 299.5;
const PILE_X0 = 304;
const PILE_X1 = 306.5;
const PILE_HEIGHT = 1.9;
/** O laboratório inteiro foi para o segundo andar: tudo o que era do Lab. 3 anda junto. */
const LAB_DX = 17;
const LAB_DOOR_X = 296 + LAB_DX;
const DOOR_HEIGHT = 2.6;
const END = 308 + LAB_DX;
const DESK_TOP = 0.77;

const lamps: LampData[] = [
  // Passarela: postes de sódio do pátio lá embaixo e uma luminária fraca na cobertura.
  { x: 244, y: ROOF - 0.25, tom: "sodio", forca: 0.75 },
  { x: 258, y: ROOF - 0.25, tom: "sodio", forca: 0.65, flicker: true, zumbido: true },
  // Portaria: a luz da TV (fria, piscando com as imagens) e uma lâmpada fraca no teto.
  { x: TV_X, y: FLOOR + 1.35, tom: "fluorescente", forca: 0.35, flicker: true },
  { x: 271, y: CEILING - 0.4, tom: "fluorescente", forca: 0.5 },
  // Corredor do bloco C: fluorescente fraco, apagando atrás do jogador.
  { x: 285, y: CEILING - 0.4, tom: "fluorescente", forca: 0.6, diesWhenPassed: true },
  // Vão da escada: uma luminária de parede piscando no patamar.
  { x: 291.5, y: FLOOR2 + 1.4, tom: "fluorescente", forca: 0.45, flicker: true, diesWhenPassed: true },
  // Corredor do segundo andar: as duas lâmpadas que sobraram apagam quando ele passa.
  { x: 298.5, y: CEILING2 - 0.4, tom: "fluorescente", forca: 0.55, diesWhenPassed: true },
  { x: 305, y: CEILING2 - 0.4, tom: "fluorescente", forca: 0.5, flicker: true, diesWhenPassed: true },
  // O Lab. 3: a única luz quente do jogo, vazando pela porta.
  { x: 298.4 + LAB_DX, y: FLOOR2 + 2.6, tom: "sala", forca: 1.25 },
  { x: 302.3 + LAB_DX, y: FLOOR2 + 2.8, tom: "sala", forca: 1.1 },
  { x: 306.4 + LAB_DX, y: FLOOR2 + 2.8, tom: "sala", forca: 1.1 },
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
    { model: "SchoolDesk_01", x, y: FLOOR2, z, rotY: 180 },
    { model: "SchoolChair_01", x: x + 0.04, y: FLOOR2, z: z - 0.55, rotY: 180 },
  ];
}

function monitor(x: number, z: number): DecorData[] {
  return [
    { x, y: FLOOR2 + DESK_TOP + 0.2, z: z + 0.12, width: 0.42, height: 0.28, depth: 0.04, material: "tela" },
    { x, y: FLOOR2 + DESK_TOP + 0.04, z: z + 0.16, width: 0.08, height: 0.08, depth: 0.08, material: "metal" },
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
const pile: BlockData = { x: (PILE_X0 + PILE_X1) / 2, y: FLOOR2 + PILE_HEIGHT / 2, width: PILE_X1 - PILE_X0, height: PILE_HEIGHT, z: 0, depth: 4, hidden: true };

/** A mudança do Lab. 3 no corredor de cima: carteiras e armário deitados, caixas e cadeiras por cima. */
function movingPile(): { decor: DecorData[]; props: PropData[] } {
  const mid = (PILE_X0 + PILE_X1) / 2;
  const top = FLOOR2 + PILE_HEIGHT;
  return {
    decor: [
      // Armário de aço deitado na base e o tampo de uma bancada por cima: a face lisa diz "não dá para escalar".
      { x: mid, y: FLOOR2 + 0.55, z: 0, width: PILE_X1 - PILE_X0, height: 1.1, depth: 3.4, material: "metal" },
      { x: mid, y: FLOOR2 + 1.5, z: 0, width: PILE_X1 - PILE_X0 + 0.1, height: 0.8, depth: 3.2, material: "madeira" },
      { x: mid, y: top - 0.02, z: 0, width: PILE_X1 - PILE_X0 + 0.15, height: 0.05, depth: 3.3, material: "madeira" },
      // Etiqueta da mudança.
      { x: PILE_X0 - 0.01, y: FLOOR2 + 1.5, z: -0.6, width: 0.02, height: 0.28, depth: 0.7, material: "quadro", giz: "LAB. 3" },
    ],
    props: [
      { model: "SchoolChair_01", x: PILE_X0 + 0.5, y: top, z: 1.1, rotY: 70 },
      { model: "plastic_crate_01", x: PILE_X1 - 0.5, y: top, z: 1.0, rotY: -10, fitWidth: 0.55 },
      { model: "cardboard_box_01", x: mid, y: top, z: 1.3, rotY: 25, fitWidth: 0.5 },
    ],
  };
}
const PILE = movingPile();

export const area6Level: LevelData = {
  checkpoints: [{ x: 241, y: FLOOR + 1.2 }, { x: 296.5, y: FLOOR2 + 1.2 }],
  killY: -6,
  bounds: { minX: START, maxX: END },
  // Bloco C: aviso na portaria, cartaz, umidade e marcas no piso.
  adesivos: [
    { kind: "cartaz", x: DESK_X - 2.6, y: FLOOR + 1.9, z: BACK_Z - 0.06, width: 0.55, height: 0.75, rot: 0.03, color: "#f7f7f2", ink: "#222222", glow: 0.45, text: ["PORTARIA", "FECHA", "ÀS 22H30"] },
    { kind: "umidade", x: 285, y: FLOOR + 0.55, z: BACK_Z - 0.06, width: 5, height: 1.1 },
    { kind: "rachadura", x: 288.5, y: FLOOR + 2.3, z: BACK_Z - 0.06, width: 1.5, height: 0.5 },
    { kind: "mancha", x: 284, y: FLOOR + 0.02, z: -0.2, width: 2.2, height: 1.3, chao: true },
  ],
  // Da passarela se vê a cidade atrás do pátio (a mesma silhueta do pátio de entrada).
  cidade: [{ minX: START, maxX: ENTRY_X }],
  // Só o bloco C: a passarela é suspensa, e embaixo dela fica o pátio.
  primeiroPlano: [
    { x0: ENTRY_X, x1: STAIR_X0, y0: FLOOR },
    { x0: STAIR_X1, x1: END, y0: FLOOR2 },
  ],
  depth: 4,
  ambiente: [
    { minX: START, maxX: ENTRY_X, intensidade: 0.34, cor: [0.55, 0.5, 0.45] },
    { minX: ENTRY_X, maxX: LAB_DOOR_X - 1.5, intensidade: 0.26, cor: [0.5, 0.55, 0.62] },
    { minX: LAB_DOOR_X - 1.5, maxX: END + 1, intensidade: 0.9, cor: [0.95, 0.76, 0.52] },
  ],
  // O professor em pé na mesa, com a lista, e o Davi sentado numa carteira com o celular na mão.
  figurantes: [
    { modelo: "professor", x: 306.4 + LAB_DX, y: FLOOR2, z: 1.98, rotY: 180, pose: "em-pe", tom: [0.75, 0.72, 0.68], segura: "lista" },
    { modelo: "aluno", x: 302.25 + LAB_DX, y: FLOOR2, z: 0.42, rotY: 0, pose: "sentado", tom: [0.7, 0.7, 0.74], segura: "celular" },
  ],
  ground: [
    // Passarela (laje fina, com o vão do pátio embaixo) e o piso do bloco C.
    { x: (START + PASS_END) / 2, y: FLOOR - 0.2, width: PASS_END - START, height: 0.4, material: "concreto" },
    { x: (PASS_END + STAIR_X1) / 2, y: (FLOOR - 1) / 2, width: STAIR_X1 - PASS_END, height: FLOOR + 1, material: "piso" },
    // O segundo andar, do alto da escada até o fim do Lab. 3.
    { x: (STAIR_X1 + END + 1) / 2, y: (FLOOR2 - 1) / 2, width: END + 1 - STAIR_X1, height: FLOOR2 + 1, material: "piso" },
  ],
  walls: [
    { x: END + 0.5, y: 6, width: 1, height: 12, material: "pedra" },
    // Teto do térreo, grosso como a laje do segundo andar, até o vão da escada.
    { x: (ENTRY_X + CEILING_END) / 2, y: (CEILING + CEILING2 + 0.4) / 2, width: CEILING_END - ENTRY_X, height: CEILING2 + 0.4 - CEILING, material: "concreto" },
    // Teto do segundo andar, do vão da escada ao Lab. 3.
    { x: (CEILING_END + END) / 2, y: CEILING2 + 0.2, width: END - CEILING_END, height: 0.4, material: "concreto" },
  ],
  platforms: [],
  obstacles: [scaffold, stack, cover, pile],
  ramps: [{ x0: STAIR_X0, y0: FLOOR, x1: STAIR_X1, y1: FLOOR2, steps: STAIR_STEPS, stepDepth: 4 }],
  // O carrinho do zelador, largo e baixo, esquecido no corredor de cima.
  boxes: [{ x: CART_X, y: FLOOR2 + 0.5, size: 1, mass: 20, material: "metal", visual: TOOL_CART_VISUAL, pegada: TOOL_CART_GRIP }],
  lamps,
  // Do outro lado do pátio, alguém vê TV no bloco C (janela do 3º andar, longe das acesas do Lab. 3).
  vida: [{ minX: START, maxX: 265, tvs: [{ x: 264.4, y: 7.4, z: 13.64, largura: 1.3, altura: 1.2 }] }],
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
  finalDoor: { x: LAB_DOOR_X, floorY: FLOOR2, height: DOOR_HEIGHT, depth: 1.6, triggerX: LAB_DOOR_X - 0.6, walkToX: 301.5 + LAB_DX },
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
    { x: (ENTRY_X + END) / 2, y: (FLOOR + CEILING2) / 2, z: BACK_Z + 0.05, width: END - ENTRY_X, height: CEILING2 - FLOOR, depth: 0.1, material: "parede" },
    { x: DESK_X + 0.3, y: FLOOR + 0.42, z: 0.95, width: 2.6, height: 0.84, depth: 0.12, material: "madeira" },
    { x: DESK_X + 0.3, y: FLOOR + 0.86, z: 1.2, width: 2.7, height: 0.05, depth: 0.6, material: "madeira" },
    { x: TV_X, y: FLOOR + 1.08, z: 1.35, width: 0.5, height: 0.34, depth: 0.12, material: "metal" },
    { x: TV_X - 0.03, y: FLOOR + 1.08, z: 1.28, width: 0.42, height: 0.27, depth: 0.01, material: "tela", id: "tv-tela" },
    { x: DESK_X - 1.4, y: FLOOR + 1.6, z: BACK_Z - 0.03, width: 0.5, height: 0.6, depth: 0.04, material: "madeira" },
    { x: 272, y: FLOOR + 1.9, z: BACK_Z - 0.04, width: 1.2, height: 0.5, depth: 0.03, material: "quadro", giz: "Portaria\nBloco C" },

    // Corredor do bloco C: portas de outras salas fechadas, nos dois andares.
    ...([[285.5, FLOOR], [300.5, FLOOR2]] as const).flatMap(([x, floor]): DecorData[] => [
      { x, y: floor + 1.1, z: BACK_Z - 0.03, width: 1.0, height: 2.2, depth: 0.05, material: "madeira" },
      { x: x + 0.18, y: floor + 1.55, z: BACK_Z - 0.06, width: 0.3, height: 0.5, depth: 0.02, material: "janela" },
    ]),
    // Pé da escada: a placa com a seta para cima diz onde fica o laboratório.
    { x: STAIR_X0 - 0.6, y: FLOOR + 1.85, z: BACK_Z - 0.05, width: 0.8, height: 0.42, depth: 0.03, material: "quadro", giz: "LAB. 3\n2º andar" },
    { x: 309.5, y: CEILING2 - 0.35, z: BACK_Z - 0.06, width: 0.42, height: 0.16, depth: 0.04, material: "saida" },
    { x: 311.6, y: FLOOR2 + 1.85, z: BACK_Z - 0.05, width: 0.6, height: 0.22, depth: 0.03, material: "quadro", giz: "LAB. 3" },
    // A mudança empilhada.
    ...PILE.decor,

    // Porta do Lab. 3 e o laboratório.
    { x: LAB_DOOR_X, y: (FLOOR2 + DOOR_HEIGHT + CEILING2) / 2, z: 0, width: 0.3, height: CEILING2 - FLOOR2 - DOOR_HEIGHT, depth: 4, material: "parede" },
    { x: LAB_DOOR_X, y: FLOOR2 + DOOR_HEIGHT / 2, z: -1.85, width: 0.35, height: DOOR_HEIGHT, depth: 0.5, material: "moldura" },
    { x: LAB_DOOR_X, y: FLOOR2 + DOOR_HEIGHT / 2, z: 1.2, width: 0.35, height: DOOR_HEIGHT, depth: 1.8, material: "parede" },
    { x: (LAB_DOOR_X + END) / 2, y: FLOOR2 + 0.6, z: BACK_Z, width: END - LAB_DOOR_X, height: 1.2, depth: 0.1, material: "madeira" },
    { x: 303.5 + LAB_DX, y: FLOOR2 + 2, z: BACK_Z - 0.06, width: 3.2, height: 1.3, depth: 0.05, material: "quadro" },
    { x: 303.5 + LAB_DX, y: FLOOR2 + 1.3, z: BACK_Z - 0.12, width: 3.3, height: 0.06, depth: 0.12, material: "moldura" },
    { x: 307.6 + LAB_DX, y: FLOOR2 + 2.06, z: BACK_Z - 0.04, width: 0.95, height: 1.6, depth: 0.02, material: "luar" },
    // Narrativa: a prova esperando na carteira vazia do Zacarias, e a mochila do Davi.
    { x: 302.2 + LAB_DX, y: FLOOR2 + DESK_TOP, z: -1.45, width: 0.3, height: 0.005, depth: 0.22, material: "papel" },
    { x: 302.62 + LAB_DX, y: FLOOR2 + 0.21, z: -1.95, width: 0.34, height: 0.42, depth: 0.2, material: "tecido" },
    ...[299.8, 302.2, 304.6].flatMap((x) => [...monitor(x + LAB_DX, -1.45), ...monitor(x + LAB_DX, 1.0)]),
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
    ...[271, 285].map((x) => fluorescent(x, CEILING - 0.01)),
    ...[298.5, 305].map((x) => fluorescent(x, CEILING2 - 0.01)),
    // A mudança empilhada no corredor de cima.
    ...PILE.props,
    // Lab. 3: carteiras com computador, mesa do professor e a janela do fundo.
    ...[299.8, 302.2, 304.6].flatMap((x) => [...labDesk(x + LAB_DX, -1.45), ...labDesk(x + LAB_DX, 1.0)]),
    { model: "metal_office_desk", x: 306.8 + LAB_DX, y: FLOOR2, z: 1.45, rotY: 180, scale: 0.8 },
    { model: "SchoolChair_01", x: 307.7 + LAB_DX, y: FLOOR2, z: 1.85, rotY: 35 },
    ...moonWindow(307.6 + LAB_DX, FLOOR2 + 1.2, BACK_Z),
  ],
};
