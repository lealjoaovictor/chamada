import type { LampData, StickerData } from "./types";

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
