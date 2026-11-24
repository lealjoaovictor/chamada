<div align="center">

# c h a m a d a

*Chegue à sala antes que o professor chame o seu nome.*

**Jogue agora no navegador:** [lealjoaovictor.github.io/chamada](https://lealjoaovictor.github.io/chamada/)

</div>

---

## 1. A ideia

> Zacarias trabalha de dia e estuda à noite. Hoje ele se atrasou, está **no limite de faltas**, e o professor está fazendo a chamada. O nome dele é o último.

- **Gênero:** plataforma e puzzle 2.5D, no máximo 8 minutos, no navegador.
- **O relógio é a chamada.** Não existe barra de tempo: um colega deixa a ligação aberta e você **ouve** o professor lendo os nomes em ordem alfabética.
- **Como se joga:** andar, pular, deslizar e empurrar objetos, sem ser visto pelos seguranças.
- **Inspiração:** o clima de *INSIDE* e a pressão de *SpeedRunners*.

---

## 2. Babylon.js: o motor do jogo

Escolhemos o **Babylon.js 9.37** (com TypeScript e Vite) porque ele entrega um motor 3D completo **rodando direto no navegador**: o jogo abre por um link, sem instalar nada.

| O que o Babylon nos deu | Onde aparece no jogo |
| --- | --- |
| **Física Havok** integrada e controlador de personagem | Andar, pular, deslizar e empurrar carrinhos travados num plano 2D |
| **Carregador glTF** e grupos de animação | Personagem e animações do Mixamo, modelos do cenário, troca suave entre correr, empurrar e agachar |
| **Luzes, sombras e raycast** | A lanterna do segurança é uma luz de verdade: as estantes fazem sombra e escondem o jogador |
| **Pipeline de pós-processamento** | Névoa, grão, bloom e cores frias: o clima de faculdade à noite |
| **Inspector** | Depurar a cena ao vivo enquanto desenvolvíamos |

---

## 3. IA usada com método

A regra foi: **a equipe decide, a IA executa e testa, a equipe joga e aprova.**

| Ferramenta | Para quê |
| --- | --- |
| **Claude Code** (agente de programação) | Escreveu e testou o código seguindo um arquivo de regras do projeto (`PROJETO.md`): uma tarefa por vez, versão do Babylon fixada, pontos de parada para decisão humana |
| **ElevenLabs** | As **124 falas** do jogo, com mais de 10 vozes (professor, colega, alunos e seguranças), e a trilha sonora com os efeitos de tensão |
| **Mixamo** (Adobe) | Personagens com esqueleto automático e animações de captura de movimento |
| **Blender via MCP** (a IA controlando o Blender) | Modelagem da lanterna e das estantes, testes de personagem e conversão das animações para o formato do jogo |
| **IA no design** | Apoio no GDD, na história, no roteiro das falas e no ajuste de dificuldade |
| **Testes automáticos e bot** | Navegador automático que joga as fases, mede tempo e confirma que nada quebrou |

---

## 4. Como desenvolvemos

### Antes de programar: dois documentos

| Documento | Pergunta que responde | Exemplo do que tem lá |
| --- | --- | --- |
| **GDD** (design do jogo) | *O que* é o jogo? | História, as 4 ações do jogador, duração máxima, o que cortar se faltar tempo |
| **PROJETO.md** (regras para a IA) | *Como* a IA deve trabalhar? | Uma tarefa por vez · versão do Babylon fixada · nada de texto na tela · todo asset entra na tabela de licenças · quando parar e perguntar |

### O ciclo de cada tarefa

| Passo | Quem faz | O que acontece |
| :-: | --- | --- |
| **1. Pedir** | Equipe | Uma tarefa só, por exemplo: "o personagem empurra uma caixa" |
| **2. Implementar** | IA | Escreve o código seguindo o GDD e as regras |
| **3. Testar sozinha** | IA | Compila, roda os testes automáticos, abre o jogo num navegador automático, lê os erros e tira capturas de tela |
| **4. Jogar e decidir** | Equipe | Playtest: aprova, pede ajuste ou muda o design |
| **5. Registrar** | IA | Commit no Git e atualização do estado do projeto no `PROJETO.md` |

**Exemplo real, o empurrar:** a primeira versão funcionou, mas no playtest a caixa parecia leve demais. Pedimos um empurrão mais lento e pesado (velocidade máxima de 1,2 m/s e mais atrito), depois a animação tremia e foi estabilizada, e por fim trocamos por uma animação melhor do Mixamo. Só então seguimos para o deslizar.

### As etapas

| Etapa | Foco | O que ficou pronto |
| --- | --- | --- |
| **1** | **Base técnica** | Documentos, prova de pipeline (um cubo anda, pula e empurra com física a 60 fps), personagem do Mixamo animado, leitura de controle |
| **2** | **Jogabilidade** | Deslizar, câmera, morte e checkpoints, as cinco áreas montadas em blocos simples, seguranças, relógio da chamada, menu, sons e o visual noturno. No fim da etapa, a história foi reescrita para ficar mais realista |
| **3** | **Acabamento** | Cenário com modelos prontos, 124 vozes e a trilha do ElevenLabs, a ligação do colega na tela, mãos que seguram os objetos de verdade e playtests de cada área |

**Princípios que guiaram tudo:** jogabilidade antes da arte · uma coisa de cada vez · nada é "pronto" sem alguém jogar · escopo fechado, com uma lista do que cortar primeiro.

**Em números:** ~15 mil linhas de TypeScript · 6 áreas · 124 falas.

---

<sub>Feito por João Leal, Murilo Schettino, Gustavo Lopes e Eduardo Millione · Desenvolvimento de Jogos Digitais · [README completo](README.md)</sub>
