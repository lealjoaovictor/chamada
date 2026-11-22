import { test } from "node:test";
import assert from "node:assert/strict";
import { CallSchedule } from "../src/game/CallSchedule.ts";
import { CHAMADA } from "../src/levels/chamada.ts";
import { AREAS, areaAt } from "../src/levels/areas.ts";
import { Checkpoints } from "../src/game/Checkpoints.ts";

const schedule = new CallSchedule(CHAMADA);

test("a chamada dura entre 10 e 11 minutos", () => {
  assert.ok(schedule.finalAt >= 600 && schedule.finalAt <= 660, `duração: ${schedule.finalAt.toFixed(1)} s`);
});

test("o nome do aluno é o último e mais ninguém vem depois em ordem alfabética", () => {
  const last = schedule.events[schedule.events.length - 1];
  assert.equal(last.nome, CHAMADA.aluno);
  assert.equal(last.aluno, true);
  for (const event of schedule.events.slice(0, -1)) {
    assert.ok(event.nome.localeCompare(CHAMADA.aluno, "pt-BR") < 0, event.nome);
  }
});

test("os nomes estão em ordem alfabética e sem repetição", () => {
  const nomes = CHAMADA.entradas.map((e) => e.nome);
  assert.deepEqual(nomes, [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR")));
  assert.equal(new Set(nomes).size, nomes.length);
});

test("menos gente responde no fim da lista do que no começo", () => {
  const terco = Math.floor(CHAMADA.entradas.length / 3);
  const presentes = (lista: typeof CHAMADA.entradas) => lista.filter((e) => e.presente).length;
  assert.ok(presentes(CHAMADA.entradas.slice(0, terco)) > presentes(CHAMADA.entradas.slice(-terco)) * 2);
});

test("cada nome é chamado uma vez, em ordem, mesmo em passos irregulares", () => {
  const seen: number[] = [];
  let t = 0;
  const steps = [0.016, 0.25, 0.033, 0.1];
  let i = 0;
  while (t < schedule.finalAt) {
    const next = t + steps[i++ % steps.length];
    for (const event of schedule.between(t, next)) seen.push(event.index);
    t = next;
  }
  assert.deepEqual(seen, schedule.events.map((e) => e.index));
});

test("calledAt conta quantos nomes já foram chamados", () => {
  assert.equal(schedule.calledAt(0), 0);
  assert.equal(schedule.calledAt(schedule.events[2].at), 3);
  assert.equal(schedule.calledAt(schedule.finalAt), schedule.total);
});

test("áreas por posição no mundo", () => {
  assert.equal(areaAt(0), 1);
  AREAS.forEach((area) => assert.equal(areaAt(area.inicioX + 1), area.numero));
  assert.equal(areaAt(AREAS[1].inicioX - 0.5), 1);
});

test("começar numa área usa o último checkpoint antes dela", () => {
  const checkpoints = new Checkpoints([{ x: 1, y: 1 }, { x: 44, y: 1 }, { x: 74, y: 1 }, { x: 110, y: 1 }]);
  assert.equal(checkpoints.indexBefore(48), 1);
  assert.equal(checkpoints.indexBefore(80), 2);
  checkpoints.jumpTo(checkpoints.indexBefore(117));
  assert.equal(checkpoints.current.x, 110);
});
