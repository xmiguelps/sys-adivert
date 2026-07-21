# Design — Excel em "Histórico por motivo" + Responsividade + Rolagem da lista

**Data:** 2026-07-20
**Projeto:** sys-adivert (Sistema de Advertências — DANLEX)
**Escopo:** apenas front-end (`front-end/sys-adivert`). Nenhuma alteração no back-end.

## Contexto

App React 19 + Vite + TypeScript. Estado central em `App.tsx`, estilo único em `src/index.css`
(~2.650 linhas). Geração de arquivos: `pdfmake` (PDF), `xlsx` (Excel), `jszip` (lote).

O fluxo de Histórico tem dois ramos:
- **Por colaborador** (`GerarHistoricoColaborador`) — já gera **Excel** via `utils/excelHistorico.ts`.
- **Por motivo** (`GerarHistoricoMotivo`) — hoje só gera **PDF**.

## Objetivos

1. **Excel em "por motivo"** — dar a opção de exportar o histórico por motivo em Excel, além do PDF.
2. **Responsividade em notebooks pequenos** (alvo ~1366×768 e 1280×720) — nada pode ficar
   cortado/inacessível. O caso concreto reportado: o modal de histórico por motivo corta os
   rádios "Sem filtro / Filtrar por mês / Filtrar por dia" e o botão de gerar.
3. **Rolagem da lista de advertências** — a barra da tabela principal deve ficar **sempre visível,
   discreta e cinza** (aparência de barra "normal" de sistema).

## Decisões (confirmadas com o usuário)

- Excel: **dois botões** lado a lado (📄 Gerar PDF / 📊 Gerar Excel), não um seletor.
- Rolagem: **sempre visível, discreta e cinza** (não a barra vermelha atual).
- Responsividade: corrigir **tudo** que quebra em telas pequenas, **mantendo o visual em telas grandes**.
- Rolagem "principal" = a da **lista de advertências** (tabela), não a da página.

## Design

### 1. Excel no `GerarHistoricoMotivo.tsx`
- Importar `downloadHistoricoExcel` de `../utils/excelHistorico` (reuso — os itens `doMes`/`doDia`
  já têm `{data, matricula, nome, tipo, motivo}`, compatível com `AdvertenciaExcel`).
- Adicionar handlers `gerarMesExcel` / `gerarDiaExcel` (espelham os de PDF).
- Nos dois blocos (`modo === 'mes'` e `modo === 'dia'`), o rodapé passa a ter **dois botões**:
  - PDF: mantém o comportamento atual (variante vermelha `hist-btn-pdf`).
  - Excel: novo, variante verde (consistente com a tela "por colaborador").
- Nomes de arquivo: `historico_motivo_<mes>_<ano>.xlsx` e `historico_motivo_<dd-mm-aaaa>.xlsx`.
- `baixando` compartilhado desabilita ambos durante a geração.

### 2. Rolagem da lista (`.box-adiverts`) — `index.css`
- `overflow-y: auto` → **`overflow-y: scroll`** + manter `scrollbar-gutter: stable` (sempre visível, sem “pulo”).
- Substituir o bloco de scrollbar vermelho (que hoje estiliza `.box-adiverts` e `.hist-tabela-wrap`)
  por um **cinza discreto**: trilho `--gray-200`, polegar `--gray-400` arredondado, hover `--gray-500`;
  Firefox via `scrollbar-color`/`scrollbar-width: thin`. Aplicado também às tabelas de histórico
  (`.hist-tabela-wrap`) para consistência.

### 3. Responsividade — `index.css`
**3a. Modais de histórico (bug da imagem):**
- `.caixa--hist`: `overflow: visible` → **`overflow-y: auto; overflow-x: hidden`** (rola internamente).
- `.hist-popup`: remover `height: 100%` (passa a crescer com o conteúdo; a caixa rola quando excede `max-height`).
- Seguro: os dropdowns de Motivo/Tipo/Colaborador são `position: fixed`, então **não são cortados** pelo `overflow`.

**3b. Breakpoint de altura para notebooks** (`@media (max-height: 850px)`), aplicado só em telas baixas:
- `.box-body`: reduzir padding e gap; header com menos padding-bottom.
- `.logo` 70→52px; `.box-body h1` 22→18px.
- `.box-main`: reduzir `min-height`.
- Listas/tabelas internas: reduzir `max-height` (`.hist-tabela-wrap`, `.add-lista`, `.colab-lista`).
- `.hist-menu-card`, `.hist-menu-icon`, `.caixa` padding: compactar.

**3c. Rede de segurança:** manter `overflow: hidden` no `.box-body` (página não rola — só a lista),
confiando no layout flex + rolagem interna da tabela para conter tudo dentro da viewport após a compactação.

## Arquivos alterados
- `src/components/GerarHistoricoMotivo.tsx` — feature Excel.
- `src/index.css` — rolagem + responsividade + variantes de botão.

## Verificação
- `npm run build` (tsc + vite) deve passar sem erros de tipo.
- Revisão visual nos breakpoints: 1920×1080 (inalterado), 1366×768 e 1280×720 (nada cortado;
  modal de histórico rola; barra da lista cinza sempre visível).

## Fora de escopo
- Back-end, autenticação, novas colunas nos relatórios, mudança de paleta geral.
