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

test("corredor final não se repete: as lâmpadas dele apagam quando o jogador passa e a sala tem luz quente", () => {
  // O corredor do bloco C começa depois da portaria (43 m dentro da área 6).
  const corridorStart = areas[5].inicioX + 43;
  const door = level.finalDoor;
  assert.ok(door);
  const corridor = level.lamps.filter((lamp) => lamp.x > corridorStart && lamp.x < door.x);
  assert.ok(corridor.length >= 2);
  for (const lamp of corridor) assert.ok(lamp.diesWhenPassed, `lâmpada em ${lamp.x}`);
  const room = level.lamps.filter((lamp) => lamp.x > door.x);
  assert.ok(room.length > 0 && room.every((lamp) => lamp.tom === "sala"));
  const acesas = level.lamps.filter((lamp) => lamp.x < door.x && !lamp.desligada);
  assert.ok(acesas.every((lamp) => lamp.tom !== "sala"), "só a sala tem luz quente");
});

test("professor e colega ficam dentro da sala do final", () => {
  const door = level.finalDoor;
  assert.ok(door);
  const people = level.figurantes ?? [];
  assert.equal(people.length, 2);
  for (const p of people) assert.ok(p.x > door.x && p.x < level.bounds.maxX);
});

test("contrapeso puxa uma porta que existe", () => {
  for (const plate of level.plates.filter((p) => p.tipo === "contrapeso")) {
    assert.ok(plate.portaX !== undefined);
    assert.ok(level.doors.some((d) => Math.abs(d.x - (plate.portaX ?? 0)) < 0.01));
  }
});

test("vultos ficam dentro do mundo", () => {
  for (const v of level.vultos ?? []) assert.ok(v.x > level.bounds.minX && v.x < level.bounds.maxX);
});

test("o deslocamento das áreas move também o cenário (horizonte, fios, grades, adesivos e vida)", async () => {
  const { shiftLevel } = await import("../src/levels/shift.ts");
  const { area1Level: base } = await import("../src/levels/area1.ts");
  const moved = shiftLevel(base, 100);
  const pairs: [number | undefined, number | undefined][] = [
    [base.cidade?.[0]?.minX, moved.cidade?.[0]?.minX],
    [base.fios?.[0]?.a[0], moved.fios?.[0]?.a[0]],
    [base.fios?.[0]?.b[0], moved.fios?.[0]?.b[0]],
    [base.grades?.[0]?.x0, moved.grades?.[0]?.x0],
    [base.adesivos?.[0]?.x, moved.adesivos?.[0]?.x],
    [base.vida?.[0]?.minX, moved.vida?.[0]?.minX],
    [base.vida?.[0]?.tvs?.[0]?.x, moved.vida?.[0]?.tvs?.[0]?.x],
  ];
  for (const [before, after] of pairs) {
    assert.notEqual(before, undefined, "o mundo deve ter esse tipo de cenário");
    assert.equal(after, before! + 100);
  }
});

test("o piso de primeiro plano acompanha as áreas deslocadas e cobre os interiores sem buracos", () => {
  const aprons = level.primeiroPlano ?? [];
  assert.ok(aprons.length > 0);
  for (const a of aprons) {
    assert.ok(a.x0 < a.x1, `trecho ${a.x0}..${a.x1}`);
    assert.ok(a.x0 >= level.bounds.minX && a.x1 <= level.bounds.maxX);
  }
  // Do corredor da área 2 ao fim da área 5, o piso da frente é contínuo (as quinas se encostam).
  const sorted = [...aprons].sort((a, b) => a.x0 - b.x0).filter((a) => a.x1 <= areas[5].inicioX);
  assert.equal(sorted[0].x0, areas[1].inicioX);
  for (let i = 1; i < sorted.length; i++) assert.ok(Math.abs(sorted[i].x0 - sorted[i - 1].x1) < 0.01, `vão em x ${sorted[i].x0}`);
  // A área 4 começa com a rampa que desce da galeria: o trecho dela tem que estar nas coordenadas do mundo.
  const ramp = aprons.find((a) => a.y1 !== undefined && a.y0 > a.y1);
  assert.ok(ramp && Math.abs(ramp.x0 - areas[3].inicioX) < 0.01);
});
