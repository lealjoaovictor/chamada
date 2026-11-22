import { test } from "node:test";
import assert from "node:assert/strict";
import { WORLD } from "../src/levels/world.ts";

const { level, areas, hints } = WORLD;

test("cada área começa onde a anterior termina", () => {
  for (let i = 1; i < areas.length; i++) assert.ok(areas[i].inicioX > areas[i - 1].inicioX);
  assert.equal(areas[0].inicioX, level.bounds.minX);
});

test("as dicas apontam para caixas, placas e elevadores que existem, dentro do mundo", () => {
  for (const hint of hints) {
    const box = hint.glow?.box ?? hint.icon?.followBox ?? hint.doneWhen.boxMoved;
    if (box !== undefined) assert.ok(level.boxes[box], `caixa ${box}`);
    const plate = hint.glow?.plate ?? hint.doneWhen.platePressed ?? hint.requires?.platePressed;
    if (plate !== undefined) assert.ok(level.plates[plate], `placa ${plate}`);
    const elevator = hint.glow?.elevator ?? hint.doneWhen.elevatorCalled;
    if (elevator !== undefined) assert.ok(level.elevators[elevator], `elevador ${elevator}`);
    assert.ok(hint.zone.minX >= level.bounds.minX && hint.zone.maxX <= level.bounds.maxX);
  }
});

test("a dica do carrinho aponta para o carrinho e para a placa do corredor", () => {
  const carrinho = level.boxes.findIndex((b) => b.material === "carrinho");
  const hint = hints.find((h) => h.glow?.plate !== undefined && h.glow.box === carrinho);
  assert.ok(hint, "dica do carrinho");
  const plate = level.plates[hint.glow!.plate!];
  assert.ok(Math.abs(plate.x - level.boxes[carrinho].x) < 6);
});

test("cada placa abre uma porta que existe", () => {
  for (const plate of level.plates) assert.ok(level.doors[plate.door]);
});

test("checkpoints em ordem crescente", () => {
  for (let i = 1; i < level.checkpoints.length; i++) {
    assert.ok(level.checkpoints[i].x > level.checkpoints[i - 1].x);
  }
});

test("trechos furtivos e escuros ficam dentro de alguma área", () => {
  const { level } = WORLD;
  for (const zone of [...(level.furtivo ?? []), ...(level.escuro ?? [])]) {
    assert.ok(zone.minX < zone.maxX);
    assert.ok(zone.minX >= level.bounds.minX && zone.maxX <= level.bounds.maxX);
  }
  assert.ok((level.furtivo ?? []).length > 0);
});

test("corredor que se repete volta para dentro da área 5 e cada volta apaga lâmpadas que existem", () => {
  const { level } = WORLD;
  const laco = level.laco;
  assert.ok(laco);
  const area5 = areas[4].inicioX;
  assert.ok(laco.gatilhoX - laco.recuo > area5);
  for (const grupo of laco.apagar) {
    for (const x of grupo) assert.ok(level.lamps.some((lamp) => Math.abs(lamp.x - x) < 0.01), `lâmpada em ${x}`);
  }
});

test("vultos ficam dentro do mundo", () => {
  for (const v of level.vultos ?? []) assert.ok(v.x > level.bounds.minX && v.x < level.bounds.maxX);
  assert.ok((level.vultos ?? []).length >= 4);
});
