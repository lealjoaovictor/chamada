<div align="center">

# c h a m a d a

*Chegue à sala antes que o professor chame o seu nome.*

![Babylon.js](https://img.shields.io/badge/Babylon.js-9.37-BB464B?style=flat-square&logo=babylondotjs&logoColor=white)
![Havok](https://img.shields.io/badge/física-Havok-1f1f1f?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite&logoColor=white)
![Duração](https://img.shields.io/badge/duração-até%208%20min-444?style=flat-square)

![Menu do jogo sobre o pátio da universidade à noite](docs/imagens/menu.png)

</div>

## Sobre o jogo

**Chamada** é um jogo de plataforma e puzzle 2.5D, de no máximo oito minutos, que roda no navegador. Zacarias trabalha de dia e estuda à noite. Hoje ele se atrasou, está no limite de faltas e precisa atravessar uma faculdade que está fechando para chegar à sala antes que o professor leia o nome dele na chamada.

Não há barra de tempo. **O relógio é a própria chamada:** um colega da turma deixa a ligação aberta, e você ouve pelo celular o professor lendo os nomes em ordem alfabética. O seu é o último. Ser pego pelos seguranças não para a chamada.

<p align="center">
  <img src="docs/imagens/patio.png" alt="O aluno empurra uma caixa no pátio escuro da universidade" width="100%">
</p>

### Pilares

| | |
| --- | --- |
| 🔊 **A pressão é sonora** | O tempo é a voz da chamada, não um número na tela. |
| 🤫 **Sem texto de interface** | As palavras vêm só do som: a ligação, a chamada e os seguranças. |
| 💀 **Falha barata** | Reinício instantâneo no início da área. |
| 🌫️ **Clima antes de quantidade** | Poucas áreas, bem acabadas, com névoa, grão e luzes quentes contra um fundo frio. |

## O caminho até a sala

| | Área | O que acontece |
| :-: | --- | --- |
| 1 | **Pátio** | O portão principal está fechado. Empurre uma caixa e ache outro caminho. |
| 2 | **Corredor do bloco principal** | Luzes sendo apagadas, uma catraca baixa e uma porta que fecha sozinha. |
| 3 | **Biblioteca** | Os seguranças fazem a ronda com a lanterna. Fique fora da luz. |
| 4 | **Subsolo** | Um segurança corre atrás de você. Pule, deslize e não olhe para trás. |
| 5 | **Corredor final** | A voz do professor de verdade, e o seu nome chegando. |

## Controles

| Ação | Teclado | Controle |
| --- | --- | --- |
| Andar | `A` / `D` ou setas | Analógico esquerdo ou direcional |
| Pular | `Espaço` | `A` (Xbox) / `X` (PlayStation) |
| Deslizar | `S` ou `↓` enquanto corre | Analógico para baixo enquanto corre |
| Empurrar caixa | Andar contra a caixa | Andar contra a caixa |

## Como rodar

Você precisa do [Git](https://git-scm.com) e do [Node.js](https://nodejs.org) **22 LTS** (ou 20.19 em diante; versões mais antigas do Node 20 não rodam o Vite). Confira com `node -v`.

```bash
git clone https://github.com/lealjoaovictor/chamada.git
cd chamada
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador (Chrome, Edge ou Firefox) e pressione qualquer botão. Para parar o servidor, use `Ctrl+C` no terminal. O servidor também escuta na rede local, então dá para abrir no celular pelo IP do computador (com um controle bluetooth).

**Versão publicada.** A cada atualização do `main`, o GitHub publica o jogo sozinho em https://lealjoaovictor.github.io/chamada/ (veja a aba Actions). Para testar, basta abrir o link no Chrome, Edge ou Firefox, sem instalar nada.

<details>
<summary><b>Versão final, testes e fase de teste</b></summary>

<br>

Gerar e servir a build:

```bash
npm run build
npx vite preview --port 4173
```

O `index.html` da build não abre com duplo clique, porque o navegador bloqueia o carregamento de modelos e sons fora de um servidor local.

Rodar os testes automáticos da lógica (precisa do Node 22.18 ou mais recente):

```bash
npm test
```

Há uma fase de testes em `http://localhost:5173/?fase=teste`.

</details>

## Estrutura do projeto

```
chamada/
├── src/
│   ├── game/        núcleo: jogador, câmera, física, seguranças (`Vigia`), portas, caixas, pós-processamento
│   ├── levels/      as cinco áreas descritas em dados, separadas do código
│   └── ui/          menu, transições e tela final com créditos
├── public/          modelos GLB e sons usados pelo jogo
├── ferramentas/     script do Blender que converte os FBX do Mixamo para GLB
├── tests/           testes com node --test
├── Chamada GDD enxuto.md   documento de design
└── PROJETO.md       contexto técnico, estado atual e licenças dos assets
```

## Equipe

Feito por **João Leal**, **Murilo Schettino**, **Gustavo Lopes** e **Eduardo Millione** para a disciplina de Desenvolvimento de Jogos Digitais.

## Créditos e licenças

- Motor: [Babylon.js](https://www.babylonjs.com) e física [Havok](https://www.havok.com)
- Personagens e animações: [Mixamo](https://www.mixamo.com) (Adobe), usados conforme os termos do serviço
- Cenário: modelos e texturas CC0 do [Poly Haven](https://polyhaven.com)
- Vozes: geradas no [ElevenLabs](https://elevenlabs.io)
- Referências de clima e ritmo: *INSIDE* e *SpeedRunners*

A lista completa de assets, com origem e licença de cada um, está na seção 9 do [`PROJETO.md`](PROJETO.md).
