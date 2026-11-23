// Roteiro das vozes e vozes provisórias.
//
//   node ferramentas/vozes.ts                 → escreve docs/roteiro-vozes.csv (todas as falas, para gravar no ElevenLabs)
//   node ferramentas/vozes.ts --provisorias   → também gera as falas que faltam em public/audio/vozes/ com a voz do macOS (`say`)
//   node ferramentas/vozes.ts --refazer       → gera de novo todas as provisórias (apaga as gravações por cima!)
//
// Para trocar uma voz pela do ElevenLabs: salve o arquivo como public/audio/vozes/<id>.mp3 (id na 1ª coluna do CSV)
// e rode `node ferramentas/vozes.ts` de novo, que atualiza o manifest.json. Precisa do ffmpeg para as provisórias.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CHAMADA } from "../src/levels/chamada.ts";
import { allFalas } from "../src/game/CallSchedule.ts";

const OUT = join("public", "audio", "vozes");
const CSV = join("docs", "roteiro-vozes.csv");
const EXTENSIONS = ["mp3", "m4a", "wav", "ogg"];
const PT = (name: string): string => `${name} (Portuguese (Brazil))`;
// Vozes do macOS usadas só como provisórias (rate = palavras por minuto).
const VOICES: Record<string, { voices: string[]; rate: number }> = {
  professor: { voices: [PT("Reed")], rate: 175 },
  colega: { voices: [PT("Eddy")], rate: 215 },
  aluno: { voices: [PT("Rocko"), PT("Eddy"), PT("Grandpa")], rate: 185 },
  aluna: { voices: [PT("Flo"), PT("Sandy"), PT("Shelley"), "Luciana"], rate: 185 },
  zacarias: { voices: [PT("Rocko")], rate: 175 },
  seguranca: { voices: [PT("Grandpa")], rate: 160 },
};

const args = new Set(process.argv.slice(2));
const falas = allFalas(CHAMADA);
mkdirSync(OUT, { recursive: true });
mkdirSync("docs", { recursive: true });

const quote = (text: string): string => `"${text.replace(/"/g, '""')}"`;
writeFileSync(CSV, ["id;voz;texto;legenda", ...falas.map((f) => [f.id, f.voz, quote(f.texto), quote(f.legenda ?? "")].join(";"))].join("\n") + "\n");
console.log(`${falas.length} falas em ${CSV}`);

const fileOf = (id: string): string | undefined => EXTENSIONS.map((ext) => `${id}.${ext}`).find((file) => existsSync(join(OUT, file)));

if (args.has("--provisorias") || args.has("--refazer")) {
  const tmp = join(tmpdir(), "chamada-vozes.aiff");
  let made = 0;
  falas.forEach((fala, i) => {
    if (fileOf(fala.id) && !args.has("--refazer")) return;
    const { voices, rate } = VOICES[fala.voz];
    const voice = voices[i % voices.length];
    execFileSync("say", ["-v", voice, "-r", String(rate), "-o", tmp, fala.texto]);
    for (const ext of EXTENSIONS) rmSync(join(OUT, `${fala.id}.${ext}`), { force: true });
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", tmp, "-ac", "1", "-ar", "24000", "-b:a", "48k", join(OUT, `${fala.id}.mp3`)]);
    made++;
  });
  rmSync(tmp, { force: true });
  console.log(`${made} vozes provisórias geradas em ${OUT}`);
}

const manifest: Record<string, string> = {};
const missing: string[] = [];
for (const fala of falas) {
  const file = fileOf(fala.id);
  if (file) manifest[fala.id] = file;
  else missing.push(fala.id);
}
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1) + "\n");
const unused = readdirSync(OUT).filter((file) => file !== "manifest.json" && !Object.values(manifest).includes(file));
console.log(`manifest.json: ${Object.keys(manifest).length} falas com áudio`);
if (missing.length) console.log(`sem áudio (o jogo usa a voz do navegador): ${missing.join(", ")}`);
if (unused.length) console.log(`arquivos sem uso: ${unused.join(", ")}`);
