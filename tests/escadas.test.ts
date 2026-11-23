import { test } from "node:test";
import assert from "node:assert/strict";
import { stairSteps, treadHeight } from "../src/levels/stairs.ts";
import { worldLevel } from "../src/levels/world.ts";

const subida = { x0: 15, y0: 0, x1: 19, y1: 1.5, steps: 8 };

test("degrau sob cada ponto de uma escada que sobe", () => {
  assert.equal(treadHeight(subida, 14.9), null);
  assert.equal(treadHeight(subida, 15.1), 0.1875);
  assert.equal(treadHeight(subida, 16.6), 0.75);
  assert.equal(treadHeight(subida, 19), 1.5);
  assert.equal(treadHeight(subida, 19.1), null);
});

test("escada que desce para a direita espelha os degraus", () => {
  const descida = { x0: 10, y0: 1.5, x1: 14, y1: 0, steps: 8 };
  assert.equal(treadHeight(descida, 10), 1.5);
  assert.equal(treadHeight(descida, 13.9), 0.1875);
});

test("a rampa escondida nunca passa por cima do piso do degrau", () => {
  for (const stair of worldLevel.ramps.filter((r) => r.steps)) {
    const slope = (stair.y1 - stair.y0) / (stair.x1 - stair.x0);
    for (let i = 0; i <= 200; i++) {
      const x = stair.x0 + ((stair.x1 - stair.x0) * i) / 200;
      const ramp = stair.y0 + slope * (x - stair.x0);
      assert.ok(treadHeight(stair, x)! >= ramp - 1e-9, `x=${x}`);
    }
  }
});

test("blocos dos degraus vão do chão até o piso de cada degrau", () => {
  const blocos = stairSteps(subida, 4);
  assert.equal(blocos.length, 8);
  const ultimo = blocos[7];
  assert.equal(ultimo.y + ultimo.height / 2, 1.5);
  assert.equal(blocos[0].y - blocos[0].height / 2, 0);
});
