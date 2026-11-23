import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CallSchedule, allFalas } from "../src/game/CallSchedule.ts";
import { CHAMADA } from "../src/levels/chamada.ts";
import { AREAS, areaAt } from "../src/levels/areas.ts";
import { Checkpoints } from "../src/game/Checkpoints.ts";

const schedule = new CallSchedule(CHAMADA);
const nomes = schedule.names;

test("o nome do Zacarias é lido em 7min50, e a chamada começa em 1min45", () => {
  assert.equal(schedule.finalAt, 470);
  assert.equal(nomes[0].at, 105);
  const fimDaAula = schedule.events.filter((e) => e.at < 105);
  assert.ok(fimDaAula.every((e) => e.kind === "professor" || e.kind === "colega"));
  assert.match(CHAMADA.fimDaAula.at(-1)!.fala.texto, /vamos fazer a chamada/);
});

test("48 colegas e o Zacarias por último, sem ninguém depois dele em ordem alfabética", () => {
  assert.equal(CHAMADA.turma.length, 48);
  const last = nomes[nomes.length - 1];
  assert.equal(last.nome, CHAMADA.aluno);
  assert.equal(last.aluno, true);
  for (const name of nomes.slice(0, -1)) assert.ok(name.nome.localeCompare(CHAMADA.aluno, "pt-BR") < 0, name.nome);
  assert.equal(schedule.events.at(-1)!.aluno, true, "nada toca depois do nome do Zacarias");
});

test("os nomes estão em ordem alfabética e sem repetição", () => {
  const lista = CHAMADA.turma.map((e) => e.nome);
  assert.deepEqual(lista, [...lista].sort((a, b) => a.localeCompare(b, "pt-BR")));
  assert.equal(new Set(lista).size, lista.length);
});

test("8 faltas espalhadas pela lista, cada uma com o nome repetido e \"Falta.\"", () => {
  const faltas = CHAMADA.turma.filter((e) => !e.presente);
  assert.equal(faltas.length, 8);
  const metade = CHAMADA.turma.length / 2;
  const primeira = CHAMADA.turma.slice(0, metade).filter((e) => !e.presente).length;
  assert.ok(primeira >= 3 && primeira <= 5, `faltas na 1ª metade: ${primeira}`);
  for (const falta of faltas) {
    const kinds = schedule.events.filter((e) => e.nome === falta.nome).map((e) => e.kind);
    assert.deepEqual(kinds, ["nome", "repete", "falta"]);
  }
});

test("três interrupções, cada uma depois de um nome que existe e comentada pelo colega", () => {
  assert.equal(CHAMADA.interrupcoes.length, 3);
  assert.equal(schedule.interruptionsAt.length, 3);
  for (const pausa of CHAMADA.interrupcoes) {
    assert.ok(CHAMADA.turma.some((e) => e.nome === pausa.depoisDe), pausa.depoisDe);
    assert.ok(pausa.comentario.em < pausa.duracao);
  }
});

test("13 falas do colega, todas antes do nome do Zacarias e cada uma com legenda", () => {
  const colega = schedule.events.filter((e) => e.kind === "colega");
  assert.equal(colega.length, 13);
  for (const e of colega) {
    assert.ok(e.at < schedule.finalAt, e.fala.id);
    assert.ok(e.fala.legenda, e.fala.id);
  }
});

test("\"Tá no M\" toca quando a chamada está mesmo no M (e o mesmo para as outras letras)", () => {
  for (const { quando, fala } of CHAMADA.colega) {
    if (!("letra" in quando)) continue;
    const at = schedule.events.find((e) => e.fala.id === fala.id)!.at;
    const atual = nomes[schedule.calledAt(at) - 1];
    assert.ok(atual.nome.startsWith(quando.letra), `${fala.id}: ${atual.nome}`);
  }
});

test("as falas não se atropelam: o \"presente\" vem depois do fim do nome e antes do próximo", () => {
  for (const name of nomes.slice(0, -1)) {
    const proximo = nomes[name.index + 1];
    const doNome = schedule.events.filter((e) => e.nome === name.nome);
    for (const e of doNome) assert.ok(e.at >= name.at && e.at < proximo.at, `${name.nome} ${e.kind}`);
  }
});

test("cada nome é chamado uma vez, em ordem, mesmo em passos irregulares", () => {
  const seen: number[] = [];
  let t = 0;
  const steps = [0.016, 0.25, 0.033, 0.1];
  let i = 0;
  while (t < schedule.finalAt) {
    const next = t + steps[i++ % steps.length];
    for (const event of schedule.between(t, next)) if (event.kind === "nome") seen.push(event.nomeIndex!);
    t = next;
  }
  assert.deepEqual(seen, nomes.map((n) => n.index));
});

test("calledAt conta quantos nomes já foram chamados", () => {
  assert.equal(schedule.calledAt(0), 0);
  assert.equal(schedule.calledAt(nomes[2].at), 3);
  assert.equal(schedule.calledAt(schedule.finalAt), schedule.total);
  assert.equal(schedule.total, 49);
});

test("todas as falas têm id único e um arquivo de voz no manifest", () => {
  const falas = allFalas(CHAMADA);
  assert.equal(new Set(falas.map((f) => f.id)).size, falas.length);
  const manifest = JSON.parse(readFileSync("public/audio/vozes/manifest.json", "utf8")) as Record<string, string>;
  for (const fala of falas) assert.ok(manifest[fala.id], `sem áudio: ${fala.id}`);
  for (const kind of ["desconfia", "barulho", "pego"] as const) assert.equal(CHAMADA.falas.seguranca[kind].length, 3);
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
