import type { BlockData, DecorData, LampData, LevelData, PropData } from "./types";
import { CRATE_VISUAL, clad, facade, type BayKind } from "./kits.ts";

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
const END = 92;

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
  ambiente: [{ minX: -5, maxX: END, intensidade: 0.8, cor: [0.48, 0.54, 0.7] }],
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
      visual: [{ model: "metal_trash_can", part: "metal_trash_can|metal_trash_can_handle_(left|right)", x: 0, y: 0, z: 0, fitHeight: 1.02, stretch: [1.3, 1, 1.3] }],
    },
    {
      x: DOCK_X + 0.8,
      y: DOCK_HEIGHT + 0.5,
      size: 1,
      mass: 20,
      material: "caixa",
      visual: CRATE_VISUAL,
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
    { x: -2, y: 8, z: 20.1, width: 23.6, height: 16, depth: 5.6, material: "interior" },
    { x: 46.5, y: 9.5, z: 21.1, width: 26.6, height: 19, depth: 5.6, material: "interior" },
    { x: 77.5, y: 6.5, z: 19.1, width: 26.6, height: 13, depth: 5.6, material: "interior" },
    // Algumas janelas acesas (alguém ainda está lá dentro).
    ...[
      [15, 6, 4.28],
      [24, 9, 4.28],
      [27, 3, 4.28],
      [53.5, 4.5, 4.75],
      [80.5, 4.5, 4.45],
      [86.5, 1.5, 4.45],
      [-6.5, 7.5, 17.28],
      [3.5, 13.5, 17.28],
      [40.5, 10.5, 18.28],
      [49.5, 16.5, 18.28],
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
  ],
  props: [
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
    // Prédios distantes, que a névoa transforma em silhueta.
    ...facade({
      model: "modular_urban_apartments_facade",
      x0: -14,
      z: 17,
      y0: 0,
      floors: Array.from({ length: 5 }, () => Array<BayKind>(8).fill("janela")),
    }),
    ...facade({
      model: "modular_factory_facade",
      x0: 33,
      z: 18,
      y0: 0,
      plinth: 0,
      floors: Array.from({ length: 6 }, () => Array<BayKind>(9).fill("janela")),
    }),
    ...facade({
      model: "modular_urban_apartments_facade",
      x0: 64,
      z: 16,
      y0: 0,
      floors: Array.from({ length: 4 }, () => Array<BayKind>(9).fill("janela")),
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

    // Guarita e vans.
    { model: "rollershutter_window_01", part: "rollershutter_window_01", x: GUARITA_X, y: 0.6, z: COVER_Z - COVER_DEPTH / 2 - 0.03, rotY: 180, fitWidth: 2.2 },
    { model: "security_light", x: GUARITA_X + 1.6, y: 2.4, z: COVER_Z - COVER_DEPTH / 2 - 0.02, rotY: 180 },
    { model: "security_camera_01", x: GUARITA_X - 1.8, y: 2.76, z: COVER_Z - 0.4, rotY: 230 },
    ...VAN_XS.map((x): PropData => ({ model: "covered_car", x, y: 0, z: COVER_Z, rotY: 90, fitWidth: VAN_WIDTH * 0.42, stretch: [1, 1.42, 1], shadow: true })),
    { model: "utility_box_02", x: 82, y: 0, z: 3.9, rotY: 180 },
    { model: "power_box_01", x: 84.3, y: 1.5, z: 4.15, rotY: 180 },
    { model: "exterior_aircon_unit", part: "exterior_aircon_unit", x: 88.5, y: 3.6, z: 4.05, rotY: 180 },
    { model: "WetFloorSign_01", x: 90.2, y: 0, z: 1.8, rotY: 30 },
  ],
};
