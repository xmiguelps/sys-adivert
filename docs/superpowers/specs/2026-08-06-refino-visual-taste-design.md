# Design — Refino visual (design-taste-frontend) + migração de ícones para Phosphor

**Data:** 2026-08-06
**Projeto:** sys-adivert (Sistema de Advertências — DANLEX)
**Escopo:** apenas front-end (`front-end/`), somente CSS/visual + troca de ícones. Nenhuma
alteração de comportamento, de API/back-end, ou de arquitetura de componentes.

## Contexto

Este ciclo é um teste da skill `design-taste-frontend` (instalada via `skills-lock.json`,
fonte `Leonxlnx/taste-skill`), que o usuário quer avaliar antes de decidir entre ela e um
plugin oficial de frontend.

A skill é construída para **landing pages, portfólios e redesigns de marketing** e
declara explicitamente, na sua seção "Out of Scope", que **não** se aplica a
"dashboards / dense product UI / admin panels" nem a "data tables" — categoria exata do
sys-adivert (painel interno de RH: tabela de dados, modais de CRUD, exportação de
PDF/Excel, fluxo de histórico). A skill instrui que, nesse caso, isso deve ser dito
explicitamente e que só as partes genéricas de "taste" (não as mecânicas de landing page)
devem ser aplicadas.

Decisão confirmada com o usuário: aplicar **somente** as regras genéricas de qualidade da
skill — calibração de cor, tipografia, consistência de forma, contraste/acessibilidade de
botões e formulários, evitar "AI tells" (linguagem de ícone inconsistente, em dash como
floreio) — e **ignorar** todas as mecânicas específicas de landing page (hero, bento grid,
marquee, GSAP scroll-hijack, eyebrows, kinetic type etc.), que não se aplicam a este app.

Uma auditoria (6 agentes em paralelo, um por dimensão) foi executada sobre
`front-end/src/index.css` (~2730 linhas) e todos os componentes em `front-end/src/components/`,
produzindo 45 achados concretos. Este documento organiza os achados relevantes (severidade
média/alta, mais os de baixa severidade que são triviais de resolver junto) num plano de
refino em 4 blocos.

## Decisões confirmadas com o usuário

1. **Escopo da skill:** aplicar só a camada de "taste" genérica; ignorar regras de landing page.
2. **Modo de redesign:** preservar e refinar — vermelho `#a81515` continua o único acento de
   marca; estrutura/IA das telas não muda.
3. **Escopo de telas:** app inteiro (tela principal + todos os modais), não só a tela principal.
4. **Sistema de ícones:** migrar para uma biblioteca de ícones SVG — **Phosphor Icons**
   (`@phosphor-icons/react`), primeira opção recomendada pela skill para este cenário,
   funciona como componente React puro (o projeto não usa Tailwind), usa `currentColor`
   (elimina o hack atual `filter: brightness(0) invert(1)` nos PNGs do menu escuro).

## Objetivos

1. Corrigir a base de tokens (cor, raio, sombra, espaçamento, transição) para que sejam
   realmente aplicados em todo o app, não só declarados.
2. Levar a paleta a um único acento (vermelho) + neutros, eliminando cores "de marca"
   paralelas (azul/verde/roxo morto) usadas sem critério semântico.
3. Corrigir contraste (WCAG AA) em texto mudo, estados desabilitados, e adicionar foco
   visível em campos/dropdowns.
4. Substituir a linguagem de ícone fragmentada (PNG + emoji + caracteres digitados) por um
   sistema único (Phosphor Icons).
5. Reduzir aninhamento excessivo de "caixas com borda" e padronizar o padding das caixas de
   destaque recorrentes.
6. Remover o em dash usado como conector genérico na cópia em português.

## Design

### Bloco A — Fundação: tokens, cor, contraste e movimento

**A1. Fundo da página (`body`, `index.css` linha ~49)**
Hoje: `background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)` — um
azul-marinho sem relação com o vermelho DANLEX ou com qualquer outra cor do app; lê como
fundo de template genérico.
Direção: substituir por um neutro discreto derivado da própria escala de cinza do app
(ex.: um gradiente sutil entre `--gray-800`/`--gray-900`, ou um cinza claro com leve
tingimento quente), sem alterar o card branco, a borda vermelha do topo, nem o layout.

**A2. Consistência de cor (Color Consistency Lock)**
- Remover `--purple` / `--purple-dark` (`index.css` linhas 15-16) — declarados e nunca usados.
- Botões de ação secundária que hoje usam azul/verde como se fossem "marca" (`.acoes-btn--editar`,
  `.acoes-btn--pdf`, `.add-btn-nova`, `.colab-btn-listar`, `.add-btn-confirm`, `.add-btn-salvar`,
  `.colab-btn-novo`) passam a usar tratamento neutro (cinza ou vermelho-contorno), reservando
  vermelho saturado só para ação primária/destrutiva.
- `.badge-escrita` / `.badge-verbal` (linhas ~1008-1018, azul e laranja) passam a neutros —
  o campo "Tipo" não tem semântica de status.
- Unificar os ~4 tons de "linha/opção selecionada" hoje espalhados
  (`#ffeaea`, `--red-light` `#f9e5e5`, `#fff8e1`, `#ddeafd`/`#e8f0fe`) em um só, derivado de
  `--red-light`.
- Variáveis não declaradas usadas com fallback (`--text-primary`, `--text-muted`,
  `--border-color`, `--blue-primary-rgb` — bloco "modo múltiplo" de `Add.tsx`,
  linhas ~2216-2295) passam a apontar para os tokens `--gray-*` já existentes, ou são
  substituídas pela referência direta ao token.

**A3. Consistência de forma e sombra (Shape Consistency Lock)**
- Corrigir o raio incoerente da barra de busca principal: `.search-colab-select .add-input`
  (linha ~125, `border-radius: 8px 0 0 8px`) passa a usar `var(--radius-md)` para bater com
  `.search-buttom` (linha ~150), já que os dois formam uma peça só.
- Substituir raios crus (8px, 6px, 4px) por tokens `--radius-*` existentes onde fizer sentido
  (`.add-btn-fechar`, `.btn-inspecionar`, `.add-modo-toggle-bar`, `.add-multiplo-secao`,
  scrollbars, `.tabela-hint kbd`).
- Sombras ad hoc que não usam `--shadow-sm/md/lg` (`.acoes-btn:hover`, `.toast`) passam a
  reutilizar os tokens existentes.

**A4. Contraste e acessibilidade**
- Texto "vazio"/"carregando" hoje em `--gray-500` (#adb5bd) ou `#aaa` (contraste ~2.1-2.3:1)
  escurece para um tom que bata 4.5:1 no fundo branco (ex.: aproximar de `--gray-600`/`700`),
  aplicado de forma consistente em `.tabela-vazia__texto`, `.add-vazio`, `.add-card-motivo`,
  `.motivos-select__placeholder` e equivalentes.
- Botões desabilitados (`.btn:disabled`, `.acoes-btn:disabled`, `.colab-btn-download:disabled`,
  `.search-buttom:disabled` — hoje 5 valores de opacity diferentes: 0.40/0.45/0.55/0.65/0.70)
  passam a um tratamento único que preserva legibilidade do texto (não só opacity sobre fundo
  colorido).
- Adicionar anel de foco visível (`box-shadow`, no tom do acento já em uso) em
  `.add-input:focus`, `select:focus`, `.motivos-select__trigger:focus`,
  `.tipo-select__trigger:focus`, `.search-input:focus` — hoje todos suprimem o `outline`
  nativo e só trocam a cor da borda.
- Corrigir a inversão de hover em `.colab-btn-remover--ativo` (Colaboradores.tsx linha ~161):
  hoje o hover da variante "cancelar remoção" herda o vermelho de `.colab-btn-remover:hover`,
  fazendo um botão neutro parecer destrutivo ao passar o mouse.

**A5. Movimento/transição consistente**
- `.acoes-btn:hover` (translateY(-4px) + sombra bespoke) e `.btn:hover` (translateY(-1px) +
  `--shadow-sm`) convergem para uma única "personalidade" de hover-lift.
- Elementos que hoje usam duração/easing fora de `var(--transition)`
  (`.config-tab`, `.btn-inspecionar`, `.assinada-toggle`, `.add-btn-remover-colab`) passam a
  usar o token, ou um segundo token dedicado (`--transition-fast`) se uma velocidade diferente
  for intencional.
- `.btn:active` ganha um estado de pressionado distinto (não só reverter o hover); botões
  somente-ícone hoje sem nenhum `:active` (`.add-btn-fechar`, `.add-btn-icone`,
  `.hist-btn-voltar`) recebem o mesmo tratamento leve.

**A6. Pontinha solta da spec de rolagem anterior**
`.add-colabs-lista` (scrollbar da lista de colaboradores dentro de "Nova Advertência",
linhas ~2374-2380) ainda usa o scrollbar vermelho antigo — não foi migrado para o cinza
discreto definido na spec de 2026-07-20. Inclui na mesma leva de seletores que já recebem o
tratamento cinza.

### Bloco B — Sistema de ícones (Phosphor Icons)

- Adicionar dependência `@phosphor-icons/react`.
- Substituir, em todo o app, ícones PNG (`plus.png`, `colab.png`, `settings.png`,
  `search.png`, `close.png`, `download.png`, `edit.png`, `lixeira.png`) e todo emoji/caractere
  usado como ícone funcional por componentes Phosphor equivalentes, com peso e tamanho
  padronizados por contexto (ex.: 20-22px no menu lateral, 16-18px em botões inline,
  14-16px em badges/rótulos pequenos). Cor via `currentColor` (herdada do CSS do elemento pai)
  em vez do filtro `brightness(0) invert(1)`.
- Mapeamento (não exaustivo — a lista completa de ocorrências está nos achados da auditoria,
  arquivo de referência: journal da auditoria desta sessão):
  - Menu lateral: `plus.png`→`Plus`, `colab.png`→`Users`, `download.png`→`DownloadSimple`,
    `settings.png`→`Gear`.
  - Barra de ações da tabela (`App.tsx`, hoje 🔍🗑️✏️📄): `MagnifyingGlass`, `Trash`,
    `PencilSimple`, `FilePdf`.
  - Fechar/voltar (hoje `close.png` + `✕` + `←` competindo): um único par `X` / `ArrowLeft`
    em todos os cabeçalhos de modal e fluxo de Histórico.
  - Confirmar (hoje `✔` + `✅`): `Check` / `CheckCircle` (mantendo `CheckCircle`/quadrado
    vazio como badge de "Assinada", já que ali há semântica real de status).
  - Carregando (hoje `⏳` em alguns lugares, "..." simples em outros):
    padronizar em um só indicador (texto "..." onde já é o padrão majoritário, sem o emoji).
  - Histórico/exportação (hoje 📥📄📊): `DownloadSimple`, `FilePdf`, `FileXls`.
  - Toast (`Toast.tsx`, hoje ✅❌ℹ️): `CheckCircle`, `XCircle`, `Info`.
- Remover do repositório os PNGs que ficarem sem uso após a migração
  (`plus.png`, `colab.png`, `settings.png`, `search.png`, `close.png`, `download.png`,
  `edit.png`, `lixeira.png`). **`danlex.png`** (logo da empresa) e **`favicon.ico`** não são
  tocados.

### Bloco C — Menos aninhamento de caixas

- `Add.tsx`, `renderFormMultiplo` (linhas ~478-613): hoje até 4 níveis de caixa com
  borda/fundo aninhados (`.caixa` → `.add-form-box` → `.add-lote-toggle` →
  `.add-multiplo-secao` ×2) para um formulário conceitualmente único. Achatar para
  título + divisor simples (no mesmo espírito de `.inspecionar-body`), mantendo caixa com
  borda só onde há de fato uma escolha destacada (o toggle de modo).
- `Colaboradores.tsx` (linhas ~202-250, fluxo de remover por nome): as duas caixas
  sequenciais (busca em vermelho + confirmação em amarelo) passam a um painel único e
  contínuo, com a confirmação como mudança de estado inline em vez de uma segunda caixa.
- `.hist-resultado-header` (linha ~1905): remove borda/sombra — passa a subtítulo simples
  (peso/cor), já que é só uma restatement do filtro atual, sem necessidade de elevação.
- Padronizar o padding das "caixas de destaque com borda de cor" recorrentes
  (`.add-form-box`, `.colab-form-box`, `.colab-remover-bar`, `.colab-confirm-box`,
  `.hist-busca-box`, `.hist-gerar-box` — hoje 6 combinações diferentes de padding) numa
  única receita.

### Bloco D — Limpeza de cópia

Remover o em dash (—) usado como conector genérico em textos visíveis, substituindo por
pontuação normal em português (vírgula, dois-pontos, ou frase separada). Ocorrências
identificadas: `Add.tsx` (linhas ~134, 140, 403, 456, 584, 591), `Update.tsx` (linha ~166),
`Tabela.tsx` (linha ~57, tooltip de botão), `HistoricoColaborador.tsx` (linha ~114),
`App.tsx` (linha ~331, texto de confirmação de download em lote).

## Arquivos afetados

- `front-end/src/index.css` — maior parte das mudanças (tokens, cor, forma, contraste,
  movimento, remoção de caixas/paddings).
- `front-end/src/App.tsx` — troca de ícones, cópia (em dash), ajustes de classe onde caixas
  forem achatadas.
- `front-end/src/components/*.tsx` — troca de ícones e cópia nos componentes listados acima
  (`Add.tsx`, `Update.tsx`, `Excluir.tsx`, `Colaboradores.tsx`, `Configuracoes.tsx`,
  `Tabela.tsx`, `Toast.tsx`, `HistoricoMenu.tsx`, `HistoricoColaborador.tsx`,
  `HistoricoMotivo.tsx`, `GerarHistoricoColaborador.tsx`, `GerarHistoricoMotivo.tsx`,
  `EvidenciasUploader.tsx`).
- `front-end/package.json` — nova dependência `@phosphor-icons/react`.
- `front-end/public/*.png` — remoção dos ícones PNG substituídos (mantendo `danlex.png`).

## Verificação

- `npm run build` (tsc + vite) sem erros de tipo.
- Revisão visual em 1920×1080, 1366×768 e 1280×720: nenhuma regressão nas correções de
  responsividade da spec de 2026-07-20 (modal de histórico ainda rola internamente, barra da
  lista de advertências ainda cinza e sempre visível).
- Checagem manual de contraste (texto mudo, estados desabilitados) com uma ferramenta de
  contraste ou inspeção visual cuidadosa.
- Navegação por teclado (Tab) em pelo menos um formulário (Add) e um dropdown customizado
  (Motivo) para confirmar o anel de foco visível.
- Conferir visualmente que nenhum PNG antigo ficou referenciado após a migração de ícones
  (build não deve ter 404 de imagem).

## Fora de escopo

- Qualquer regra da skill específica de landing page (hero, bento grid, marquee, GSAP
  scroll-hijack, eyebrows, kinetic type, etc.) — não se aplica a este admin panel.
- Back-end, API, banco de dados, geração de PDF/Excel (lógica), autenticação.
- Novas funcionalidades, mudança de IA (fluxos/telas), mudança de nomes de campos.
- Modo escuro (não mandatório para uma ferramenta interna, e não solicitado pelo usuário).
- Mudança da cor de marca (vermelho `#a81515` permanece o único acento).
