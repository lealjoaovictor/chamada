import type { CallData, CallEntryData, Fala } from "./types";

// Roteiro da chamada (GDD v3.1, "A chamada"). Tudo o que se ouve pela ligação está aqui:
// textos, instantes e quem fala. Cada fala tem um `id`, que é o nome do arquivo de áudio em `public/audio/vozes/`.
// Para regravar no ElevenLabs: `node ferramentas/vozes.ts` gera `docs/roteiro-vozes.csv` com todas as falas.

const professor = (id: string, texto: string, legenda?: string): Fala => ({ id, voz: "professor", texto, legenda });
const colega = (id: string, texto: string, legenda = texto): Fala => ({ id, voz: "colega", texto, legenda });
const seguranca = (id: string, texto: string): Fala => ({ id, voz: "seguranca", texto });
const zacarias = (id: string, texto: string): Fala => ({ id, voz: "zacarias", texto, legenda: texto });

// A turma: 48 colegas em ordem alfabética, e o Zacarias por último. F = faltou (8 faltas espalhadas).
const TURMA: [string, "a" | "o", "F"?][] = [
  ["Adriana Costa", "a"],
  ["Alan Ferreira", "o"],
  ["Amanda Ribeiro", "a"],
  ["Ana Beatriz Lopes", "a", "F"],
  ["André Martins", "o"],
  ["Beatriz Nunes", "a"],
  ["Bruno Carvalho", "o"],
  ["Caio Almeida", "o"],
  ["Camila Duarte", "a", "F"],
  ["Carlos Eduardo Pinto", "o"],
  ["Daniela Rocha", "a"],
  ["Diego Moreira", "o"],
  ["Eduarda Lima", "a"],
  ["Felipe Santos", "o"],
  ["Fernanda Gomes", "a", "F"],
  ["Gabriel Teixeira", "o"],
  ["Gabriela Souza", "a"],
  ["Guilherme Barbosa", "o"],
  ["Gustavo Mendes", "o"],
  ["Helena Castro", "a"],
  ["Igor Freitas", "o", "F"],
  ["Isabela Ramos", "a"],
  ["Jéssica Machado", "a"],
  ["João Pedro Dias", "o"],
  ["Júlia Farias", "a"],
  ["Larissa Melo", "a"],
  ["Leonardo Cardoso", "o"],
  ["Letícia Oliveira", "a", "F"],
  ["Lucas Pereira", "o"],
  ["Marcela Reis", "a"],
  ["Mariana Silva", "a"],
  ["Mateus Batista", "o"],
  ["Natália Moura", "a"],
  ["Otávio Campos", "o", "F"],
  ["Paula Andrade", "a"],
  ["Pedro Henrique Lima", "o"],
  ["Rafael Monteiro", "o"],
  ["Renata Borges", "a"],
  ["Ricardo Nogueira", "o"],
  ["Rodrigo Azevedo", "o", "F"],
  ["Sabrina Correia", "a"],
  ["Samuel Fonseca", "o"],
  ["Sofia Cavalcanti", "a"],
  ["Thiago Araújo", "o"],
  ["Valentina Rezende", "a"],
  ["Vinícius Prado", "o", "F"],
  ["Wesley Fagundes", "o"],
  ["Yasmin Tavares", "a"],
];

const turma: CallEntryData[] = TURMA.map(([nome, genero, falta]) => ({
  nome,
  presente: falta !== "F",
  voz: genero === "a" ? "aluna" : "aluno",
}));

const nomeId = (indice: number): string => `nome_${String(indice + 1).padStart(2, "0")}`;

export const CHAMADA: CallData = {
  aluno: "Zacarias Vieira",
  colegaNome: "Davi",

  // Parte 1 (0:00 a 1:45): o fim da aula, ouvido pelo celular. A chamada ainda não começou.
  fimDaAula: [
    { t: 14, fala: professor("prof_aula_01", "Então, pessoal, a prova é semana que vem, na quinta. Cai tudo até o capítulo seis.", "[falando da prova]") },
    { t: 30, fala: professor("prof_aula_02", "E quem tá no limite de faltas, atenção. Não dá pra faltar na prova, hein.", "\"quem tá no limite de faltas, atenção\"") },
    { t: 52, fala: professor("prof_aula_03", "Sobre o trabalho: é em dupla, entrega impressa, no dia da prova.", "[passando o trabalho]") },
    { t: 66, fala: professor("prof_aula_04", "Quem não tiver dupla me procura depois. Mas hoje não, que hoje eu tô com pressa.") },
    { t: 84, fala: professor("prof_aula_05", "Mais alguma dúvida? ... Ninguém? Ótimo.") },
    { t: 95, fala: professor("prof_aula_06", "Bom, pessoal, vamos fazer a chamada. Quem eu chamar já pode ir.", "\"vamos fazer a chamada\"") },
  ],

  // Parte 2 (1:45 a 7:50): 48 nomes e o Zacarias por último.
  inicio: 105,
  turma,
  tempoComResposta: 6,
  tempoFalta: 9,
  atrasoPresente: 1.9,
  atrasoRepete: 3,
  atrasoFalta: 5,
  interrupcoes: [
    {
      depoisDe: "Carlos Eduardo Pinto",
      duracao: 14,
      falas: [{ em: 1, fala: professor("prof_interrupcao_1", "Silêncio aí no fundo! Quem já respondeu pode ir, mas em silêncio, por favor.", "\"silêncio aí no fundo!\"") }],
      comentario: { em: 7, fala: colega("colega_06", "Ele parou pra brigar com o fundão. Aproveita!") },
    },
    {
      depoisDe: "Isabela Ramos",
      duracao: 21,
      falas: [
        {
          em: 1,
          fala: professor(
            "prof_interrupcao_2",
            "Ah, antes que eu esqueça: a coordenação pediu pra avisar que o prédio fecha às dez e meia. Depois disso os seguranças não deixam mais ninguém entrar.",
            "[aviso da coordenação]",
          ),
        },
      ],
      comentario: { em: 11, fala: colega("colega_08", "Parou pra dar um aviso, aproveita!") },
    },
    {
      depoisDe: "Pedro Henrique Lima",
      duracao: 18,
      falas: [
        { em: 1, fala: { id: "aluna_pergunta", voz: "aluna", texto: "Professor, a prova é com consulta?", legenda: "[uma aluna pergunta da prova]" } },
        { em: 4.5, fala: professor("prof_interrupcao_3", "Não. Sem consulta. Pronto... onde é que eu parei?") },
      ],
      comentario: { em: 10, fala: colega("colega_10", "Uma menina tá perguntando da prova... corre, mano!") },
    },
  ],

  // As 13 falas do colega, sussurradas e cada vez mais nervosas (as 3 das interrupções estão acima).
  colega: [
    {
      quando: { t: 1.5 },
      fala: colega(
        "colega_01",
        "Zacarias? Cadê você, cara? A aula tá acabando e ele vai fazer a chamada. Sorte sua que você é o último... Nem dá pra responder por você, ele tá olhando um por um. Corre! Vou deixar a ligação aberta.",
        "Cadê você? Ele vai fazer a chamada! Você é o último. Corre!",
      ),
    },
    { quando: { t: 41 }, fala: colega("colega_02", "Ele ainda tá falando da prova... não começou.") },
    { quando: { t: 75 }, fala: colega("colega_03", "Ele tá passando o trabalho, ainda dá.") },
    { quando: { t: 100.5 }, fala: colega("colega_04", "Começou a chamada!") },
    { quando: { letra: "B" }, fala: colega("colega_05", "Ainda tá no B... vai, vai.") },
    { quando: { letra: "G" }, fala: colega("colega_07", "Tá no G, mano.") },
    { quando: { letra: "M" }, fala: colega("colega_09", "Tá no M, mano. Cadê você?") },
    { quando: { letra: "S" }, fala: colega("colega_11", "Tá no S! Corre!") },
    { quando: { letra: "V" }, fala: colega("colega_12", "Ele tá no V...") },
    { quando: { antesDoAluno: true }, fala: colega("colega_13", "Mano... é você agora.") },
  ],
  atrasoComentario: 3,

  // A 204 vazia: o projetor queimou e a aula mudou para o Lab. 3, e o Davi esqueceu de avisar.
  salaVazia: [
    zacarias("zac_sala_1", "Ué... cadê todo mundo?"),
    zacarias("zac_sala_2", "Lab. 3? Bloco C?!"),
    zacarias("zac_sala_3", "Davi?! Vocês trocaram de sala?!"),
    colega("colega_sala_1", "Ih... esqueci de te falar, mano! É no Lab. 3! Corre!", "Esqueci de te falar! É no Lab. 3! Corre!"),
    colega("colega_sala_2", "A porta do bloco C eu deixei aberta.", "Deixei a porta do bloco C aberta."),
    colega("colega_sala_3", "Pode deixar que eu seguro o professor.", "Eu seguro o professor."),
  ],
  // Para compensar, quando a chamada chega no V, o Davi faz pergunta atrás de pergunta e a chamada para.
  // Começa logo depois do "Ele tá no V..." e antes do próximo nome.
  enrola: {
    letra: "V",
    atraso: 5.2,
    duracao: 19,
    falas: [
      { em: 0, fala: colega("colega_enrola_1", "Professor! Professor, posso fazer uma pergunta?", "Professor! Posso fazer uma pergunta?") },
      { em: 3, fala: professor("prof_enrola_1", "Rápido, Davi.", "Rápido, Davi.") },
      { em: 4.8, fala: colega("colega_enrola_2", "A prova vai ser em dupla?", "A prova vai ser em dupla?") },
      { em: 7.4, fala: professor("prof_enrola_2", "Não. Individual.", "Não. Individual.") },
      { em: 9.4, fala: colega("colega_enrola_3", "E... pode levar calculadora?", "E... pode levar calculadora?") },
      { em: 12.2, fala: professor("prof_enrola_3", "Pode, Davi. Posso continuar?", "Pode. Posso continuar?") },
      { em: 16, fala: colega("colega_enrola_4", "Segurei o quanto deu, mano. Corre!", "Segurei o quanto deu. Corre!") },
    ],
  },

  falas: {
    nome: (indice, nome) => professor(nomeId(indice), `${nome}.`),
    nomeAluno: professor("nome_zacarias", "Zacarias Vieira."),
    presente: [
      { id: "presente_a1", voz: "aluna", texto: "Presente." },
      { id: "presente_a2", voz: "aluna", texto: "Presente!" },
      { id: "presente_a3", voz: "aluna", texto: "Aqui." },
      { id: "presente_o1", voz: "aluno", texto: "Presente." },
      { id: "presente_o2", voz: "aluno", texto: "Presente!" },
      { id: "presente_o3", voz: "aluno", texto: "Aqui, professor." },
    ],
    falta: [professor("prof_falta_1", "Falta."), professor("prof_falta_2", "Não veio? Falta.")],
    eleChamou: colega("colega_ele_chamou", "...ele chamou."),
    salaChama: professor("prof_sala_zacarias", "Zacarias Vieira?"),
    zacariasPresente: { id: "zacarias_presente", voz: "zacarias", texto: "Presente!" },
    seguranca: {
      desconfia: [seguranca("seg_desconfia_1", "Ei? Tem alguém aí?"), seguranca("seg_desconfia_2", "Quem tá aí?"), seguranca("seg_desconfia_3", "Hm?")],
      barulho: [seguranca("seg_barulho_1", "Que foi isso?"), seguranca("seg_barulho_2", "Ué..."), seguranca("seg_barulho_3", "Quem derrubou isso aí?")],
      pego: [
        seguranca("seg_pego_1", "Já fechou, rapaz. Pra fora."),
        seguranca("seg_pego_2", "Acabou o horário!"),
        seguranca("seg_pego_3", "Opa, opa. Aqui não."),
      ],
      // Perseguição do subsolo: o segurança sai pela porta gritando.
      persegue: [seguranca("seg_persegue_1", "Ei! Parado aí!"), seguranca("seg_persegue_2", "Volta aqui, rapaz!")],
      // Segurança da portaria do bloco C, vendo o jogo na TV.
      lance: [seguranca("seg_lance_1", "Vai... vai... vai!"), seguranca("seg_lance_2", "Chuta, chuta!"), seguranca("seg_lance_3", "Olha o contra-ataque...")],
      gol: [seguranca("seg_gol_1", "Gooool! É isso!"), seguranca("seg_gol_2", "Golaço! Golaço!")],
      perdeu: [seguranca("seg_perdeu_1", "Não acredito... na trave!"), seguranca("seg_perdeu_2", "Ahh, como perde isso?!")],
      reclama: [seguranca("seg_reclama_1", "Ô juiz, foi pênalti!"), seguranca("seg_reclama_2", "Juiz ladrão!")],
      // Segurança cochilando no corredor do segundo andar.
      acorda: [seguranca("seg_acorda_1", "Hã?! Quem tá aí?"), seguranca("seg_acorda_2", "Hein?! Que barulho foi esse?")],
      voltaDormir: [seguranca("seg_volta_1", "Hm... devia ser o vento."), seguranca("seg_volta_2", "Tô ficando doido...")],
    },
  },

  sinalPorArea: [1, 1, 1, 0.55, 1, 0.8],
  picotaNasAreas: [4],
};
