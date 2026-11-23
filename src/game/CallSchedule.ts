import type { CallData, Fala } from "../levels/types";

/**
 * O que toca num instante da ligação.
 * - `professor`: fala do professor (fim da aula ou interrupção);
 * - `nome`: o professor lê um nome; `repete`: lê de novo o nome de quem não respondeu;
 * - `presente`: um aluno responde; `falta`: o professor marca a falta;
 * - `colega`: o colega fala perto do microfone.
 */
export type CallEventKind = "professor" | "nome" | "repete" | "presente" | "falta" | "colega" | "aluna";

export interface CallEvent {
  at: number;
  kind: CallEventKind;
  fala: Fala;
  /** Nos eventos de nome: qual nome (0 = primeiro) e se é o do jogador. */
  nomeIndex?: number;
  nome?: string;
  aluno?: boolean;
}

export interface CallName {
  index: number;
  nome: string;
  presente: boolean;
  aluno: boolean;
  at: number;
}

// Linha do tempo da ligação. O tempo de jogo é o relógio: cada fala tem um instante fixo.
export class CallSchedule {
  readonly events: readonly CallEvent[];
  readonly names: readonly CallName[];
  readonly finalAt: number;
  /** Instante em que começa cada interrupção. */
  readonly interruptionsAt: readonly number[];
  /** Quando o Davi começa a enrolar o professor (se prometeu). */
  readonly stallAt: number;

  constructor(data: CallData) {
    const events: CallEvent[] = [];
    const names: CallName[] = [];
    const interruptionsAt: number[] = [];
    for (const { t, fala } of data.fimDaAula) events.push({ at: t, kind: "professor", fala });

    let at = data.inicio;
    data.turma.forEach((entrada, index) => {
      names.push({ index, nome: entrada.nome, presente: entrada.presente, aluno: false, at });
      const base = { nomeIndex: index, nome: entrada.nome };
      events.push({ at, kind: "nome", fala: data.falas.nome(index, entrada.nome), ...base });
      if (entrada.presente) {
        const opcoes = data.falas.presente.filter((fala) => fala.voz === entrada.voz);
        const fala = opcoes[index % opcoes.length] ?? data.falas.presente[0];
        events.push({ at: at + data.atrasoPresente, kind: "presente", fala, ...base });
        at += data.tempoComResposta;
      } else {
        events.push({ at: at + data.atrasoRepete, kind: "repete", fala: data.falas.nome(index, entrada.nome), ...base });
        const falta = data.falas.falta[index % data.falas.falta.length];
        events.push({ at: at + data.atrasoFalta, kind: "falta", fala: falta, ...base });
        at += data.tempoFalta;
      }
      for (const pausa of data.interrupcoes.filter((p) => p.depoisDe === entrada.nome)) {
        interruptionsAt.push(at);
        for (const { em, fala } of pausa.falas) events.push({ at: at + em, kind: fala.voz === "professor" ? "professor" : "aluna", fala });
        events.push({ at: at + pausa.comentario.em, kind: "colega", fala: pausa.comentario.fala });
        at += pausa.duracao;
      }
    });
    const aluno = { index: names.length, nome: data.aluno, presente: false, aluno: true, at };
    names.push(aluno);
    events.push({ at, kind: "nome", fala: data.falas.nomeAluno, nomeIndex: aluno.index, nome: data.aluno, aluno: true });

    for (const { quando, fala } of data.colega) {
      let t: number | undefined;
      if ("t" in quando) t = quando.t;
      else if ("letra" in quando) {
        const first = names.find((n) => n.nome.toUpperCase().startsWith(quando.letra.toUpperCase()));
        if (first) t = first.at + data.atrasoComentario;
      } else t = names[names.length - 2].at + data.atrasoComentario;
      if (t !== undefined) events.push({ at: t, kind: "colega", fala });
    }

    const letra = data.enrola.letra.toUpperCase();
    const primeiro = names.find((n) => !n.aluno && n.nome.toUpperCase().startsWith(letra));
    this.stallAt = primeiro ? primeiro.at + data.enrola.atraso : names[names.length - 2].at + data.enrola.atraso;

    events.sort((a, b) => a.at - b.at);
    this.events = events;
    this.names = names;
    this.finalAt = at;
    this.interruptionsAt = interruptionsAt;
  }

  /** Quantos nomes existem, contando o do jogador. */
  get total(): number {
    return this.names.length;
  }

  // Quantos nomes já foram chamados até o instante t.
  calledAt(t: number): number {
    let count = 0;
    for (const name of this.names) {
      if (name.at > t) break;
      count++;
    }
    return count;
  }

  // Eventos cujo instante cai em (from, to].
  between(from: number, to: number): CallEvent[] {
    return this.events.filter((event) => event.at > from && event.at <= to);
  }
}

/** Todas as falas do jogo, sem repetição (para gravar e para conferir que nenhum áudio falta). */
export function allFalas(data: CallData): Fala[] {
  const schedule = new CallSchedule(data);
  const falas = new Map<string, Fala>();
  const add = (fala: Fala): void => {
    if (!falas.has(fala.id)) falas.set(fala.id, fala);
  };
  schedule.events.forEach((event) => add(event.fala));
  const extra = data.falas;
  [...extra.presente, ...extra.falta, extra.eleChamou, extra.salaChama, extra.zacariasPresente].forEach(add);
  Object.values(extra.seguranca).flat().forEach(add);
  data.salaVazia.forEach(add);
  data.enrola.falas.forEach(({ fala }) => add(fala));
  return [...falas.values()];
}
