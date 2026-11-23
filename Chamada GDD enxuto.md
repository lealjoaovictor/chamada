# Chamada: GDD enxuto

Versão 3.1 · Nov 23, 2026 (v3 de 22/11: faculdade noturna realista, chamada ouvida por uma ligação do colega, seguranças no lugar do Vigia; corredor em laço e vultos removidos. v3.1: uma ordem de corte só, congelamento em 24/11, vozes no ElevenLabs, legenda do nome lido, modelos do final e plano B da apresentação)

## Visão geral

Chamada é um jogo de plataforma e puzzle 2.5D de no máximo 8 minutos em que um aluno atravessa à noite uma faculdade que está fechando para chegar à sala antes que o professor leia o nome dele na chamada.

- **Gênero:** plataforma e puzzle 2.5D (mundo 3D, câmera lateral), um jogador.
- **Plataforma:** navegador, rodando localmente no MacBook Air (M1) da apresentação, com Babylon.js. Teclado ou controle conectado ao computador. Decisão de 2026-11-23: o alvo é o computador; o celular deixou de ser plataforma.
- **Duração:** no máximo 8 minutos (decisão de 2026-11-22). O relógio termina em 7min50; a primeira partida deve levar de 5 a 6 minutos, com cerca de 2 minutos de folga para quem joga bem (a calibrar nos testes com a telemetria).
- **Referências:** INSIDE (clima, perseguição, narrativa pelo cenário) e SpeedRunners (pressão que empurra o jogador para frente, movimento fluido).

Pilares:

1. **A pressão é sonora.** O relógio é a chamada, ouvida por uma ligação aberta no celular, sem barra de tempo na tela.
2. **Sem texto de interface; as palavras vêm só do som.** Nada de diálogo escrito, HUD ou tutorial em texto. As palavras são as falas curtas do colega na ligação (com legenda curta na tela da ligação), os nomes lidos pelo professor, frases curtas dos seguranças e conversa de fundo dos alunos saindo.
3. **Morte barata.** Reinício imediato no último checkpoint.
4. **Realismo antes de sobrenatural.** Uma faculdade noturna brasileira de verdade. Nada no jogo é irreal; a tensão vem do horário, do prédio fechando e dos seguranças.

## História

**Premissa.** Zacarias Vieira trabalha de dia e estuda à noite. Hoje ele se atrasou e perdeu a aula inteira. Está no limite de faltas, e o professor faz a chamada no fim da aula, em ordem alfabética. Se ele chegar à sala antes de o nome dele ser lido, ganha a presença.

**Abertura.** Zacarias chega ao portão principal, já trancado. O celular vibra: é um colega da turma, que liga e sussurra algo como "Começou a chamada! Sorte sua que você é o último, Zacarias. Nem dá pra responder por você, ele tá olhando um por um. Corre!". O colega deixa a ligação aberta. Essa fala ensina tudo: o que está acontecendo, o nome do jogador, que ele é o último e por que ninguém pode responder por ele.

**O mundo.** O prédio está fechando: portões trancados, corredores sendo apagados, seguranças fazendo a ronda. O caminho normal está sempre fechado, e por isso Zacarias corta por onde não deveria (lateral do pátio, garagem, zeladoria, biblioteca, subsolo). Cada área começa com uma passagem "óbvia" trancada.

**Os colegas saindo.** Quem já respondeu "presente" vai embora. Nas áreas 1 e 2, Zacarias cruza com alunos de verdade (sólidos, sem rosto, num tom diferente do dele, sem lanterna) indo para a saída na direção contrária, sem dar atenção a ele. Quanto mais a chamada anda, mais gente passa. Eles não somem: saem do quadro. Não falam com ele; nas áreas 1 e 2 se ouvem fragmentos baixos de conversa entre eles ("finalmente...", "amanhã tem prova?", uma risada), só quando o colega não está falando.

**Tom.** Tensão realista, não terror. Pressa, horário, prédio apagando. O fim é caloroso: alguém ficou esperando.

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

O relógio do jogo dura 7min50 e tem duas partes. O tempo de jogo é o cronômetro e decide o que está tocando; a lista fica em `src/levels/chamada.ts` (a refazer com a tabela do roteiro da voz).

- **Fim da aula (0:00 a 1:45).** A chamada ainda não começou. Pela ligação, o professor fala da prova (com "quem tá no limite de faltas, atenção") e passa o trabalho. Termina com "Bom, pessoal, vamos fazer a chamada. Quem eu chamar já pode ir.", que explica os colegas saindo.
- **A chamada (1:45 a 7:50).** Uma turma real: 48 colegas em ordem alfabética e o Zacarias por último. Cerca de 5,5 s por nome; nas 8 faltas o professor repete o nome e diz "Falta." Três interrupções curtas (bronca de "silêncio aí no fundo", aviso da coordenação, pergunta de uma aluna sobre a prova) dão respiro, e o colega comenta cada uma ("Parou pra dar um aviso, aproveita!").

- **Sem barra de tempo.** O jogador sabe quanto falta pela letra em que a chamada está.
- **Como se ouve:** pela ligação aberta do colega. A voz do professor chega ao fundo, abafada pelo celular, com os "presente" dos alunos (ou silêncio, quando alguém faltou: faltas comuns, espalhadas pela lista, sem a regra de "quase ninguém responde no fim").
- **Falas do colega:** 13 falas sussurradas, em instantes fixos do relógio, que dizem em que ponto a aula e a chamada estão, comentam as interrupções e ficam mais nervosas ("Ele tá passando o trabalho, ainda dá", "Começou a chamada!", "Tá no M, mano", "Tá no S! Corre!", "Ele tá no V..."). Cada fala tem legenda curta na tela da ligação, para quem joga sem som.
- **Legenda do nome lido (acessibilidade):** a tela da ligação mostra, em letra pequena, o nome que o professor está lendo (e "presente" ou "Falta."). Assim quem joga sem som também sabe em que letra está a chamada. Não é barra de tempo: só repete o que se ouve (equivalente visual para som importante, como pedem as diretrizes de acessibilidade).
- **Sinal por área:** limpo nas áreas 1 a 3; no subsolo (área 4) a ligação picota e quase some, e o jogador perde o relógio na perseguição; na área 5 o sinal volta e entra a voz real do professor, sem filtro, vindo do fim do corredor, enquanto a do celular baixa.
- **Morrer ou ser pego não reinicia o relógio.** O reinício é instantâneo no último checkpoint (início de cada área), e cada falha custa só alguns segundos.
- **Calibragem:** a fase leva de 5 a 6 minutos numa primeira partida, e quem joga bem chega com cerca de 2 minutos de folga. Esta é a única ordem de corte do jogo. Se a primeira partida passar de 6 minutos nos dois primeiros playtests, corta-se nesta ordem: (1) a segunda perseguição da área 4 e o depósito entre as perseguições; (2) a sala escura da área 2; (3) a garagem da área 1.

Finais:

| Condição | O que acontece |
| --- | --- |
| Chega à porta da sala antes do último nome | Final bom: a sala está vazia, menos o professor e o colega, que ficou esperando com o celular na mão. O professor ergue os olhos, vê alguém na porta e chama "Zacarias Vieira" fora da ordem (a lista não precisa chegar ao Z). O jogador aperta qualquer botão e Zacarias responde "presente". Corte para preto. Se ele não apertar em cerca de 4 s, corta em silêncio. Modelos: os mesmos bonecos do Mixamo já usados (Y Bot e X Bot), sem rosto e num tom diferente do Zacarias e dos seguranças; o professor fica em pé na mesa, numa animação parada segurando a lista, e o colega fica sentado numa carteira com o celular na mão. Nenhum processo novo de modelagem. |
| O nome é chamado antes da chegada | Final ruim: pela ligação, o nome, um silêncio, o colega dizendo baixinho "...ele chamou" e o som da caneta marcando a falta. A tela escurece e o jogo oferece reiniciar. |

## Os seguranças

Os seguranças são o único perigo humano: silhuetas sem rosto, uniformizadas, com lanterna, comportamento simples e sem busca de caminho. Eles não deixam ninguém entrar depois do horário. **Ser pego não é morrer:** é ser levado para fora. A tela escurece e o jogador volta ao último checkpoint. Devem parecer bravos, não violentos.

**Falas dos seguranças** (ao vivo, sem filtro de telefone, voz grave e cansada). Servem de aviso para o jogador, além da lanterna:

- **Desconfiança**, quando começa a ver o jogador: "Ei? Tem alguém aí?", "Quem tá aí?", "Hm?".
- **Barulho**, quando vai investigar (carrinho da biblioteca): "Que foi isso?", "Ué...".
- **Pego**: "Já fechou, rapaz. Pra fora.", "Acabou o horário!", "Opa, opa. Aqui não.".

Cada tipo tem 3 variações sorteadas, sem repetir a anterior, e às vezes nenhuma fala, para não cansar quem é pego várias vezes.

| Área | Comportamento | Regra |
| --- | --- | --- |
| 1 (guarita) | Segurança na guarita, primeiro encontro. | Ser visto é ser pego. Vans e a guarita servem de cobertura. |
| 2 (corredor) | Segurança fazendo a ronda num recuo do corredor, que já apagou metade das luzes (decisão de 2026-11-23, para alongar a fase). | Ser visto é ser pego, e ele reage rápido: quem passa correndo na frente dele é pego. Dois pilares servem de cobertura. |
| 3 (biblioteca) | Ronda em linha reta entre dois pontos, com cone de luz da lanterna; na sala de leitura, um de guarda que vai ver de onde veio o barulho; no acervo, dois em rondas que se cruzam. | Ficar no cone é ser pego. O jogador passa quando o segurança está de costas ou atrás das estantes. |
| 4 (subsolo) | Um segurança corre atrás do jogador por um corredor longo, em velocidade elástica: acelera quando o jogador abre distância e alivia quando ele erra. | Ser alcançado é ser pego. Duas perseguições com obstáculos em ritmo irregular, separadas por um depósito com sensor e valeta. |

É um único modelo reaproveitado. O cone de luz é uma luz do tipo spot mais uma checagem geométrica simples.

## As cinco áreas

A fase tem cinco áreas em sequência, cada uma com uma ideia principal; o checkpoint fica no início de cada uma. Os puzzles são Zacarias se virando num prédio fechado: "placa de pressão" aparece como sensor de portão automático (garagem e depósito) ou como algo físico (na zeladoria, a caixa trava uma porta que fecha sozinha).

| # | Área | Ação principal | Puzzle ou perigo | História |
| --- | --- | --- | --- | --- |
| 1 | Pátio e garagem (noite, névoa) | Andar, pular, empurrar | Portão principal trancado: lixeira empurrada até o muro para pular pela lateral; na garagem, caixote que cai sobre o sensor do portão; na guarita, o primeiro segurança | A ligação começa; primeiros colegas saindo |
| 2 | Corredor do bloco principal | Deslizar | Catraca baixa; segurança apagando o corredor (pilares como cobertura); zeladoria com palco alto e caixa que trava a porta; sala escura com vãos no piso | Luzes sendo desligadas; mais colegas saindo |
| 3 | Biblioteca e escadas | Todas | Elevador com botão; seguranças com lanterna; agachado entre as estantes; na sala de leitura, derrubar um carrinho faz barulho e tira o segurança do lugar; no acervo (piso rebaixado), dois seguranças em rondas que se cruzam e um carrinho no patamar que serve de isca | Furtividade; colega cada vez mais nervoso |
| 4 | Subsolo | Pular e deslizar | Duas perseguições elásticas com obstáculos em ritmo irregular; entre elas, um depósito em dois passos: um objeto vai para a valeta aberta no piso e vira ponte, e o outro passa por cima até o sensor do portão | Pico de tensão; a ligação picota |
| 5 | Corredor final e sala de aula | Andar | Corredor longo, sem repetição, com as luzes apagando; porta da sala | A voz real do professor chegando; o final |

A dificuldade sobe em degraus: a área 1 só ensina, a 2 combina caixa e deslizar, a 3 junta puzzle e segurança, a 4 é puro movimento sob pressão e a 5 é só tensão.

**Removido nesta versão:** vultos translúcidos que somem, corredor que se repete, alto-falante pelo prédio, Vigia que mata e a regra de "quase ninguém responde no fim".
## Direção de arte e câmera

O visual vem da atmosfera, não da quantidade de detalhe: formas simples, escuridão, névoa e poucas luzes unificam assets de origens diferentes.

- **Câmera:** lateral, seguindo o jogador de forma suave no eixo horizontal. O mundo é 3D, mas o jogador fica travado num plano 2D.
- **Cenário:** modelos e texturas CC0 do Poly Haven, mais as estantes modeladas no Blender pelo projeto. A licença de cada item é anotada ao baixar.
- **Personagem:** boneco neutro do Mixamo, escurecido e sem rosto.
- **Modelos gerados por IA:** só para props estáticos pequenos; não para personagem.
- **Coesão:** materiais escuros e simples, névoa, grão, vinheta e cores dessaturadas. Paleta de faculdade noturna real: amarelo de sódio nos postes, fluorescente frio nos corredores, e o prédio apagando área por área. O último lugar quente é a sala de aula. A lanterna dos seguranças é branca e fria, para não competir com a sala.

## Direção de áudio

O som carrega metade do clima. **Decisão (2026-11-23): todas as vozes são geradas no ElevenLabs** (professor, colega, seguranças, alunos e o "presente" do Zacarias), porque dá para regravar uma fala em minutos se o tempo da chamada mudar e as vozes ficam consistentes.

- **Voz da chamada:** text-to-speech gravado limpo. O jogo aplica o filtro de telefone (faixa de 300 a 3.400 Hz, compressão e leve distorção). Dentro da ligação há dois planos: o colega perto do microfone, sussurrado e seco, e o professor ao fundo, mais baixo, com eco de sala. No subsolo, picotes e chiado; na área 5, a voz real do professor sem filtro. É a faixa que serve de relógio.
- **Falas do colega:** 13 falas sussurradas (ElevenLabs v3 com marcação de sussurro), mais "...ele chamou" do final ruim e o "presente" do Zacarias no final bom.
- **Seguranças e alunos:** cerca de 10 falas curtas dos seguranças e 4 ou 5 fragmentos de conversa de alunos (ver "Os seguranças" e "História"). A conversa dos alunos e as falas dos seguranças baixam o volume (ducking) quando o colega fala.
- **Efeitos:** passos em corredor vazio, caixa arrastada, porta metálica, catraca, lâmpada falhando, estática, ventilação, passos pesados dos seguranças, vibração do celular, caneta riscando a lista.
- **Ambiente e música:** um drone sombrio contínuo e a tensão crescendo na perseguição. O silêncio é um recurso, principalmente na área 5.
- **Formato:** OGG ou MP3 comprimido, com nomes padronizados (`sfx_porta_metal.ogg`, `voz_chamada_01.ogg`).
- **Licenças:** conferir se o plano do ElevenLabs usado exige crédito e permite este uso, e registrar o plano, a data de geração e os termos na tabela de licenças (e nos créditos, se exigir).

## Escopo, cronograma e ordem de corte

Prazo curto e equipe pequena com IA: melhor uma fase curta e polida do que um jogo grande e incompleto.

**Congelamento (decisão de 2026-11-23):** features congeladas na noite de 24/11; o dia 25/11 é só para corrigir bugs e entregar.

**Mínimo da v3 (entra de qualquer jeito):** relógio novo pela ligação do colega, seguranças no lugar do Vigia e os dois finais. A conversa de fundo dos alunos e o sinal picotando no subsolo são os primeiros a sair se faltar tempo.

**Dentro do escopo:** 5 áreas, 4 ações do jogador, 1 perigo humano (os seguranças), relógio sonoro pela ligação do colega, 2 finais, menu, tela de morte e tela final.

**Fora do escopo:** mundo maior, mais inimigos, narrativa em texto além das falas curtas do colega, geração procedural, escalada e gancho.

Se o tempo de jogo apertar, vale a ordem de corte única da seção "A chamada" (calibragem): segunda perseguição e depósito da área 4, sala escura da área 2, garagem da área 1.

Nunca se cortam: a perseguição, os puzzles de caixa, a atmosfera visual e o relógio sonoro.

## Plano de testes e critérios de pronto

O jogo está pronto quando uma pessoa de fora consegue jogá-lo do menu ao final, sem ajuda e sem travar.

- [ ] Todos os controles funcionam no teclado e num controle real (até agora só testado com controle simulado).
- [ ] Toda morte reinicia no checkpoint em menos de 1 segundo.
- [ ] Cada área foi completada 3 vezes seguidas sem bug.
- [ ] A primeira partida leva de 5 a 6 minutos, e a folga até o fim da chamada (7min50) é suficiente.
- [ ] Os finais bom e ruim funcionam, e o jogo reinicia depois de ambos.
- [ ] A voz da chamada acompanha o tempo real e o nome final chega na hora certa.
- [ ] Roda a 60 quadros por segundo estáveis no Mac da apresentação.
- [ ] Plano B: vídeo de uma partida completa gravado na véspera da apresentação (23 ou 24/11).
- [ ] Pelo menos duas pessoas de fora jogaram uma vez, sem ajuda, na reta final, com anotações de onde morreram demais ou se perderam.
- [ ] A tabela de licenças cobre todos os assets e áudios.

Marcos de controle: **protótipo pronto** (feito em 21/11), **congelamento de features** na noite de 24/11 e **versão final** em 25/11.
