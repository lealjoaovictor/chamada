import { test } from "node:test";
import assert from "node:assert/strict";
import { Checkpoints } from "../src/game/Checkpoints.ts";

const points = [
  { x: -8, y: 1 },
  { x: 5, y: 1 },
  { x: 20, y: 1 },
];

test("começa no primeiro checkpoint", () => {
  const checkpoints = new Checkpoints(points);
  assert.deepEqual(checkpoints.current, points[0]);
});

test("avança ao passar pelo próximo checkpoint", () => {
  const checkpoints = new Checkpoints(points);
  checkpoints.update(4.9);
  assert.equal(checkpoints.currentIndex, 0);
  checkpoints.update(5);
  assert.equal(checkpoints.currentIndex, 1);
});

test("não volta para trás quando o jogador recua", () => {
  const checkpoints = new Checkpoints(points);
  checkpoints.update(6);
  checkpoints.update(-10);
  assert.deepEqual(checkpoints.current, points[1]);
});

test("pula vários checkpoints de uma vez", () => {
  const checkpoints = new Checkpoints(points);
  checkpoints.update(25);
  assert.deepEqual(checkpoints.current, points[2]);
});
