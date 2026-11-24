import type { CenaPerseguicao, CameraBeatData, HintData, LevelData, RattleData } from "./types";

// Cada área é desenhada nas próprias coordenadas; o mundo contínuo desloca as áreas seguintes
// quando uma área cresce. Estas funções somam `dx` a tudo o que é posição X.

/** Função que leva uma posição X para outra (deslocar uma área, ou esticar um trecho dela). */
export type MapX = (x: number) => number;

type WithX = { x: number; width?: number };
/** Objetos com largura têm as duas bordas levadas pela função: um piso que atravessa um trecho esticado estica junto. */
function mx<T extends WithX>(item: T, f: MapX): T {
  if (typeof item.width !== "number") return { ...item, x: f(item.x) };
  const left = f(item.x - item.width / 2);
  const right = f(item.x + item.width / 2);
  return { ...item, x: (left + right) / 2, width: right - left };
}
const sx = <T extends WithX>(items: T[], f: MapX): T[] => items.map((item) => mx(item, f));
const opt = (value: number | undefined, f: MapX): number | undefined => (value === undefined ? undefined : f(value));
const range = <T extends { minX: number; maxX: number }>(r: T, f: MapX): T => ({ ...r, minX: f(r.minX), maxX: f(r.maxX) });

export function shiftLevel(level: LevelData, dx: number): LevelData {
  if (dx === 0) return level;
  return mapLevelX(level, (x) => x + dx);
}

/** Leva toda posição X da área pela função `f` (deslocar ou esticar). */
export function mapLevelX(level: LevelData, f: MapX): LevelData {
  return {
    ...level,
    checkpoints: level.checkpoints.map((c) => ({ ...c, x: f(c.x) })),
    bounds: { minX: f(level.bounds.minX), maxX: f(level.bounds.maxX) },
    ground: sx(level.ground, f),
    walls: sx(level.walls, f),
    platforms: sx(level.platforms, f),
    obstacles: sx(level.obstacles, f),
    ramps: level.ramps.map((r) => ({ ...r, x0: f(r.x0), x1: f(r.x1) })),
    boxes: level.boxes.map((b) => ({ ...b, x: f(b.x) })),
    lamps: level.lamps.map((l) => ({ ...l, x: f(l.x) })),
    plates: level.plates.map((p) => ({ ...mx(p, f), portaX: opt(p.portaX, f) })),
    doors: level.doors.map((d) => ({ ...mx(d, f), closeAfterX: opt(d.closeAfterX, f) })),
    vigias: level.vigias.map((v) => ({
      ...v,
      x0: f(v.x0),
      x1: f(v.x1),
      triggerX: opt(v.triggerX, f),
      cena: mapCena(v.cena, f),
    })),
    elevators: level.elevators.map((e) => ({ ...mx(e, f), buttonX: f(e.buttonX) })),
    finalDoor: level.finalDoor && {
      ...level.finalDoor,
      x: f(level.finalDoor.x),
      triggerX: f(level.finalDoor.triggerX),
      walkToX: f(level.finalDoor.walkToX),
    },
    salaVazia: level.salaVazia && {
      quadroX: f(level.salaVazia.quadroX),
      porta: {
        ...level.salaVazia.porta,
        x: f(level.salaVazia.porta.x),
        triggerX: f(level.salaVazia.porta.triggerX),
        walkToX: f(level.salaVazia.porta.walkToX),
      },
    },
    decor: sx(level.decor, f),
    props: level.props?.map((p) => ({ ...p, x: f(p.x) })),
    furtivo: level.furtivo?.map((r) => range(r, f)),
    escuro: level.escuro?.map((r) => range(r, f)),
    ambiente: level.ambiente?.map((r) => range(r, f)),
    cidade: level.cidade?.map((r) => range(r, f)),
    fios: level.fios?.map((w) => ({ ...w, a: [f(w.a[0]), w.a[1], w.a[2]], b: [f(w.b[0]), w.b[1], w.b[2]] })),
    grades: level.grades?.map((g) => ({ ...g, x0: f(g.x0), x1: f(g.x1) })),
    adesivos: level.adesivos && sx(level.adesivos, f),
    vida: level.vida?.map((v) => ({
      ...range(v, f),
      tvs: v.tvs?.map((t) => ({ ...t, x: f(t.x) })),
      monitores: v.monitores?.map((m) => ({ ...m, x: f(m.x) })),
      relogios: v.relogios?.map((r) => ({ ...r, x: f(r.x) })),
    })),
    vultos: level.vultos?.map((v) => ({ ...v, x: f(v.x) })),
    figurantes: level.figurantes?.map((v) => ({ ...v, x: f(v.x) })),
    primeiroPlano: level.primeiroPlano?.map((a) => ({ ...a, x0: f(a.x0), x1: f(a.x1) })),
    neblina: level.neblina?.map((m) => ({ ...m, x0: f(m.x0), x1: f(m.x1) })),
  };
}

export interface IndexOffsets {
  boxes: number;
  plates: number;
  elevators: number;
}

const add = (value: number | undefined, offset: number): number | undefined => (value === undefined ? undefined : value + offset);

export function shiftHint(hint: HintData, dx: number, o: IndexOffsets): HintData {
  return mapHint(hint, (x) => x + dx, o);
}

export function mapHint(hint: HintData, f: MapX, o: IndexOffsets = { boxes: 0, plates: 0, elevators: 0 }): HintData {
  return {
    ...hint,
    zone: range(hint.zone, f),
    deathZone: hint.deathZone && range(hint.deathZone, f),
    icon: hint.icon && {
      ...hint.icon,
      x: hint.icon.followBox === undefined ? f(hint.icon.x) : hint.icon.x,
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
      passedX: opt(hint.doneWhen.passedX, f),
    },
  };
}

export const mapBeat = (beat: CameraBeatData, f: MapX): CameraBeatData => ({ ...beat, triggerX: f(beat.triggerX), focusX: f(beat.focusX) });
export const shiftBeat = (beat: CameraBeatData, dx: number): CameraBeatData => mapBeat(beat, (x) => x + dx);

export const mapRattle = (rattle: RattleData, f: MapX): RattleData => range(rattle, f);
export const shiftRattle = (rattle: RattleData, dx: number): RattleData => mapRattle(rattle, (x) => x + dx);

function mapCena(cena: CenaPerseguicao | undefined, f: MapX): CenaPerseguicao | undefined {
  if (!cena) return undefined;
  if (cena.tipo === "porta") return { ...cena, triggerX: f(cena.triggerX), focusX: f(cena.focusX) };
  return { ...cena, de: f(cena.de), ate: f(cena.ate) };
}
