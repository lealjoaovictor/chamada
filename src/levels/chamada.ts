import type { CallData } from "./types";

// Nomes fictícios. A lista é montada em ordem alfabética e o nome do aluno é sempre o último.
const PRIMEIROS = [
  "Adriana", "Alan", "Alice", "Amanda", "André", "Antônio", "Arthur", "Beatriz", "Bianca", "Bruno",
  "Caio", "Camila", "Carla", "Carlos", "Caroline", "Cecília", "Clara", "Cláudio", "Daniel", "Daniela",
  "Davi", "Débora", "Diego", "Eduarda", "Elisa", "Enzo", "Érica", "Fábio", "Felipe", "Fernanda",
  "Flávia", "Gabriel", "Gabriela", "Giovana", "Guilherme", "Gustavo", "Heitor", "Helena", "Hugo", "Igor",
  "Isabela", "Ítalo", "Jéssica", "Joana", "Jorge", "Júlia", "Juliano", "Karina", "Kauã", "Larissa",
  "Laura", "Leonardo", "Letícia", "Lívia", "Lorena", "Lucas", "Luana", "Luiza", "Manuela", "Marcela",
  "Marcos", "Mariana", "Mateus", "Melissa", "Miguel", "Natália", "Nicolas", "Otávio", "Paula", "Pedro",
  "Priscila", "Rafael", "Rafaela", "Renan", "Ricardo", "Rodrigo", "Sabrina", "Samuel", "Sara", "Sérgio",
  "Sofia", "Tatiane", "Thiago", "Valentina", "Vanessa", "Vicente", "Vinícius", "Vitória", "Wesley", "Yasmin",
];

const SOBRENOMES = [
  "Almeida", "Barbosa", "Cardoso", "Carvalho", "Castro", "Costa", "Dias", "Duarte", "Farias", "Ferreira",
  "Freitas", "Gomes", "Lima", "Lopes", "Machado", "Martins", "Melo", "Mendes", "Moreira", "Nunes",
  "Oliveira", "Pereira", "Pinto", "Ramos", "Reis", "Ribeiro", "Rocha", "Santos", "Silva", "Souza",
  "Teixeira", "Vieira",
];

const TOTAL_NOMES = 160;

function montarLista(): string[] {
  const nomes = new Set<string>();
  let i = 0;
  while (nomes.size < TOTAL_NOMES) {
    const primeiro = PRIMEIROS[i % PRIMEIROS.length];
    const sobrenome = SOBRENOMES[(i * 7 + Math.floor(i / PRIMEIROS.length) * 3) % SOBRENOMES.length];
    nomes.add(`${primeiro} ${sobrenome}`);
    i++;
  }
  return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

// Quem responde "presente": muitos no começo, quase ninguém no fim (a sala vai ficando vazia).
function responde(indice: number, total: number): boolean {
  const chance = 0.85 - 0.75 * (indice / (total - 1));
  const sorteio = ((indice * 9301 + 49297) % 233280) / 233280;
  return sorteio < chance;
}

const nomes = montarLista();

export const CHAMADA: CallData = {
  aluno: "Zacarias Vieira",
  entradas: nomes.map((nome, i) => ({ nome, presente: responde(i, nomes.length) })),
  inicio: 4,
  tempoComResposta: 3.4,
  tempoSemResposta: 4.6,
  // Volume e filtro da voz por área (1 a 5): longe e abafada no pátio, perto e clara no corredor final.
  volumePorArea: [0.35, 0.45, 0.55, 0.65, 1],
  filtroPorArea: [900, 1300, 1900, 2600, 6000],
};
