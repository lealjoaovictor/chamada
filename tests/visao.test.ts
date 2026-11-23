import { test } from "node:test";
import assert from "node:assert/strict";
import { coverBlocks, coverFromBlocks, segmentHitsBox } from "../src/game/sightCover.ts";
import { gymLevel } from "../src/levels/gym.ts";
import { WORLD } from "../src/levels/world.ts";

// Lente do segurança da sala de teste/biblioteca: atrás das estantes (z = 3.2), na altura da mão.
function lens(x: number) {
  return { x, y: 1.1, z: 2.9 };
}
const bodyPoints = (x: number) => [0.25, 0.9, 1.5].map((y) => ({ x, y, z: 0 }));
const hidden = (lensX: number, playerX: number, covers: ReturnType<typeof coverFromBlocks>) =>
  bodyPoints(playerX).every((p) => coverBlocks(lens(lensX), p, covers));
const exposed = (lensX: number, playerX: number, covers: ReturnType<typeof coverFromBlocks>) =>
  bodyPoints(playerX).every((p) => !coverBlocks(lens(lensX), p, covers));

test("segmento e caixa: cruza, passa ao lado e começa dentro", () => {
  const box = { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: 1 };
  assert.ok(segmentHitsBox({ x: -1, y: 0.5, z: 0.5 }, { x: 2, y: 0.5, z: 0.5 }, box));
  assert.ok(!segmentHitsBox({ x: -1, y: 2, z: 0.5 }, { x: 2, y: 2, z: 0.5 }, box));
  assert.ok(segmentHitsBox({ x: 0.5, y: 0.5, z: 0.5 }, { x: 3, y: 3, z: 3 }, box));
});

test("sala de teste: atrás da estante não é visto, mesmo com o segurança na diagonal", () => {
  const covers = coverFromBlocks(gymLevel.obstacles, gymLevel.depth);
  for (const shelfX of [18, 21.5, 25, 28.5]) {
    for (const guardX of [shelfX - 4, shelfX - 1, shelfX + 1, shelfX + 4]) {
      assert.ok(hidden(guardX, shelfX, covers), `estante ${shelfX}, segurança em ${guardX}`);
    }
  }
});

test("sala de teste: no vão entre estantes, o segurança em frente vê", () => {
  const covers = coverFromBlocks(gymLevel.obstacles, gymLevel.depth);
  for (const gapX of [19.75, 23.25, 26.75]) assert.ok(exposed(gapX, gapX, covers), `vão ${gapX}`);
});

test("biblioteca: cada estante esconde quem está atrás dela", () => {
  const covers = coverFromBlocks(WORLD.level.obstacles, WORLD.level.depth);
  for (const shelfX of [168.5, 171.5, 174.5, 177.5, 180.5]) {
    assert.ok(hidden(shelfX + 3, shelfX, covers), `estante ${shelfX}`);
    assert.ok(exposed(shelfX + 1.5, shelfX + 1.5, covers), `vão depois de ${shelfX}`);
  }
});

test("pulando acima da estante, o jogador aparece", () => {
  const covers = coverFromBlocks(gymLevel.obstacles, gymLevel.depth);
  assert.ok(!coverBlocks(lens(25), { x: 21.5, y: 3, z: 0 }, covers));
});

test("sala de leitura: em pé na frente de uma estante, o segurança que passa por trás não vê", () => {
  const covers = coverFromBlocks(WORLD.level.obstacles, WORLD.level.depth);
  const guard = WORLD.level.vigias.find((v) => v.y > 0 && v.mode !== "perseguicao")!;
  const shelves = WORLD.level.obstacles.filter((b) => b.y > guard.y && (b.z ?? 0) > 0.5);
  assert.ok(shelves.length >= 2, "estantes da sala de leitura viraram obstáculos");
  const standing = (x: number) => [0.25, 0.9, 1.6].map((h) => ({ x, y: guard.y + h, z: 0 }));
  for (const shelf of shelves) {
    for (const dx of [-3, -1, 1, 3]) {
      // Lente na altura da mão, ainda atrás das estantes mesmo com o braço esticado para a frente.
      const lensPos = { x: shelf.x + dx, y: guard.y + 1.1, z: guard.z - 0.3 };
      assert.ok(standing(shelf.x).every((p) => coverBlocks(lensPos, p, covers)), `estante ${shelf.x}, segurança ${dx}`);
    }
  }
});
