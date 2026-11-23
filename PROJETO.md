# PROJETO: Chamada

Arquivo de contexto para qualquer IA que trabalhe neste projeto. **Leia tudo antes de escrever código.** Atualize a seção "Estado atual" ao fim de cada tarefa.

## 1. O que é

**Chamada** é um jogo de plataforma e puzzle 2.5D (mundo 3D, câmera lateral, jogabilidade num plano 2D) feito com **Babylon.js**, de no máximo 8 minutos (meta revista em 2026-11-22). Um aluno de faculdade noturna (Zacarias Vieira) atravessa um prédio que está fechando para chegar à sala antes que o professor leia o nome dele na chamada. O relógio é a chamada, ouvida por uma ligação aberta de um colega, sem barra de tempo. História validada em 2026-11-22: ver seção "História" do GDD (versão 3).

Referências: INSIDE (clima, mundo sem palavras, perseguição) e SpeedRunners (pressão que empurra para frente, movimento fluido).

O design completo está no **GDD** ("Chamada: GDD enxuto"). Em caso de dúvida de design, o GDD vale mais que este arquivo. Em caso de dúvida técnica, vale este arquivo.

## 2. Regras de ouro para a IA

1. **Uma tarefa por vez.** Não implemente nada fora do que foi pedido.
2. **Escopo fechado.** Quatro ações do jogador (andar, pular, deslizar, empurrar caixa), um perigo humano (os seguranças; no código ainda se chama `Vigia`), cinco áreas. Não adicione mecânicas, menus extras nem sistemas novos sem pedido.
3. **Use só a API da versão fixada** na seção 3. Em caso de dúvida, consulte a documentação oficial (doc.babylonjs.com) e o Playground da mesma versão antes de escrever. Não misture API antiga com nova. Não invente métodos.
4. **Não reescreva arquivos inteiros** para mudar pouco. Altere o mínimo e diga o que mudou.
5. **Dados separados do código.** Posições, textos e parâmetros de fase ficam em arquivos de dados (`src/levels/`), não espalhados na lógica.
6. **Nada de texto na tela** além do menu, "pressione qualquer botão" e a tela final.
7. **Todo asset novo** entra na tabela de licenças (seção 9) no mesmo momento.
8. Ao terminar, diga como testar (o que rodar e o que deve acontecer).

## 2.1 Autonomia e pontos de parada

Você (a IA) deve **rodar e testar o que for possível por conta própria**, e só chamar o humano nos pontos abaixo.

**Faça sem perguntar:**
- Instalar dependências, rodar `npm run dev` e `npm run build`, e corrigir erros de compilação.
- Abrir o jogo num navegador controlado por ferramenta (por exemplo Playwright), ler o console, tirar capturas de tela e confirmar que a cena carrega sem erro.
- Escrever e rodar testes automáticos para a lógica (placa de pressão abre a porta, checkpoint reinicia, o relógio da chamada não reinicia ao morrer, etc.).
- Refatorações pequenas e correção de bugs dentro da tarefa pedida.
- Marcar na seção 7 o que foi concluído.

**Pare e pergunte antes de:**
- Mudar o design, o escopo ou a ordem de corte do GDD.
- Trocar de biblioteca ou de versão (principalmente Babylon.js e Havok).
- Adicionar ou remover uma mecânica, uma área ou um inimigo.
- Qualquer escolha que mude como o jogo **parece** ou **se sente** (visual, som, dificuldade, ritmo).

**Peça playtest humano** ao concluir cada mecânica ou área. Diga exatamente:
1. como rodar;
2. o que testar (ações e trechos específicos);
3. quais parâmetros podem ser ajustados e onde estão (velocidade, altura do pulo, coyote time, buffer de pulo, velocidade do Vigia, volume por área).

Só siga para a próxima tarefa depois da resposta do humano.

**Antes de pedir playtest ou dizer que terminou**, confirme que `npm run build` passa e que não há erros no console do navegador. Se não conseguir testar algo sozinho (movimento, visual, som, controle físico, desempenho no computador final), diga isso de forma explícita em vez de afirmar que funciona.

## 2.2 Trabalho remoto

O humano pode estar longe do computador, acompanhando e dando ordens pelo celular. O computador fica ligado e a IA trabalha sozinha entre as mensagens.

**Regras:**
1. **Trabalhe em blocos grandes.** Uma área inteira ou uma mecânica completa por vez, não ajustes miúdos. Só pare antes do fim do bloco nos pontos de parada da seção 2.1.
2. **Relatório ao fim de cada bloco**, curto e legível no celular:
   - o que foi feito (2 a 4 linhas);
   - capturas de tela da cena, se for visual;
   - o que o humano precisa testar e como;
   - qual é o próximo bloco;
   - se há decisão pendente, a pergunta e **duas ou três opções** com uma recomendação.
3. **Escopo de arquivos:** trabalhe só dentro da pasta do projeto. Não altere nem apague nada fora dela. Para apagar algo, mova para `_to_delete/` e avise.
4. **Sem ações irreversíveis** sem confirmação: apagar pastas, trocar de versão do Babylon.js, publicar online, instalar programas no computador.
5. **Se ficar travado** (erro que não resolve em 2 a 3 tentativas, dependência que falha, asset que falta), pare, descreva o problema e diga o que precisa. Não repita a mesma tentativa em loop.
6. **Ao terminar um bloco, deixe o jogo acessível** para o humano testar sem estar no computador (seção 10.1).

## 3. Stack e versões

| Item | Versão |
| --- | --- |
| Node.js | LTS atual (anotado: 24.14.0, npm 11.9.0) |
| Vite | 8.3.8 |
| TypeScript | 7.0.2 |
| `@babylonjs/core` | **9.37.1** (instalada em 2026-11-21) |
| `@babylonjs/loaders` | 9.37.1 |
| `@babylonjs/havok` | 1.3.14 |
| `@babylonjs/inspector` | 9.37.1 (só em desenvolvimento) |

**No dia 1:** rode `npm view @babylonjs/core version`, instale exatamente essa versão (sem `^`, em `package.json`) e escreva-a na tabela acima. Todos os pacotes `@babylonjs/*` precisam ter a **mesma versão**. Nunca atualize no meio do projeto.

Atenção: a IA tende a conhecer melhor as versões 6 a 8 do Babylon. Se a versão fixada for mais nova, confirme na documentação qualquer método que gere dúvida, principalmente física (Havok) e pipeline de renderização.

## 4. Estrutura de pastas

```
chamada/
  PROJETO.md
  iniciar.bat             (sobe o jogo local e abre o navegador)
  index.html
  package.json
  vite.config.ts
  public/
    models/               (GLB: personagem, cenário, props)
    audio/                (OGG ou MP3)
    textures/
  src/
    main.ts               (cria engine, carrega o jogo)
    game/
      Game.ts             (estados: menu, jogando, morto, final)
      Input.ts            (teclado + controle, uma interface só)
      Player.ts           (movimento, animação, empurrar, deslizar)
      CameraRig.ts        (câmera lateral suave)
      Physics.ts          (Havok, grupos de colisão)
      Checkpoints.ts
      CallClock.ts        (a chamada: áudio = relógio)
      PostFX.ts           (névoa, grão, vinheta, cor)
      entities/
        Box.ts
        PressurePlate.ts
        Door.ts
        Elevator.ts
        Vigia.ts
    levels/
      area1.ts ... area5.ts   (dados: posições, caixas, portas, luzes)
    ui/
      Menu.ts
      EndScreen.ts
```

## 5. Convenções de código

- TypeScript, módulos ES, uma classe por arquivo.
- Imports **por caminho** (`@babylonjs/core/...`) para o build ficar leve.
- Nada de variáveis globais; o estado vive em `Game`.
- **Entrada abstrata:** o jogo só lê ações (`left`, `right`, `jump`, `slide`), nunca teclas direto. `Input.ts` mapeia teclado e controle para essas ações. O controle só é detectado depois do primeiro botão apertado.
- **Plano 2D:** o jogador e as caixas ficam travados no eixo Z (movimento só em X e Y).
- **Movimento:** velocidade única, aceleração e frenagem curtas, *coyote time* (~0,1 s) e *buffer de pulo* (~0,1 s). Valores em constantes no topo de `Player.ts`, fáceis de ajustar. Se a versão fixada tiver o controlador de personagem do Havok, use-o; caso contrário, um controlador cinemático próprio.
- **Morte:** fade curto (~0,5 s) e reposicionamento no último checkpoint. O relógio da chamada **não reinicia**.
- **Relógio:** `CallClock.ts` usa o tempo de jogo (`CallSchedule.ts` diz em que instante cada fala toca; roteiro em `src/levels/chamada.ts`). Tudo chega pela ligação do colega, com filtro de telefone. As vozes são arquivos de `public/audio/vozes/` (lista em `manifest.json`, id = nome do arquivo); sem o arquivo, a voz sintetizada do navegador. O sinal picota no subsolo e a voz real do professor aparece na área 5.
- Use o **Inspector** do Babylon para depurar. Ele fica fora do build final.

## 6. Arquitetura resumida

- `Game` controla os estados e o laço principal.
- `Player` recebe ações de `Input`, usa a física do `Physics` e toca animações do boneco do Mixamo.
- `CameraRig` segue o jogador no eixo X, com suavização.
- `Levels` descrevem cada área em dados; `Game` monta a cena a partir deles.
- `Vigia` tem dois modos: patrulha (área 3, com cone de luz) e perseguição (área 4, velocidade constante). Sem busca de caminho.
- `PostFX` aplica o visual: névoa forte, grão, vinheta, cores dessaturadas, poucas luzes quentes.

## 7. Estado atual

Atualize esta lista a cada tarefa concluída.

- [ ] **História nova (GDD v3.1): mínimo feito em 2026-11-23, testado por bot, falta playtest humano**
  - Relógio novo (`src/levels/chamada.ts` = roteiro inteiro com ids das falas; `CallSchedule.ts` = linha do tempo): fim da aula de 0:00 a 1:45 (6 falas do professor), chamada de 1:45 a 7:50 com 48 colegas (6 s por nome com "presente", 9 s por falta: nome, silêncio, nome de novo, "Falta."), 8 faltas espalhadas, 3 interrupções (bronca, aviso da coordenação, pergunta de uma aluna) e o Zacarias em 7:50 exatos. Teste em `tests/chamada.test.ts`
  - Ligação do colega (`CallClock.ts`): celular vibra no primeiro botão, filtro de telefone (300 a 3.400 Hz, distorção leve, compressão), professor ao fundo com eco e colega seco perto do microfone, ducking quando o colega fala, 13 falas do colega (as de letra ficam presas ao primeiro nome daquela letra). Sinal picota no subsolo (área 4) e a legenda mostra "· · ·"; na área 5 a voz real do professor (sem filtro) sobe conforme o jogador chega à porta
  - Tela da ligação (`src/ui/CallScreen.ts`, estilos `.ligacao` em `index.html`): card no canto inferior direito no estilo notificação de chamada (avatar com inicial e selo verde), nome do contato (`colegaNome`, provisório "Davi"), barras de sinal, legenda do colega e nome lido ("Larissa Melo · presente", "· falta")
  - Seguranças: ser pego escurece devagar (0,7 s + 0,5 s) e volta ao checkpoint; falas de desconfiança (ao começar a desconfiar, com intervalo mínimo de 6 s), barulho (ao ir investigar) e pego, 3 variações sorteadas sem repetir, às vezes nenhuma (`GUARD_SILENT_CHANCE` em `CallClock.ts`). No código ainda se chama `Vigia`
  - Final bom: a ligação desliga, o professor chama "Zacarias Vieira?" na sala (legenda embaixo); qualquer botão responde "Presente!" e corta para preto; sem botão em ~4 s depois da fala, corta em silêncio. Final ruim: o nome pela ligação, silêncio, "...ele chamou" e a caneta, depois escurece e oferece recomeçar
  - Vozes: provisórias geradas no Mac (`node ferramentas/vozes.ts --provisorias`). Para trocar pelo ElevenLabs: salvar `public/audio/vozes/<id>.mp3` com o id da 1ª coluna de `docs/roteiro-vozes.csv` e rodar `node ferramentas/vozes.ts` (atualiza o `manifest.json`). Fala sem arquivo cai na voz do navegador
  - Falta (se der tempo, nesta ordem): colegas sólidos saindo na direção contrária e conversa de fundo nas áreas 1 e 2 (os `vultos` antigos continuam no código); professor erguer os olhos no final; sensores de portão já feitos no cenário
- [ ] **Fase mais longa (2026-11-23), testada por bot, falta playtest humano.** O João (que conhece o caminho) terminou no Diego Moreira (3:11); escolheu 3A + 2A + 4A
  - Área 2: recuo do corredor entre a porta e a zeladoria (`HALL_X0`–`HALL_X1` em `area2.ts`, +12 m; o resto da área foi deslocado), segurança de ronda, dois pilares de cobertura, metade das luzes apagada; checkpoint passou para x 71
  - Área 3: acervo depois da sala de leitura (`area3.ts`, x 141–168): patamar com estante e carrinho de isca, piso rebaixado 1,2 m, três estantes, dois seguranças em rondas que se cruzam, escada de volta à galeria; checkpoint novo em 141,4; foco de câmera ao entrar
  - Área 4: depósito em dois passos: sensor perto da entrada, valeta de 1,2 m × 1 m no piso, tambores e carrinho de gás do outro lado (qualquer um que caia na valeta vira ponte); duas dicas
  - `reacao` opcional por segurança (`VigiaData`): 0,5 s no corredor e no acervo, para quem passa correndo na frente ser pego
  - Bot: no corredor, quem corre direto é pego 5 de 5 vezes e quem espera passa 3 de 3 (~19 s); no acervo, 3 de 5 e 3 de 3 (~20 s); no depósito, os tambores caem na valeta e o carrinho de gás passa por cima até o sensor (portão abre). Para quem conhece o caminho, as três somam uns 45 s
- [ ] **Decisões de 2026-11-23 (GDD v3.1), falta:**
  - Ordem de corte única (GDD, "A chamada"): segunda perseguição e depósito da área 4, sala escura da área 2, garagem da área 1; gatilho = primeira partida acima de 6 min nos dois primeiros playtests
  - Vozes: gravar todas no ElevenLabs; conferir crédito e uso permitido do plano e registrar na seção 9
  - Testar com um controle real
  - Plano B: gravar vídeo de uma partida completa na véspera da apresentação
- [x] Projeto base (Vite + TypeScript + Babylon + Havok)
- [ ] **Prova de pipeline** (seção 8)
  - [x] 1. Projeto criado com versões fixadas
  - [x] 2. Cena com câmera lateral e chão
  - [x] 3. Cubo anda, pula e empurra caixa (Havok, controlador de personagem, plano 2D) — playtest humano aprovado (2026-11-21)
  - [x] 4. Personagem do Mixamo convertido para GLB (`ferramentas/converter_mixamo.py`, Blender 5.3.0, saída `public/models/personagem.glb`) — deslocamento usa "Running" e empurrar usa "Pushing" (ambos In Place)
  - [x] 5. GLB importado, escurecido e trocando parado/andar/pular/empurrar conforme o movimento e deslizar — playtest aprovado
  - [x] 6. Névoa e luz simples
  - Desempenho: 60 fps estáveis no Mac do humano (teste manual, 2026-11-21)
  - [x] 7. Leitura de controle (analógico/direcional, botão inferior pula, para baixo = deslizar) — testado só com controle simulado; falta teste com controle real
  - [x] 8. `npm run build` e `vite preview` funcionando (Vite escuta na rede local)
- [ ] Entrada: teclado e controle
- [x] Jogador: andar e pular (playtest aprovado)
- [x] Jogador: empurrar caixa (playtest aprovado; sem botão, empurrão lento: caixa a ~0,5 m/s). Em 2026-11-23: mãos presas à pegada do objeto por IK de dois ossos (`src/game/HandIK.ts`; `pegada` em `BoxData`), caixas trocadas por objetos do lugar (lixeira, tambores, carrinho de ferramentas, carrinho de carga com cimento, carrinho de gás, carrinho da biblioteca com livros; visuais em `src/levels/kits.ts`) e mãos apoiando na parede ao andar contra ela, com balanço do corpo no impacto (`Player.updateBrace`). Falta playtest humano
- [x] Jogador: deslizar (playtest aprovado em 2026-11-22)
- [x] Morte, checkpoint e reinício (queda abaixo de `killY` mata, fade de 0,5 s, volta ao último checkpoint e caixas resetam; teste automático em `tests/checkpoints.test.ts` com `npm test`; playtest aprovado)
- [x] Câmera lateral (segue em X com antecipação de 1,5 m, segue a altura do chão ao pousar, respeita `bounds` da fase; playtest aprovado)
- [ ] Atmosfera visual (névoa, grão, vinheta, luz) — opção B escolhida em 2026-11-22 (`VISUAL` em `src/game/PostFX.ts`; lâmpadas quentes por fase em `lamps`). Polimento aprovado em 2026-11-22: mais claro (usuário: "a claridade está perfeita"), bloom, tone mapping, poeira nas lâmpadas (`Dust.ts`), contorno fresnel nos personagens, lanterna do Vigia mais forte (22). SSAO testado e descartado (60→40 fps). Texturas CC0 em cinza tingidas pela paleta, UV em escala de mundo (`WorldUV.ts`); pré-aquecimento espera as texturas e passa os personagens pelo mundo para não travar. Claridade reduzida a pedido (exposição 1,4, ambiente 0,6). Objetos do Blender: estantes feitas (3 variações com cores por vértice, `src/game/Props.ts`; colisão continua na caixa invisível, que também bloqueia a visão do Vigia). Faltam lixeira, carrinho e catraca, e o playtest humano
- [ ] Área 1: pátio — **cenário trocado por modelos prontos em 2026-11-22** (fatia vertical para aprovação): fachadas modulares de tijolo do Poly Haven montadas por dados (`src/levels/kits.ts`: `facade` e `clad`), objetos em `props` da fase, visual das caixas em `visual` da caixa, carregados por `src/game/Kit.ts` (converte o PBR do glTF para StandardMaterial, para seguir a mesma luz e névoa). Interiores escuros com janelas acesas, céu em degradê (`Backdrop.ts`) e cones de luz nos postes (`Lamp.ts`). Em 2026-11-22 (mesmo dia) o João aprovou e o estilo foi levado às áreas 2 a 5: janelas prontas com luar (`moonWindow`), luminárias fluorescentes, prateleiras, carteiras, barreiras de concreto (colisão escondida), canos, dutos e visuais das caixas; estantes da sala de leitura viraram decoração com modelo (sem colisão, para não bloquear a visão do Vigia). Antes: montada em 2026-11-22 com referência nas fotos da faculdade (`src/levels/area1.ts`: rua, jardim, escadaria até a porta fechada, lixeira empurrada até o muro, rampa e portão lateral); fase de teste em `?fase=teste`; usuário mandou seguir sem playtest detalhado. Arte: decidido (2026-11-22) gameplay das 5 áreas em blocos primeiro, polimento visual (sombras, SSAO, silhuetas, texturas CC0, props do Blender) no fim
- [ ] Área 2: corredor (catraca, placa de pressão) — montada em 2026-11-22 (`src/levels/area2.ts`; mundo contínuo em `src/levels/world.ts`; catraca com vão de 1,1 m, carrinho cai no rebaixo da placa e a porta de enrolar sobe até 1,1 m, luzes falhando em `Lamp.ts`); testada por simulação, falta playtest humano
- [ ] Área 3: biblioteca (elevador, patrulha do Vigia) — montada em 2026-11-22 (`src/levels/area3.ts`, `entities/Vigia.ts`, `entities/Elevator.ts`). Vigia anda numa faixa ao fundo (z 3,2), estantes na faixa do meio fazem sombra real (ShadowGenerator) e bloqueiam a detecção (raycast); morte após 0,2 s no cone. Botão chama a plataforma, que sobe com o jogador até a galeria. Luzes longe da câmera são desligadas e cada material aceita 8 luzes (antes só 4 funcionavam). Testada por simulação, falta playtest humano
- [ ] Área 4: subsolo (perseguição) — montada em 2026-11-22 (`src/levels/area4.ts`). Rampa de garagem desce da galeria; Vigia (modo perseguição, `Running.fbx`) surge em x 128 e corre a 3,8 m/s numa faixa paralela; toque mata. Barra de altura (deslizar), barreira de concreto (pular), portão de enrolar meio fechado que bate depois que o jogador passa (deslizar). Pré-aquecimento de shaders no carregamento (`Game.warmUp`) elimina a câmera lenta na primeira passagem. Testada por simulação, falta playtest humano
- [ ] Área 5: corredor final e sala — montada em 2026-11-22 (`src/levels/area5.ts`, `entities/FinalDoor.ts`). Escada sobe 1,5 m, corredor de ~35 m com alto-falantes cada vez maiores e lâmpada que morre ao passar; tocar a porta tranca o controle (`Input.setAutopilot`), a porta abre, o boneco entra sozinho na sala vazia e a tela corta para preto (estados `chegada`/`fim` em `Game`). Falta: voz da chamada, final ruim e tela final. Testada por simulação, falta playtest humano
- [ ] Relógio da chamada e volume por área — feito em 2026-11-22 (`CallClock.ts`, `CallSchedule.ts`, `src/levels/chamada.ts`, áreas em `src/levels/areas.ts`). 160 nomes fictícios em ordem alfabética, aluno "Zacarias Vieira" por último, chamada de 10min48. "Presente" ou silêncio depois de cada nome. Volume e filtro passa-baixa por área, chiado de alto-falante. Falta: gravar a voz (ElevenLabs) e playtest humano
- [ ] Finais bom e ruim — feito em 2026-11-22. Bom: chega à porta antes do nome e a voz chama o nome dele na sala. Ruim: o nome é chamado antes, o controle trava, a tela escurece e aparece "pressione qualquer botão para recomeçar". Final ruim testado no navegador automático; final bom falta testar jogando
- [ ] Telemetria e testes por área — feito em 2026-11-22 (`Telemetry.ts`). `?telemetria=1` mostra tempo, nomes chamados e mortes por área; as últimas 20 partidas ficam no navegador (`chamadaTelemetria()` no console). `?area=N` começa no checkpoint antes da área N; `?chamada=S` adianta o relógio para S segundos (para testar o final ruim)
- [ ] Ajustes de dificuldade da etapa 1 — feito em 2026-11-22: Vigia da perseguição 3,8 → 4,3 m/s; dicas mais tarde (brilho 45 s, ícone 90 s, encostado 4 s, elevador 20 s); pausa da patrulha varia entre 1,2 e 3,2 s (`pauseMax`). Falta playtest humano
- [ ] Versão para celular — **deixou de ser alvo em 2026-11-23** (decisão do João: o alvo é o computador, não o celular). O código de toque e o link continuam, mas sem prioridade e sem atualização garantida. Feita em 2026-11-22. Botões de toque (`src/ui/TouchControls.ts`, ligados por `VITE_TOQUE` ou `?toque=1`); `npm run build:celular` gera `dist-celular/` com `pagina.html` para publicar como página privada no claude.ai (modelos com extensão `.glb.mp4`, ver `ferramentas/build-celular.mjs`). O `node_modules` do Mac não roda no Linux; a build foi feita num ambiente Linux à parte
- [ ] Menu, tela de morte e tela final — feito em 2026-11-22, estilo A escolhido (`src/ui/Screens.ts`, estilos em `index.html`, créditos em `src/ui/creditos.ts`). Menu sobre o pátio ao vivo depois do pré-aquecimento, "pressione qualquer botão" (teclado, clique ou controle) e linha de controles; tela de morte = escurecimento sem texto; tela final com créditos e recomeço (recarrega a página). Falta playtest humano
- [ ] Orientação do jogador (UX) — feito em 2026-11-22. Camadas: 0 = cenário guia (vidro da catraca com moldura, porta principal chacoalha ao tocar, câmera mostra o elevador ao entrar na biblioteca, pilar na entrada da biblioteca); 1 = brilho pulsante no objeto da solução quando o jogador parece perdido; 2 = ícone de tecla/botão (sem palavras, exceção aprovada à regra de texto) só quando o detector dispara. Regras em `src/levels/dicas.ts`, lógica em `src/game/Hints.ts`. Também: ponto de carregamento, cursor oculto no jogo, morte por lanterna escurece em âmbar, linha de controles com controle. Falta playtest humano
- [ ] Efeitos sonoros — feito em 2026-11-22 (`src/game/Sfx.ts` = Web Audio, `src/game/Soundscape.ts` = quando tocar). Passos, pulo, aterrissagem, deslize, empurrar, placa, portas, porta trancada, botão e motor do elevador, lâmpada que apaga, passos do Vigia (volume pela distância), Vigia surgindo, porta final e três sons de morte. Áudio liberado no primeiro botão do menu. Sem música ambiente por enquanto. Falta playtest humano (volumes e escolha dos sons)
- [ ] Música — feito em 2026-11-23 (`src/game/Music.ts`, faixas em `public/audio/musica/`). Clima escolhido pelo amigo do João: os três (drone, INSIDE e synth anos 80). Menu: tema em synth. Área 1: drone do pátio. Áreas 2 a 4: drone do corredor (mais baixo no subsolo). Camada de tensão sobe com a proximidade (14 m) e o alerta do segurança. Perseguição: faixa com batida, entra com stinger quando o segurança sai da porta e o drone cai. Pego: tudo corta em 0,15 s com stinger. Área 5: a música some em ~6 s. Final bom: tema quente no corte para preto. Final ruim: silêncio. Ducking: quando o colega fala, a música baixa para 45% e perde os agudos. Testes em `tests/musica.test.ts`. Falta playtest humano (volumes: `MUSIC_VOLUME` e `LEVEL` no topo de `Music.ts`)
- [ ] Etapa 2 (salas novas) — feito em 2026-11-22, testado por bot, falta playtest humano. O mundo agora é montado por área (`src/levels/world.ts` + `shift.ts`): cada área usa as próprias coordenadas e as seguintes são deslocadas sozinhas.
  - Área 1, sala 2 (garagem): caixote em cima da doca cai no rebaixo da placa e abre o portão de enrolar. Sala 3 (guarita): primeiro encontro com o Vigia; guarita (4 m) e van (4,4 m) como cobertura
  - Área 2, sala 2 (zeladoria): caixa do chão vira degrau para um palco de 2 m; a caixa de cima vai para a placa do palco e abre o portão. Sala 3 (sala escura): três vãos no piso, luz ambiente cai para 20% (`escuro` na fase) e as lâmpadas acendem só em lampejos (`flicker: "escuro"`)
  - Área 3 (biblioteca): personagem anda agachado e devagar (2,4 m/s) no trecho `furtivo`; a silhueta mais baixa reduz o ponto de visão mais alto. Agachamento com as animações "Crouch Idle" e "Crouched Walking" (In Place) do Mixamo, clipes `agachado` e `agachado_andar` no `personagem.glb` (2026-11-22)
  - Área 4: perseguição elástica (`elastico` no Vigia: acelera até 1,4× quando o jogador se afasta, alivia até 0,8× quando chega perto), obstáculo extra com espaçamento irregular, depósito com caixa e placa que abre o portão, segunda perseguição com seis obstáculos
  - Parâmetros de teste: `?checkpoint=N` começa no checkpoint N; `window.chamadaDebug()` (com `?telemetria=1`) mostra caixas, placas, portas e Vigias
- [ ] Etapa 3 (sem playtest) — feito em 2026-11-22, testado por bot, falta playtest humano.
  - Área 5: ~~corredor que se repete~~ removido em 2026-11-23 (GDD v3.1): corredor longo sem repetição, com lâmpadas que apagam quando o jogador passa
  - Celular: controle por gestos como no INSIDE (`src/ui/GestureControls.ts`): metade esquerda = analógico invisível (arrastar para os lados), metade direita = deslizar o dedo para cima pula, para baixo desliza. `?toque=botoes` mostra os botões antigos
  - Vigia de patrulha agora desconfia: enquanto vê o jogador ele para, a lanterna vai do âmbar ao vermelho e a morte vem em ~0,85 s; fora da luz a desconfiança baixa
  - Barulho: caixa que cai com força (> 3,5 m/s) faz som e os Vigias de patrulha a até 16 m vão investigar (andam até perto, olham 4 s e voltam)
  - Área 3, sala 2 (sala de leitura): Vigia de guarda (`x0 = x1`) olha para a entrada; o caminho passa por um mezanino com um carrinho; derrubar o carrinho atrai o guarda, que passa por baixo enquanto o jogador se esconde atrás da mureta
  - Narrativa sem texto: vultos de outros alunos (`vultos` na fase, `entities/Vultos.ts`) que somem quando o jogador chega perto (porta principal, garagem, sala escura, fim do corredor); folhas espalhadas, celular aceso, mochilas largadas e uma prova esperando na carteira da sala vazia
  - Estimativa de duração pela geometria e pelas esperas: ~3 min para quem já conhece o caminho; primeira partida provavelmente entre 6 e 8 min. Falta medir com gente
- [ ] Alvo de desempenho: a apresentação roda no Mac (decisão de 2026-11-22). O celular é só para teste; o limite é manter 60 fps no Mac
- [ ] Efeitos sonoros e ambiente
- [ ] Build local e `iniciar.bat`
- [ ] Backup publicado no itch.io

## 8. Prova de pipeline (dia 1)

Objetivo: descobrir em poucas horas se a base funciona, antes de investir no resto. **Só siga adiante quando todos os itens passarem.**

1. Criar o projeto com Vite + TypeScript e instalar as versões fixadas (seção 3).
2. Abrir uma cena Babylon com câmera lateral e um chão.
3. Ligar o Havok e fazer um **cubo** andar, pular e colidir com o chão e com uma caixa empurrável, travado no plano 2D.
4. No Mixamo, baixar um personagem humanoide neutro e as animações: parado, andar, pular, empurrar, deslizar. O Mixamo entrega **FBX**; converta para **GLB** (importar no Blender e exportar como glTF binário, ou usar um conversor FBX para glTF), porque o Babylon carrega glTF/GLB de forma nativa.
5. Importar o GLB, escurecer o material, tocar as animações e trocar entre elas conforme o movimento.
6. Aplicar névoa e uma luz simples para confirmar o visual.
7. Ler o teclado **e** um controle conectado.
8. Rodar `npm run build` e abrir o resultado com o servidor local (seção 10).

Critério de aprovação: o boneco anda, pula, empurra a caixa e desliza com animação, no teclado e no controle, rodando pela build local, a pelo menos 30 quadros por segundo.

## 9. Tabela de licenças

Preencha ao baixar ou gerar qualquer item.

| Item | Origem (URL ou ferramenta) | Licença | Atribuição necessária? | Onde é usado |
| --- | --- | --- | --- | --- |
| Animações Idle, Walking, Jump, Push Stop, Running Slide, Pushing, Running, Jogging, Crouch Idle, Crouched Walking (Walking, Push Stop e Jogging não usados) | https://www.mixamo.com (Adobe), baixado em 2026-11-21 e 2026-11-22 | Termos do Mixamo: uso livre de royalties em projetos pessoais e comerciais; não redistribuir os arquivos brutos isoladamente | Não | `public/models/*.glb` (todos os personagens) |
| Personagens Bryce (Zacarias, com mochila feita no conversor), Alex (seguranças), Joe (professor) e David (colega Davi), FBX em pose T sem textura PBR | https://www.mixamo.com (Adobe), baixados em 2026-11-23 | Termos do Mixamo: uso livre de royalties em projetos pessoais e comerciais; não redistribuir os arquivos brutos isoladamente | Não | `assets-brutos/mixamo/{Bryce,Alex,Joe,David}.fbx` → `public/models/personagem.glb`, `vigia.glb`, `professor.glb`, `aluno.glb` (gerados com `converter_mixamo.py -- <perfil>`; texturas reduzidas a 512 px). Substituem o Y Bot e o X Bot |
| 100 CC0 SFX (rubberduck): switch_01/02, machine_01, noise_01, door_01, glass_01, weird_04, hit_01 | https://opengameart.org/content/100-cc0-sfx, baixado em 2026-11-22 | CC0 | Não | `public/audio/sfx/` (placa, botao, elevador, deslizar, porta-final, lampada, morte-luz, morte-toque) |
| 100 CC0 metal and wood SFX (rubberduck): wood_squeak_01/02, metal_open_01, metal_close_01, metal_slam_01, wood_misc_01, wood_falling_01 | https://opengameart.org/content/100-cc0-metal-and-wood-sfx, baixado em 2026-11-22 | CC0 | Não | `public/audio/sfx/` (empurrar-1/2, porta-abre, porta-fecha, vigia-surge, porta-trancada, morte-queda) |
| Footsteps Leather, Cloth, Armor (haeldb): step_lth1/2/33/4, step_cloth1/2 | https://opengameart.org/content/footsteps-leather-cloth-armor, baixado em 2026-11-22 | CC0 (oferecido também em OGA-BY 3.0; usamos CC0) | Não | `public/audio/sfx/` (passo-1..4, pulo, aterrissar; passos do Vigia = mesmos sons mais graves) |
| Textura asphalt_02 (Rob Tuytel): cor e normal 1K | https://polyhaven.com/a/asphalt_02, baixado em 2026-11-22 | CC0 | Sim: cor convertida para cinza com contraste reduzido; normal reduzida para 512 px | `public/textures/asfalto_cor.jpg`, `public/textures/asfalto_normal.jpg` |
| Textura concrete_floor_worn_001 (Dimitrios Savva, Rico Cilliers): cor e normal 1K | https://polyhaven.com/a/concrete_floor_worn_001, baixado em 2026-11-22 | CC0 | Sim: cor convertida para cinza com contraste reduzido; normal reduzida para 512 px | `public/textures/concreto_cor.jpg`, `public/textures/concreto_normal.jpg` |
| Textura concrete_wall_003 (Dimitrios Savva, Rico Cilliers): cor e normal 1K | https://polyhaven.com/a/concrete_wall_003, baixado em 2026-11-22 | CC0 | Sim: cor convertida para cinza com contraste reduzido; normal reduzida para 512 px | `public/textures/pedra_cor.jpg`, `public/textures/pedra_normal.jpg` |
| Textura brown_planks_03 (Rob Tuytel): cor e normal 1K | https://polyhaven.com/a/brown_planks_03, baixado em 2026-11-22 | CC0 | Sim: cor convertida para cinza com contraste reduzido; normal reduzida para 512 px | `public/textures/madeira_cor.jpg`, `public/textures/madeira_normal.jpg` |
| Textura metal_plate (Rob Tuytel): cor e normal 1K | https://polyhaven.com/a/metal_plate, baixado em 2026-11-22 | CC0 | Sim: cor convertida para cinza com contraste reduzido; normal reduzida para 512 px | `public/textures/metal_cor.jpg`, `public/textures/metal_normal.jpg` |
| Textura beige_wall_001 (Dimitrios Savva, Rico Cilliers): cor e normal 1K | https://polyhaven.com/a/beige_wall_001, baixado em 2026-11-22 | CC0 | Sim: cor convertida para cinza com contraste reduzido; normal reduzida para 512 px | `public/textures/parede_cor.jpg`, `public/textures/parede_normal.jpg` |
| Textura granite_tile (Charlotte Baglioni): cor e normal 1K | https://polyhaven.com/a/granite_tile, baixado em 2026-11-22 | CC0 | Sim: cor convertida para cinza com contraste reduzido; normal reduzida para 512 px | `public/textures/piso_cor.jpg`, `public/textures/piso_normal.jpg` |
| Vozes provisórias (92 falas: professor, colega, alunos, seguranças, Zacarias) | Geradas com o `say` do macOS (vozes Reed, Eddy, Rocko, Grandpa, Flo, Sandy, Shelley, Luciana) por `ferramentas/vozes.ts --provisorias`, 2026-11-23 | Provisórias, só para teste. Substituídas em 2026-11-23 pelas do ElevenLabs (linha abaixo); o script ainda as gera para falas novas sem gravação | — | `public/audio/vozes/` (lista em `docs/roteiro-vozes.csv`) |
| Vozes do ElevenLabs (as 94 falas) | https://elevenlabs.io, Text to Speech com o modelo Eleven v4, conta do João no plano **Starter** (renova em 19/12), gerado em 2026-11-23. Vozes da Voice Library: Professor Ulisses (professor), Gabriel - Casual (Davi), Leonardo - Deep & Resonant (seguranças), Nandinha, Raquel, Serena, Melodie (alunas), Wellerson, Jorge - Engaging, Dagozin - Casual (alunos e Zacarias). No teste também foram geradas Alírio, Alberto Oliveira, Mark, Moutella, Adriano, Manoel Lopes e Mota, que não ficaram no jogo | Plano pago (Starter em diante) inclui licença comercial; o plano Free é só não comercial e exige atribuição. Conferir nos termos se o direito continua caso a assinatura seja cancelada | Não no Starter (o Free exigiria) | `public/audio/vozes/` (escolhidas) e `public/audio/teste-vozes/` (todas as versões, comparação em `teste-vozes.html`) |
| Trilha sonora: 6 faixas (Fog Outside The Hall = pátio, Empty Hall After Midnight = corredor, Close Search = tensão, Basement Chase = perseguição, Empty Campus at Night = menu, Made It In Time = final) e 3 stingers (desconfia, pego, perseguição) | https://elevenlabs.io, Eleven Music v2.5 (instrumental) e Sound Effects v3, conta do João no plano **Starter**, gerado em 2026-11-23. Prompts sem nome de artista ou música. Amostras de escolha (30 s, três climas) em `assets-brutos/musica-amostras/` | Termos do Eleven Music (https://elevenlabs.io/music-terms, 09/10/2026): plano pago permite uso comercial exceto "Studio Games"; jogo indie pode; sem distribuição em streaming no Starter | Não nos planos pagos | `public/audio/musica/*.ogg` (originais em `assets-brutos/musica/originais/`, loops feitos por `ferramentas/musica_loops.py`) |
| Estantes com livros (3 variações) | Modeladas por script no Blender (`ferramentas/modelar_estante.py -- 1|2|3`), 2026-11-22 | Próprio do projeto | — | `public/models/estante-1.glb`, `estante-2.glb`, `estante-3.glb` |
| Modelo `SchoolChair_01` (glTF 1K) | https://polyhaven.com/a/SchoolChair_01, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/SchoolChair_01.glb` (áreas 2, 3 e 5)); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `SchoolDesk_01` (glTF 1K) | https://polyhaven.com/a/SchoolDesk_01, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/SchoolDesk_01.glb` (áreas 2 e 5)); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `WetFloorSign_01` (glTF 1K) | https://polyhaven.com/a/WetFloorSign_01, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/WetFloorSign_01.glb` (áreas 1, 2 e 3); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `barrel_03` (glTF 1K) | https://polyhaven.com/a/barrel_03, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/barrel_03.glb` (áreas 1, 2 e 4); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `cardboard_box_01` (glTF 1K) | https://polyhaven.com/a/cardboard_box_01, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/cardboard_box_01.glb` (áreas 2, 3 e 4)); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `concrete_road_barrier` (glTF 1K) | https://polyhaven.com/a/concrete_road_barrier, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/concrete_road_barrier.glb` (áreas 1 e 4); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `covered_car` (glTF 1K) | https://polyhaven.com/a/covered_car, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/covered_car.glb` (área 1); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `exterior_aircon_unit` (glTF 1K) | https://polyhaven.com/a/exterior_aircon_unit, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/exterior_aircon_unit.glb` (área 1); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `fire_hydrant` (glTF 1K) | https://polyhaven.com/a/fire_hydrant, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/fire_hydrant.glb` (área 1); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `grass_medium_01` (glTF 1K) | https://polyhaven.com/a/grass_medium_01, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/grass_medium_01.glb` (área 1); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `hand_truck` (glTF 1K) | https://polyhaven.com/a/hand_truck, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/hand_truck.glb` (áreas 1 e 2); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `industrial_storage_cart` (glTF 1K) | https://polyhaven.com/a/industrial_storage_cart, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/industrial_storage_cart.glb` (áreas 1, 2 e 3); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `island_tree_02` (glTF 1K) | https://polyhaven.com/a/island_tree_02, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/island_tree_02.glb` (área 1); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `large_iron_gate` (glTF 1K) | https://polyhaven.com/a/large_iron_gate, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/large_iron_gate.glb` (área 1); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `metal_office_desk` (glTF 1K) | https://polyhaven.com/a/metal_office_desk, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/metal_office_desk.glb` (áreas 3 e 5)); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `metal_trash_can` (glTF 1K) | https://polyhaven.com/a/metal_trash_can, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/metal_trash_can.glb` (áreas 1, 2 e 3); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `modular_airduct_rectangular_01` (glTF 1K) | https://polyhaven.com/a/modular_airduct_rectangular_01, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/modular_airduct_rectangular_01.glb` (área 2)); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `modular_factory_facade` (glTF 1K) | https://polyhaven.com/a/modular_factory_facade, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/modular_factory_facade.glb` (área 1); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `modular_pipes` (glTF 1K) | https://polyhaven.com/a/modular_pipes, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/modular_pipes.glb` (área 4)); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `modular_street_seating` (glTF 1K) | https://polyhaven.com/a/modular_street_seating, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/modular_street_seating.glb` (área 1); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `modular_urban_apartments_facade` (glTF 1K) | https://polyhaven.com/a/modular_urban_apartments_facade, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/modular_urban_apartments_facade.glb` (áreas 1, 2, 3 e 5); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `mounted_fluorescent_lights` (glTF 1K) | https://polyhaven.com/a/mounted_fluorescent_lights, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/mounted_fluorescent_lights.glb` (áreas 2, 3, 4 e 5)); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `old_tyre` (glTF 1K) | https://polyhaven.com/a/old_tyre, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/old_tyre.glb` (áreas 1 e 4); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `painted_wooden_bench` (glTF 1K) | https://polyhaven.com/a/painted_wooden_bench, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/painted_wooden_bench.glb` (áreas 1, 2 e 5); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `plastic_crate_01` (glTF 1K) | https://polyhaven.com/a/plastic_crate_01, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/plastic_crate_01.glb` (áreas 2, 3 e 4)); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `power_box_01` (glTF 1K) | https://polyhaven.com/a/power_box_01, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/power_box_01.glb` (áreas 1, 2, 3 e 4); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `rollershutter_window_01` (glTF 1K) | https://polyhaven.com/a/rollershutter_window_01, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/rollershutter_window_01.glb` (área 1); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `searsia_lucida` (glTF 1K) | https://polyhaven.com/a/searsia_lucida, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/searsia_lucida.glb` (área 1); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `security_camera_01` (glTF 1K) | https://polyhaven.com/a/security_camera_01, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/security_camera_01.glb` (áreas 1, 2, 3 e 4); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `security_light` (glTF 1K) | https://polyhaven.com/a/security_light, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/security_light.glb` (área 1); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `shrub_02` (glTF 1K) | https://polyhaven.com/a/shrub_02, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/shrub_02.glb` (área 1); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `steel_frame_shelves_01` (glTF 1K) | https://polyhaven.com/a/steel_frame_shelves_01, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/steel_frame_shelves_01.glb` (áreas 2 e 4)); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `street_lamp_01` (glTF 1K) | https://polyhaven.com/a/street_lamp_01, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/street_lamp_01.glb` (área 1); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `trashbag` (glTF 1K) | https://polyhaven.com/a/trashbag, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/trashbag.glb` (áreas 1, 2 e 4); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `utility_box_01` (glTF 1K) | https://polyhaven.com/a/utility_box_01, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/utility_box_01.glb` (área 4)); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `utility_box_02` (glTF 1K) | https://polyhaven.com/a/utility_box_02, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/utility_box_02.glb` (áreas 1 e 4); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `water_manhole_cover` (glTF 1K) | https://polyhaven.com/a/water_manhole_cover, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/water_manhole_cover.glb` (área 1); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `wooden_military_crate` (glTF 1K) | https://polyhaven.com/a/wooden_military_crate, baixado em 2026-11-22 | CC0 | Não | `public/models/kit/wooden_military_crate.glb` (áreas 1, 2 e 3); convertido para GLB, malha simplificada quando pesada, texturas ORM descartadas e cor/normal em JPEG ≤ 1024 px |
| Modelo `tool_cart` (glTF 1K) | https://polyhaven.com/a/tool_cart, baixado em 2026-11-23 | CC0 | Não | `public/models/kit/tool_cart.glb` (área 2 e sala de teste: carrinho empurrável); convertido com `ferramentas/converter_kit.py` (malha ≤ 12 mil faces, sem ORM, JPEG ≤ 512 px) |
| Modelo `portable_welding_cart` (glTF 1K) | https://polyhaven.com/a/portable_welding_cart, baixado em 2026-11-23 | CC0 | Não | `public/models/kit/portable_welding_cart.glb` (área 4: carrinho de gás empurrável); convertido com `ferramentas/converter_kit.py` |
| Modelo `cement_bag` (glTF 1K) | https://polyhaven.com/a/cement_bag, baixado em 2026-11-23 | CC0 | Não | `public/models/kit/cement_bag.glb` (área 2: carga do carrinho do contrapeso); convertido com `ferramentas/converter_kit.py` |
| Modelo `book_encyclopedia_set_01` (glTF 1K) | https://polyhaven.com/a/book_encyclopedia_set_01, baixado em 2026-11-23 | CC0 | Não | `public/models/kit/book_encyclopedia_set_01.glb` (área 3: livros no carrinho da biblioteca); convertido com `ferramentas/converter_kit.py` |

Voz e efeitos do ElevenLabs: registrar o plano usado e a data de geração.

## 10. Rodar localmente

Desenvolvimento: `npm run dev`.

Jogo final (computador da apresentação): `npm run build` uma vez e depois o `iniciar.bat`. O `index.html` **não abre com duplo clique**, porque o navegador bloqueia o carregamento de modelos e sons; é preciso um servidor local.

```bat
@echo off
cd /d %~dp0
start "" http://localhost:4173
npx vite preview --port 4173
```

Em Mac ou Linux, o equivalente é um `iniciar.sh` com `npx vite preview --port 4173` e a abertura do navegador. Teste a build em outro computador antes da entrega, e mantenha uma cópia publicada no itch.io como reserva.

### 10.1 Jogar no celular

**Mesma rede Wi-Fi (em casa).** Configure o Vite para escutar na rede (`server.host: true` no `vite.config.ts`, ou `npm run dev -- --host`). Descubra o IP do computador, e o jogo abre no celular em `http://IP-DO-COMPUTADOR:5173`. Em Windows, pode ser preciso liberar a porta no firewall quando o sistema perguntar. Para testar a build, use `npx vite preview --host --port 4173`.

**Fora de casa.** Publique uma versão de teste online, **privada ou como rascunho**: itch.io (projeto restrito por senha), GitHub Pages ou similar. **Só publique depois de o humano confirmar** a conta e o destino (regra 4 da seção 2.2). Um túnel (Cloudflare Tunnel, ngrok) é alternativa, mas é mais frágil.

**Limitações no celular:**
- O jogo é feito para teclado e controle. No celular, é preciso um **controle bluetooth** pareado ou botões de toque. Se o humano quiser, implemente botões de toque (esquerda, direita, pular, deslizar) **só na versão de teste**, atrás de uma flag, sem alterar o fluxo de entrada de `Input.ts`.
- O áudio só toca depois de um primeiro toque na tela (o jogo já pede "pressione qualquer botão").
- O desempenho no celular é diferente do computador da apresentação. Não o use como medida final.

## 11. Papéis para as sessões com IA

Cole o papel no início da sessão, junto com este arquivo e o GDD.

**Programador de gameplay.** "Você implementa o jogo Chamada conforme o PROJETO.md e o GDD. Faça só a tarefa pedida, use apenas a API da versão fixada do Babylon.js e diga como testar o resultado."

**Designer de fase e guardião do GDD.** "Você mantém o GDD e o roteiro das cinco áreas. Proponha ideias, mas rejeite o que extrapolar o escopo e aponte o que precisa ser cortado, seguindo a ordem de corte do GDD."

**Revisor e QA.** "Você não escreveu este código. Revise a build contra o checklist de testes do GDD, aponte bugs com passos para reproduzir e diga o que falta para cada critério de pronto. Seja crítico."

## 12. Marcos

| Marco | Fim do dia |
| --- | --- |
| Protótipo pronto (prova de pipeline aprovada) | 1 |
| Features congeladas (nada novo entra) | noite de 24/11 (decisão de 2026-11-23) |
| Versão final (build testada em outro computador) | 25/11 (só correção de bugs) |
