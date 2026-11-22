# Chamada

Jogo de plataforma e puzzle 2.5D, de cerca de 5 minutos, feito com [Babylon.js](https://www.babylonjs.com/). Um aluno sem rosto atravessa uma universidade vazia e sombria para chegar à sala antes que o alto-falante chame o nome dele. O relógio é um único áudio de chamada, sem barra de tempo.

## Como rodar

Requer Node.js 20 ou mais recente.

```bash
npm install
npm run dev
```

O jogo abre em `http://localhost:5173`. Há uma fase de teste em `?fase=teste`.

Para gerar e testar a versão final:

```bash
npm run build
npx vite preview --port 4173
```

O `index.html` da build não abre com duplo clique, porque o navegador bloqueia o carregamento de modelos e sons fora de um servidor local.

Testes automáticos da lógica:

```bash
npm test
```

## Controles

Andar, pular, deslizar e empurrar caixas, pelo teclado ou por um controle.

## Estrutura

- `src/game/`: núcleo do jogo (jogador, câmera, física, entidades, dicas, pós-processamento)
- `src/levels/`: dados das cinco áreas, separados do código
- `src/ui/`: menu, transições e tela final com créditos
- `public/`: modelos GLB e sons usados pelo jogo
- `ferramentas/`: script do Blender que converte os FBX do Mixamo para GLB
- `tests/`: testes com `node --test`

O design completo está em `Chamada GDD enxuto.md`, e o contexto técnico, o estado atual e a tabela de licenças dos assets estão em `PROJETO.md`.

## Créditos e licenças

Personagens e animações vêm do [Mixamo](https://www.mixamo.com) (Adobe), usados conforme os termos do serviço. A lista completa de assets e licenças está na seção 9 do `PROJETO.md`.
