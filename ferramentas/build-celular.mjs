// Ajusta a build para celular (dist-celular) para ser publicada como página privada no claude.ai:
// os modelos .glb ganham a extensão .glb.mp4 (tipo aceito pelo servidor) e a página perde o esqueleto HTML,
// que o claude.ai acrescenta sozinho.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = "dist-celular";
for (const dir of [join(root, "models"), join(root, "models", "kit")]) {
  for (const file of readdirSync(dir)) {
    if (file.endsWith(".glb")) renameSync(join(dir, file), join(dir, `${file}.mp4`));
    if (file === ".gitkeep") rmSync(join(dir, file));
  }
}
for (const dir of ["audio", "textures"]) rmSync(join(root, dir, ".gitkeep"), { force: true });

// Cópia em MP3 dos sons (o iPhone não toca Ogg Vorbis). Precisa do ffmpeg instalado.
const sfxDir = join(root, "audio", "sfx");
try {
  for (const file of readdirSync(sfxDir).filter((f) => f.endsWith(".ogg"))) {
    const mp3 = join(sfxDir, file.replace(/\.ogg$/, ".mp3"));
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", join(sfxDir, file), "-b:a", "128k", mp3]);
  }
} catch (error) {
  console.warn("ffmpeg indisponível: a build para celular fica sem som no iPhone", error.message);
}

let html = readFileSync(join(root, "index.html"), "utf8");
html = html
  .replace(/<!doctype html>\s*<html[^>]*>\s*<head>\s*/i, "")
  .replace(/<meta charset[^>]*>\s*/i, "")
  .replace(/<meta name="viewport"[^>]*>\s*/i, "")
  .replace(/<\/?(head|body|html)>/gi, "")
  .replace("<title>Chamada</title>", "<title>Chamada</title>\n<style>:root{color-scheme:dark;padding:0!important}</style>");
writeFileSync(join(root, "pagina.html"), html);
console.log("dist-celular/pagina.html pronta");
