import { test } from "node:test";
import assert from "node:assert/strict";
import { WORLD } from "../src/levels/world.ts";
import { mapLevelX } from "../src/levels/shift.ts";
import { isOutdoors, mistBands, mistStrengthAt } from "../src/levels/neblina.ts";

const { level } = WORLD;

test("toda faixa de neblina fica atrás da faixa de jogo e dentro do mundo", () => {
  const bands = mistBands(level);
  assert.ok(bands.length > 0);
  for (const band of bands) {
    // z > 0: atrás do Zacarias e dos seguranças, nunca na frente deles.
    assert.ok(band.z > 0.5, `faixa em z ${band.z}`);
    assert.ok(band.x0 < band.x1);
    assert.ok(band.altura > 0);
    assert.ok(band.x1 > level.bounds.minX && band.x0 < level.bounds.maxX);
  }
});

test("não há neblina baixa dentro da faculdade: toda faixa fica num trecho ao ar livre", () => {
  for (const band of mistBands(level)) {
    assert.ok(isOutdoors(level, band.x0 + 0.01) || isOutdoors(level, band.x1 - 0.01), `faixa ${band.x0}..${band.x1}`);
  }
  // A biblioteca (área 4) é interior.
  assert.equal(isOutdoors(level, 290), false);
});

test("a área externa declara a própria neblina e o deslocamento leva junto", () => {
  assert.ok((level.neblina ?? []).length > 0);
  const moved = mapLevelX(level, (x) => x + 10);
  level.neblina!.forEach((band, i) => {
    assert.equal(moved.neblina![i].x0, band.x0 + 10);
    assert.equal(moved.neblina![i].x1, band.x1 + 10);
  });
});

test("a força da neblina segue o trecho de ambiente, e fora dele vale o padrão", () => {
  assert.equal(mistStrengthAt(level, level.bounds.maxX + 100, 0.42), 0.42);
  const zone = { minX: 0, maxX: 10, intensidade: 1, cor: [1, 1, 1] as [number, number, number], neblina: 0.2 };
  assert.equal(mistStrengthAt({ ...level, ambiente: [zone] }, 5, 0.5), 0.2);
});
