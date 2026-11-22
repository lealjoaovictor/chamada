# Chamada: GDD enxuto

Versão 2 · Nov 22, 2026 (meta de duração revista para 8 a 10 minutos; congelamento de features adiado para perto da entrega)

## Visão geral

Chamada é um jogo de plataforma e puzzle 2.5D de 8 a 10 minutos em que um aluno atravessa uma universidade vazia e sombria para chegar à sala antes que o alto-falante chame o nome dele.

- **Gênero:** plataforma e puzzle 2.5D (mundo 3D, câmera lateral), um jogador.
- **Plataforma:** navegador, rodando localmente, com Babylon.js. Teclado ou controle conectado ao computador.
- **Duração:** de 8 a 10 minutos numa primeira partida; a chamada dura cerca de 10min50 (a calibrar nos testes com a telemetria).
- **Referências:** INSIDE (mundo sem palavras, clima, perseguição) e SpeedRunners (pressão que empurra o jogador para frente, movimento fluido).

Pilares:

1. **A pressão é sonora.** O relógio é a voz da chamada, sem barra de tempo na tela.
2. **Mundo sem palavras.** Sem diálogo e sem texto no jogo, fora do menu.
3. **Morte barata.** Reinício imediato no último checkpoint.
4. **Clima antes de quantidade.** Poucas áreas, bem acabadas.

## Jogador e controles

O jogador tem só quatro ações, e qualquer outra só entra se sobrar tempo.

| Ação | Teclado | Controle |
| --- | --- | --- |
| Andar | A / D ou setas | Analógico esquerdo ou direcional |
| Pular | Espaço | Botão inferior (A no Xbox, X no PlayStation) |
| Deslizar | S ou seta para baixo + direção | Analógico para baixo + direção |
| Empurrar caixa | Andar contra a caixa | Andar contra a caixa |

A velocidade é única e moderada, sem botão de correr, com aceleração e frenagem curtas. O deslizar passa por baixo de obstáculos baixos (catraca, mesa, grade) e mantém a inércia por um instante.

Para o movimento ficar bom, a IA deve implementar estes ajustes desde o protótipo, com valores iniciais a calibrar nos testes:

- **Coyote time:** cerca de 0,1 s para ainda pular depois de sair da borda.
- **Buffer de pulo:** cerca de 0,1 s para guardar o botão apertado um pouco antes de pousar.
- **Pulo previsível:** altura fixa, sem controle aéreo exagerado.

O personagem é um boneco neutro do Mixamo, escurecido e sem rosto, com animações de andar, pular, empurrar e deslizar.

## A chamada

O relógio do jogo é a chamada, de cerca de 10min50, que termina com o nome do jogador. O tempo de jogo é o cronômetro e decide qual nome está sendo lido; a lista fica em `src/levels/chamada.ts`.

- **Sem barra de tempo.** O jogador só sabe quanto falta pelo ponto da lista de nomes.
- **Conteúdo:** nomes fictícios em ordem alfabética, com voz de alto-falante (ElevenLabs, com filtro de rádio). O nome do jogador é o último.
- **Distância sonora:** nas áreas 1 e 2 a voz chega abafada e distante; na área 5 está próxima e alta (volume e filtro mudam por área).
- **Morrer não reinicia o relógio.** O reinício é instantâneo no último checkpoint (início de cada área), e cada morte custa só alguns segundos.
- **Respostas:** depois de cada nome, alguém responde "presente" ao longe ou há silêncio. No começo quase todos respondem; no fim, quase ninguém (a sala vai ficando vazia).
- **Calibragem:** a fase leva de 8 a 10 minutos numa primeira partida, e quem joga bem chega com cerca de 2 minutos de folga.

Finais:

| Condição | O que acontece |
| --- | --- |
| Chega à porta da sala antes do último nome | Final bom, ambíguo: sala vazia, o professor chama o nome do jogador e a tela corta para preto. |
| O nome é chamado antes da chegada | Final ruim: silêncio, a tela escurece e o jogo oferece reiniciar. |

## O Vigia

O Vigia é o único inimigo: uma silhueta humana com lanterna, sem rosto, com comportamento simples e sem busca de caminho.

| Área | Comportamento | Regra |
| --- | --- | --- |
| 3 (biblioteca) | Patrulha em linha reta entre dois pontos, com cone de luz da lanterna. | Entrar no cone de luz é morte. O jogador passa quando o Vigia está de costas ou se mantém atrás de estantes, fora do cone. |
| 4 (subsolo) | Persegue por um corredor longo, como os cães do INSIDE, em velocidade elástica: acelera quando o jogador abre distância e alivia quando ele erra, para a tensão não sumir. | Ser tocado é morte. Duas perseguições com obstáculos em ritmo irregular (deslizar e pular), separadas por um depósito com caixa e placa. |

É um único modelo reaproveitado nas duas áreas. O cone de luz é uma luz do tipo spot mais uma checagem geométrica simples.

## As cinco áreas

A fase tem cinco áreas em sequência, cada uma com uma ideia principal; o checkpoint fica no início de cada uma.

| # | Área | Ação principal | Puzzle ou perigo | Clima |
| --- | --- | --- | --- | --- |
| 1 | Pátio externo (noite, névoa) | Andar, pular, empurrar | Primeira caixa para alcançar o portão lateral, já que o principal está fechado; na garagem, caixote que cai sobre a placa; na guarita, primeiro encontro com o Vigia | Ensina sem tutorial; primeiros nomes ao longe |
| 2 | Corredor do bloco principal | Deslizar | Catraca baixa; placa de pressão que abre uma porta quando uma caixa é empurrada sobre ela; zeladoria com palco alto; sala escura com vãos no piso | Luzes falhando |
| 3 | Biblioteca e escadas | Todas | Elevador ou plataforma com botão; Vigia patrulhando com lanterna; o personagem anda agachado entre as estantes | Furtividade |
| 4 | Subsolo ou laboratório | Pular e deslizar | Duas perseguições elásticas (o Vigia acelera se o jogador abre distância) com obstáculos em ritmo irregular; depósito com caixa e placa entre elas | Pico de tensão |
| 5 | Corredor final e sala de aula | Andar | Porta final; alto-falante muito próximo | Silêncio e o nome chegando |

A dificuldade sobe em degraus: a área 1 só ensina, a 2 combina caixa e deslizar, a 3 junta puzzle e inimigo, a 4 é puro movimento sob pressão e a 5 é só tensão.

## Direção de arte e câmera

O visual vem da atmosfera, não da quantidade de detalhe: formas simples, escuridão, névoa e poucas luzes unificam assets de origens diferentes.

- **Câmera:** lateral, seguindo o jogador de forma suave no eixo horizontal. O mundo é 3D, mas o jogador fica travado num plano 2D.
- **Cenário:** pacotes low-poly 3D gratuitos de interiores e móveis (Kenney, Quaternius, Poly Pizza). A licença de cada item é anotada ao baixar.
- **Personagem:** boneco neutro do Mixamo, escurecido e sem rosto.
- **Modelos gerados por IA:** só para props estáticos pequenos; não para personagem.
- **Coesão:** materiais escuros e simples, névoa forte, grão, vinheta e cores dessaturadas. As lâmpadas amareladas e a lanterna do Vigia são os únicos pontos quentes, contra um fundo frio.

## Direção de áudio

O som carrega metade do clima, e o ElevenLabs gera quase tudo.

- **Voz da chamada:** text-to-speech com filtro de alto-falante (passa-banda, leve distorção, reverb de corredor). É a faixa que serve de relógio.
- **Efeitos:** passos em corredor vazio, caixa arrastada, porta metálica, catraca, lâmpada falhando, estática, ventilação, passos pesados do Vigia.
- **Ambiente e música:** um drone sombrio contínuo e a tensão crescendo na perseguição. O silêncio é um recurso, principalmente na área 5.
- **Formato:** OGG ou MP3 comprimido, com nomes padronizados (`sfx_porta_metal.ogg`, `voz_chamada_01.ogg`).
- **Licenças:** registrar o plano do ElevenLabs usado e seus termos de uso na tabela de licenças.

## Escopo, cronograma e ordem de corte

Sete dias, uma pessoa com IA, e a semana termina com uma fase curta e polida em vez de um jogo grande e incompleto.

&#91;embedded content: cronograma · 7 dias, 3 marcos\]

O protótipo precisa estar pronto ao fim do dia 1, as features congeladas ao fim do dia 5, e o dia 7 só corrige e entrega.

**Dentro do escopo:** 5 áreas, 4 ações do jogador, 1 inimigo (o Vigia), relógio sonoro, 2 finais, menu, tela de morte e tela final.

**Fora do escopo:** mundo maior, mais inimigos, narrativa em texto, geração procedural, escalada e gancho.

Se o tempo apertar, corta-se nesta ordem:

1. Plataforma móvel da área 3, que vira só puzzle de caixa.
2. Patrulha do Vigia na área 3, que vira puzzle puro.
3. Final ruim separado, que vira só um reinício.

Nunca se cortam: a perseguição, os puzzles de caixa, a atmosfera visual e o relógio sonoro.

## Plano de testes e critérios de pronto

O jogo está pronto quando uma pessoa de fora consegue jogá-lo do menu ao final, sem ajuda e sem travar.

- [ ] Todos os controles funcionam no teclado e no controle.
- [ ] Toda morte reinicia no checkpoint em menos de 1 segundo.
- [ ] Cada área foi completada 3 vezes seguidas sem bug.
- [ ] A primeira partida leva de 8 a 10 minutos, e a folga até o fim da chamada (cerca de 10min50) é suficiente.
- [ ] Os finais bom e ruim funcionam, e o jogo reinicia depois de ambos.
- [ ] A voz da chamada acompanha o tempo real e o nome final chega na hora certa.
- [ ] Roda a pelo menos 30 quadros por segundo no computador da apresentação.
- [ ] Pelo menos duas pessoas de fora jogaram uma vez, sem ajuda, a partir do dia 6, com anotações de onde morreram demais ou se perderam.
- [ ] A tabela de licenças cobre todos os assets e áudios.

Marcos de controle: **protótipo pronto** ao fim do dia 1, **congelamento de features** ao fim do dia 5 e **versão final** ao fim do dia 7.
