import type { CallData } from "../levels/types";

export interface CallEvent {
  index: number;
  nome: string;
  presente: boolean;
  aluno: boolean;
  at: number;
}

// Linha do tempo da chamada. O tempo de jogo é o relógio: cada nome tem um instante fixo.
export class CallSchedule {
  readonly events: readonly CallEvent[];
  readonly finalAt: number;

  constructor(data: CallData) {
    const events: CallEvent[] = [];
    let at = data.inicio;
    data.entradas.forEach((entrada, index) => {
      events.push({ index, nome: entrada.nome, presente: entrada.presente, aluno: false, at });
      at += entrada.presente ? data.tempoComResposta : data.tempoSemResposta;
    });
    events.push({ index: events.length, nome: data.aluno, presente: false, aluno: true, at });
    this.events = events;
    this.finalAt = at;
  }

  get total(): number {
    return this.events.length;
  }

  // Quantos nomes já foram chamados até o instante t.
  calledAt(t: number): number {
    let count = 0;
    for (const event of this.events) {
      if (event.at > t) break;
      count++;
    }
    return count;
  }

  // Eventos cujo instante cai em (from, to].
  between(from: number, to: number): CallEvent[] {
    return this.events.filter((event) => event.at > from && event.at <= to);
  }
}
