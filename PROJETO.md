# PROJETO: Chamada

Arquivo de contexto para qualquer IA que trabalhe neste projeto. **Leia tudo antes de escrever código.** Atualize a seção "Estado atual" ao fim de cada tarefa.

## 1. O que é

**Chamada** é um jogo de plataforma e puzzle 2.5D (mundo 3D, câmera lateral, jogabilidade num plano 2D) feito com **Babylon.js**, de 8 a 10 minutos (meta revista em 2026-11-22). Um aluno sem rosto atravessa uma universidade vazia e sombria para chegar à sala antes que o alto-falante chame o nome dele. O relógio é um único áudio de chamada, sem barra de tempo.

Referências: INSIDE (clima, mundo sem palavras, perseguição) e SpeedRunners (pressão que empurra para frente, movimento fluido).

O design completo está no **GDD** ("Chamada: GDD enxuto"). Em caso de dúvida de design, o GDD vale mais que este arquivo. Em caso de dúvida técnica, vale este arquivo.

## 2. Regras de ouro para a IA

1. **Uma tarefa por vez.** Não implemente nada fora do que foi pedido.
2. **Escopo fechado.** Quatro ações do jogador (andar, pular, deslizar, empurrar caixa), um inimigo (o Vigia), cinco áreas. Não adicione mecânicas, menus extras nem sistemas novos sem pedido.
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
- **Relógio:** `CallClock.ts` usa o tempo de jogo (`CallSchedule.ts` diz em que instante cada nome é lido; lista em `src/levels/chamada.ts`). A voz usa clipes gravados de `public/audio/chamada/` (lista em `manifest.json`) quando existem e, sem eles, a voz sintetizada do navegador, provisória. Volume e filtro mudam por área (longe e abafado nas áreas 1 e 2, próximo e alto na 5).
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
- [x] Jogador: empurrar caixa (playtest aprovado; sem botão, empurrão lento: caixa a ~0,5 m/s)
- [x] Jogador: deslizar (playtest aprovado em 2026-11-22)
- [x] Morte, checkpoint e reinício (queda abaixo de `killY` mata, fade de 0,5 s, volta ao último checkpoint e caixas resetam; teste automático em `tests/checkpoints.test.ts` com `npm test`; playtest aprovado)
- [x] Câmera lateral (segue em X com antecipação de 1,5 m, segue a altura do chão ao pousar, respeita `bounds` da fase; playtest aprovado)
- [ ] Atmosfera visual (névoa, grão, vinheta, luz) — opção B escolhida em 2026-11-22 (`VISUAL` em `src/game/PostFX.ts`; lâmpadas quentes por fase em `lamps`). Polimento aprovado em 2026-11-22: mais claro (usuário: "a claridade está perfeita"), bloom, tone mapping, poeira nas lâmpadas (`Dust.ts`), contorno fresnel nos personagens, lanterna do Vigia mais forte (22). SSAO testado e descartado (60→40 fps). Texturas CC0 em cinza tingidas pela paleta, UV em escala de mundo (`WorldUV.ts`); pré-aquecimento espera as texturas e passa os personagens pelo mundo para não travar. Claridade reduzida a pedido (exposição 1,4, ambiente 0,6). Objetos do Blender: estantes feitas (3 variações com cores por vértice, `src/game/Props.ts`; colisão continua na caixa invisível, que também bloqueia a visão do Vigia). Faltam lixeira, carrinho e catraca, e o playtest humano
- [ ] Área 1: pátio — montada em 2026-11-22 com referência nas fotos da faculdade (`src/levels/area1.ts`: rua, jardim, escadaria até a porta fechada, lixeira empurrada até o muro, rampa e portão lateral); fase de teste em `?fase=teste`; usuário mandou seguir sem playtest detalhado. Arte: decidido (2026-11-22) gameplay das 5 áreas em blocos primeiro, polimento visual (sombras, SSAO, silhuetas, texturas CC0, props do Blender) no fim
- [ ] Área 2: corredor (catraca, placa de pressão) — montada em 2026-11-22 (`src/levels/area2.ts`; mundo contínuo em `src/levels/world.ts`; catraca com vão de 1,1 m, carrinho cai no rebaixo da placa e a porta de enrolar sobe até 1,1 m, luzes falhando em `Lamp.ts`); testada por simulação, falta playtest humano
- [ ] Área 3: biblioteca (elevador, patrulha do Vigia) — montada em 2026-11-22 (`src/levels/area3.ts`, `entities/Vigia.ts`, `entities/Elevator.ts`). Vigia anda numa faixa ao fundo (z 3,2), estantes na faixa do meio fazem sombra real (ShadowGenerator) e bloqueiam a detecção (raycast); morte após 0,2 s no cone. Botão chama a plataforma, que sobe com o jogador até a galeria. Luzes longe da câmera são desligadas e cada material aceita 8 luzes (antes só 4 funcionavam). Testada por simulação, falta playtest humano
- [ ] Área 4: subsolo (perseguição) — montada em 2026-11-22 (`src/levels/area4.ts`). Rampa de garagem desce da galeria; Vigia (modo perseguição, `Running.fbx`) surge em x 128 e corre a 3,8 m/s numa faixa paralela; toque mata. Barra de altura (deslizar), barreira de concreto (pular), portão de enrolar meio fechado que bate depois que o jogador passa (deslizar). Pré-aquecimento de shaders no carregamento (`Game.warmUp`) elimina a câmera lenta na primeira passagem. Testada por simulação, falta playtest humano
- [ ] Área 5: corredor final e sala — montada em 2026-11-22 (`src/levels/area5.ts`, `entities/FinalDoor.ts`). Escada sobe 1,5 m, corredor de ~35 m com alto-falantes cada vez maiores e lâmpada que morre ao passar; tocar a porta tranca o controle (`Input.setAutopilot`), a porta abre, o boneco entra sozinho na sala vazia e a tela corta para preto (estados `chegada`/`fim` em `Game`). Falta: voz da chamada, final ruim e tela final. Testada por simulação, falta playtest humano
- [ ] Relógio da chamada e volume por área — feito em 2026-11-22 (`CallClock.ts`, `CallSchedule.ts`, `src/levels/chamada.ts`, áreas em `src/levels/areas.ts`). 160 nomes fictícios em ordem alfabética, aluno "Zacarias Vieira" por último, chamada de 10min48. "Presente" ou silêncio depois de cada nome. Volume e filtro passa-baixa por área, chiado de alto-falante. Falta: gravar a voz (ElevenLabs) e playtest humano
- [ ] Finais bom e ruim — feito em 2026-11-22. Bom: chega à porta antes do nome e a voz chama o nome dele na sala. Ruim: o nome é chamado antes, o controle trava, a tela escurece e aparece "pressione qualquer botão para recomeçar". Final ruim testado no navegador automático; final bom falta testar jogando
- [ ] Telemetria e testes por área — feito em 2026-11-22 (`Telemetry.ts`). `?telemetria=1` mostra tempo, nomes chamados e mortes por área; as últimas 20 partidas ficam no navegador (`chamadaTelemetria()` no console). `?area=N` começa no checkpoint antes da área N; `?chamada=S` adianta o relógio para S segundos (para testar o final ruim)
- [ ] Ajustes de dificuldade da etapa 1 — feito em 2026-11-22: Vigia da perseguição 3,8 → 4,3 m/s; dicas mais tarde (brilho 45 s, ícone 90 s, encostado 4 s, elevador 20 s); pausa da patrulha varia entre 1,2 e 3,2 s (`pauseMax`). Falta playtest humano
- [ ] Versão para celular — feita em 2026-11-22. Botões de toque (`src/ui/TouchControls.ts`, ligados por `VITE_TOQUE` ou `?toque=1`); `npm run build:celular` gera `dist-celular/` com `pagina.html` para publicar como página privada no claude.ai (modelos com extensão `.glb.mp4`, ver `ferramentas/build-celular.mjs`). O `node_modules` do Mac não roda no Linux; a build foi feita num ambiente Linux à parte
- [ ] Menu, tela de morte e tela final — feito em 2026-11-22, estilo A escolhido (`src/ui/Screens.ts`, estilos em `index.html`, créditos em `src/ui/creditos.ts`). Menu sobre o pátio ao vivo depois do pré-aquecimento, "pressione qualquer botão" (teclado, clique ou controle) e linha de controles; tela de morte = escurecimento sem texto; tela final com créditos e recomeço (recarrega a página). Falta playtest humano
- [ ] Orientação do jogador (UX) — feito em 2026-11-22. Camadas: 0 = cenário guia (vidro da catraca com moldura, porta principal chacoalha ao tocar, câmera mostra o elevador ao entrar na biblioteca, pilar na entrada da biblioteca); 1 = brilho pulsante no objeto da solução quando o jogador parece perdido; 2 = ícone de tecla/botão (sem palavras, exceção aprovada à regra de texto) só quando o detector dispara. Regras em `src/levels/dicas.ts`, lógica em `src/game/Hints.ts`. Também: ponto de carregamento, cursor oculto no jogo, morte por lanterna escurece em âmbar, linha de controles com controle. Falta playtest humano
- [ ] Efeitos sonoros — feito em 2026-11-22 (`src/game/Sfx.ts` = Web Audio, `src/game/Soundscape.ts` = quando tocar). Passos, pulo, aterrissagem, deslize, empurrar, placa, portas, porta trancada, botão e motor do elevador, lâmpada que apaga, passos do Vigia (volume pela distância), Vigia surgindo, porta final e três sons de morte. Áudio liberado no primeiro botão do menu. Sem música ambiente por enquanto. Falta playtest humano (volumes e escolha dos sons)
- [ ] Etapa 2 (salas novas) — feito em 2026-11-22, testado por bot, falta playtest humano. O mundo agora é montado por área (`src/levels/world.ts` + `shift.ts`): cada área usa as próprias coordenadas e as seguintes são deslocadas sozinhas.
  - Área 1, sala 2 (garagem): caixote em cima da doca cai no rebaixo da placa e abre o portão de enrolar. Sala 3 (guarita): primeiro encontro com o Vigia; guarita (4 m) e van (4,4 m) como cobertura
  - Área 2, sala 2 (zeladoria): caixa do chão vira degrau para um palco de 2 m; a caixa de cima vai para a placa do palco e abre o portão. Sala 3 (sala escura): três vãos no piso, luz ambiente cai para 20% (`escuro` na fase) e as lâmpadas acendem só em lampejos (`flicker: "escuro"`)
  - Área 3 (biblioteca): personagem anda agachado e devagar (2,4 m/s) no trecho `furtivo`; a silhueta mais baixa reduz o ponto de visão mais alto. Agachamento com as animações "Crouch Idle" e "Crouched Walking" (In Place) do Mixamo, clipes `agachado` e `agachado_andar` no `personagem.glb` (2026-11-22)
  - Área 4: perseguição elástica (`elastico` no Vigia: acelera até 1,4× quando o jogador se afasta, alivia até 0,8× quando chega perto), obstáculo extra com espaçamento irregular, depósito com caixa e placa que abre o portão, segunda perseguição com seis obstáculos
  - Parâmetros de teste: `?checkpoint=N` começa no checkpoint N; `window.chamadaDebug()` (com `?telemetria=1`) mostra caixas, placas, portas e Vigias
- [ ] Etapa 3 (sem playtest) — feito em 2026-11-22, testado por bot, falta playtest humano.
  - Área 5: corredor que se repete (`laco` na fase): ao cruzar o gatilho, jogador e câmera recuam 18 m num trecho periódico; duas voltas, e a cada volta um grupo de lâmpadas passa a piscar no escuro
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
| Y Bot (personagem) e animações Idle, Walking, Jump, Push Stop, Running Slide, Pushing, Running, Jogging, Crouch Idle, Crouched Walking (Walking, Push Stop e Jogging não usados) | https://www.mixamo.com (Adobe), baixado em 2026-11-21 e 2026-11-22 | Termos do Mixamo: uso livre de royalties em projetos pessoais e comerciais; não redistribuir os arquivos brutos isoladamente | Não | `public/models/personagem.glb` (jogador) |
| X Bot (Vigia), reaproveitando Idle e Walking | https://www.mixamo.com (Adobe), baixado em 2026-11-22 | Termos do Mixamo: uso livre de royalties em projetos pessoais e comerciais; não redistribuir os arquivos brutos isoladamente | Não | `public/models/vigia.glb` (gerado com `converter_mixamo.py -- vigia`) |
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
| Estantes com livros (3 variações) | Modeladas por script no Blender (`ferramentas/modelar_estante.py -- 1|2|3`), 2026-11-22 | Próprio do projeto | — | `public/models/estante-1.glb`, `estante-2.glb`, `estante-3.glb` |

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
| Features congeladas (nada novo entra) | adiado para perto da entrega (decisão de 2026-11-22, para caber a meta de 8 a 10 minutos) |
| Versão final (build testada em outro computador) | 7 |
