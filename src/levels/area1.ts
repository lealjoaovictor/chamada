import type { BlockData, DecorData, LampData, LevelData, PropData, StickerData, WireData } from "./types";
import { DRUMS_GRIP, DRUMS_VISUAL, TRASH_CAN_GRIP, TRASH_CAN_VISUAL, clad, facade, type BayKind } from "./kits.ts";

const FACADE_FRONT = 4;
const LAMP_Z = 1.4;
// O vidro do lampião do street_lamp_01 fica a ~92% da altura do poste.
const LAMP_HEIGHT_RATIO = 1.08;

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
// O Kit mede a base do covered_car pela caixa das rodas sem a posição delas (fica 0,3 m abaixo do pneu),
// então o carro subia uns 44 cm. Afundar a mesma medida põe os pneus no asfalto.
const CAR_SINK = 0.44;
// Depois do carro, um quadro de energia da rua: segundo esconderijo dentro da ronda do Vigia.
const CABINET_X = 81.3;
const CABINET_WIDTH = 1.6;
const CABINET_HEIGHT = 1.7;
const CABINET_DEPTH = 0.6;
// Da guarita até o fim da ronda o Zacarias anda agachado sozinho, como entre as estantes da biblioteca.
const FURTIVO_MIN_X = GUARITA_X - GUARITA_WIDTH / 2 - 1;
const FURTIVO_MAX_X = 87;
const END = 92;
// Frente das superfícies onde os adesivos encostam: o revestimento do kit tem 20 cm de espessura para fora.
const WALL_FACE = -2.23;
const MAIN_FACE = FACADE_FRONT - 0.25;
const GARAGE_FACE = 4.25;
const BACK_FACE = 3.95;
// Postes de concreto da rede elétrica, na calçada da frente (silhueta fina entre a câmera e o jogo).
const POLE_Z = -4.6;
const POLE_HEIGHT = 6.4;
const POLE_XS = [-2, 24, 61];
// Três fios por vão, presos na cruzeta do alto do poste.
const WIRE_YS = [6.1, 5.8, 5.5];
// A calçada da frente começa antes da parede da esquerda, para não aparecer a ponta na câmera.
const FRONT_MIN_X = -12;

// Postes de rua: vapor de sódio (laranja), que tira a cor de tudo e deixa as pessoas em silhueta.
const lamps: LampData[] = ([
  { x: 7, y: 3.4 },
  { x: 13.5, y: 3.4 },
  { x: 26.5, y: 3.4 },
  { x: 36, y: 5.2 },
  { x: 52, y: 3.4 },
  { x: 57, y: 3.4, flicker: true },
  { x: 70, y: 3.4 },
  { x: 86, y: 3.4 },
] as LampData[]).map((lamp) => ({ ...lamp, tom: "sodio" }));

/** Caixa d'água de fibra no telhado: corpo azul e tampa um pouco mais larga. */
function roofTank(x: number, roofY: number, z: number, size: number): DecorData[] {
  const height = size * 0.8;
  return [
    { x, y: roofY + height / 2, z, width: size, height, depth: size, material: "tatil", shape: "cylinder" },
    { x, y: roofY + height + 0.06, z, width: size * 1.08, height: 0.12, depth: size * 1.08, material: "tatil", shape: "cylinder" },
  ];
}

/** Antena fina com a luz vermelha de balizamento na ponta. */
function antenna(x: number, baseY: number, z: number, height: number): DecorData[] {
  return [
    { x, y: baseY + height / 2, z, width: 0.08, height, depth: 0.08, material: "metal", shape: "cylinder" },
    { x, y: baseY + height + 0.1, z, width: 0.22, height: 0.22, depth: 0.22, material: "sinal", shape: "sphere" },
  ];
}

function van(x: number): BlockData {
  return { x, y: VAN_HEIGHT / 2, z: COVER_Z, depth: COVER_DEPTH, width: VAN_WIDTH, height: VAN_HEIGHT, material: "metal", hidden: true };
}

export const area1Level: LevelData = {
  checkpoints: [
    { x: 1, y: 1.2 },
    { x: 44, y: 1.2 },
    { x: 65, y: 1.2 },
  ],
  killY: -5,
  bounds: { minX: -5, maxX: END },
  furtivo: [{ minX: FURTIVO_MIN_X, maxX: FURTIVO_MAX_X }],
  // Lá fora a névoa puxa para o brilho alaranjado da cidade, e o horizonte ganha silhuetas de prédios.
  ambiente: [{ minX: -5, maxX: END, intensidade: 0.8, cor: [0.48, 0.54, 0.7], nevoa: [0.14, 0.12, 0.125] }],
  cidade: [{ minX: -10, maxX: END }],
  fios: [
    // Entre os postes da frente: três fios com barriga.
    ...POLE_XS.slice(1).flatMap((x, i) =>
      WIRE_YS.map((y, k) => ({ a: [POLE_XS[i], y, POLE_Z + (k - 1) * 0.6], b: [x, y, POLE_Z + (k - 1) * 0.6], sag: 0.7, thickness: 0.035 }) as WireData),
    ),
    // Ramais: do poste até as fachadas, atravessando a cena em profundidade.
    { a: [-2, 5.8, POLE_Z], b: [11, 8.6, FACADE_FRONT - 0.1], sag: 0.5 },
    { a: [24, 5.8, POLE_Z], b: [36.5, 7.6, 9.9], sag: 0.6 },
    { a: [61, 5.5, POLE_Z], b: [64, 5.4, 4.4], sag: 0.35 },
    { a: [61, 6.1, POLE_Z], b: [90, 6.8, 4.1], sag: 1.1, thickness: 0.03 },
    // Fios ao fundo, entre os telhados.
    { a: [-6, 9.6, 17], b: [14, 8.5, 9.9], sag: 0.7, thickness: 0.03 },
    { a: [47, 8.4, 9.9], b: [50, 5.8, 4.4], sag: 0.3 },
    { a: [64, 5.8, 4.3], b: [70, 9.6, 16], sag: 0.6, thickness: 0.03 },
  ],
  // Sujeira e identidade: cartazes do DCE, placas da universidade, pichação, umidade, folhas, óleo e rachaduras.
  adesivos: [
    // Muro com passarela: mural de cartazes e pichação.
    { kind: "umidade", x: 34.5, y: 0.6, z: WALL_FACE, width: 7, height: 1.2 },
    { kind: "cartaz", x: 32.2, y: 1.4, z: WALL_FACE, width: 0.9, height: 1.25, rot: 0.03, color: "#f0c63a", ink: "#2a1a10", text: ["CALOURADA", "SEXTA • 22H", "QUADRA DO DCE", "R$ 10 C/ CARTEIRINHA"] },
    { kind: "cartaz", x: 33.3, y: 1.5, z: WALL_FACE - 0.005, width: 0.8, height: 1.1, rot: -0.04, color: "#ebe6d8", ink: "#b3201a", text: ["ASSEMBLEIA", "GERAL", "QUINTA • 18H", "AUDITÓRIO B"] },
    { kind: "cartaz", x: 34.2, y: 1.25, z: WALL_FACE, width: 0.7, height: 0.9, rot: 0.02, color: "#f7f7f2", ink: "#1e3c8a", text: ["XEROX", "IMPRESSÃO", "ENCADERNAÇÃO", "AO LADO DO RU"] },
    { kind: "cartaz", x: 35.0, y: 1.55, z: WALL_FACE - 0.005, width: 0.6, height: 0.8, rot: -0.06, color: "#f4efe4", ink: "#222222", text: ["ALUGA-SE", "QUARTO P/", "ESTUDANTE", "TRATAR NA", "PORTARIA"] },
    { kind: "pichacao", x: 36.6, y: 0.65, z: WALL_FACE - 0.01, width: 2, height: 0.8, color: "#e6e6de", text: ["DCE LIVRE"] },
    // Prédio principal: placa da universidade, umidade no embasamento e uma pichação.
    { kind: "umidade", x: 12.8, y: 0.75, z: MAIN_FACE, width: 4.6, height: 1.5 },
    { kind: "umidade", x: 27.3, y: 0.75, z: MAIN_FACE, width: 8.4, height: 1.5 },
    { kind: "placa", x: 27.6, y: 1.05, z: MAIN_FACE - 0.01, width: 2.6, height: 0.55, color: "#262626", ink: "#d9d2bf", glow: 0.15, text: ["UNIVERSIDADE FEDERAL", "INSTITUTO DE CIÊNCIAS EXATAS"] },
    { kind: "pichacao", x: 12.4, y: 0.75, z: MAIN_FACE - 0.01, width: 1.3, height: 0.7, color: "#c8342b", text: ["ZK"] },
    // Placa de rua azul na esquina do prédio da esquerda.
    { kind: "placa", x: 6.8, y: 3, z: 7.75, width: 1.3, height: 0.32, color: "#1f4d8f", ink: "#f4f4f4", glow: 0.2, text: ["R. DOS ESTUDANTES"] },
    // Portão lateral.
    { kind: "placa", x: 43, y: 2.15, z: 1.54, width: 0.38, height: 0.3, color: "#e8e2cf", ink: "#222222", text: ["ENTRADA", "DE SERVIÇO"] },
    // Doca e garagem.
    { kind: "umidade", x: DOCK_X, y: 0.5, z: WALL_FACE, width: DOCK_WIDTH, height: 1 },
    { kind: "pichacao", x: DOCK_X - 0.4, y: 0.5, z: WALL_FACE - 0.01, width: 1.6, height: 0.6, color: "#d0d0c8", text: ["FORA"] },
    { kind: "placa", x: 61, y: 3.3, z: GARAGE_FACE, width: 1.9, height: 0.36, color: "#f2c200", ink: "#111111", text: ["SAÍDA DE VEÍCULOS"] },
    { kind: "placa", x: 56.5, y: 1.8, z: GARAGE_FACE, width: 0.7, height: 0.5, color: "#b81d18", ink: "#f4f4f4", text: ["PROIBIDO", "ESTACIONAR"] },
    { kind: "pichacao", x: 50.5, y: 1.5, z: GARAGE_FACE, width: 2.2, height: 0.8, color: "#9fd3c7", text: ["UNIÃO"] },
    // Guarita e o prédio do fundo.
    { kind: "placa", x: GUARITA_X, y: 2.35, z: COVER_Z - COVER_DEPTH / 2 - 0.24, width: 1.4, height: 0.3, color: "#e6e1d3", ink: "#1d2b4a", glow: 0.2, text: ["PORTARIA"] },
    { kind: "cartaz", x: 78, y: 1.5, z: BACK_FACE, width: 0.7, height: 0.9, rot: 0.02, color: "#fffbe8", ink: "#222222", text: ["AVISO", "O PRÉDIO", "FECHA ÀS 23H", "— PORTARIA"] },
    { kind: "pichacao", x: 88, y: 1.15, z: BACK_FACE, width: 2.3, height: 0.75, color: "#e3e3dc", text: ["PRESENTE!"] },
    { kind: "umidade", x: 79, y: 0.7, z: BACK_FACE + 0.01, width: 24, height: 1.4 },
    // Chão: folhas sob as árvores, óleo na garagem, sujeira perto da lixeira e rachaduras na calçada.
    { kind: "folhas", x: 3.5, y: 0.012, z: 1, width: 4, height: 2.5, chao: true },
    { kind: "folhas", x: 9, y: 0.012, z: 0.2, width: 3, height: 2, chao: true, rot: 0.6 },
    { kind: "folhas", x: 5, y: 0.012, z: -3.1, width: 3, height: 1.6, chao: true },
    { kind: "folhas", x: 33.5, y: 2.25, z: 0.2, width: 2, height: 1.2, chao: true },
    { kind: "mancha", x: 27, y: 0.012, z: 1.4, width: 1.6, height: 1.2, chao: true, color: "25,30,15" },
    { kind: "mancha", x: 56, y: 0.012, z: 0.2, width: 2, height: 1.4, chao: true, color: "8,8,10" },
    { kind: "mancha", x: 63, y: 0.012, z: -0.6, width: 2.4, height: 1.6, chao: true, color: "8,8,10" },
    { kind: "mancha", x: 76, y: 0.012, z: 1.3, width: 3, height: 1.4, chao: true, color: "8,8,10" },
    { kind: "rachadura", x: 20, y: 0.012, z: -3, width: 3, height: 0.8, chao: true },
    { kind: "rachadura", x: 70, y: 0.012, z: -3.2, width: 2.5, height: 0.7, chao: true, rot: 0.2 },
    { kind: "rachadura", x: 40, y: 0.012, z: 0.6, width: 2.2, height: 0.7, chao: true, rot: -0.3 },

    // Luz pintada (estilo Inside): sombra de contato sob o que fica no chão, faixa escura no pé das paredes e
    // poças de luz quente sob os postes. Nada disso é luz de verdade, então não pesa no limite da GPU.
    ...[
      [0.6, 2.6, 1.9, 0.8],
      [13, 2.4, 2.3, 0.8],
      [7.5, -1.3, 0.7, 0.6],
      [73, -3.3, 0.7, 0.6],
      [26.5, 2.6, 1, 0.8],
      [64.6, 2.5, 1.7, 1],
      [49.75, 1.95, 2.1, 1.5],
      [48.6, 2.4, 1, 0.9],
      [55.2, 2.6, 0.9, 0.7],
      [62.5, 2.6, 1.7, 1],
      [44.5, -3.3, 1.7, 0.7],
      [46.8, -3.3, 1.7, 0.7],
      [4.5, 0, 0.8, 2.2],
      [43, 1.8, 0.9, 0.9],
      [46, 1.8, 0.9, 0.9],
      [90.2, 1.8, 0.7, 0.7],
      ...POLE_XS.map((x) => [x, POLE_Z, 0.9, 0.9]),
      ...lamps.filter((lamp) => lamp.y < 4).map((lamp) => [lamp.x, LAMP_Z, 0.7, 0.7]),
    ].map(([x, z, width, height]): StickerData => ({ kind: "sombra", x, y: 0.014, z, width, height, chao: true })),
    { kind: "sombra", x: 36, y: 2.234, z: LAMP_Z, width: 0.7, height: 0.7, chao: true },
    // O carro e o quadro de energia pesam mais: sombra mais forte.
    { kind: "sombra", x: VAN_XS[0], y: 0.014, z: COVER_Z, width: 5, height: 2.2, chao: true, strength: 0.75 },
    { kind: "sombra", x: CABINET_X, y: 0.014, z: COVER_Z, width: 2, height: 1.1, chao: true, strength: 0.7 },
    ...[
      [34.5, WALL_FACE - 0.35, 7.4],
      [DOCK_X, WALL_FACE - 0.35, DOCK_WIDTH + 0.2],
      [10.5, WALL_FACE - 0.35, 1.8],
      [21, WALL_FACE - 0.35, 4.2],
      [GUARITA_X, COVER_Z - COVER_DEPTH / 2 - 0.6, GUARITA_WIDTH + 0.6],
      [21, MAIN_FACE - 0.4, 21],
      [56.5, GARAGE_FACE - 0.4, 15],
      [79, BACK_FACE - 0.4, 24],
      [-1, 7.6, 18],
    ].map(([x, z, width]): StickerData => ({ kind: "pe-de-parede", x, y: 0.016, z, width, height: 0.8, chao: true })),
    // Poças de luz dos postes (menos o que pisca, para a poça não ficar acesa com a lâmpada apagada).
    ...lamps
      .filter((lamp) => !lamp.flicker && lamp.y < 4)
      .map((lamp): StickerData => ({ kind: "luz", x: lamp.x, y: 0.018, z: LAMP_Z - 1, width: 5, height: 3.5, chao: true })),
    { kind: "luz", x: 36, y: 2.238, z: 0, width: 4, height: 3.6, chao: true },
    // Sem poça branca nos refletores: no chão ela se confunde com o facho da lanterna do Vigia.
  ],
  // Grade baixa na beira da calçada da frente, onde não há esconderijo.
  grades: [
    { x0: -6, x1: 8.5, z: -4.05, height: 0.9 },
    { x0: 47.5, x1: 57, z: -4.05, height: 0.9 },
  ],
  vultos: [{ x: 21, y: 1.5, z: 1.5, facing: 1 }, { x: 60.5, y: 0, z: 0.8, facing: 1, anda: true }],
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
    { x: GATE_X, y: GATE_HEIGHT + 1.5, width: 0.6, height: 3, material: "asfalto" },
  ],
  platforms: [
    { x: 21, y: 0.75, width: 4, height: 1.5, material: "pedra" },
    { x: DOCK_X, y: DOCK_HEIGHT / 2, width: DOCK_WIDTH, height: DOCK_HEIGHT, material: "concreto" },
  ],
  obstacles: [
    { x: 4.5, y: 0.45, width: 0.6, height: 0.9, material: "concreto", hidden: true },
    { x: 10.5, y: 0.5, width: 1.6, height: 1, material: "pedra" },
    { x: 34.5, y: 1.1, width: 7, height: 2.2, material: "pedra" },
    { x: GUARITA_X, y: 1.3, z: COVER_Z, depth: COVER_DEPTH, width: GUARITA_WIDTH, height: 2.6, material: "parede" },
    ...VAN_XS.map(van),
    { x: CABINET_X, y: CABINET_HEIGHT / 2, z: COVER_Z, depth: CABINET_DEPTH, width: CABINET_WIDTH, height: CABINET_HEIGHT, material: "metal", hidden: true },
  ],
  ramps: [
    { x0: 15, y0: 0, x1: 19, y1: 1.5, hidden: true },
    { x0: 38, y0: 2.2, x1: 42, y1: 0, material: "metal" },
  ],
  boxes: [
    {
      x: 28,
      y: 0.5,
      size: 1,
      mass: 20,
      material: "lixeira",
      visual: TRASH_CAN_VISUAL,
      pegada: TRASH_CAN_GRIP,
    },
    {
      x: DOCK_X + 0.8,
      y: DOCK_HEIGHT + 0.5,
      size: 1,
      mass: 20,
      material: "metal",
      visual: DRUMS_VISUAL,
      pegada: DRUMS_GRIP,
    },
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
    // Narrativa: folhas espalhadas pela escadaria e um celular com a tela acesa na garagem.
    { x: 16.8, y: 0.01, z: -0.9, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    { x: 17.6, y: 0.01, z: -0.4, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    { x: 24.5, y: 1.505, z: -0.7, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    { x: 25.3, y: 1.505, z: -1.2, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    { x: 26.9, y: 1.505, z: -0.3, width: 0.21, height: 0.005, depth: 0.29, material: "papel" },
    { x: 62.6, y: 0.012, z: -0.7, width: 0.09, height: 0.012, depth: 0.17, material: "tela" },
    ...[0, 1, 2, 3, 4, 5].map((i): DecorData => ({
      x: 15 + 0.333 + i * 0.667,
      y: (i + 1) * 0.125,
      width: 0.667,
      height: (i + 1) * 0.25,
      z: 0.6,
      depth: 5.2,
      material: "pedra",
    })),
    // Patamar entre a escadaria e a porta, encostado no embasamento do prédio.
    { x: 21, y: 0.75, z: 3, width: 4, height: 1.5, depth: 2, material: "pedra" },
    // Faixa de pedestre.
    { x: 2.5, y: 0.006, z: -0.6, width: 0.5, height: 0.01, depth: 0.9, material: "moldura" },
    { x: 1.4, y: 0.006, z: -0.6, width: 0.5, height: 0.01, depth: 0.9, material: "moldura" },
    { x: 0.3, y: 0.006, z: -0.6, width: 0.5, height: 0.01, depth: 0.9, material: "moldura" },
    // Canteiro do jardim (borda de concreto e terra escura).
    { x: 6.5, y: 0.08, z: 3.2, width: 9, height: 0.16, depth: 2.2, material: "concreto" },
    { x: 6.5, y: 0.1, z: 3.2, width: 8.7, height: 0.16, depth: 1.9, material: "asfalto" },

    // Porta principal: fica dentro do vão da fachada (chacoalha quando o jogador encosta).
    { id: "porta-principal", x: 21, y: 2.85, z: 4.12, width: 1.62, height: 2.7, depth: 0.12, material: "madeira" },

    // Volumes escuros atrás das fachadas: interior visto pelas janelas e silhueta do telhado.
    { x: 21, y: 5.6, z: 8, width: 20.6, height: 11.2, depth: 7.4, material: "interior" },
    { x: 56.5, y: 3.6, z: 8.1, width: 14.6, height: 7.2, depth: 6.6, material: "interior" },
    { x: 79, y: 3.6, z: 8.1, width: 23.6, height: 7.2, depth: 7.2, material: "interior" },
    // Interiores dos prédios distantes (atrás das janelas).
    { x: -2, y: 5, z: 20.1, width: 23.6, height: 10, depth: 5.6, material: "interior" },
    { x: 46.5, y: 6.5, z: 21.1, width: 26.6, height: 13, depth: 5.6, material: "interior" },
    { x: 77.5, y: 5, z: 19.1, width: 26.6, height: 10, depth: 5.6, material: "interior" },
    // Algumas janelas acesas (alguém ainda está lá dentro).
    ...[
      [15, 6, 4.28],
      [24, 9, 4.28],
      [27, 3, 4.28],
      [53.5, 4.5, 4.75],
      [80.5, 4.5, 4.45],
      [86.5, 1.5, 4.45],
      [-6.5, 7.5, 17.28],
      [3.5, 1.5, 17.28],
      [40.5, 7.5, 18.28],
      [49.5, 10.5, 18.28],
      [52.5, 4.5, 18.28],
      [71.5, 7.5, 16.28],
      [83.5, 4.5, 16.28],
    ].map(([x, y, z]): DecorData => ({ x, y, z, width: 2.4, height: 2.6, depth: 0.02, material: "janela-acesa" })),

    // Muro com passarela: piso metálico em cima.
    { x: 34.5, y: 2.22, z: 0, width: 7, height: 0.04, depth: 1.6, material: "metal" },
    { x: 40, y: 2.2, z: 1.6, width: 4.5, height: 0.06, depth: 0.06, material: "metal" },

    // Portão lateral: pilares de pedra.
    { x: 43, y: 1.6, z: 1.8, width: 0.45, height: 3.2, depth: 0.45, material: "pedra" },
    { x: 46, y: 1.6, z: 1.8, width: 0.45, height: 3.2, depth: 0.45, material: "pedra" },
    { x: 43, y: 3.26, z: 1.8, width: 0.6, height: 0.12, depth: 0.6, material: "concreto" },
    { x: 46, y: 3.26, z: 1.8, width: 0.6, height: 0.12, depth: 0.6, material: "concreto" },

    { x: GATE_X, y: GATE_HEIGHT / 2, z: 2.3, width: 0.6, height: GATE_HEIGHT, depth: 0.3, material: "asfalto" },
    { x: GATE_X, y: GATE_HEIGHT / 2, z: -2.1, width: 0.6, height: GATE_HEIGHT, depth: 0.3, material: "asfalto" },
    { x: DOCK_X, y: DOCK_HEIGHT + 0.02, z: -0.3, width: DOCK_WIDTH, height: 0.04, depth: 2.6, material: "listrado" },
    { x: GUARITA_X, y: 2.68, z: COVER_Z, width: GUARITA_WIDTH + 0.4, height: 0.16, depth: COVER_DEPTH + 0.4, material: "concreto" },

    // Primeiro plano: calçada, meio-fio e a rua entre a câmera e o jogo (antes era uma faixa preta).
    { x: (FRONT_MIN_X + END) / 2, y: -0.06, z: -3.1, width: END - FRONT_MIN_X, height: 0.12, depth: 2.2, material: "concreto" },
    { x: (FRONT_MIN_X + END) / 2, y: -0.08, z: -4.25, width: END - FRONT_MIN_X, height: 0.2, depth: 0.2, material: "moldura" },
    { x: (FRONT_MIN_X + END) / 2, y: -0.3, z: -7, width: END - FRONT_MIN_X, height: 0.1, depth: 5.4, material: "asfalto" },
    // Postes da rede elétrica: fuste de concreto e cruzeta no alto.
    ...POLE_XS.flatMap((x): DecorData[] => [
      { x, y: POLE_HEIGHT / 2, z: POLE_Z, width: 0.26, height: POLE_HEIGHT, depth: 0.26, material: "concreto", shape: "cylinder" },
      { x, y: WIRE_YS[0] - 0.05, z: POLE_Z, width: 0.12, height: 0.1, depth: 1.6, material: "madeira" },
    ]),
    // Telhados: caixas d'água de fibra (azuis), casas de máquinas e antenas com luz vermelha.
    ...roofTank(52, 7.2, 8.2, 1.5),
    ...roofTank(54.2, 7.2, 8.6, 1.2),
    { x: 60.5, y: 7.2 + 1.1, z: 9, width: 3, height: 2.2, depth: 2.4, material: "concreto" },
    { x: 84, y: 7.2 + 1.2, z: 9, width: 3.6, height: 2.4, depth: 2.6, material: "concreto" },
    ...antenna(75, 7.2, 9, 4.5),
    ...roofTank(38, 9, 12.5, 1.8),
    ...roofTank(44, 9, 13, 1.4),
    ...roofTank(-4, 10, 20, 2),
    ...roofTank(5.5, 10, 20.5, 1.6),
    { x: 40, y: 13 + 1.2, z: 21, width: 4, height: 2.4, depth: 3, material: "concreto" },
    ...antenna(41.2, 15.4, 21, 6),
    ...roofTank(52, 13, 21.5, 2),
    ...roofTank(70, 10, 19, 1.8),
    ...roofTank(73, 10, 19.5, 1.5),
    ...antenna(86, 10, 19.5, 5),

    // Vãos preenchidos: interior dos prédios novos (entre a escadaria e a garagem, e à esquerda da rua).
    { x: 40.5, y: 4.5, z: 12.5, width: 15, height: 9, depth: 5, material: "interior" },
    { x: -1, y: 6, z: 10.5, width: 18, height: 12, depth: 5, material: "interior" },
    ...[
      [36, 4.5, 10.28],
      [42, 7.5, 10.28],
      [-6, 4.5, 8.28],
      [3, 7.5, 8.28],
    ].map(([x, y, z]): DecorData => ({ x, y, z, width: 2.4, height: 2.6, depth: 0.02, material: "janela-acesa" })),
  ],
  props: [
    // Tampa da lixeira empurrável, caída onde a lixeira estava.
    { model: "metal_trash_can", part: "metal_trash_can_lid", x: 27.2, y: 0, z: 0.75, rotY: 20, scale: 1.12, stretch: [1.3, 1, 1.3] },
    // Prédio principal da universidade: embasamento de pedra, três andares e porta no meio.
    ...facade({
      model: "modular_urban_apartments_facade",
      x0: 10.5,
      z: FACADE_FRONT,
      y0: 1.5,
      plinth: 2,
      floors: [
        ["janela", "janela", "janela", "porta", "janela", "janela", "janela"],
        ["janela", "janela-dupla", "janela", "janela", "janela", "janela-dupla", "janela"],
        ["janela", "janela", "janela", "janela", "janela", "janela", "janela"],
      ],
    }),
    // Garagem (galpão atrás da doca) e o prédio do fundo da guarita.
    ...facade({
      model: "modular_factory_facade",
      x0: 49,
      z: 4.5,
      y0: 0,
      plinth: 0,
      floors: [
        ["parede", "janela", "parede", "garagem", "garagem"],
        ["janela", "janela", "janela", "janela", "janela"],
      ],
    }),
    ...facade({
      model: "modular_factory_facade",
      x0: 67,
      z: 4.2,
      y0: 0,
      plinth: 0,
      floors: [
        ["parede", "janela", "janela", "porta", "janela", "janela", "parede", "janela"],
        ["janela", "janela", "janela", "janela", "janela", "janela", "janela", "janela"],
      ],
    }),
    // Prédios distantes, que a névoa transforma em silhueta. Baixos o bastante para o céu e a cidade aparecerem atrás.
    ...facade({
      model: "modular_urban_apartments_facade",
      x0: -14,
      z: 17,
      y0: 0,
      floors: Array.from({ length: 3 }, () => Array<BayKind>(8).fill("janela")),
    }),
    ...facade({
      model: "modular_factory_facade",
      x0: 33,
      z: 18,
      y0: 0,
      plinth: 0,
      floors: Array.from({ length: 3 }, () => Array<BayKind>(9).fill("janela")),
    }),
    ...facade({
      model: "modular_urban_apartments_facade",
      x0: 64,
      z: 16,
      y0: 0,
      floors: Array.from({ length: 3 }, () => Array<BayKind>(9).fill("janela")),
    }),

    // Muro, doca, floreira e guarita revestidos com peças dos kits.
    ...clad({ model: "modular_urban_apartments_facade", part: "base_standard_01", pieceWidth: 3, pieceHeight: 0.75, x0: 31, width: 7, y0: 0, height: 2.2, z: -2 }),
    ...clad({ model: "modular_urban_apartments_facade", part: "base_standard_01", pieceWidth: 3, pieceHeight: 0.75, x0: 19, width: 4, y0: 0, height: 1.5, z: -2 }),
    ...clad({ model: "modular_urban_apartments_facade", part: "base_standard_01", pieceWidth: 3, pieceHeight: 0.75, x0: 9.7, width: 1.6, y0: 0, height: 1, z: -2 }),
    ...clad({ model: "modular_factory_facade", part: "base_standard_standard_01", pieceWidth: 3, pieceHeight: 0.75, x0: DOCK_X - DOCK_WIDTH / 2, width: DOCK_WIDTH, y0: 0, height: DOCK_HEIGHT, z: -2 }),
    ...clad({ model: "modular_factory_facade", part: "wall_standard_standard_01", pieceWidth: 3, pieceHeight: 3, x0: GUARITA_X - GUARITA_WIDTH / 2, width: GUARITA_WIDTH, y0: 0, height: 2.6, z: COVER_Z - COVER_DEPTH / 2 - 0.01 }),

    // Postes (a lâmpada de cada poste fica na luz da fase).
    ...lamps.map((lamp): PropData => {
      const baseY = lamp.x > 31 && lamp.x < 38 ? 2.2 : 0;
      return { model: "street_lamp_01", x: lamp.x, y: baseY, z: LAMP_Z, fitHeight: (lamp.y - baseY) * LAMP_HEIGHT_RATIO };
    }),

    // Rua e jardim.
    { model: "concrete_road_barrier", x: 4.5, y: 0, z: 0, rotY: 90, fitHeight: 0.9 },
    { model: "water_manhole_cover", x: 6, y: 0.01, z: 0.9 },
    { model: "fire_hydrant", part: "fire_hydrant_aged|fire_hydrant_cap_0\\d_aged|fire_hydrant_chain_aged", x: 7.5, y: 0, z: -1.3, rotY: 200 },
    { model: "island_tree_02", x: 3, y: 0.15, z: 3.4, rotY: 30, fitHeight: 4.4 },
    { model: "island_tree_02", x: 8.6, y: 0.15, z: 3.1, rotY: 200, fitHeight: 5 },
    { model: "shrub_02", part: "shrub_02_a", x: 5.6, y: 0.15, z: 2.7 },
    { model: "shrub_02", part: "shrub_02_c", x: 10.2, y: 1, z: 0.4, rotY: 70, scale: 0.7 },
    { model: "shrub_02", part: "shrub_02_b", x: 11.1, y: 1, z: -0.2, scale: 0.6 },
    { model: "grass_medium_01", x: 6.5, y: 0.17, z: 3.2 },
    { model: "painted_wooden_bench", x: 0.6, y: 0, z: 2.6, rotY: 180, scale: 1.2 },
    { model: "modular_street_seating", part: "legs_single|legs_double|seat|seat_back|back_support_r|back_support_l|arm_rest_01|crossbar|suspended_support_01", x: 13, y: 0, z: 2.4, rotY: 180 },
    { model: "trashbag", x: 26.5, y: 0, z: 2.6, rotY: 40 },
    { model: "searsia_lucida", part: "searsia_lucida_d_LOD0", x: 28.6, y: 0, z: 3, scale: 1.2 },
    { model: "searsia_lucida", part: "searsia_lucida_e_LOD0", x: 30.5, y: 0, z: 3, scale: 1.2 },
    { model: "island_tree_02", x: 33.5, y: 0, z: 5.2, rotY: 110, fitHeight: 5.6 },

    // Portão lateral aberto, folha de ferro encostada.
    { model: "large_iron_gate", part: "large_iron_gate_right_door", x: 46.2, y: 0, z: 0.9, rotY: 95 },
    { model: "large_iron_gate", part: "large_iron_gate_left_door", x: 42.8, y: 0, z: 2.6, rotY: 175 },

    // Garagem.
    { model: "barrel_03", x: 49.4, y: 0, z: 1.6 },
    { model: "barrel_03", x: 50.1, y: 0, z: 2.3, rotY: 60 },
    { model: "old_tyre", x: 48.6, y: 0.3, z: 2.4, rotY: 20 },
    { model: "hand_truck", x: 55.2, y: 0, z: 2.6, rotY: 160 },
    { model: "industrial_storage_cart", x: 62.5, y: 0, z: 2.6, rotY: 180 },
    { model: "trashbag", x: 64.4, y: 0, z: 2.8 },
    { model: "trashbag", x: 64.9, y: 0, z: 2.2, rotY: 120, scale: 0.85 },
    { model: "security_light", x: 52, y: 3.3, z: 4.45, rotY: 180 },
    { model: "exterior_aircon_unit", part: "exterior_aircon_unit_rusted", x: 51.5, y: 4.6, z: 4.35, rotY: 180 },

    // Guarita, vans e o quadro de energia.
    { model: "rollershutter_window_01", part: "rollershutter_window_01", x: GUARITA_X, y: 0.6, z: COVER_Z - COVER_DEPTH / 2 - 0.03, rotY: 180, fitWidth: 2.2 },
    { model: "security_light", x: GUARITA_X + 1.6, y: 2.4, z: COVER_Z - COVER_DEPTH / 2 - 0.02, rotY: 180 },
    { model: "security_camera_01", x: GUARITA_X - 1.8, y: 2.76, z: COVER_Z - 0.4, rotY: 230 },
    ...VAN_XS.map((x): PropData => ({ model: "covered_car", x, y: -CAR_SINK, z: COVER_Z, rotY: 90, fitWidth: VAN_WIDTH * 0.42, stretch: [1, 1.42, 1], shadow: true })),
    { model: "utility_box_02", x: CABINET_X, y: 0, z: COVER_Z, rotY: 180, fitHeight: CABINET_HEIGHT, stretch: [1.14, 1, 1], shadow: true },
    { model: "power_box_01", x: 84.3, y: 1.5, z: 4.15, rotY: 180 },
    { model: "exterior_aircon_unit", part: "exterior_aircon_unit", x: 88.5, y: 3.6, z: 4.05, rotY: 180 },
    { model: "WetFloorSign_01", x: 90.2, y: 0, z: 1.8, rotY: 30 },

    // Vãos preenchidos: prédio baixo entre a escadaria e a garagem, e um prédio à esquerda da rua.
    ...facade({ model: "modular_factory_facade", x0: 33, z: 10, y0: 0, plinth: 0, floors: Array.from({ length: 3 }, () => Array<BayKind>(5).fill("janela")) }),
    ...facade({ model: "modular_urban_apartments_facade", x0: -10, z: 8, y0: 0, floors: Array.from({ length: 4 }, () => Array<BayKind>(6).fill("janela")) }),
    // Primeiro plano baixo, na calçada da frente: nada alto, para não tapar o jogo nem os esconderijos.
    { model: "shrub_02", part: "shrub_02_a", x: 3, y: 0, z: -3.4, scale: 0.9 },
    { model: "shrub_02", part: "shrub_02_c", x: 24, y: 0, z: -3.5, scale: 0.8 },
    { model: "concrete_road_barrier", x: 44.5, y: 0, z: -3.3, fitHeight: 0.8 },
    { model: "concrete_road_barrier", x: 46.8, y: 0, z: -3.3, rotY: 8, fitHeight: 0.8 },
    { model: "shrub_02", part: "shrub_02_b", x: 60, y: 0, z: -3.5 },
    { model: "fire_hydrant", part: "fire_hydrant_aged|fire_hydrant_cap_0\\d_aged|fire_hydrant_chain_aged", x: 73, y: 0, z: -3.3, rotY: 160 },
  ],
};
