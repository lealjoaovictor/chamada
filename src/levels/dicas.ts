import type { CameraBeatData, HintData, RattleData } from "./types";

const CHASE = { minX: 124, maxX: 153 };

export const DICAS: HintData[] = [
  {
    zone: { minX: 14, maxX: 31 },
    trigger: "tempo",
    glowAfter: 15,
    iconAfter: 30,
    glow: { box: 0 },
    icon: { action: "empurrar", x: 0, y: 0.9, followBox: 0 },
    doneWhen: { boxMoved: 0 },
  },
  {
    zone: { minX: 52, maxX: 55 },
    trigger: "encostado",
    iconAfter: 1.5,
    icon: { action: "deslizar", x: 54.4, y: 1.7 },
    doneWhen: { passedX: 55.5 },
  },
  {
    zone: { minX: 56, maxX: 66.8 },
    trigger: "tempo",
    glowAfter: 20,
    iconAfter: 35,
    glow: { box: 1, plate: 0 },
    icon: { action: "empurrar", x: 0, y: 0.9, followBox: 1 },
    doneWhen: { platePressed: 0 },
  },
  {
    zone: { minX: 64, maxX: 67 },
    trigger: "encostado",
    iconAfter: 1.5,
    requires: { platePressed: 0 },
    icon: { action: "deslizar", x: 66.4, y: 1.7 },
    doneWhen: { passedX: 67.5 },
  },
  {
    zone: { minX: 98, maxX: 105.5 },
    trigger: "tempo",
    glowAfter: 6,
    glow: { elevator: 0 },
    doneWhen: { elevatorCalled: 0 },
  },
  {
    zone: { minX: 124, maxX: 134.3 },
    trigger: "mortes",
    deathZone: CHASE,
    iconAfter: 2,
    icon: { action: "deslizar", x: 133.6, y: 1.7 },
    doneWhen: { passedX: 134.5 },
  },
  {
    zone: { minX: 134.3, maxX: 143.3 },
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
];

export const FOCOS: CameraBeatData[] = [{ triggerX: 82, focusX: 101, seconds: 2.4 }];

export const CHACOALHAR: RattleData[] = [{ meshId: "porta-principal", minX: 19.6, maxX: 22.4, minFeetY: 1.3 }];
