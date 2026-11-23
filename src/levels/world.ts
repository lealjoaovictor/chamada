import type { AreaData, CameraBeatData, HintData, LevelData, PlateData, RattleData } from "./types";
import { area1Level } from "./area1.ts";
import { area2Level } from "./area2.ts";
import { area3Level } from "./area3.ts";
import { area4Level } from "./area4.ts";
import { area5Level } from "./area5.ts";
import { CHACOALHAR_POR_AREA, DICAS_POR_AREA, FOCOS_POR_AREA } from "./dicas.ts";
import { shiftBeat, shiftHint, shiftLevel, shiftRattle } from "./shift.ts";

const AREA_LEVELS = [area1Level, area2Level, area3Level, area4Level, area5Level];

export interface World {
  level: LevelData;
  areas: AreaData[];
  hints: HintData[];
  beats: CameraBeatData[];
  rattles: RattleData[];
}

// Junta as cinco áreas num mundo contínuo: cada área começa onde a anterior termina,
// então uma área que cresce empurra as seguintes para a direita sem precisar reescrevê-las.
function buildWorld(levels: LevelData[]): World {
  const shifted: LevelData[] = [];
  const areas: AreaData[] = [];
  const hints: HintData[] = [];
  const beats: CameraBeatData[] = [];
  const rattles: RattleData[] = [];
  const offsets = { boxes: 0, plates: 0, elevators: 0 };
  let doorOffset = 0;
  const plates: PlateData[] = [];
  levels.forEach((original, i) => {
    const numero = i + 1;
    const dx = i === 0 ? 0 : shifted[i - 1].bounds.maxX - original.bounds.minX;
    const level = shiftLevel(original, dx);
    shifted.push(level);
    areas.push({ numero, inicioX: level.bounds.minX });
    hints.push(...(DICAS_POR_AREA[numero] ?? []).map((h) => shiftHint(h, dx, offsets)));
    beats.push(...(FOCOS_POR_AREA[numero] ?? []).map((b) => shiftBeat(b, dx)));
    rattles.push(...(CHACOALHAR_POR_AREA[numero] ?? []).map((r) => shiftRattle(r, dx)));
    plates.push(...level.plates.map((plate) => ({ ...plate, door: plate.door + doorOffset })));
    doorOffset += level.doors.length;
    offsets.boxes += level.boxes.length;
    offsets.plates += level.plates.length;
    offsets.elevators += level.elevators.length;
  });
  const level: LevelData = {
    checkpoints: shifted.flatMap((a) => a.checkpoints),
    killY: Math.min(...shifted.map((a) => a.killY)),
    bounds: { minX: shifted[0].bounds.minX, maxX: shifted[shifted.length - 1].bounds.maxX },
    depth: shifted[0].depth,
    ground: shifted.flatMap((a) => a.ground),
    walls: shifted.flatMap((a) => a.walls),
    platforms: shifted.flatMap((a) => a.platforms),
    obstacles: shifted.flatMap((a) => a.obstacles),
    ramps: shifted.flatMap((a) => a.ramps),
    boxes: shifted.flatMap((a) => a.boxes),
    lamps: shifted.flatMap((a) => a.lamps),
    plates,
    doors: shifted.flatMap((a) => a.doors),
    vigias: shifted.flatMap((a) => a.vigias),
    elevators: shifted.flatMap((a) => a.elevators),
    decor: shifted.flatMap((a) => a.decor),
    props: shifted.flatMap((a) => a.props ?? []),
    furtivo: shifted.flatMap((a) => a.furtivo ?? []),
    escuro: shifted.flatMap((a) => a.escuro ?? []),
    ambiente: shifted.flatMap((a) => a.ambiente ?? []),
    vultos: shifted.flatMap((a) => a.vultos ?? []),
    figurantes: shifted.flatMap((a) => a.figurantes ?? []),
    finalDoor: shifted.find((a) => a.finalDoor)?.finalDoor,
  };
  return { level, areas, hints, beats, rattles };
}

export const WORLD = buildWorld(AREA_LEVELS);
export const worldLevel = WORLD.level;
