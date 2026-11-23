import type { ApronData, LampData, LampTone, LevelData, StickerData } from "./types";

/**
 * Atalhos para os adesivos de luz e sombra pintados no chão. Cada um diz o que é, em vez de uma lista de números
 * soltos; tamanhos em metros (largura em x, fundo em z).
 */

/** Sombra de contato embaixo de algo apoiado no chão (`y` é a altura do chão onde ela fica). */
export function contactShadow(x: number, z: number, width: number, depth: number, strength?: number, y = 0): StickerData {
  return { kind: "sombra", x, y: y + 0.014, z, width, height: depth, chao: true, strength };
}

/** Faixa escura no pé de uma parede; `z` é a linha do chão logo à frente da parede. */
export function wallFoot(x: number, z: number, width: number): StickerData {
  return { kind: "pe-de-parede", x, y: 0.016, z, width, height: 0.8, chao: true };
}

/** Poça d'água com brilho especular. */
export function puddle(x: number, z: number, width: number, depth: number): StickerData {
  return { kind: "poca", x, y: 0.02, z, width, height: depth, chao: true };
}

/** Poça de luz quente sob um poste (o jogo apaga junto com a lâmpada). */
export function lampPool(lamp: LampData, z: number, width = 5, depth = 3.5, y = 0): StickerData {
  return { kind: "luz", x: lamp.x, y: y + 0.018, z, width, height: depth, chao: true };
}

/** Rastro do reflexo de um poste no asfalto molhado. */
export function lampStreak(lamp: LampData, z: number): StickerData {
  return { kind: "reflexo", x: lamp.x, y: 0.022, z, width: 0.7, height: 2.6, chao: true };
}

/** Tamanho de chão (largura em x, fundo em z, em m) de cada modelo pronto, no tamanho original e sem girar. */
const FOOTPRINT: Record<string, [number, number]> = {
  SchoolChair_01: [0.5, 0.5],
  SchoolDesk_01: [0.75, 0.55],
  painted_wooden_bench: [1.6, 0.5],
  metal_trash_can: [0.45, 0.45],
  WetFloorSign_01: [0.35, 0.45],
  steel_frame_shelves_01: [1.2, 0.5],
  cardboard_box_01: [0.5, 0.4],
  plastic_crate_01: [0.55, 0.4],
  barrel_03: [0.65, 0.65],
  hand_truck: [0.55, 0.5],
  trashbag: [0.6, 0.5],
  wooden_military_crate: [1, 0.6],
  metal_office_desk: [1.4, 0.75],
  concrete_road_barrier: [2, 0.6],
  old_tyre: [0.7, 0.7],
  utility_box_01: [0.8, 0.45],
  utility_box_02: [0.8, 0.45],
  fire_hydrant: [0.35, 0.35],
  industrial_storage_cart: [1.2, 0.6],
};

/** Cor da poça de luz pintada embaixo de cada tipo de lâmpada (a mesma das lâmpadas, em "r,g,b"). */
const POOL_COLORS: Record<LampTone, string> = {
  sodio: "255,176,92",
  fluorescente: "200,222,214",
  subsolo: "214,232,150",
  sala: "255,196,128",
};

/** Altura do piso de primeiro plano em x (o trecho reto que contém x), ou undefined fora dos interiores. */
function floorAt(aprons: ApronData[], x: number): number | undefined {
  const apron = aprons.find((a) => x >= a.x0 && x <= a.x1 && a.y1 === undefined);
  return apron?.y0;
}

/**
 * Acabamento pintado dos interiores, gerado a partir do que já está na fase (nada posto à mão):
 * - sombra de contato embaixo de cada móvel e bloco apoiado no chão;
 * - faixa escura no pé da parede do fundo;
 * - poça de luz embaixo de cada lâmpada acesa (apaga e pisca junto com ela).
 * Só onde há piso de primeiro plano; as caixas empurráveis ficam de fora, porque se movem.
 */
export function dressInteriors(level: LevelData): StickerData[] {
  const aprons = level.primeiroPlano ?? [];
  if (aprons.length === 0) return [];
  const out: StickerData[] = [];
  const onFloor = (x: number, bottom: number) => {
    const floor = floorAt(aprons, x);
    return floor !== undefined && Math.abs(bottom - floor) < 0.06 ? floor : undefined;
  };

  for (const prop of level.props ?? []) {
    const base = FOOTPRINT[prop.model];
    if (!base || prop.virada) continue;
    const floor = onFloor(prop.x, prop.y);
    if (floor === undefined) continue;
    const k = prop.fitWidth ? prop.fitWidth / base[0] : (prop.scale ?? 1);
    const turned = Math.abs(Math.sin(((prop.rotY ?? 0) * Math.PI) / 180)) > 0.7;
    const [w, d] = turned ? [base[1], base[0]] : base;
    // A mancha passa bem da base: o miolo fica escondido embaixo do móvel e o que aparece é a borda escura.
    out.push({ ...contactShadow(prop.x, prop.z, w * k * 1.5 + 0.4, d * k * 1.5 + 0.4, 0.85, floor), nucleo: 0.7 });
  }

  // Blocos de cenário e obstáculos apoiados no chão (armários, balcões, estantes, mesas montadas por blocos).
  for (const block of [...level.decor, ...level.obstacles]) {
    const depth = block.depth ?? level.depth;
    const height = block.height;
    if (block.width < 0.3 || block.width > 6 || depth > 1.6 || height < 0.4) continue;
    if (block.material === "luar" || block.material === "janela" || block.material === "vidro") continue;
    const floor = onFloor(block.x, block.y - height / 2);
    if (floor === undefined) continue;
    out.push({ ...contactShadow(block.x, block.z ?? 0, block.width + 0.7, depth + 0.8, 0.8, floor), nucleo: 0.7 });
  }

  // Pé da parede do fundo: paredes do fundo (planos finos e largos, z ≥ 1,5) que começam no piso de cada trecho.
  const walls = level.decor
    .filter((d) => d.depth <= 0.25 && d.width >= 3 && d.z >= 1.5 && d.material !== "luar" && d.material !== "janela")
    .sort((a, b) => a.y - a.height / 2 - (b.y - b.height / 2));
  const done: { x0: number; x1: number }[] = [];
  for (const apron of aprons) {
    if (apron.y1 !== undefined) continue;
    for (const wall of walls) {
      const x0 = Math.max(apron.x0, wall.x - wall.width / 2);
      const x1 = Math.min(apron.x1, wall.x + wall.width / 2);
      if (x1 - x0 < 1) continue;
      if (Math.abs(wall.y - wall.height / 2 - apron.y0) > 0.35) continue;
      if (done.some((r) => Math.min(r.x1, x1) - Math.max(r.x0, x0) > 0.5)) continue;
      done.push({ x0, x1 });
      const front = wall.z - wall.depth / 2;
      out.push({ ...wallFoot((x0 + x1) / 2, front - 0.4, x1 - x0), y: apron.y0 + 0.016 });
    }
  }

  // Poça de luz embaixo das lâmpadas acesas (a luminária fica em z 1,4; a poça cai um pouco à frente).
  for (const lamp of level.lamps) {
    if (lamp.moonlight || lamp.desligada) continue;
    const floor = floorAt(aprons, lamp.x);
    if (floor === undefined || lamp.y - floor > 6) continue;
    const reach = Math.min(5, 1.6 + (lamp.y - floor) * 0.9);
    out.push({
      ...lampPool(lamp, 0.9, reach, Math.min(3.2, reach * 0.75), floor),
      color: POOL_COLORS[lamp.tom ?? "fluorescente"],
      strength: 0.2 * (lamp.forca ?? 1),
    });
  }
  return out;
}
