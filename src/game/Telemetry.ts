const STORAGE_KEY = "chamada-telemetria";
const MAX_RUNS = 20;

export interface AreaStats {
  segundos: number;
  mortes: { causa: string; x: number }[];
}

export interface RunRecord {
  data: string;
  inicioArea: number;
  final: "bom" | "ruim" | "incompleto";
  segundos: number;
  nomesChamados: number;
  areas: Record<number, AreaStats>;
}

// Mede tempo e mortes por área para calibrar duração e dificuldade.
// Guarda as últimas partidas no navegador; com ?telemetria=1 mostra um painel de depuração.
export class Telemetry {
  private readonly run: RunRecord;
  private readonly panel: HTMLDivElement | null = null;
  private saved = false;
  private panelTimer = 0;

  constructor(startArea: number) {
    this.run = { data: new Date().toISOString(), inicioArea: startArea, final: "incompleto", segundos: 0, nomesChamados: 0, areas: {} };
    if (new URLSearchParams(location.search).get("telemetria") === "1") {
      this.panel = document.createElement("div");
      this.panel.className = "telemetria";
      document.body.append(this.panel);
      (window as unknown as { chamadaTelemetria: () => RunRecord[] }).chamadaTelemetria = () => Telemetry.history();
    }
    window.addEventListener("pagehide", () => this.save());
  }

  static history(): RunRecord[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as RunRecord[];
    } catch {
      return [];
    }
  }

  update(dt: number, area: number, calledCount: number, totalNames: number, x = 0, y = 0): void {
    this.run.segundos += dt;
    this.run.nomesChamados = calledCount;
    this.stats(area).segundos += dt;
    if (!this.panel) return;
    this.panelTimer -= dt;
    if (this.panelTimer > 0) return;
    this.panelTimer = 0.25;
    const lines = [
      `tempo ${formatTime(this.run.segundos)}  ·  área ${area}`,
      `chamada ${calledCount}/${totalNames}  ·  x ${x.toFixed(1)} y ${y.toFixed(1)}`,
      ...Object.entries(this.run.areas).map(
        ([n, s]) => `área ${n}: ${formatTime(s.segundos)}  ·  ${s.mortes.length} morte(s)`,
      ),
    ];
    this.panel.textContent = lines.join("\n");
  }

  death(area: number, cause: string, x: number): void {
    this.stats(area).mortes.push({ causa: cause, x: Math.round(x * 10) / 10 });
  }

  finish(result: "bom" | "ruim"): void {
    this.run.final = result;
    this.save();
    console.table(
      Object.entries(this.run.areas).map(([n, s]) => ({ area: n, segundos: Math.round(s.segundos), mortes: s.mortes.length })),
    );
  }

  private stats(area: number): AreaStats {
    return (this.run.areas[area] ??= { segundos: 0, mortes: [] });
  }

  private save(): void {
    if (this.saved || this.run.segundos < 1) return;
    this.saved = true;
    try {
      const runs = [...Telemetry.history(), this.run].slice(-MAX_RUNS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
    } catch {
      // Armazenamento indisponível (janela privada): a partida só não fica registrada.
    }
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
