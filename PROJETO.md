# PROJETO: Chamada

Arquivo de contexto para qualquer IA que trabalhe neste projeto. **Leia tudo antes de escrever código.** Atualize a seção "Estado atual" ao fim de cada tarefa.

## 1. O que é

**Chamada** é um jogo de plataforma e puzzle 2.5D (mundo 3D, câmera lateral, jogabilidade num plano 2D) feito com **Babylon.js**, de cerca de 5 minutos. Um aluno sem rosto atravessa uma universidade vazia e sombria para chegar à sala antes que o alto-falante chame o nome dele. O relógio é um único áudio de chamada, sem barra de tempo.

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
- **Relógio:** `CallClock.ts` usa o tempo de reprodução do áudio da chamada. Volume e filtro mudam por área (longe e abafado nas áreas 1 e 2, próximo e alto na 5).
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
- [ ] Atmosfera visual (névoa, grão, vinheta, luz) — opção B escolhida em 2026-11-22 (`VISUAL` em `src/game/PostFX.ts`; lâmpadas quentes por fase em `lamps`); falta playtest humano
- [ ] Área 1: pátio — montada em 2026-11-22 com referência nas fotos da faculdade (`src/levels/area1.ts`: rua, jardim, escadaria até a porta fechada, lixeira empurrada até o muro, rampa e portão lateral); fase de teste em `?fase=teste`; usuário mandou seguir sem playtest detalhado. Arte: decidido (2026-11-22) gameplay das 5 áreas em blocos primeiro, polimento visual (sombras, SSAO, silhuetas, texturas CC0, props do Blender) no fim
- [ ] Área 2: corredor (catraca, placa de pressão)
- [ ] Área 3: biblioteca (elevador, patrulha do Vigia)
- [ ] Área 4: subsolo (perseguição)
- [ ] Área 5: corredor final e sala
- [ ] Relógio da chamada (áudio) e volume por área
- [ ] Finais bom e ruim
- [ ] Menu, tela de morte e tela final
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
| Y Bot (personagem) e animações Idle, Walking, Jump, Push Stop, Running Slide, Pushing, Running, Jogging (Walking, Push Stop e Jogging não usados) | https://www.mixamo.com (Adobe), baixado em 2026-11-21 e 2026-11-22 | Termos do Mixamo: uso livre de royalties em projetos pessoais e comerciais; não redistribuir os arquivos brutos isoladamente | Não | `public/models/personagem.glb` (jogador) |

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
| Features congeladas (nada novo entra) | 5 |
| Versão final (build testada em outro computador) | 7 |
