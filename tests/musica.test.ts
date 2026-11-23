import { test } from "node:test";
import assert from "node:assert/strict";
import { Music, type MusicState } from "../src/game/Music.ts";

// Contexto de áudio falso: só guarda o que a música liga, toca e para.
class FakeParam {
  value = 0;
}
class FakeNode {
  gain = new FakeParam();
  frequency = new FakeParam();
  type = "";
  connect<T>(node: T): T {
    return node;
  }
  disconnect(): void {}
}
class FakeSource extends FakeNode {
  buffer: unknown = null;
  loop = false;
  started = 0;
  stopped = 0;
  private readonly log: string[];
  constructor(log: string[]) {
    super();
    this.log = log;
  }
  start(): void {
    this.started++;
    this.log.push(`start ${(this.buffer as { name: string }).name}`);
  }
  stop(): void {
    this.stopped++;
    this.log.push(`stop ${(this.buffer as { name: string }).name}`);
  }
}
function setup() {
  const log: string[] = [];
  const ctx = {
    state: "running",
    currentTime: 0,
    createGain: () => new FakeNode(),
    createBiquadFilter: () => new FakeNode(),
    createBufferSource: () => new FakeSource(log),
  };
  const sfx = { audio: ctx, output: new FakeNode() };
  const music = new Music(sfx as never);
  const internal = music as unknown as { buffers: Map<string, unknown>; voices: Map<string, { level: number; source: unknown }>; duckLevel: number };
  for (const name of ["menu", "patio", "corredor", "tensao", "perseguicao", "final", "stinger-desconfia", "stinger-pego", "stinger-perseguicao"]) {
    internal.buffers.set(name, { name });
  }
  const run = (state: Partial<MusicState>, seconds: number) => {
    const full: MusicState = { scene: "jogo", area: 1, tension: 0, suspicious: false, chase: 0, colegaSpeaking: false, ...state };
    for (let t = 0; t < seconds; t += 1 / 60) music.update(1 / 60, full);
  };
  const level = (name: string) => internal.voices.get(name)?.level ?? 0;
  return { music, log, run, level, internal };
}

test("menu toca o tema; ao começar, o tema sai e entra o pátio", () => {
  const { run, level } = setup();
  run({ scene: "menu" }, 6);
  assert.ok(level("menu") > 0.9);
  run({ scene: "jogo", area: 1 }, 12);
  assert.ok(level("menu") < 0.05);
  assert.ok(level("patio") > 0.9);
  assert.ok(level("corredor") < 0.01);
});

test("corredores trocam o drone e a tensão sobe com o alerta do segurança", () => {
  const { run, level, log } = setup();
  run({ area: 2 }, 12);
  assert.ok(level("corredor") > 0.9 && level("patio") < 0.01);
  run({ area: 2, tension: 0.8, suspicious: true }, 3);
  assert.ok(level("tensao") > 0.7);
  assert.ok(log.includes("start stinger-desconfia"));
  run({ area: 2, tension: 0 }, 12);
  assert.ok(level("tensao") < 0.05);
});

test("perseguição: stinger, batida no alto e drone baixo; ser pego corta tudo", () => {
  const { run, level, log } = setup();
  run({ area: 4 }, 10);
  run({ area: 4, chase: 0.5 }, 2);
  assert.ok(log.includes("start stinger-perseguicao"));
  assert.ok(level("perseguicao") > 0.8);
  assert.ok(level("corredor") < 0.2);
  run({ scene: "pego", area: 4, chase: 0.5 }, 1);
  assert.ok(log.includes("start stinger-pego"));
  assert.ok(level("perseguicao") < 0.01 && level("corredor") < 0.01);
});

test("perseguição recomeça do início depois de parada", () => {
  const { run, log } = setup();
  run({ area: 4, chase: 0.5 }, 3);
  run({ area: 4, chase: 0 }, 15);
  assert.ok(log.includes("stop perseguicao"));
  run({ area: 4, chase: 0.5 }, 1);
  assert.equal(log.filter((l) => l === "start perseguicao").length, 2);
});

test("bloco C (área 6) fica sem trilha de fundo e o final toca uma vez", () => {
  const { run, level, music, log } = setup();
  run({ area: 3 }, 10);
  run({ area: 6 }, 30);
  for (const name of ["patio", "corredor", "tensao", "perseguicao"]) assert.ok(level(name) < 0.01, name);
  music.playFinal();
  music.playFinal();
  assert.equal(log.filter((l) => l === "start final").length, 1);
});

test("a música baixa quando o colega fala e volta depois", () => {
  const { run, internal } = setup();
  run({ area: 1 }, 5);
  run({ area: 1, colegaSpeaking: true }, 1);
  assert.ok(internal.duckLevel < 0.5);
  run({ area: 1 }, 4);
  assert.ok(internal.duckLevel > 0.95);
});
