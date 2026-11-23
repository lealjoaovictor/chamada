import type { PropData } from "./types";

// Montagem de fachadas com os kits modulares do Poly Haven (CC0).
// Cada módulo tem 3 m de largura e 3 m de altura; a origem do kit fica no canto inferior direito da peça,
// com a frente virada para +z. Giramos 180° para a frente olhar para a câmera (que fica em z negativo),
// e então cada módulo ocupa [x, x + 3] a partir da origem colocada.

export const BAY = 3;
const STOREY = 3;

export type BayKind = "parede" | "janela" | "janela-dupla" | "porta" | "garagem";

export interface FacadeOptions {
  model: "modular_urban_apartments_facade" | "modular_factory_facade";
  /** X da borda esquerda da fachada. */
  x0: number;
  /** Plano da fachada (z da parede). */
  z: number;
  /** Altura do pé do primeiro andar. */
  y0: number;
  /** Tipo de cada vão, por andar (o primeiro é o térreo). */
  floors: BayKind[][];
  /** Quantos módulos de embasamento (0,75 m cada) ficam abaixo do térreo. */
  plinth?: number;
}

const PIECES: Record<FacadeOptions["model"], Record<BayKind, string[]>> = {
  modular_urban_apartments_facade: {
    parede: ["wall_standard_standard_01"],
    janela: ["wall_window_centered_large_01", "window_centered_large_01"],
    "janela-dupla": ["wall_window_centered_double_01", "window_centered_double_01"],
    porta: ["wall_door_centered_large_01"],
    garagem: ["wall_door_centered_large_01"],
  },
  modular_factory_facade: {
    parede: ["wall_standard_standard_01"],
    janela: ["wall_window_tall_large_01", "window_tall_large_01"],
    "janela-dupla": ["wall_window_centered_double_01", "window_centered_double_01"],
    porta: ["wall_door_recessed_large_01", "door_recessed_large_01"],
    garagem: ["wall_door_garage_door_01", "door_garage_door_01"],
  },
};

/** Peça com a borda esquerda em `left`: girada 180°, a origem do kit (canto direito) vai para left + width. */
function piece(model: string, part: string, left: number, y: number, z: number, width = BAY): PropData {
  return { model, part, x: left + width, y, z, rotY: 180, origin: true };
}

export function facade(o: FacadeOptions): PropData[] {
  const props: PropData[] = [];
  const bays = o.floors[0].length;
  const plinth = o.plinth ?? 1;
  const crown = o.model === "modular_urban_apartments_facade" ? "crown_standard_standard_01" : "crown_standard_standard_01";
  const cornice = o.model === "modular_urban_apartments_facade" ? "cornice_standard_standard_01" : "cornice01_standard_standard_01";
  const base = o.model === "modular_urban_apartments_facade" ? "base_standard_01" : "base_standard_standard_01";
  const pier = "wall_pier_standard_01";
  for (let i = 0; i < bays; i++) {
    const x = o.x0 + i * BAY;
    for (let p = 0; p < plinth; p++) props.push(piece(o.model, base, x, o.y0 - (p + 1) * 0.75, o.z));
    o.floors.forEach((floor, f) => {
      const kind = floor[i];
      if (kind === undefined) return;
      const y = o.y0 + f * STOREY;
      const width = kind === "garagem" && o.model === "modular_factory_facade" ? 2 : 1;
      if (kind === "garagem" && i > 0 && floor[i - 1] === "garagem") return;
      for (const part of PIECES[o.model][kind]) props.push(piece(o.model, part, x, y, o.z, width * BAY));
      if (f > 0) props.push(piece(o.model, cornice, x, y - 0.1, o.z));
    });
    props.push(piece(o.model, crown, x, o.y0 + o.floors.length * STOREY, o.z));
  }
  for (let i = 0; i <= bays; i++) {
    const x = o.x0 + i * BAY;
    o.floors.forEach((_, f) => props.push(piece(o.model, pier, x, o.y0 + f * STOREY, o.z, 0)));
  }
  return props;
}

export interface CladOptions {
  model: FacadeOptions["model"];
  /** Peça usada no revestimento (ex.: embasamento de pedra ou parede de tijolo). */
  part: string;
  pieceWidth: number;
  pieceHeight: number;
  x0: number;
  width: number;
  y0: number;
  height: number;
  /** Plano da face revestida (a frente da peça olha para a câmera). */
  z: number;
}

/** Reveste a face frontal de um bloco de colisão com peças de um kit, esticando um pouco para caber exato. */
export function clad(o: CladOptions): PropData[] {
  const cols = Math.max(1, Math.round(o.width / o.pieceWidth));
  const rows = Math.max(1, Math.round(o.height / o.pieceHeight));
  const sx = o.width / (cols * o.pieceWidth);
  const sy = o.height / (rows * o.pieceHeight);
  const props: PropData[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      props.push({
        ...piece(o.model, o.part, o.x0 + c * o.pieceWidth * sx, o.y0 + r * o.pieceHeight * sy, o.z, o.pieceWidth * sx),
        stretch: [sx, sy, 1],
      });
    }
  }
  return props;
}

/** Janela do kit de fachada encostada numa parede interna, com o luar atrás do vidro. */
export function moonWindow(x: number, y: number, wallZ: number, tall = false): PropData[] {
  const part = tall ? "window_centered_large_01" : "window_centered_small_01";
  const stretch: [number, number, number] = tall ? [0.75, 1.5, 1] : [1, 0.75, 1];
  // Origem do kit no canto direito do módulo de 3 m: girado 180°, o centro da janela fica 1,5 m antes dela.
  return [{ model: "modular_urban_apartments_facade", part, x: x + 1.5 * stretch[0], y, z: wallZ - 0.2, rotY: 180, origin: true, stretch }];
}

/** Luminária fluorescente de teto. */
export function fluorescent(x: number, y: number, z = 1.4): PropData {
  return { model: "mounted_fluorescent_lights", x, y, z, rotY: 90, scale: 1.3 };
}

/** Pilha de dois caixotes de madeira para uma caixa empurrável de 1 m. */
export const CRATE_VISUAL: PropData[] = [
  { model: "wooden_military_crate", x: 0, y: 0, z: 0, fitWidth: 1, stretch: [1, 1.19, 1.6] },
  { model: "wooden_military_crate", x: 0.02, y: 0.5, z: 0.02, rotY: 4, fitWidth: 0.98, stretch: [1, 1.19, 1.6] },
];

/** Pilha de caixas de papelão (2 × 3) para uma caixa empurrável de 1 m. */
export const CARDBOARD_VISUAL: PropData[] = [0, 1, 2].flatMap((row) =>
  [-0.25, 0.25].map((x, i): PropData => ({
    model: "cardboard_box_01",
    x: x + (row % 2 ? 0.01 : -0.01),
    y: row * 0.333,
    z: 0,
    rotY: 90 + (row * 7 + i * 5) % 9 - 4,
    fitWidth: 0.48,
    stretch: [1, 1.02, 2],
  })),
);

/** Carrinho de metal para uma caixa empurrável de 1 m. */
export const CART_VISUAL: PropData[] = [
  { model: "industrial_storage_cart", x: 0, y: 0, z: 0, fitWidth: 1.02, stretch: [1, 1.16, 1.4] },
];

// Objetos empurráveis com cara de fazer parte do lugar. O cubo de 1 m continua sendo o corpo físico;
// `pegada` diz onde as mãos seguram (ver BoxData). Modelos do Poly Haven (CC0).

/** Carrinho de ferramentas verde da zeladoria: alça na altura das mãos e tampo firme para subir. */
export const TOOL_CART_VISUAL: PropData[] = [
  { model: "tool_cart", x: 0, y: 0, z: 0, fitWidth: 1, stretch: [1, 1.3, 1.1] },
];
export const TOOL_CART_GRIP = { y: 0.95, x: 0 };

/** Dois tambores de metal lado a lado, na doca de carga. */
export const DRUMS_VISUAL: PropData[] = [-0.25, 0.25].map((x, i): PropData => ({
  model: "barrel_03", x, y: 0, z: i ? 0.06 : -0.04, rotY: i * 70, fitHeight: 0.99, stretch: [0.78, 1, 0.78],
}));
export const DRUMS_GRIP = { y: 0.95, x: 0.06 };

/** Lixeira de metal do pátio (sem a tampa, que fica caída no chão ao lado). */
export const TRASH_CAN_VISUAL: PropData[] = [
  { model: "metal_trash_can", part: "metal_trash_can|metal_trash_can_handle_(left|right)", x: 0, y: 0, z: 0, fitHeight: 1.02, stretch: [1.15, 1, 1.15] },
];
// Mãos na lateral voltada para o jogador, logo abaixo da borda: o corpo fica do lado de fora da lixeira.
export const TRASH_CAN_GRIP = { y: 0.88, x: 0.1 };

/** Carrinho de carga com sacos de cimento: o peso que puxa a corda do contrapeso. */
export const HAND_TRUCK_VISUAL: PropData[] = [
  { model: "hand_truck", x: -0.3, y: 0, z: 0, rotY: 60, fitHeight: 1.3 },
  ...[0, 1, 2, 3].map((row): PropData => ({
    model: "cement_bag", x: 0.12 + (row % 2 ? 0.02 : -0.02), y: 0.04 + row * 0.17, z: 0, rotY: 90 + (row % 2 ? 4 : -3), fitWidth: 0.62,
  })),
];
export const HAND_TRUCK_GRIP = { y: 1.22, x: 0.12 };

/** Carrinho com cilindros de gás do depósito. */
export const GAS_CART_VISUAL: PropData[] = [
  { model: "portable_welding_cart", x: 0, y: 0, z: 0, fitHeight: 1.35, stretch: [1.15, 1, 1] },
];
export const GAS_CART_GRIP = { y: 1.12, x: 0.15 };

// Os 20 livros da coleção chegam todos na mesma origem (a posição de cada um no arquivo se perde), e a coleção
// inteira medida como um livro só fazia `fitWidth` ampliar tudo umas 11 vezes, um bloco gigante na frente da
// câmera. Por isso cada livro entra como peça própria, em tamanho real, enfileirado à mão.
const BOOKS_PER_ROW = 14;
const BOOK_SCALE = 1.25;
const BOOK_STEP = 0.05;

function bookRow(z: number, first: number, rotY: number): PropData[] {
  return Array.from({ length: BOOKS_PER_ROW }, (_, i): PropData => {
    const n = String(((first + i) % 20) + 1).padStart(2, "0");
    return {
      model: "book_encyclopedia_set_01",
      part: `book_encyclopedia_set_01_book${n}`,
      x: (i - (BOOKS_PER_ROW - 1) / 2) * BOOK_STEP,
      y: 0.95,
      z,
      rotY: rotY + ((i * 7) % 5) - 2,
      scale: BOOK_SCALE,
    };
  });
}

/** Carrinho da biblioteca: o carrinho de metal com duas fileiras de livros em cima. */
export const LIBRARY_CART_VISUAL: PropData[] = [...CART_VISUAL, ...bookRow(0.15, 0, 0), ...bookRow(-0.15, 6, 180)];
