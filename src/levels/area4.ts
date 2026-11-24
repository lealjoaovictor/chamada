import type { StickerData, BlockData, DecorData, LampData, LevelData, PropData } from "./types";
import { DRUMS_GRIP, DRUMS_VISUAL, GAS_CART_GRIP, GAS_CART_VISUAL, fluorescent } from "./kits.ts";
import { mapLevelX, type MapX } from "./shift.ts";

const START = 117;
const RAMP_END = 123;
const GALLERY_Y = 3.5;
const END = 200;
const CEILING = 3;
const HALL_CEILING = 6.5;
const LANE_Z = -0.65;
const LANE_DEPTH = 2.7;
const BACK_Z = 2.6;
const GAP = 1.1;
const BAR_X = 134;
const BARRIER_X = 143;
const GATE_X = 152;
const BARRIER2_X = 138.3;

// Depósito: pausa entre as duas perseguições. Um objeto sobre o sensor (perto da entrada) abre o portão de saída.
// Os dois objetos estão do outro lado de uma valeta aberta (a grade foi tirada): o primeiro empurrado para a
// esquerda cai na valeta e vira ponte; o segundo passa por cima dele até o sensor. Tanto faz qual vai primeiro.
const DEPOT_DRUMS_X = 160.6;
const DEPOT_BOX_X = 163;
const DEPOT_PLATE_X = 155.2;
const TRENCH_X0 = 157.4;
const TRENCH_X1 = 158.6;
const TRENCH_DEPTH = 1;
const DEPOT_PLATE_WIDTH = 1.4;
const DEPOT_PLATE_DEPTH = 0.2;
const DEPOT_GATE_X = 167;

// Segunda perseguição, com obstáculos em ritmo irregular.
const CHASE2_TRIGGER = 169.5;
const SLIDES2 = [174.5, 183.2];
const BARRIERS2 = [177.6, 186.1, 188.4];
const GATE2_X = 193;
// O segurança para antes do portão: com o braço esticado, a lanterna não pode atravessar a grade.
const GATE_STOP = 1.2;
// Portas de serviço na parede do fundo: é por elas que os seguranças entram na perseguição.
const DOOR1_X = 123.3;
// Segunda perseguição: sem porta. No apagão, a lanterna dele acende no escuro, logo antes do portão do depósito
// (ou até 6 m atrás do jogador, se ele já correu muito; ver `ChaseDirector`).
const CHASE2_START_X = 166.2;
// Primeira perseguição: ao pé da rampa, o Zacarias para e a câmera mostra a porta (a cena só toca uma vez).
const SCENE1_TRIGGER = 127.6;
const SCENE1_FOCUS = 125.6;
// Apagão da segunda perseguição: as lâmpadas deste trecho apagam e voltam vermelhas (emergência).
const BLACKOUT_FROM = 154;
const BLACKOUT_TO = 197;

const ELASTICO = { distancia: 5, ganho: 0.12, min: 0.8, max: 1.4 };

function laneBlock(x: number, y: number, width: number, height: number, material: BlockData["material"]): BlockData {
  return { x, y, width, height, z: LANE_Z, depth: LANE_DEPTH, material };
}

/** Barreira de concreto: o bloco de colisão fica escondido e duas barreiras prontas ocupam a faixa. */
function barrier(x: number, height: number): BlockData {
  return { ...laneBlock(x, height / 2, 0.6, height, "concreto"), hidden: true };
}

function barrierVisual(x: number, height: number): PropData[] {
  const s = height / 0.83;
  return [-0.65, 0.65].map((dz, i): PropData => ({
    model: "concrete_road_barrier",
    x: x + (i ? 0.03 : -0.02),
    y: 0,
    z: LANE_Z + dz,
    rotY: 90 + (i ? 2 : -1),
    scale: s,
    stretch: [1.4 / (1.54 * s), 1, 0.62 / (0.63 * s)],
  }));
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

/** Concreto embaixo da rampa da garagem, em fatias que ficam sob a laje (um bloco só atravessava a rampa e escondia o jogador). */
function rampFill(): DecorData[] {
  const slices = 12;
  const step = (RAMP_END - START) / slices;
  return Array.from({ length: slices }, (_, i): DecorData => {
    const x1 = START + step * (i + 1);
    const height = Math.max(GALLERY_Y * (RAMP_END - x1) / (RAMP_END - START) - 0.05, 0.05);
    return { x: x1 - step / 2, y: height / 2, z: 0, width: step, height, depth: 4, material: "concreto" };
  });
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

// Subsolo: tubos fluorescentes velhos, esverdeados; o primeiro é o poste de sódio da rampa.
const lamps: LampData[] = ([
  { x: 126, y: 2.75, tom: "sodio" },
  { x: 133, y: 2.75 },
  { x: 140, y: 2.75 },
  { x: 147, y: 2.75 },
  { x: 156, y: 2.75 },
  { x: 162, y: 2.75, flicker: true, zumbido: true },
  { x: 172, y: 2.75 },
  { x: 180, y: 2.75 },
  { x: 188, y: 2.75 },
  { x: 196, y: 2.75 },
] as LampData[]).map((lamp) => ({ tom: "subsolo", ...lamp }));

function groundWithRecess(): BlockData[] {
  const a = DEPOT_PLATE_X - DEPOT_PLATE_WIDTH / 2;
  const b = DEPOT_PLATE_X + DEPOT_PLATE_WIDTH / 2;
  return [
    { x: (START + a) / 2, y: -0.5, width: a - START, height: 1, material: "asfalto" },
    { x: DEPOT_PLATE_X, y: -0.5 - DEPOT_PLATE_DEPTH, width: DEPOT_PLATE_WIDTH, height: 1, material: "concreto" },
    { x: (b + TRENCH_X0) / 2, y: -0.5, width: TRENCH_X0 - b, height: 1, material: "asfalto" },
    // Valeta: fundo um metro abaixo do piso (um objeto dentro dela fica rente ao chão).
    { x: (TRENCH_X0 + TRENCH_X1) / 2, y: -TRENCH_DEPTH - 0.5, width: TRENCH_X1 - TRENCH_X0, height: 1, material: "concreto" },
    { x: (TRENCH_X1 + END + 1) / 2, y: -0.5, width: END + 1 - TRENCH_X1, height: 1, material: "asfalto" },
  ];
}

const area4Base: LevelData = {
  checkpoints: [
    { x: 124, y: 1.2 },
    { x: 153.4, y: 1.2 },
    { x: 168.6, y: 1.2 },
  ],
  killY: -5,
  bounds: { minX: START, maxX: END },
  // Garagem: número nos pilares, saída, vaga reservada, pichação, óleo e poças; depósito com placa de manutenção.
  adesivos: [
    ...[125, 130, 135, 140, 145, 150, 155, 160, 164, 170, 175, 180, 185, 190, 195].map((x, i): StickerData => ({
      kind: "placa", x, y: 1.75, z: 1.985, width: 0.42, height: 0.42, color: "#c9a21a", ink: "#141414", glow: 0.24, text: [`G${i + 1}`],
    })),
    { kind: "placa", x: 127.5, y: 2.35, z: BACK_Z - 0.07, width: 1.7, height: 0.45, color: "#1d5a36", ink: "#f1f1e6", glow: 0.35, text: ["SAÍDA  →"] },
    { kind: "placa", x: 146.6, y: 1.7, z: BACK_Z - 0.07, width: 1.0, height: 0.7, color: "#e8e4d6", ink: "#b3201a", glow: 0.24, text: ["VAGA", "RESERVADA", "DIRETORIA"] },
    { kind: "pichacao", x: 142.4, y: 1.0, z: BACK_Z - 0.07, width: 1.8, height: 0.8, color: "#d8d8cc", text: ["ZK 22"] },
    { kind: "umidade", x: 137.5, y: 1.3, z: BACK_Z - 0.06, width: 4, height: 2.6 },
    { kind: "umidade", x: 182.5, y: 1.3, z: BACK_Z - 0.06, width: 5, height: 2.6 },
    { kind: "mancha", x: 136.2, y: 0.02, z: 0.5, width: 2.4, height: 1.8, chao: true, color: "8,8,6" },
    { kind: "mancha", x: 141.3, y: 0.02, z: 1.0, width: 2.0, height: 1.5, chao: true, color: "8,8,6" },
    { kind: "mancha", x: 178.2, y: 0.02, z: 0.2, width: 2.6, height: 1.6, chao: true, color: "8,8,6" },
    { kind: "poca", x: 132.6, y: 0.02, z: -1.0, width: 2.2, height: 1.2, chao: true },
    { kind: "poca", x: 147.4, y: 0.02, z: 0.9, width: 1.6, height: 0.9, chao: true },
    { kind: "poca", x: 186.8, y: 0.02, z: -0.6, width: 1.8, height: 1.0, chao: true },
    { kind: "rachadura", x: 134, y: 0.02, z: 0.2, width: 2.4, height: 0.8, chao: true },
    { kind: "placa", x: 161.8, y: 2.6, z: BACK_Z - 0.07, width: 2.0, height: 0.38, color: "#3a2a1a", ink: "#e6dcc2", glow: 0.24, text: ["DEPÓSITO • MANUTENÇÃO"] },
  ],
  primeiroPlano: [
    { x0: START, x1: RAMP_END, y0: GALLERY_Y, y1: 0, material: "concreto" },
    { x0: RAMP_END, x1: END, y0: 0, material: "asfalto" },
  ],
  ambiente: [{ minX: START, maxX: END, intensidade: 0.5, cor: [0.56, 0.62, 0.44], nevoa: [0.26, 0.33, 0.3] }],
  vultos: [],
  depth: 4,
  ground: groundWithRecess(),
  walls: [
    { x: (START + RAMP_END) / 2, y: HALL_CEILING + 0.2, width: RAMP_END - START, height: 0.4, material: "concreto" },
    { x: (RAMP_END + END) / 2, y: CEILING + 0.2, width: END - RAMP_END, height: 0.4, material: "concreto" },
  ],
  platforms: [],
  obstacles: [
    laneBlock(BAR_X, (GAP + CEILING) / 2, 0.25, CEILING - GAP, "listrado"),
    barrier(BARRIER_X, 1),
    barrier(BARRIER2_X, 0.8),
    ...SLIDES2.map((x) => laneBlock(x, (GAP + CEILING) / 2, 0.25, CEILING - GAP, "listrado")),
    ...BARRIERS2.map((x) => barrier(x, 0.9)),
  ],
  ramps: [{ x0: START, y0: GALLERY_Y, x1: RAMP_END, y1: 0, material: "concreto" }],
  boxes: [
    { x: DEPOT_DRUMS_X, y: 0.5, size: 1, mass: 20, material: "metal", visual: DRUMS_VISUAL, pegada: DRUMS_GRIP },
    { x: DEPOT_BOX_X, y: 0.5, size: 1, mass: 20, material: "metal", visual: GAS_CART_VISUAL, pegada: GAS_CART_GRIP },
  ],
  lamps,
  plates: [{ x: DEPOT_PLATE_X, y: -DEPOT_PLATE_DEPTH, width: DEPOT_PLATE_WIDTH, door: 1 }],
  doors: [
    { x: GATE_X, y: CEILING / 2, width: 0.25, height: CEILING, openHeight: GAP, closeAfterX: GATE_X + 0.6 },
    { x: DEPOT_GATE_X, y: CEILING / 2, width: 0.25, height: CEILING, openHeight: 2.3 },
    { x: GATE2_X, y: CEILING / 2, width: 0.25, height: CEILING, openHeight: GAP, closeAfterX: GATE2_X + 0.6 },
  ],
  vigias: [
    {
      mode: "perseguicao",
      triggerX: 128,
      x0: DOOR1_X,
      porta: { z: BACK_Z },
      cena: { tipo: "porta", triggerX: SCENE1_TRIGGER, focusX: SCENE1_FOCUS },
      x1: GATE_X - GATE_STOP,
      y: 0,
      z: 1.4,
      speed: 4.3,
      elastico: ELASTICO,
      pause: 0,
      aimAhead: 5,
      aimY: 0.9,
      coneAngle: 0.45,
      range: 9,
    },
    {
      mode: "perseguicao",
      triggerX: CHASE2_TRIGGER,
      x0: CHASE2_START_X,
      cena: { tipo: "apagao", de: BLACKOUT_FROM, ate: BLACKOUT_TO, ambiente: { intensidade: 0.12, cor: [0.7, 0.3, 0.27] } },
      x1: GATE2_X - GATE_STOP,
      y: 0,
      z: 1.4,
      speed: 4.3,
      elastico: ELASTICO,
      pause: 0,
      aimAhead: 5,
      aimY: 0.9,
      coneAngle: 0.45,
      range: 9,
    },
  ],
  elevators: [],
  decor: [
    // Narrativa: mochila esquecida no depósito.
    { x: 161.9, y: 0.22, z: 1.3, width: 0.36, height: 0.44, depth: 0.2, material: "tecido" },
    { x: 155.9, y: 0.01, z: 1.0, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    { x: 162.6, y: 0.01, z: 0.7, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    // Valeta: paredes de concreto, faixa de aviso nas bordas e a grade tirada, encostada na parede.
    { x: (TRENCH_X0 + TRENCH_X1) / 2, y: -TRENCH_DEPTH / 2, z: 1.9, width: TRENCH_X1 - TRENCH_X0, height: TRENCH_DEPTH, depth: 0.2, material: "concreto" },
    ...[TRENCH_X0 - 0.06, TRENCH_X1 + 0.06].map((x): DecorData => ({ x, y: 0.005, z: -0.3, width: 0.12, height: 0.01, depth: 3.4, material: "listrado" })),
    { x: 159.3, y: 0.6, z: 2.35, width: 1.2, height: 1.2, depth: 0.05, material: "metal" },
    ...SLIDES2.flatMap((x) => [
      ...stripes(x, (GAP + CEILING) / 2, CEILING - GAP, 0.25),
      { x, y: CEILING - 0.02, z: LANE_Z, width: 0.08, height: 0.04, depth: LANE_DEPTH, material: "metal" } as DecorData,
    ]),
    ...[DEPOT_GATE_X, GATE2_X].map((x): DecorData => ({ x, y: CEILING / 2, z: BACK_Z - 0.1, width: 0.6, height: CEILING, depth: 0.2, material: "concreto" })),
    ...[164, 170, 175, 180, 185, 190, 195].flatMap(column),
    ...[172.5, 187.5].flatMap(cobogo),
    ...rampFill(),
    { x: (RAMP_END + END) / 2, y: CEILING + 2.2, z: 0, width: END - RAMP_END, height: 3.6, depth: 4.6, material: "concreto" },
    { x: RAMP_END - 0.2, y: (CEILING + HALL_CEILING) / 2 + 0.2, z: 0, width: 0.4, height: HALL_CEILING - CEILING, depth: 4.6, material: "concreto" },

    { x: (RAMP_END + END) / 2, y: 0.45, z: BACK_Z, width: END - RAMP_END, height: 0.9, depth: 0.1, material: "concreto" },
    { x: (RAMP_END + END) / 2, y: 1.95, z: BACK_Z + 0.03, width: END - RAMP_END, height: 2.1, depth: 0.1, material: "parede" },
    // Parede do fundo da rampa (pé-direito alto da entrada da garagem): sem ela o fundo ficava vazio.
    { x: (START + RAMP_END) / 2, y: HALL_CEILING / 2, z: BACK_Z + 0.03, width: RAMP_END - START + 0.2, height: HALL_CEILING, depth: 0.1, material: "parede" },
    { x: (START + RAMP_END) / 2, y: 0.45, z: BACK_Z, width: RAMP_END - START + 0.2, height: 0.9, depth: 0.1, material: "concreto" },
    ...[125, 130, 135, 140, 145, 150, 155, 160].flatMap(column),
    // Teto da garagem: eletrocalha de cabos e um cano correndo junto da laje (era um plano preto liso).
    { x: (RAMP_END + END) / 2, y: CEILING - 0.12, z: 0.5, width: END - RAMP_END, height: 0.07, depth: 0.32, material: "metal" },
    { x: (RAMP_END + END) / 2, y: CEILING - 0.22, z: 1.55, width: END - RAMP_END, height: 0.14, depth: 0.14, shape: "box", material: "carrinho" },
    ...[132.5, 147.5].flatMap(cobogo),

    ...[127, 131, 137, 141, 146, 150, 155, 159].map((x): DecorData => ({
      x, y: 0.005, z: -1, width: 0.12, height: 0.01, depth: 1.8, material: "listrado",
    })),
    ...stripes(BAR_X, (GAP + CEILING) / 2, CEILING - GAP, 0.25),
    { x: BAR_X, y: CEILING - 0.02, z: LANE_Z, width: 0.08, height: 0.04, depth: LANE_DEPTH, material: "metal" },
    { x: GATE_X, y: CEILING / 2, z: BACK_Z - 0.1, width: 0.6, height: CEILING, depth: 0.2, material: "concreto" },

  ],
  props: [
    // Barreiras de concreto prontas na faixa de corrida.
    ...barrierVisual(BARRIER_X, 1),
    ...barrierVisual(BARRIER2_X, 0.8),
    ...BARRIERS2.flatMap((x) => barrierVisual(x, 0.9)),
    // Luminárias fluorescentes no teto baixo.
    ...lamps.map((lamp) => fluorescent(lamp.x, CEILING - 0.01)),
    // Canos descendo pela parede do fundo, ao lado de algumas colunas.
    ...[125, 140, 155, 170, 185].map((x): PropData => ({ model: "modular_pipes", part: "pipe_200cm_metal", x: x + 0.55, y: 0, z: BACK_Z - 0.12, scale: 1.5 })),
    ...[130, 175].map((x): PropData => ({ model: "modular_pipes", part: "pipe_200cm_metal", x: x - 0.5, y: 0, z: BACK_Z - 0.12, scale: 2.4, stretch: [1, 0.625, 1] })),
    // Depósito: prateleiras de aço com caixas, tambores e pneus velhos.
    ...[157.5, 160.5].map((x): PropData => ({ model: "steel_frame_shelves_01", x, y: 0, z: BACK_Z - 0.35, rotY: 180, fitHeight: 2.2 })),
    { model: "cardboard_box_01", x: 157.1, y: 0.95, z: BACK_Z - 0.35, rotY: 92 },
    { model: "cardboard_box_01", x: 157.8, y: 0.95, z: BACK_Z - 0.35, rotY: 86 },
    { model: "plastic_crate_01", x: 160.2, y: 0.95, z: BACK_Z - 0.35, rotY: 90 },
    { model: "cardboard_box_01", x: 160.7, y: 1.85, z: BACK_Z - 0.35, rotY: 95 },
    { model: "plastic_crate_01", x: 157.4, y: 1.85, z: BACK_Z - 0.35, rotY: 88 },
    { model: "barrel_03", x: 154.2, y: 0, z: 2.15 },
    { model: "barrel_03", x: 154.85, y: 0, z: 2.2, rotY: 70 },
    // Garagem: pneus, sacos de lixo e caixas de força.
    ...[0, 1, 2].map((i): PropData => ({ model: "old_tyre", x: 128.3 + i * 0.12, y: 0, z: 2.05 + i * 0.17, rotY: 25 - i * 8 })),
    { model: "trashbag", x: 136.6, y: 0, z: 2.25 },
    { model: "trashbag", x: 137.1, y: 0, z: 2.3, rotY: 60 },
    { model: "utility_box_01", x: 144.2, y: 0, z: 2.3, rotY: 180 },
    { model: "power_box_01", x: 126.4, y: 1.5, z: BACK_Z - 0.04, rotY: 180 },
    { model: "security_camera_01", x: 165.4, y: 2.75, z: BACK_Z - 0.1, rotY: 220 },
    { model: "trashbag", x: 178.4, y: 0, z: 2.25, rotY: 20 },
    { model: "utility_box_02", x: 182.2, y: 0, z: 2.3, rotY: 180 },
    { model: "barrel_03", x: 191.2, y: 0, z: 2.2, rotY: 15 },
    { model: "old_tyre", x: 197.4, y: 0, z: 2.3, rotY: 8 },
  ],
};

// Perseguições mais longas (feedback do segundo jogador: cada uma durava uns 6 s; agora uns 10 s). A área é desenhada
// como antes e depois esticada: 20 m entram logo antes do portão de cada perseguição, e nesses trechos novos entram mais dois
// obstáculos (4 por trecho). Tudo o que vem depois de cada corte (depósito, segunda perseguição, fim da área) anda junto.
const STRETCH = 20;
const CUT1 = 145.5;
const CUT2 = 190.5;
/** Leva uma posição do desenho original da área 4 para a área esticada. */
export const AREA4_STRETCH: MapX = (x) => x + (x > CUT1 ? STRETCH : 0) + (x > CUT2 ? STRETCH : 0);

// Obstáculos novos, já nas coordenadas esticadas: um deslize e uma barreira em cada trecho novo.
const NEW_SLIDES = [149.2, 164, 217.5, 227.5];
const NEW_BARRIERS = [[154, 0.9], [158.5, 0.8], [213, 1], [223, 0.9]] as const;
// Lâmpadas que cobrem os trechos novos (a do segundo trecho apaga junto no apagão, que vai até o portão).
const NEW_LAMPS = [151.5, 161, 215, 225];

function withLongerChases(base: LevelData): LevelData {
  const level = mapLevelX(base, AREA4_STRETCH);
  return {
    ...level,
    obstacles: [
      ...level.obstacles,
      ...NEW_SLIDES.map((x) => laneBlock(x, (GAP + CEILING) / 2, 0.25, CEILING - GAP, "listrado")),
      ...NEW_BARRIERS.map(([x, h]) => barrier(x, h)),
    ],
    lamps: [...level.lamps, ...NEW_LAMPS.map((x): LampData => ({ x, y: 2.75, tom: "subsolo" }))],
    decor: [
      ...level.decor,
      ...NEW_SLIDES.flatMap((x) => [
        ...stripes(x, (GAP + CEILING) / 2, CEILING - GAP, 0.25),
        { x, y: CEILING - 0.02, z: LANE_Z, width: 0.08, height: 0.04, depth: LANE_DEPTH, material: "metal" } as DecorData,
      ]),
    ],
    props: [
      ...(level.props ?? []),
      ...NEW_BARRIERS.flatMap(([x, h]) => barrierVisual(x, h)),
      ...NEW_LAMPS.map((x) => fluorescent(x, CEILING - 0.01)),
    ],
  };
}

export const area4Level: LevelData = withLongerChases(area4Base);
