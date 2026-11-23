import type { CameraBeatData, HintData, RattleData } from "./types";

// Dicas por área, nas coordenadas e índices (caixa, placa, elevador) da própria área.
// O mundo contínuo (`world.ts`) desloca tudo para a posição final.

const CHASE = { minX: 124, maxX: 153 };
const CHASE2 = { minX: 169, maxX: 194 };

export const DICAS_POR_AREA: Record<number, HintData[]> = {
  1: [
    {
      zone: { minX: 14, maxX: 31 },
      trigger: "tempo",
      glowAfter: 45,
      iconAfter: 90,
      glow: { box: 0 },
      icon: { action: "empurrar", x: 0, y: 0.9, followBox: 0 },
      doneWhen: { boxMoved: 0 },
    },
    {
      zone: { minX: 49, maxX: 57.8 },
      trigger: "tempo",
      glowAfter: 45,
      iconAfter: 90,
      glow: { box: 1, plate: 0 },
      icon: { action: "empurrar", x: 0, y: 0.9, followBox: 1 },
      doneWhen: { platePressed: 0 },
    },
  ],
  2: [
    {
      zone: { minX: 52, maxX: 55 },
      trigger: "encostado",
      iconAfter: 4,
      icon: { action: "deslizar", x: 54.4, y: 1.7 },
      doneWhen: { passedX: 55.5 },
    },
    {
      zone: { minX: 56, maxX: 66.8 },
      trigger: "tempo",
      glowAfter: 45,
      iconAfter: 90,
      glow: { box: 0, plate: 0 },
      icon: { action: "empurrar", x: 0, y: 0.9, followBox: 0 },
      doneWhen: { platePressed: 0 },
    },
    {
      zone: { minX: 64, maxX: 67 },
      trigger: "encostado",
      iconAfter: 4,
      requires: { platePressed: 0 },
      icon: { action: "deslizar", x: 66.4, y: 1.7 },
      doneWhen: { passedX: 67.5 },
    },
    {
      zone: { minX: 91, maxX: 104 },
      trigger: "tempo",
      glowAfter: 45,
      iconAfter: 90,
      glow: { box: 2, plate: 1 },
      icon: { action: "empurrar", x: 0, y: 0.9, followBox: 2 },
      doneWhen: { platePressed: 1 },
    },
  ],
  3: [
    {
      zone: { minX: 98, maxX: 105.5 },
      trigger: "tempo",
      glowAfter: 20,
      glow: { elevator: 0 },
      doneWhen: { elevatorCalled: 0 },
    },
    {
      zone: { minX: 117, maxX: 125 },
      trigger: "tempo",
      glowAfter: 45,
      iconAfter: 90,
      glow: { box: 0 },
      icon: { action: "empurrar", x: 0, y: 0.9, followBox: 0 },
      doneWhen: { passedX: 128 },
    },
    {
      // Acervo: o carrinho do patamar é a isca (só brilha; dá para passar sem ele).
      zone: { minX: 141, maxX: 145 },
      trigger: "tempo",
      glowAfter: 30,
      glow: { box: 1 },
      doneWhen: { passedX: 146 },
    },
  ],
  4: [
    {
      zone: { minX: 124, maxX: 134.3 },
      trigger: "mortes",
      deathZone: CHASE,
      iconAfter: 2,
      icon: { action: "deslizar", x: 133.6, y: 1.7 },
      doneWhen: { passedX: 134.5 },
    },
    {
      zone: { minX: 134.3, maxX: 138.6 },
      trigger: "mortes",
      deathZone: CHASE,
      iconAfter: 2,
      icon: { action: "pular", x: 137.9, y: 1.5 },
      doneWhen: { passedX: 138.8 },
    },
    {
      zone: { minX: 138.6, maxX: 143.3 },
      trigger: "mortes",
      deathZone: CHASE,
      iconAfter: 2,
      icon: { action: "pular", x: 142.6, y: 1.7 },
      doneWhen: { passedX: 143.5 },
    },
    {
      zone: { minX: 143.3, maxX: 152.3 },
      trigger: "mortes",
      deathZone: CHASE,
      iconAfter: 2,
      icon: { action: "deslizar", x: 151.6, y: 1.7 },
      doneWhen: { passedX: 152.5 },
    },
    {
      // Depósito: primeiro um objeto vai para a valeta (vira ponte)...
      zone: { minX: 153, maxX: 166.8 },
      trigger: "tempo",
      glowAfter: 40,
      iconAfter: 80,
      glow: { box: 0 },
      icon: { action: "empurrar", x: 0, y: 0.9, followBox: 0 },
      doneWhen: { boxMoved: 0 },
    },
    {
      // ...e o outro passa por cima até o sensor.
      zone: { minX: 153, maxX: 166.8 },
      trigger: "tempo",
      glowAfter: 70,
      iconAfter: 110,
      glow: { box: 1, plate: 0 },
      icon: { action: "empurrar", x: 0, y: 0.9, followBox: 1 },
      doneWhen: { platePressed: 0 },
    },
    ...[174.5, 183.2, 193].map((x): HintData => ({
      zone: { minX: x - 3, maxX: x + 0.3 },
      trigger: "mortes",
      deathZone: CHASE2,
      iconAfter: 2,
      icon: { action: "deslizar", x: x - 0.4, y: 1.7 },
      doneWhen: { passedX: x + 0.5 },
    })),
    ...[177.6, 186.1, 188.4].map((x): HintData => ({
      zone: { minX: x - 2.2, maxX: x + 0.3 },
      trigger: "mortes",
      deathZone: CHASE2,
      iconAfter: 2,
      icon: { action: "pular", x: x - 0.4, y: 1.6 },
      doneWhen: { passedX: x + 0.5 },
    })),
  ],
};

export const FOCOS_POR_AREA: Record<number, CameraBeatData[]> = {
  // Primeiro encontro com um segurança (guarita): passado o portão da garagem, a câmera vai até ele
  // para o jogador ver a lanterna e entender a mecânica antes de chegar perto.
  1: [{ triggerX: 62, focusX: 79, seconds: 2.6, seguranca: true }],
  // Depois da porta do corredor, a câmera mostra o segurança apagando as luzes no recuo.
  2: [{ triggerX: 68.5, focusX: 82, seconds: 2.2, seguranca: true }],
  // Ao entrar na biblioteca, a câmera mostra o segurança da ronda (o primeiro aviso do perigo da área).
  // No acervo, mostra a sala com os dois seguranças.
  3: [
    { triggerX: 82, focusX: 93, seconds: 2.4, seguranca: true },
    { triggerX: 141.8, focusX: 155.5, seconds: 2.6 },
  ],
  // No corredor da 204, a câmera mostra o segurança cochilando na cadeira (o "z Z" em cima da cabeça).
  5: [{ triggerX: 186, focusX: 196, seconds: 2.4 }],
  // Ao entrar no bloco C, a câmera mostra a portaria: o segurança dividido entre a entrada e a TV.
  6: [{ triggerX: 268.6, focusX: 275.5, seconds: 2.6 }],
};

export const CHACOALHAR_POR_AREA: Record<number, RattleData[]> = {
  1: [{ meshId: "porta-principal", minX: 19.6, maxX: 22.4, minFeetY: 1.3 }],
};
