import type { CenaPerseguicao, CameraBeatData, HintData, LevelData, RattleData } from "./types";

// Cada área é desenhada nas próprias coordenadas; o mundo contínuo desloca as áreas seguintes
// quando uma área cresce. Estas funções somam `dx` a tudo o que é posição X.

type WithX = { x: number };
const sx = <T extends WithX>(items: T[], dx: number): T[] => items.map((item) => ({ ...item, x: item.x + dx }));

export function shiftLevel(level: LevelData, dx: number): LevelData {
  if (dx === 0) return level;
  return {
    ...level,
    checkpoints: sx(level.checkpoints, dx),
    bounds: { minX: level.bounds.minX + dx, maxX: level.bounds.maxX + dx },
    ground: sx(level.ground, dx),
    walls: sx(level.walls, dx),
    platforms: sx(level.platforms, dx),
    obstacles: sx(level.obstacles, dx),
    ramps: level.ramps.map((r) => ({ ...r, x0: r.x0 + dx, x1: r.x1 + dx })),
    boxes: sx(level.boxes, dx),
    lamps: sx(level.lamps, dx),
    plates: level.plates.map((p) => ({ ...p, x: p.x + dx, portaX: p.portaX === undefined ? undefined : p.portaX + dx })),
    doors: level.doors.map((d) => ({
      ...d,
      x: d.x + dx,
      closeAfterX: d.closeAfterX === undefined ? undefined : d.closeAfterX + dx,
    })),
    vigias: level.vigias.map((v) => ({
      ...v,
      x0: v.x0 + dx,
      x1: v.x1 + dx,
      triggerX: v.triggerX === undefined ? undefined : v.triggerX + dx,
      cena: shiftCena(v.cena, dx),
    })),
    elevators: level.elevators.map((e) => ({ ...e, x: e.x + dx, buttonX: e.buttonX + dx })),
    finalDoor: level.finalDoor && {
      ...level.finalDoor,
      x: level.finalDoor.x + dx,
      triggerX: level.finalDoor.triggerX + dx,
      walkToX: level.finalDoor.walkToX + dx,
    },
    salaVazia: level.salaVazia && {
      quadroX: level.salaVazia.quadroX + dx,
      porta: {
        ...level.salaVazia.porta,
        x: level.salaVazia.porta.x + dx,
        triggerX: level.salaVazia.porta.triggerX + dx,
        walkToX: level.salaVazia.porta.walkToX + dx,
      },
    },
    decor: sx(level.decor, dx),
    props: level.props && sx(level.props, dx),
    furtivo: level.furtivo?.map((f) => ({ minX: f.minX + dx, maxX: f.maxX + dx })),
    escuro: level.escuro?.map((f) => ({ minX: f.minX + dx, maxX: f.maxX + dx })),
    ambiente: level.ambiente?.map((z) => ({ ...z, minX: z.minX + dx, maxX: z.maxX + dx })),
    cidade: level.cidade?.map((c) => ({ minX: c.minX + dx, maxX: c.maxX + dx })),
    fios: level.fios?.map((w) => ({ ...w, a: [w.a[0] + dx, w.a[1], w.a[2]], b: [w.b[0] + dx, w.b[1], w.b[2]] })),
    grades: level.grades?.map((g) => ({ ...g, x0: g.x0 + dx, x1: g.x1 + dx })),
    adesivos: level.adesivos?.map((a) => ({ ...a, x: a.x + dx })),
    vida: level.vida?.map((v) => ({ ...v, minX: v.minX + dx, maxX: v.maxX + dx, tvs: v.tvs?.map((t) => ({ ...t, x: t.x + dx })),
      monitores: v.monitores?.map((m) => ({ ...m, x: m.x + dx })),
      relogios: v.relogios?.map((r) => ({ ...r, x: r.x + dx })),
    })),
    vultos: level.vultos && sx(level.vultos, dx),
    figurantes: level.figurantes && sx(level.figurantes, dx),
    primeiroPlano: level.primeiroPlano?.map((a) => ({ ...a, x0: a.x0 + dx, x1: a.x1 + dx })),
  };
}

export interface IndexOffsets {
  boxes: number;
  plates: number;
  elevators: number;
}

const add = (value: number | undefined, offset: number): number | undefined => (value === undefined ? undefined : value + offset);

export function shiftHint(hint: HintData, dx: number, o: IndexOffsets): HintData {
  return {
    ...hint,
    zone: { minX: hint.zone.minX + dx, maxX: hint.zone.maxX + dx },
    deathZone: hint.deathZone && { minX: hint.deathZone.minX + dx, maxX: hint.deathZone.maxX + dx },
    icon: hint.icon && {
      ...hint.icon,
      x: hint.icon.followBox === undefined ? hint.icon.x + dx : hint.icon.x,
      followBox: add(hint.icon.followBox, o.boxes),
    },
    glow: hint.glow && {
      box: add(hint.glow.box, o.boxes),
      plate: add(hint.glow.plate, o.plates),
      elevator: add(hint.glow.elevator, o.elevators),
    },
    requires: hint.requires && { platePressed: add(hint.requires.platePressed, o.plates) },
    doneWhen: {
      boxMoved: add(hint.doneWhen.boxMoved, o.boxes),
      platePressed: add(hint.doneWhen.platePressed, o.plates),
      elevatorCalled: add(hint.doneWhen.elevatorCalled, o.elevators),
      passedX: add(hint.doneWhen.passedX, dx),
    },
  };
}

export const shiftBeat = (beat: CameraBeatData, dx: number): CameraBeatData => ({
  ...beat,
  triggerX: beat.triggerX + dx,
  focusX: beat.focusX + dx,
});

export const shiftRattle = (rattle: RattleData, dx: number): RattleData => ({
  ...rattle,
  minX: rattle.minX + dx,
  maxX: rattle.maxX + dx,
});

function shiftCena(cena: CenaPerseguicao | undefined, dx: number): CenaPerseguicao | undefined {
  if (!cena) return undefined;
  if (cena.tipo === "porta") return { ...cena, triggerX: cena.triggerX + dx, focusX: cena.focusX + dx };
  return { ...cena, de: cena.de + dx, ate: cena.ate + dx };
}
