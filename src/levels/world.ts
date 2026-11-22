import type { LevelData, PlateData } from "./types";
import { area1Level } from "./area1";
import { area2Level } from "./area2";
import { area3Level } from "./area3";
import { area4Level } from "./area4";

function joinAreas(areas: LevelData[]): LevelData {
  let doorOffset = 0;
  const plates: PlateData[] = [];
  for (const area of areas) {
    plates.push(...area.plates.map((plate) => ({ ...plate, door: plate.door + doorOffset })));
    doorOffset += area.doors.length;
  }
  return {
    checkpoints: areas.flatMap((area) => area.checkpoints),
    killY: Math.min(...areas.map((area) => area.killY)),
    bounds: {
      minX: Math.min(...areas.map((area) => area.bounds.minX)),
      maxX: Math.max(...areas.map((area) => area.bounds.maxX)),
    },
    depth: areas[0].depth,
    ground: areas.flatMap((area) => area.ground),
    walls: areas.flatMap((area) => area.walls),
    platforms: areas.flatMap((area) => area.platforms),
    obstacles: areas.flatMap((area) => area.obstacles),
    ramps: areas.flatMap((area) => area.ramps),
    boxes: areas.flatMap((area) => area.boxes),
    lamps: areas.flatMap((area) => area.lamps),
    plates,
    doors: areas.flatMap((area) => area.doors),
    vigias: areas.flatMap((area) => area.vigias),
    elevators: areas.flatMap((area) => area.elevators),
    decor: areas.flatMap((area) => area.decor),
  };
}

export const worldLevel = joinAreas([area1Level, area2Level, area3Level, area4Level]);
