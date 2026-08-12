# Refino Visual (design-taste-frontend) + Migração de Ícones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the sys-adivert front-end's visual consistency (color, shape, spacing, contrast, motion) and replace its fragmented icon language (PNG + emoji + typed glyphs) with a single Phosphor Icons system, without changing behavior, IA, or the red DANLEX brand.

**Architecture:** Pure CSS/JSX edits to an existing Vite + React 19 + TypeScript app with one global stylesheet (`front-end/src/index.css`) and no component library. No new abstractions — apply existing CSS custom properties consistently, and introduce one new icon dependency.

**Tech Stack:** React 19, TypeScript, Vite, plain CSS (custom properties), `@phosphor-icons/react` (new).

**Spec:** `docs/superpowers/specs/2026-08-06-refino-visual-taste-design.md`

## Global Constraints

- **No test framework exists in this project** (no jest/vitest/testing-library in `front-end/package.json`). "Run tests" in this plan means: `npm run build` (runs `tsc -b && vite build`, catches TypeScript/JSX errors) run from `front-end/`, plus targeted `grep` commands asserting old patterns are gone, plus a manual visual check via the dev server. Do not invent a test suite that doesn't exist.
- Every `grep` command in this plan is run from the repo root `C:\Users\Miguel Alves\Documents\Estudos - Miguel Passos\dlx\sys-adivert`.
- `--red-primary` (`#a81515`) stays the only accent for **destructive** actions (Excluir, Remover, "Sim, remover"). `--green-primary` stays the only accent for **affirmative/state-changing** actions (Salvar, Criar, Adicionar). Blue stays the established color for **form-focus/interactive** cues (input focus rings, custom-select triggers) — it is being removed only from **buttons that used it as a decorative "brand" color** (Editar, Baixar PDF, Nova Advertência, Anexar imagens), which fall back to neutral gray.
- All new/changed radii, shadows, spacing, and transition durations must reference existing CSS custom properties (`--radius-*`, `--shadow-*`, `--transition*`, `--gray-*`) — no new raw magic numbers unless a step explicitly introduces a new named token.
- All Phosphor icons are imported by name from `@phosphor-icons/react` (e.g. `import { X, ArrowLeft } from "@phosphor-icons/react"`), default `weight="regular"` unless a step says otherwise. Never hand-roll SVG icon paths.
- `front-end/tsconfig.app.json` has `"noUnusedLocals": true` and `"noUnusedParameters": true` — `npm run build` fails on any imported icon that isn't actually referenced in that file's JSX. Every icon-migration task's import list in this plan was checked against its own JSX edits before being written down; if you add or drop an icon reference while executing a step, update that file's import line in the same step.
- UI copy stays in Portuguese. Do not change field names, route/IA structure, or component prop signatures.
- After every task, run `npm run build` from `front-end/` and confirm it exits 0 before moving to the next task.

---

### Task 1: Remove dead CSS + fix the search-bar radius mismatch

**Files:**
- Modify: `front-end/src/index.css`

**Interfaces:**
- Consumes: current `index.css` as read in this session (unmodified baseline).
- Produces: `index.css` with no `--purple`/`--purple-dark` tokens, no `.colab-btn-listar`/`.colab-btn-refresh`/`.colab-btn-download`/`.search-input` rules, and a search bar whose two halves share one radius token. All later tasks assume these are already gone.

- [ ] **Step 1: Remove the dead `--purple` tokens**

```css
/* index.css — old (inside :root, right after --red-light) */
    --blue-primary:  #1565c0;
    --blue-dark:     #0d47a1;

    --green-primary: #2e7d32;
    --green-dark:    #1b5e20;

    --purple:        #6a1fc2;
    --purple-dark:   #4a148c;

    --orange:        #e65100;
```

```css
/* index.css — new */
    --blue-primary:  #1565c0;
    --blue-dark:     #0d47a1;

    --green-primary: #2e7d32;
    --green-dark:    #1b5e20;

    --orange:        #e65100;
```

- [ ] **Step 2: Remove the dead `.search-input` rule**

```css
/* index.css — old */
.search-colab-select .add-input {
    width: 100%;
    height: 43px;
    border-radius: 8px 0 0 8px;
    border-right: none;
    font-size: 14px;
}

.search-input {
    flex: 1;
    padding: 9px 14px;
    border: 2px solid var(--gray-300);
    border-right: none;
    border-radius: var(--radius-md) 0 0 var(--radius-md);
    font-size: 14px;
    background: #fff;
    transition: border-color var(--transition);
    outline: none;
}

.search-input:focus {
    border-color: var(--red-primary);
}

.search-buttom {
```

```css
/* index.css — new (also fixes the radius mismatch: the search input's
   outer corners now use the same --radius-md token as .search-buttom,
   so the joined pill has one consistent curvature) */
.search-colab-select .add-input {
    width: 100%;
    height: 43px;
    border-radius: var(--radius-md) 0 0 var(--radius-md);
    border-right: none;
    font-size: 14px;
}

.search-buttom {
```

- [ ] **Step 3: Remove the dead "COLABORADORES — novos botões" block**

```css
/* index.css — old */
/* ══════════════════════════════════════════════════
   COLABORADORES — novos botões
══════════════════════════════════════════════════ */
.colab-btn-refresh {
    background: var(--blue-primary);
    color: #fff;
    border-color: var(--blue-primary);
    font-weight: 600;
}

.colab-btn-refresh:hover:not(:disabled) {
    background: var(--blue-dark);
    border-color: var(--blue-dark);
}

.colab-btn-download {
    background: var(--green-primary);
    color: #fff;
    border-color: var(--green-primary);
    font-weight: 600;
}

.colab-btn-download:hover:not(:disabled) {
    background: var(--green-dark);
    border-color: var(--green-dark);
}

.colab-btn-download:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.colab-lista-info {
```

```css
/* index.css — new */
.colab-lista-info {
```

- [ ] **Step 4: Remove the dead `.colab-btn-listar` rule**

```css
/* index.css — old */
.colab-btn-novo   { background: var(--green-primary); border-color: var(--green-primary); }
.colab-btn-novo:hover { background: #fff; color: var(--green-primary); }

.colab-btn-remover {
```

Note: `.colab-btn-listar` sits between `.colab-btn-novo:hover` and the `.colab-btn-remover` block in the real file — locate it by its own two-line body and delete both lines:

```css
/* index.css — old (delete these two lines, which appear right after
   the .colab-btn-novo:hover rule above) */
.colab-btn-listar { background: var(--blue-primary); border-color: var(--blue-primary); }
.colab-btn-listar:hover:not(:disabled) { background: #fff; color: var(--blue-primary); }

```

Delete just that two-line pair (and the blank line after it), leaving `.colab-btn-novo:hover` immediately followed by the `/* ── Remover por nome ── */` comment that precedes `.colab-btn-remover`.

- [ ] **Step 5: Fold `.add-colabs-lista` into the shared gray-scrollbar system**

```css
/* index.css — old */
.box-adiverts::-webkit-scrollbar,
.hist-tabela-wrap::-webkit-scrollbar,
.caixa::-webkit-scrollbar,
.add-lista::-webkit-scrollbar,
.colab-lista::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}

.box-adiverts::-webkit-scrollbar-track,
.hist-tabela-wrap::-webkit-scrollbar-track,
.caixa::-webkit-scrollbar-track,
.add-lista::-webkit-scrollbar-track,
.colab-lista::-webkit-scrollbar-track {
    background: var(--gray-200);
    border-radius: 8px;
}

.box-adiverts::-webkit-scrollbar-thumb,
.hist-tabela-wrap::-webkit-scrollbar-thumb,
.caixa::-webkit-scrollbar-thumb,
.add-lista::-webkit-scrollbar-thumb,
.colab-lista::-webkit-scrollbar-thumb {
    background: var(--gray-500);
    border-radius: 8px;
    border: 2px solid var(--gray-200);
    background-clip: padding-box;
}

.box-adiverts::-webkit-scrollbar-thumb:hover,
.hist-tabela-wrap::-webkit-scrollbar-thumb:hover,
.caixa::-webkit-scrollbar-thumb:hover,
.add-lista::-webkit-scrollbar-thumb:hover,
.colab-lista::-webkit-scrollbar-thumb:hover {
    background: var(--gray-600);
    border: 2px solid var(--gray-200);
    background-clip: padding-box;
}

/* Firefox */
.box-adiverts,
.hist-tabela-wrap,
.caixa,
.add-lista,
.colab-lista {
    scrollbar-color: var(--gray-500) var(--gray-200);
    scrollbar-width: thin;
}
```

```css
/* index.css — new */
.box-adiverts::-webkit-scrollbar,
.hist-tabela-wrap::-webkit-scrollbar,
.caixa::-webkit-scrollbar,
.add-lista::-webkit-scrollbar,
.colab-lista::-webkit-scrollbar,
.add-colabs-lista::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}

.box-adiverts::-webkit-scrollbar-track,
.hist-tabela-wrap::-webkit-scrollbar-track,
.caixa::-webkit-scrollbar-track,
.add-lista::-webkit-scrollbar-track,
.colab-lista::-webkit-scrollbar-track,
.add-colabs-lista::-webkit-scrollbar-track {
    background: var(--gray-200);
    border-radius: 8px;
}

.box-adiverts::-webkit-scrollbar-thumb,
.hist-tabela-wrap::-webkit-scrollbar-thumb,
.caixa::-webkit-scrollbar-thumb,
.add-lista::-webkit-scrollbar-thumb,
.colab-lista::-webkit-scrollbar-thumb,
.add-colabs-lista::-webkit-scrollbar-thumb {
    background: var(--gray-500);
    border-radius: 8px;
    border: 2px solid var(--gray-200);
    background-clip: padding-box;
}

.box-adiverts::-webkit-scrollbar-thumb:hover,
.hist-tabela-wrap::-webkit-scrollbar-thumb:hover,
.caixa::-webkit-scrollbar-thumb:hover,
.add-lista::-webkit-scrollbar-thumb:hover,
.colab-lista::-webkit-scrollbar-thumb:hover,
.add-colabs-lista::-webkit-scrollbar-thumb:hover {
    background: var(--gray-600);
    border: 2px solid var(--gray-200);
    background-clip: padding-box;
}

/* Firefox */
.box-adiverts,
.hist-tabela-wrap,
.caixa,
.add-lista,
.colab-lista,
.add-colabs-lista {
    scrollbar-color: var(--gray-500) var(--gray-200);
    scrollbar-width: thin;
}
```

- [ ] **Step 6: Remove the now-redundant standalone red scrollbar for `.add-colabs-lista`**

```css
/* index.css — old */
/* Scrollbar na lista de colabs */
.add-colabs-lista::-webkit-scrollbar {
    width: 4px;
}
.add-colabs-lista::-webkit-scrollbar-thumb {
    background: var(--red-primary);
    border-radius: 4px;
}

/* Botão adicionar mais colaboradores */
```

```css
/* index.css — new */
/* Botão adicionar mais colaboradores */
```

- [ ] **Step 7: Verify the dead code and mismatch are gone**

Run: `grep -n "purple\|colab-btn-listar\|colab-btn-refresh\|colab-btn-download\|\.search-input" "front-end/src/index.css"`
Expected: no output (exit code 1 — no matches).

Run: `cd front-end && npm run build`
Expected: exits 0, no TypeScript/build errors.

- [ ] **Step 8: Commit**

```bash
git add front-end/src/index.css
git commit -m "style: remove dead CSS tokens/rules, fix search bar radius mismatch"
```

---

### Task 2: Recolor the page backdrop to relate to the brand

**Files:**
- Modify: `front-end/src/index.css`

**Interfaces:**
- Consumes: Task 1's `index.css`.
- Produces: `body` background is a neutral dark-gray gradient built from existing `--gray-800`/`--gray-900` tokens instead of an unrelated navy gradient. The white `.box-body` card, its red top border, and layout are untouched.

- [ ] **Step 1: Replace the navy gradient**

```css
/* index.css — old */
body {
    width: 100%;
    min-height: 100vh;
    overflow-x: hidden;
    display: flex;
    justify-content: center;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: var(--gray-800);
}
```

```css
/* index.css — new */
body {
    width: 100%;
    min-height: 100vh;
    overflow-x: hidden;
    display: flex;
    justify-content: center;
    background: linear-gradient(135deg, var(--gray-800) 0%, var(--gray-900) 100%);
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: var(--gray-800);
}
```

- [ ] **Step 2: Verify**

Run: `grep -n "1a1a2e\|16213e\|0f3460" "front-end/src/index.css"`
Expected: no output.

Run: `cd front-end && npm run build`
Expected: exits 0.

Visual check: use the `run` skill to start the dev server and open the app. The page backdrop should read as a neutral dark charcoal gradient (no blue hue), with the white card and red top border unchanged and still clearly popping against it.

- [ ] **Step 3: Commit**

```bash
git add front-end/src/index.css
git commit -m "style: recolor page backdrop from navy gradient to neutral dark gray"
```

---

### Task 3: Color Consistency Lock — buttons, badges, selected-state, and the "modo múltiplo" tokens

**Files:**
- Modify: `front-end/src/index.css`
- Modify: `front-end/src/App.tsx`

**Interfaces:**
- Consumes: Task 2's `index.css`.
- Produces: red = destructive only, green = affirmative/save only, no button uses blue as a decorative brand color, `.badge-escrita`/`.badge-verbal` are neutral, all "selected/hover" tints share one token, the "modo múltiplo" CSS block uses the app's real `--gray-*` tokens and px sizes instead of undeclared variables and a parallel rem scale.

- [ ] **Step 1: Remove the blue/green color overrides from `.acoes-btn--editar` and `.acoes-btn--pdf`**

```css
/* index.css — old */
.acoes-btn--editar {
    background: var(--blue-primary);
    border-color: var(--blue-primary);
}

.acoes-btn--editar:hover:not(:disabled) {
    background: var(--blue-dark);
    border-color: var(--blue-dark);
}

.acoes-btn--pdf {
    background: var(--green-primary);
    border-color: var(--green-primary);
}

.acoes-btn--pdf:hover:not(:disabled) {
    background: var(--green-dark);
    border-color: var(--green-dark);
}

.acoes-btn--disabled,
```

```css
/* index.css — new (Editar and Baixar PDF now fall back to the plain
   gray .acoes-btn look, same as Inspecionar already has) */
.acoes-btn--disabled,
```

- [ ] **Step 2: Drop the now-unused modifier classes from `App.tsx`**

```tsx
{/* App.tsx — old */}
                        <button
                            className={`acoes-btn acoes-btn--editar ${selectedIds.length !== 1 ? 'acoes-btn--disabled' : ''}`}
                            onClick={() => selectedIds.length === 1 && setUpdateView(true)}
                            disabled={selectedIds.length !== 1}
                            title="Editar (selecione uma advertência)"
                        >
                            ✏️ Editar
                        </button>
                        <button
                            className={`acoes-btn acoes-btn--pdf ${selectedIds.length === 0 ? 'acoes-btn--disabled' : ''}`}
```

```tsx
{/* App.tsx — new */}
                        <button
                            className={`acoes-btn ${selectedIds.length !== 1 ? 'acoes-btn--disabled' : ''}`}
                            onClick={() => selectedIds.length === 1 && setUpdateView(true)}
                            disabled={selectedIds.length !== 1}
                            title="Editar (selecione uma advertência)"
                        >
                            ✏️ Editar
                        </button>
                        <button
                            className={`acoes-btn ${selectedIds.length === 0 ? 'acoes-btn--disabled' : ''}`}
```

(The `✏️ Editar` emoji is replaced with a Phosphor icon in Task 10 — leave the text as-is here, this step only removes the color modifier classes.)

- [ ] **Step 3: Recolor `.add-btn-nova` and `.evid-add-btn` from blue to neutral gray**

```css
/* index.css — old */
.add-btn-nova     { background: var(--blue-primary); border-color: var(--blue-primary); }
.add-btn-nova:hover { background: #fff; color: var(--blue-primary); }
```

```css
/* index.css — new */
.add-btn-nova     { background: var(--gray-700); border-color: var(--gray-700); }
.add-btn-nova:hover { background: #fff; color: var(--gray-700); }
```

```css
/* index.css — old */
.evid-add-btn {
    background: var(--blue-primary) !important;
    color: #fff !important;
    border: none !important;
    padding: 6px 14px !important;
    font-size: 13px;
    border-radius: var(--radius-sm);
    cursor: pointer;
}
.evid-add-btn:hover:not(:disabled) { background: var(--blue-dark) !important; }
```

```css
/* index.css — new */
.evid-add-btn {
    background: var(--gray-700) !important;
    color: #fff !important;
    border: none !important;
    padding: 6px 14px !important;
    font-size: 13px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
.evid-add-btn:hover:not(:disabled) { background: var(--gray-800) !important; }
```

- [ ] **Step 4: Make the Tipo badges neutral (no status semantics on Escrita/Verbal)**

```css
/* index.css — old */
.badge-escrita {
    background: #e3f2fd;
    color: var(--blue-dark);
    border: 1px solid #90caf9;
}

.badge-verbal {
    background: #fff3e0;
    color: var(--orange);
    border: 1px solid #ffcc80;
}
```

```css
/* index.css — new */
.badge-escrita {
    background: var(--gray-200);
    color: var(--gray-800);
    border: 1px solid var(--gray-400);
}

.badge-verbal {
    background: var(--gray-100);
    color: var(--gray-700);
    border: 1px solid var(--gray-300);
}
```

- [ ] **Step 5: Unify the four "selected/hover" tints onto `--red-light`**

```css
/* index.css — old */
.tabela-row--selected {
    background: #ffeaea !important;
    outline: 2px solid var(--red-primary);
    outline-offset: -2px;
}
```

```css
/* index.css — new */
.tabela-row--selected {
    background: var(--red-light) !important;
    outline: 2px solid var(--red-primary);
    outline-offset: -2px;
}
```

```css
/* index.css — old */
.colab-row--selecionada {
    background: #fff8e1 !important;
}
```

```css
/* index.css — new */
.colab-row--selecionada {
    background: var(--red-light) !important;
}
```

```css
/* index.css — old */
.motivos-select__option--selected {
    background: #ffeaea;
    color: var(--red-dark);
    font-weight: 600;
}
```

```css
/* index.css — new */
.motivos-select__option--selected {
    background: var(--red-light);
    color: var(--red-dark);
    font-weight: 600;
}
```

**No change needed for `.colab-select__option:hover`/`--selected`:** unlike the three fixed above, this pair (`#e8f0fe` hover / `#ddeafd` selected, both blue) is already internally consistent with itself — it's the "pick a person to autofill this field" autocomplete, which legitimately belongs to the blue form-interactive family (same role as `.add-input:focus`), not the red primary-selection family used by table rows and the Motivo/Tipo dropdowns. Leave it as-is.

- [ ] **Step 6: Fix the "modo múltiplo" block's undeclared CSS variables, rem scale, and letter-spacing drift**

```css
/* index.css — old */
.add-modo-toggle-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(var(--blue-primary-rgb, 21, 101, 192), 0.07);
    border: 1px solid rgba(var(--blue-primary-rgb, 21, 101, 192), 0.18);
    border-radius: 8px;
    margin-bottom: 14px;
}

.add-btn-modo-toggle {
    background: var(--blue-primary) !important;
    border-color: var(--blue-primary) !important;
    font-size: 0.82rem !important;
    padding: 5px 14px !important;
    white-space: nowrap;
}
.add-btn-modo-toggle:hover {
    background: #fff !important;
    color: var(--blue-primary) !important;
}

.add-modo-label {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--blue-primary);
}

.add-btn-modo-voltar {
    background: transparent !important;
    border-color: var(--blue-primary) !important;
    color: var(--blue-primary) !important;
    font-size: 0.8rem !important;
    padding: 4px 12px !important;
}
.add-btn-modo-voltar:hover {
    background: var(--blue-primary) !important;
    color: #fff !important;
}

.add-form-box--multiplo {
    gap: 0 !important;
}

/* Seções internas do modo múltiplo */
.add-multiplo-secao {
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 12px;
    background: rgba(0,0,0,0.015);
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.add-multiplo-secao-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 2px;
}

.add-multiplo-secao-titulo {
    font-weight: 600;
    font-size: 0.88rem;
    color: var(--text-primary, #222);
}

.add-multiplo-hint {
    font-size: 0.75rem;
    color: var(--text-muted, #888);
    font-style: italic;
}

/* Header das colunas */
.add-multiplo-cols-header {
    display: grid;
    grid-template-columns: 1fr 140px 28px;
    gap: 8px;
    padding: 0 2px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted, #888);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}
```

```css
/* index.css — new (blue kept — this toggle is form-interactive chrome,
   not a decorative brand button; tokens now reference the real declared
   scale instead of undeclared vars with drifting fallbacks; sizes moved
   from an ad hoc rem scale onto the same px scale used everywhere else) */
.add-modo-toggle-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(21, 101, 192, 0.07);
    border: 1px solid rgba(21, 101, 192, 0.18);
    border-radius: var(--radius-md);
    margin-bottom: 14px;
}

.add-btn-modo-toggle {
    background: var(--blue-primary) !important;
    border-color: var(--blue-primary) !important;
    font-size: 13px !important;
    padding: 5px 14px !important;
    white-space: nowrap;
}
.add-btn-modo-toggle:hover {
    background: #fff !important;
    color: var(--blue-primary) !important;
}

.add-modo-label {
    font-weight: 600;
    font-size: 14px;
    color: var(--blue-primary);
}

.add-btn-modo-voltar {
    background: transparent !important;
    border-color: var(--blue-primary) !important;
    color: var(--blue-primary) !important;
    font-size: 13px !important;
    padding: 4px 12px !important;
}
.add-btn-modo-voltar:hover {
    background: var(--blue-primary) !important;
    color: #fff !important;
}

.add-form-box--multiplo {
    gap: 0 !important;
}

/* Seções internas do modo múltiplo */
.add-multiplo-secao {
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
    padding: 12px 14px;
    margin-bottom: 12px;
    background: rgba(0,0,0,0.015);
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.add-multiplo-secao-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 2px;
}

.add-multiplo-secao-titulo {
    font-weight: 600;
    font-size: 14px;
    color: var(--gray-900);
}

.add-multiplo-hint {
    font-size: 12px;
    color: var(--gray-600);
    font-style: italic;
}

/* Header das colunas */
.add-multiplo-cols-header {
    display: grid;
    grid-template-columns: 1fr 140px 28px;
    gap: 8px;
    padding: 0 2px;
    font-size: 12px;
    font-weight: 600;
    color: var(--gray-600);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
```

- [ ] **Step 7: Verify**

Run: `grep -n "blue-primary-rgb\|border-color, #e0e0e0\|text-primary, #222\|text-muted, #888\|0\.82rem\|0\.9rem\|0\.8rem\|0\.88rem\|0\.75rem\|0\.03em" "front-end/src/index.css"`
Expected: no output.

Run: `grep -n "acoes-btn--editar\|acoes-btn--pdf" "front-end/src/App.tsx" "front-end/src/index.css"`
Expected: no output (both the CSS rules and the JSX class references are gone).

Run: `cd front-end && npm run build`
Expected: exits 0.

Visual check: open the app. The acoes-bar's "Editar" and "Baixar PDF" buttons are now the same gray as "Inspecionar"; only "Excluir" is red. "+ Nova Advertência" and "Anexar imagens" are gray, not blue. Open "Nova Advertência" → modo múltiplo: labels/hints render at the same sizes as the rest of the form, no visual regression.

- [ ] **Step 8: Commit**

```bash
git add front-end/src/index.css front-end/src/App.tsx
git commit -m "style: color consistency lock — neutral secondary buttons, badges, unified selected state"
```

---

### Task 4: Shape Consistency Lock — radius and shadow tokens

**Files:**
- Modify: `front-end/src/index.css`

**Interfaces:**
- Consumes: Task 3's `index.css`.
- Produces: every touched radius/shadow value now references `--radius-*`/`--shadow-*` instead of a raw number.

- [ ] **Step 1: Route raw radii through tokens**

```css
/* index.css — old */
.add-btn-fechar {
    background: var(--gray-200) !important;
    border-radius: 10px !important;
```

```css
/* index.css — new */
.add-btn-fechar {
    background: var(--gray-200) !important;
    border-radius: var(--radius-md) !important;
```

```css
/* index.css — old */
.btn-inspecionar {
    font-size: 16px;
    padding: 2px 6px;
    border-radius: 6px;
```

```css
/* index.css — new */
.btn-inspecionar {
    font-size: 16px;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
```

```css
/* index.css — old */
.tabela-hint kbd {
    background: var(--gray-200);
    border: 1px solid var(--gray-300);
    border-bottom-width: 2px;
    border-radius: 4px;
```

```css
/* index.css — new (4px is genuinely smaller than the smallest declared
   step, --radius-sm at 6px, for this tiny inline kbd chip — add the
   missing step to :root instead of leaving a raw literal) */
.tabela-hint kbd {
    background: var(--gray-200);
    border: 1px solid var(--gray-300);
    border-bottom-width: 2px;
    border-radius: var(--radius-xs);
```

```css
/* index.css — old (inside :root) */
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
```

```css
/* index.css — new */
    --radius-xs: 4px;
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
```

```css
/* index.css — old (the "modo múltiplo" block's own 8px radii, touched
   again here for the ones Task 3 didn't already convert) */
.add-modo-toggle-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(21, 101, 192, 0.07);
    border: 1px solid rgba(21, 101, 192, 0.18);
    border-radius: var(--radius-md);
    margin-bottom: 14px;
}
```

(No change needed here — Task 3 already moved this one to `var(--radius-md)`. This block is listed for context only; skip if already correct.)

- [ ] **Step 2: Route ad hoc shadows through tokens**

```css
/* index.css — old */
.acoes-btn:hover:not(:disabled) {
    transform: translateY(-4px);
    box-shadow: 0 6px 14px rgba(0,0,0,.18);
}
```

```css
/* index.css — new (also converges the hover-lift distance toward the
   rest of the app — full rationale and the matching .btn:hover change
   live in Task 6) */
.acoes-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}
```

```css
/* index.css — old */
.toast {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border-radius: var(--radius-md);
    padding: 12px 22px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 6px 24px rgba(0,0,0,.18);
    min-width: 260px;
    max-width: 420px;
    white-space: nowrap;
}
```

```css
/* index.css — new */
.toast {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border-radius: var(--radius-md);
    padding: 12px 22px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: var(--shadow-lg);
    min-width: 260px;
    max-width: 420px;
    white-space: nowrap;
}
```

- [ ] **Step 3: Verify**

Run: `grep -n "border-radius: 10px\|border-radius: 6px\|border-radius: 4px\|rgba(0,0,0,\.18)" "front-end/src/index.css"`
Expected: no output. (Deliberately excludes `rgba(0,0,0,.2)` from this check: `--shadow-lg`'s own token *definition* in `:root` legitimately contains that literal; grepping for it would always show that one expected line.)

Run: `cd front-end && npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add front-end/src/index.css
git commit -m "style: shape consistency lock — route raw radii/shadows through tokens"
```

---

### Task 5: Contrast & accessibility — muted text, disabled state, focus rings

**Files:**
- Modify: `front-end/src/index.css`

**Interfaces:**
- Consumes: Task 4's `index.css`.
- Produces: muted/empty-state text at `--gray-600` (was `--gray-500`/`#aaa`), one consolidated disabled-button treatment, visible focus rings on every text input and custom-select trigger, and a corrected hover on `.colab-btn-remover--ativo`.

- [ ] **Step 1: Darken and unify muted/empty-state text**

```css
/* index.css — old */
.add-vazio {
    color: var(--gray-500);
    text-align: center;
    margin-top: 40px;
    font-size: 14px;
}
```

```css
/* index.css — new */
.add-vazio {
    color: var(--gray-600);
    text-align: center;
    margin-top: 40px;
    font-size: 14px;
}
```

```css
/* index.css — old */
.add-card-motivo {
    font-size: 12px;
    color: var(--gray-500);
    margin-top: 2px;
}
```

```css
/* index.css — new */
.add-card-motivo {
    font-size: 12px;
    color: var(--gray-600);
    margin-top: 2px;
}
```

```css
/* index.css — old */
.motivos-select__placeholder {
    flex: 1;
    color: var(--gray-500);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
```

```css
/* index.css — new */
.motivos-select__placeholder {
    flex: 1;
    color: var(--gray-600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
```

```css
/* index.css — old */
.tabela-vazia__icone {
    display: block;
    font-size: 2.8rem;
    margin-bottom: 10px;
    opacity: 0.45;
}

.tabela-vazia__texto {
    display: block;
    font-size: 1rem;
    color: #aaa;
    font-weight: 500;
    letter-spacing: 0.02em;
}
```

```css
/* index.css — new (unified with .add-vazio's voice: same size, same
   token, no stray letter-spacing) */
.tabela-vazia__icone {
    display: block;
    font-size: 2.8rem;
    margin-bottom: 10px;
    opacity: 0.45;
}

.tabela-vazia__texto {
    display: block;
    font-size: 14px;
    color: var(--gray-600);
    font-weight: 500;
}
```

- [ ] **Step 2: Replace opacity-only disabled styling with one legible, consolidated treatment**

```css
/* index.css — old */
.btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
}
```

```css
/* index.css — new (superseded by the consolidated rule below; kept
   removed here so there is exactly one disabled rule per family) */
```

```css
/* index.css — old */
.btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }
.btn:active { transform: translateY(0); box-shadow: none; }
.btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
```

```css
/* index.css — new */
.btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }
.btn:active { transform: translateY(0) scale(0.97); box-shadow: none; }
.btn:disabled,
.acoes-btn:disabled,
.acoes-btn--disabled,
.search-buttom:disabled {
    opacity: 1;
    background: var(--gray-300) !important;
    border-color: var(--gray-300) !important;
    color: var(--gray-600) !important;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
}
```

```css
/* index.css — old */
.acoes-btn--disabled,
.acoes-btn:disabled {
    opacity: 0.40;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
}
```

```css
/* index.css — new (removed — consolidated into the single rule added
   above, next to .btn:disabled) */
```

```css
/* index.css — old */
.search-buttom:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}
```

```css
/* index.css — new (removed — consolidated into the single rule added
   above, next to .btn:disabled) */
```

- [ ] **Step 3: Add visible focus rings**

```css
/* index.css — old */
.add-input:focus { border-color: var(--blue-primary); }
```

```css
/* index.css — new */
.add-input:focus {
    border-color: var(--blue-primary);
    box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.15);
}
```

```css
/* index.css — old */
select:focus { border-color: var(--blue-primary); }
```

```css
/* index.css — new */
select:focus {
    border-color: var(--blue-primary);
    box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.15);
}
```

```css
/* index.css — old */
.motivos-select__trigger:focus,
.motivos-select--open .motivos-select__trigger {
    border-color: var(--blue-primary);
    outline: none;
}
```

```css
/* index.css — new */
.motivos-select__trigger:focus,
.motivos-select--open .motivos-select__trigger {
    border-color: var(--blue-primary);
    outline: none;
    box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.15);
}
```

```css
/* index.css — old */
.tipo-select__trigger:focus,
.tipo-select--open .tipo-select__trigger {
    border-color: var(--blue-primary);
    outline: none;
}
```

```css
/* index.css — new */
.tipo-select__trigger:focus,
.tipo-select--open .tipo-select__trigger {
    border-color: var(--blue-primary);
    outline: none;
    box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.15);
}
```

- [ ] **Step 4: Fix the "cancel toggle looks destructive on hover" bug**

```css
/* index.css — old */
.colab-btn-remover--ativo {
    background: var(--gray-600);
    border-color: var(--gray-600);
}

.colab-btn-remover-exec {
```

```css
/* index.css — new */
.colab-btn-remover--ativo {
    background: var(--gray-600);
    border-color: var(--gray-600);
}
.colab-btn-remover--ativo:hover:not(:disabled) {
    background: var(--gray-700);
    border-color: var(--gray-700);
    color: #fff;
}

.colab-btn-remover-exec {
```

- [ ] **Step 5: Verify**

Run: `grep -n "color: var(--gray-500)\|color: #aaa" "front-end/src/index.css"`
Expected: no output (the remaining legitimate `--gray-500` uses, e.g. `.colab-td--num`, `.add-modo-tab-texto small`, `.inspecionar-sem-evid`, are decorative/secondary metadata, not the empty-state/placeholder pattern this step targeted — confirm none of `.add-vazio`, `.add-card-motivo`, `.motivos-select__placeholder`, `.tabela-vazia__texto` appear in the grep output).

Run: `grep -n "opacity: 0\.4\|opacity: 0\.45\|opacity: 0\.55\|opacity: 0\.65\|opacity: 0\.7" "front-end/src/index.css"`
Expected: no output.

Run: `cd front-end && npm run build`
Expected: exits 0.

Visual check: use the `run` skill to open the app. Tab through the "Nova Advertência" form with the keyboard — every input and the Motivo/Tipo dropdown trigger should show a visible glow on focus. Select zero rows in the main table — "Inspecionar", "Editar", "Baixar PDF" should render as clearly muted but readable gray, not near-invisible. In "Gerenciar Colaboradores", click "Remover" then hover it — it must stay gray, never flash red.

- [ ] **Step 6: Commit**

```bash
git add front-end/src/index.css
git commit -m "fix: darken muted text, consolidate disabled-button styling, add focus rings"
```

---

### Task 6: Motion consistency — transitions and tactile feedback

**Files:**
- Modify: `front-end/src/index.css`

**Interfaces:**
- Consumes: Task 5's `index.css`.
- Produces: a new `--transition-fast` token; `.btn-inspecionar`, `.assinada-toggle`, `.add-btn-remover-colab` route their durations through the token system; icon-only buttons that had no `:active` state now have one.

- [ ] **Step 1: Add the `--transition-fast` token**

```css
/* index.css — old (inside :root) */
    --transition: 0.18s ease;
}
```

```css
/* index.css — new */
    --transition: 0.18s ease;
    --transition-fast: 0.08s ease;
}
```

- [ ] **Step 2: Route ad hoc durations through tokens**

```css
/* index.css — old */
.btn-inspecionar {
    font-size: 16px;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    background: rgba(21, 101, 192, 0.12) !important;
    transition: background 0.18s ease;
    cursor: pointer;
    border: none;
    line-height: 1;
}
```

```css
/* index.css — new */
.btn-inspecionar {
    font-size: 16px;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    background: rgba(21, 101, 192, 0.12) !important;
    transition: background var(--transition);
    cursor: pointer;
    border: none;
    line-height: 1;
}
```

```css
/* index.css — old */
.assinada-toggle {
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 999px;
    cursor: pointer;
    letter-spacing: 0.2px;
    white-space: nowrap;
    transition: filter 0.15s ease, transform 0.05s ease;
}
```

```css
/* index.css — new */
.assinada-toggle {
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 999px;
    cursor: pointer;
    letter-spacing: 0.2px;
    white-space: nowrap;
    transition: filter var(--transition), transform var(--transition-fast);
}
```

```css
/* index.css — old */
.add-btn-remover-colab {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid #ccc;
    background: transparent;
    color: #999;
    cursor: pointer;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: all 0.15s;
    flex-shrink: 0;
}
```

```css
/* index.css — new */
.add-btn-remover-colab {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid #ccc;
    background: transparent;
    color: #999;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: all var(--transition);
    flex-shrink: 0;
}
```

- [ ] **Step 3: Add `:active` feedback to icon-only buttons that had none**

```css
/* index.css — old */
.add-btn-fechar:hover {
    background: var(--gray-300) !important;
}
```

```css
/* index.css — new */
.add-btn-fechar:hover {
    background: var(--gray-300) !important;
}
.add-btn-fechar:active {
    transform: scale(0.93);
}
```

```css
/* index.css — old */
.add-btn-icone:hover {
    background: var(--gray-300) !important;
}
```

```css
/* index.css — new */
.add-btn-icone:hover {
    background: var(--gray-300) !important;
}
.add-btn-icone:active {
    transform: scale(0.93);
}
```

```css
/* index.css — old */
.hist-btn-voltar:hover {
    background: var(--gray-300);
}
```

```css
/* index.css — new */
.hist-btn-voltar:hover {
    background: var(--gray-300);
}
.hist-btn-voltar:active {
    transform: scale(0.97);
}
```

- [ ] **Step 4: Verify**

Run: `grep -n "transition: background 0\.18s ease\|transition: filter 0\.15s ease\|transition: all 0\.15s;" "front-end/src/index.css"`
Expected: no output. (This deliberately does not grep for the bare substring `0.18s ease`, since the `--transition: 0.18s ease;` token declaration in `:root` legitimately still contains it.)

Run: `cd front-end && npm run build`
Expected: exits 0.

Visual check: click the ✕ close button on any modal and the small edit/delete icon buttons in "Nova Advertência" and "Gerenciar Colaboradores" — each should visibly "press" (shrink slightly) on click, not just change background on hover.

- [ ] **Step 5: Commit**

```bash
git add front-end/src/index.css
git commit -m "style: route ad hoc transition durations through tokens, add missing :active feedback"
```

---

### Task 7: Spacing rhythm for accent-bordered callout boxes

**Files:**
- Modify: `front-end/src/index.css`

**Interfaces:**
- Consumes: Task 6's `index.css`.
- Produces: `.add-form-box`, `.colab-form-box`, `.colab-remover-bar`, `.colab-confirm-box`, `.hist-busca-box`, `.hist-gerar-box` all use the same `16px` vertical / `16px` horizontal padding recipe.

- [ ] **Step 1: Standardize padding**

```css
/* index.css — old */
.add-form-box {
    background: #fff;
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
    border-left: 4px solid var(--blue-primary);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
```

```css
/* index.css — new */
.add-form-box {
    background: #fff;
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
    border-left: 4px solid var(--blue-primary);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
```

```css
/* index.css — old */
.colab-remover-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    background: var(--red-light);
    border: 1px solid #f5c2c2;
    border-left: 4px solid var(--red-primary);
    border-radius: var(--radius-md);
    padding: 12px 16px;
}
```

```css
/* index.css — new */
.colab-remover-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    background: var(--red-light);
    border: 1px solid #f5c2c2;
    border-left: 4px solid var(--red-primary);
    border-radius: var(--radius-md);
    padding: 16px;
}
```

```css
/* index.css — old */
.colab-confirm-box {
    background: #fffde7;
    border: 1px solid #ffe082;
    border-left: 4px solid var(--orange);
    border-radius: var(--radius-md);
    padding: 14px 18px;
}
```

```css
/* index.css — new */
.colab-confirm-box {
    background: #fffde7;
    border: 1px solid #ffe082;
    border-left: 4px solid var(--orange);
    border-radius: var(--radius-md);
    padding: 16px;
}
```

```css
/* index.css — old */
.hist-busca-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--gray-100);
    padding: 14px 16px;
    border-radius: var(--radius-md);
    border: 1px solid var(--gray-300);
}
```

```css
/* index.css — new */
.hist-busca-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--gray-100);
    padding: 16px;
    border-radius: var(--radius-md);
    border: 1px solid var(--gray-300);
}
```

```css
/* index.css — old */
.hist-gerar-box {
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: var(--gray-100);
    padding: 16px 18px;
    border-radius: var(--radius-md);
    border: 1px solid var(--gray-300);
}
```

```css
/* index.css — new */
.hist-gerar-box {
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: var(--gray-100);
    padding: 16px;
    border-radius: var(--radius-md);
    border: 1px solid var(--gray-300);
}
```

(`.colab-form-box` already uses `padding: 16px;` — no change needed there.)

- [ ] **Step 2: Remove the elevation from the "resultado da busca" subheading**

```css
/* index.css — old */
.hist-resultado-header {
    display: flex;
    align-items: center;
    background: #fff;
    padding: 10px 14px;
    border-left: 4px solid var(--red-primary);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-sm);
}
```

```css
/* index.css — new (plain subheading — weight/color carry the hierarchy,
   no card treatment for what is just a restatement of the current filter) */
.hist-resultado-header {
    display: flex;
    align-items: center;
    padding: 4px 2px 10px;
    border-bottom: 1px solid var(--gray-200);
}
```

- [ ] **Step 3: Verify**

Run: `grep -n "padding: 14px 16px\|padding: 12px 16px\|padding: 14px 18px\|padding: 16px 18px" "front-end/src/index.css"`
Expected: no output for these five specific selectors (other unrelated rules may still legitimately use similar-looking padding values for different components — re-check by eye that `.add-form-box`, `.colab-remover-bar`, `.colab-confirm-box`, `.hist-busca-box`, `.hist-gerar-box` specifically now read `padding: 16px;`).

Run: `cd front-end && npm run build`
Expected: exits 0.

Visual check: open "Nova Advertência", "Gerenciar Colaboradores" (try "Remover"), and a "Histórico" flow — all the bordered form/callout boxes should feel like they breathe the same amount. The "X advertência(s) encontrada(s)" line in Histórico now reads as a plain subheading with a hairline underneath, not a raised card.

- [ ] **Step 4: Commit**

```bash
git add front-end/src/index.css
git commit -m "style: standardize callout-box padding, de-card the histórico result subheading"
```

---

### Task 8: Flatten the nested boxes in Add.tsx's batch form

**Files:**
- Modify: `front-end/src/components/Add.tsx`
- Modify: `front-end/src/index.css`

**Interfaces:**
- Consumes: Task 7's `index.css`, current `Add.tsx`.
- Produces: `renderFormMultiplo` uses one outer form box plus plain divider-separated sections instead of two more nested bordered/tinted boxes; `.add-multiplo-secao` is now a plain section (heading + divider), not its own card.

- [ ] **Step 1: Turn `.add-multiplo-secao` into a plain divided section**

```css
/* index.css — old */
/* Seções internas do modo múltiplo */
.add-multiplo-secao {
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
    padding: 12px 14px;
    margin-bottom: 12px;
    background: rgba(0,0,0,0.015);
    display: flex;
    flex-direction: column;
    gap: 8px;
}
```

```css
/* index.css — new */
/* Seções internas do modo múltiplo — divisor simples, sem card */
.add-multiplo-secao {
    padding-top: 12px;
    border-top: 1px solid var(--gray-200);
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.add-multiplo-secao:first-of-type {
    padding-top: 0;
    border-top: none;
}
```

- [ ] **Step 2: Simplify the "iguais para todos / individuais" toggle to a plain row (remove its own tinted box)**

```css
/* index.css — old */
/* Toggle "iguais para todos" / "individuais" no modo lote */
.add-lote-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 8px 10px;
    background: var(--gray-100, #f5f5f5);
    border-radius: var(--radius-sm);
}
```

```css
/* index.css — new */
/* Toggle "iguais para todos" / "individuais" no modo lote — linha simples */
.add-lote-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding-bottom: 4px;
}
```

- [ ] **Step 3: Verify the `renderFormMultiplo` JSX still reads as one continuous form (no code change needed — the CSS changes above are what flattens it)**

Run: `cd front-end && npm run build`
Expected: exits 0.

Visual check: open "Nova Advertência" → "Vários colaboradores". The mode-toggle row, "Colaboradores" section, and "Dados da Advertência" section should now read as one continuous form with plain divider lines between sections, not three stacked boxes each with their own border/tint.

- [ ] **Step 4: Commit**

```bash
git add front-end/src/index.css
git commit -m "style: flatten nested boxes in the batch advertência form"
```

---

### Task 9: Flatten the "remove by name" flow and the histórico result header

**Files:**
- Modify: `front-end/src/components/Colaboradores.tsx`

**Interfaces:**
- Consumes: Task 8's codebase state.
- Produces: the search bar and its confirmation render as one continuous panel instead of two separately bordered/colored boxes.

- [ ] **Step 1: Merge the confirmation into the same panel as the search bar**

```tsx
{/* Colaboradores.tsx — old */}
            {/* ── Remover por nome ── */}
            {removendoAtivo && (
                <div className="colab-remover-bar">
                    <label className="add-label">Remover por nome:</label>
                    <ColabSelect
                        nome={nomeRemover}
                        colabs={colabs}
                        onNomeChange={v => { setNomeRemover(v); setConfirmRemoverId(null); }}
                        onColabSelect={(nome, _matricula) => {
                            setNomeRemover(nome)
                            const encontrado = colabs.find(c => c.nome === nome)
                            if (encontrado) setConfirmRemoverId(encontrado.id)
                        }}
                        placeholder="Nome do colaborador"
                        className="colab-input-remover"
                    />
                    <button
                        className="btn colab-btn-remover-exec"
                        onClick={removerPorNome}
                        disabled={removendo}
                    >
                        {removendo ? "⏳" : "🗑 Buscar e Remover"}
                    </button>
                </div>
            )}

            {/* ── Confirmação de remoção ── */}
            {confirmRemoverId !== null && (() => {
                const alvo = colabs.find(c => c.id === confirmRemoverId);
                return alvo ? (
                    <div className="colab-confirm-box">
                        <p>
                            Tem certeza que deseja remover <strong>{alvo.nome}</strong>{" "}
                            (Mat: {alvo.matricula})?
                        </p>
                        <div className="add-form-acoes">
                            <button
                                className="btn excluir-btn"
                                onClick={() => removerPorId(confirmRemoverId)}
                                disabled={removendo}
                            >
                                {removendo ? "Removendo..." : "✔ Sim, remover"}
                            </button>
                            <button className="btn cancel-btn" onClick={() => setConfirmRemoverId(null)}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : null;
            })()}
```

```tsx
{/* Colaboradores.tsx — new: one continuous panel; the confirmation
   renders as a state change inside it (a divider + message + actions)
   instead of a second, differently-colored box */}
            {/* ── Remover por nome ── */}
            {removendoAtivo && (
                <div className="colab-remover-bar">
                    <label className="add-label">Remover por nome:</label>
                    <ColabSelect
                        nome={nomeRemover}
                        colabs={colabs}
                        onNomeChange={v => { setNomeRemover(v); setConfirmRemoverId(null); }}
                        onColabSelect={(nome, _matricula) => {
                            setNomeRemover(nome)
                            const encontrado = colabs.find(c => c.nome === nome)
                            if (encontrado) setConfirmRemoverId(encontrado.id)
                        }}
                        placeholder="Nome do colaborador"
                        className="colab-input-remover"
                    />
                    <button
                        className="btn colab-btn-remover-exec"
                        onClick={removerPorNome}
                        disabled={removendo}
                    >
                        {removendo ? "Buscando..." : "🗑 Buscar e Remover"}
                    </button>

                    {confirmRemoverId !== null && (() => {
                        const alvo = colabs.find(c => c.id === confirmRemoverId);
                        return alvo ? (
                            <div className="colab-remover-confirm">
                                <p>
                                    Tem certeza que deseja remover <strong>{alvo.nome}</strong>{" "}
                                    (Mat: {alvo.matricula})?
                                </p>
                                <div className="add-form-acoes">
                                    <button
                                        className="btn excluir-btn"
                                        onClick={() => removerPorId(confirmRemoverId)}
                                        disabled={removendo}
                                    >
                                        {removendo ? "Removendo..." : "✔ Sim, remover"}
                                    </button>
                                    <button className="btn cancel-btn" onClick={() => setConfirmRemoverId(null)}>
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : null;
                    })()}
                </div>
            )}
```

- [ ] **Step 2: Add the `.colab-remover-confirm` style (inline state change, no new card) and remove the now-unused `.colab-confirm-box`**

```css
/* index.css — old */
/* ── Confirmação ── */
.colab-confirm-box {
    background: #fffde7;
    border: 1px solid #ffe082;
    border-left: 4px solid var(--orange);
    border-radius: var(--radius-md);
    padding: 16px;
}

.colab-confirm-box p {
    font-size: 14px;
    color: var(--gray-800);
    margin-bottom: 12px;
}
```

```css
/* index.css — new */
/* ── Confirmação: continua dentro do mesmo painel do .colab-remover-bar ── */
.colab-remover-confirm {
    flex-basis: 100%;
    padding-top: 12px;
    margin-top: 4px;
    border-top: 1px solid #f5c2c2;
}

.colab-remover-confirm p {
    font-size: 14px;
    color: var(--gray-800);
    margin-bottom: 12px;
}
```

**Note:** `Configuracoes.tsx` also renders a `.colab-confirm-box` (for removing a Motivo) — that usage is intentionally left as its own standalone confirmation there, since it is not preceded by a search bar to merge into. Since this step removes the `.colab-confirm-box` CSS rule entirely, `Configuracoes.tsx`'s confirmation would lose its styling. Fix it in the same step by keeping a card there but on the neutral gray system instead of the removed yellow one. `.colab-form-box` does not itself style its `<p>` children, so add the same 14px/gray-800 paragraph treatment the removed rule provided:

```css
/* index.css — new (add right after .colab-form-titulo, the existing
   rule for this same box's optional heading) */
.colab-form-box p {
    font-size: 14px;
    color: var(--gray-800);
    margin-bottom: 12px;
}
```

```tsx
{/* Configuracoes.tsx — old */}
                    {confirmRemoverId !== null && (() => {
                        const alvo = motivos.find(m => m.id === confirmRemoverId);
                        return alvo ? (
                            <div className="colab-confirm-box">
```

```tsx
{/* Configuracoes.tsx — new */}
                    {confirmRemoverId !== null && (() => {
                        const alvo = motivos.find(m => m.id === confirmRemoverId);
                        return alvo ? (
                            <div className="colab-form-box">
```

(`.colab-form-box` already exists, uses the neutral gray/green-accent card system, and is not removed by this task.)

- [ ] **Step 3: Verify**

Run: `grep -n "colab-confirm-box" "front-end/src/index.css" "front-end/src/components/Colaboradores.tsx" "front-end/src/components/Configuracoes.tsx"`
Expected: no output.

Run: `cd front-end && npm run build`
Expected: exits 0.

Visual check: in "Gerenciar Colaboradores", click "Remover", type a real collaborator's name, and confirm the search — the confirmation ("Tem certeza que deseja remover...") should appear inside the same red-accented panel as the search row, separated by a hairline, not as a second yellow box below it. In "Configurações", removing a Motivo should still show its own confirmation card, now in the neutral form-box style.

- [ ] **Step 4: Commit**

```bash
git add front-end/src/index.css front-end/src/components/Colaboradores.tsx front-end/src/components/Configuracoes.tsx
git commit -m "style: merge remove-by-name confirmation into one panel, restyle motivo confirmation"
```

---

### Task 10: Add Phosphor Icons + shared icon/title CSS support + migrate App.tsx

**Files:**
- Modify: `front-end/package.json` (via `npm install`)
- Modify: `front-end/src/index.css`
- Modify: `front-end/src/App.tsx`

**Interfaces:**
- Consumes: Task 9's codebase state.
- Produces: `@phosphor-icons/react` is installed; a reusable `.titulo-com-icone` utility class exists; `App.tsx` renders Phosphor icons everywhere it previously used PNG images or emoji/typed glyphs. Later icon-migration tasks (11-15) reuse `.titulo-com-icone` and the same import pattern.

**Icon mapping used across this task and Tasks 11-15 (reference table — not repeated per task):**

| Concept | Phosphor component | Notes |
|---|---|---|
| Fechar (close.png, ✕) | `X` | |
| Voltar (←) | `ArrowLeft` | |
| Buscar / Inspecionar / Pesquisar (search.png, 🔍) | `MagnifyingGlass` | placeholders just drop the glyph — a placeholder can't render a component |
| Editar (edit.png, ✏️) | `PencilSimple` | |
| Excluir / Remover (lixeira.png, 🗑️/🗑) | `Trash` | |
| Colaboradores / várias pessoas (colab.png, 👥) | `Users` | |
| Uma pessoa (👤) | `User` | |
| Configurações (settings.png, ⚙️) | `Gear` | |
| Histórico / Download (download.png, 📥) | `DownloadSimple` | |
| PDF (📄) | `FilePdf` | |
| Excel (📊 on export buttons) | `FileXls` | |
| Análise (📊 on the histórico menu header only) | `ChartBar` | |
| Motivo / lista (📋, 📝 tab) | `ClipboardText` | |
| "tem complemento" indicator (📝 in Add.tsx card) | `NotePencil` | |
| Evidências / Anexar (📎) | `Paperclip` | |
| Assinada = sim (✅) | `CheckCircle` weight="fill" | |
| Assinada = não (⬜) | `Square` | |
| Aviso (⚠️) | `Warning` | |
| Erro (❌) | `XCircle` | |
| Info / dica (ℹ️, 💡) | `Info` | |
| Calendário (📅/📆) | `Calendar` | |
| Confirmar (✔) | *(none — dropped, label text already says the action)* | |
| Carregando/Processando/Gerando (⏳) | *(none — dropped, plain "…ando..." text)* | |
| Decorative field labels in Inspecionar (📅👤🪪📝⚠️✍️📎 prefixing a label) | *(none — dropped, plain text label)* | |
| Pin (📌 in histórico result header) | *(none — dropped)* | |

- [ ] **Step 1: Install the dependency**

Run: `cd front-end && npm install @phosphor-icons/react`
Expected: exits 0, `front-end/package.json` now lists `@phosphor-icons/react` under `dependencies`.

- [ ] **Step 2: Add the shared `.titulo-com-icone` utility and `min-width: 0` on `.hist-titulo`**

```css
/* index.css — old */
.icon {
    width: 22px;
    height: 22px;
    display: block;
}
```

```css
/* index.css — new */
.icon {
    width: 22px;
    height: 22px;
    display: block;
}

/* Ícone + título lado a lado em cabeçalhos de modal — usado com uma
   classe de título existente (add-titulo-principal, colab-titulo,
   hist-titulo) ou envolvendo [ícone, h2] quando o próprio título
   precisa manter seu próprio overflow/ellipsis (hist-titulo). */
.titulo-com-icone {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}
```

```css
/* index.css — old */
.hist-titulo {
    font-size: 20px;
    font-weight: 700;
    color: var(--gray-900);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
```

```css
/* index.css — new */
.hist-titulo {
    font-size: 20px;
    font-weight: 700;
    color: var(--gray-900);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
}
```

```css
/* index.css — old */
.add-titulo-principal {
    font-size: 20px;
    font-weight: 700;
    color: var(--gray-900);
    margin: 0;
}
```

```css
/* index.css — new (icon sits inside the h2 itself here — no ellipsis
   risk on this fixed short title, so flex goes directly on the title
   class rather than a wrapper) */
.add-titulo-principal {
    font-size: 20px;
    font-weight: 700;
    color: var(--gray-900);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}
```

```css
/* index.css — old */
.colab-titulo {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--gray-900);
}
```

```css
/* index.css — new */
.colab-titulo {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--gray-900);
    display: flex;
    align-items: center;
    gap: 8px;
}
```

- [ ] **Step 3: Migrate the side menu, main title, and search button**

```tsx
{/* App.tsx — old (top of file) */}
import { useEffect, useState } from 'react'
import Tabela from './components/Tabela'
```

```tsx
{/* App.tsx — new */}
import { useEffect, useState } from 'react'
import {
    Plus, X, MagnifyingGlass, PencilSimple, Trash, Users, Gear,
    DownloadSimple, FilePdf, CheckCircle, Square,
} from '@phosphor-icons/react'
import Tabela from './components/Tabela'
```

```tsx
{/* App.tsx — old */}
                    <div className='d-flex'>
                        <img className='logo' src="/danlex.png" alt="logo-empresa" />
                        <h1>Sistema de Advertências</h1>
                    </div>
                    <form className='box-search' onSubmit={e => {
                        e.preventDefault();
                        const nomeUpper = nome.toUpperCase();
                        setNome(nomeUpper);
                        getAdiverts(nomeUpper);
                    }}>
                        <ColabSelect
                            nome={nome}
                            colabs={colabs}
                            onNomeChange={setNome}
                            onColabSelect={(nomeColab) => {
                                const upper = nomeColab.toUpperCase()
                                setNome(upper)
                                getAdiverts(upper)
                            }}
                            placeholder="Digite um colaborador para filtragem"
                            className="search-colab-select"
                        />
                        <button className='search-buttom' disabled={carregando}>
                            {carregando
                                ? <span className="search-loading">...</span>
                                : <img className='icon' src="/search.png" alt="botão de pesquisa" />
                            }
                        </button>
                    </form>
```

```tsx
{/* App.tsx — new */}
                    <div className='d-flex'>
                        <img className='logo' src="/danlex.png" alt="logo-empresa" />
                        <h1>Sistema de Advertências</h1>
                    </div>
                    <form className='box-search' onSubmit={e => {
                        e.preventDefault();
                        const nomeUpper = nome.toUpperCase();
                        setNome(nomeUpper);
                        getAdiverts(nomeUpper);
                    }}>
                        <ColabSelect
                            nome={nome}
                            colabs={colabs}
                            onNomeChange={setNome}
                            onColabSelect={(nomeColab) => {
                                const upper = nomeColab.toUpperCase()
                                setNome(upper)
                                getAdiverts(upper)
                            }}
                            placeholder="Digite um colaborador para filtragem"
                            className="search-colab-select"
                        />
                        <button className='search-buttom' disabled={carregando}>
                            {carregando
                                ? <span className="search-loading">...</span>
                                : <MagnifyingGlass size={20} color="#fff" />
                            }
                        </button>
                    </form>
```

```tsx
{/* App.tsx — old */}
                            {/* Botão: Nova Advertência */}
                            <button
                                onClick={() => { setAddAberto(true); setColabAberto(false); }}
                                title="Nova Advertência"
                            >
                                <img className='icon buttons-menu' src="/plus.png" alt="botão de adicionar" />
                            </button>

                            {/* Botão: Gerenciar Colaboradores */}
                            <button
                                onClick={() => { setColabAberto(true); setAddAberto(false); }}
                                title="Gerenciar Colaboradores"
                                className="btn-menu-colab"
                            >
                                <img className='icon buttons-menu' src="/colab.png" alt="botão de colaboradores" />
                            </button>

                            {/* Botão: Histórico (abre o menu com as duas opções) */}
                            <button
                                onClick={() => setHistView('menu')}
                                title="Histórico de advertências"
                            >
                                <img className='icon buttons-menu' src="/download.png" alt="botão de histórico" />
                            </button>

                            {/* Botão: Configurações (sempre o último) */}
                            <button
                                onClick={() => { setConfigAberto(true); setAddAberto(false); setColabAberto(false); }}
                                title="Configurações"
                            >
                                <img className='icon buttons-menu' src="/settings.png" alt="botão de configurações" />
                            </button>
```

```tsx
{/* App.tsx — new (Phosphor renders via currentColor, so color:#fff on
   .box-menu button already makes these render white — no filter hack
   needed) */}
                            {/* Botão: Nova Advertência */}
                            <button
                                onClick={() => { setAddAberto(true); setColabAberto(false); }}
                                title="Nova Advertência"
                            >
                                <Plus size={22} color="#fff" />
                            </button>

                            {/* Botão: Gerenciar Colaboradores */}
                            <button
                                onClick={() => { setColabAberto(true); setAddAberto(false); }}
                                title="Gerenciar Colaboradores"
                                className="btn-menu-colab"
                            >
                                <Users size={22} color="#fff" />
                            </button>

                            {/* Botão: Histórico (abre o menu com as duas opções) */}
                            <button
                                onClick={() => setHistView('menu')}
                                title="Histórico de advertências"
                            >
                                <DownloadSimple size={22} color="#fff" />
                            </button>

                            {/* Botão: Configurações (sempre o último) */}
                            <button
                                onClick={() => { setConfigAberto(true); setAddAberto(false); setColabAberto(false); }}
                                title="Configurações"
                            >
                                <Gear size={22} color="#fff" />
                            </button>
```

- [ ] **Step 4: Migrate the `.buttons-menu` filter (no longer needed) and drop `.icon` sizing conflicts**

```css
/* index.css — old */
.buttons-menu {
    filter: brightness(0) invert(1);
}
```

```css
/* index.css — new (Phosphor icons already render in the color passed
   via the `color` prop — no filter needed. The class stays declared
   but empty is unnecessary; remove it and drop the now-unused
   `buttons-menu` class from the JSX in this same task's remaining
   steps, since no image needs inverting anymore) */
```

Remove the whole `.buttons-menu` rule.

- [ ] **Step 5: Migrate the Inspecionar modal (header, field labels, badges, footer)**

```tsx
{/* App.tsx — old */}
                    <div className="caixa inspecionar-caixa" onClick={e => e.stopPropagation()}>
                        <div className="inspecionar-header">
                            <h2 className="inspecionar-titulo">🔍 Detalhes da Advertência</h2>
                            <button
                                className="add-btn-fechar"
                                onClick={() => setInspecionarView(false)}
                                title="Fechar"
                            >
                                <img className="icon" src="close.png" alt="fechar" />
                            </button>
                        </div>

                        <div className="inspecionar-body">
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">📅 Data</span>
                                <span className="inspecionar-valor">{dataFormatada(selectedAdivert.data)}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">👤 Nome do Colaborador</span>
                                <span className="inspecionar-valor">{selectedAdivert.nome}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">🪪 Matrícula</span>
                                <span className="inspecionar-valor">{selectedAdivert.matricula}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">📝 Tipo</span>
                                <span className={`inspecionar-badge ${selectedAdivert.tipo === 'Escrita' ? 'badge-escrita' : 'badge-verbal'}`}>
                                    {selectedAdivert.tipo}
                                </span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo inspecionar-campo--coluna">
                                <span className="inspecionar-label">⚠️ Motivo</span>
                                <span className="inspecionar-motivo">{selectedAdivert.motivo}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">✍️ Assinatura</span>
                                <span className={`assinada-badge ${selectedAdivert.assinada ? 'assinada-badge--sim' : 'assinada-badge--nao'}`}>
                                    {selectedAdivert.assinada ? '✅ Assinada' : '⬜ Pendente'}
                                </span>
                            </div>
```

```tsx
{/* App.tsx — new */}
                    <div className="caixa inspecionar-caixa" onClick={e => e.stopPropagation()}>
                        <div className="inspecionar-header">
                            <span className="titulo-com-icone">
                                <MagnifyingGlass size={20} />
                                <h2 className="inspecionar-titulo">Detalhes da Advertência</h2>
                            </span>
                            <button
                                className="add-btn-fechar"
                                onClick={() => setInspecionarView(false)}
                                title="Fechar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="inspecionar-body">
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">Data</span>
                                <span className="inspecionar-valor">{dataFormatada(selectedAdivert.data)}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">Nome do Colaborador</span>
                                <span className="inspecionar-valor">{selectedAdivert.nome}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">Matrícula</span>
                                <span className="inspecionar-valor">{selectedAdivert.matricula}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">Tipo</span>
                                <span className={`inspecionar-badge ${selectedAdivert.tipo === 'Escrita' ? 'badge-escrita' : 'badge-verbal'}`}>
                                    {selectedAdivert.tipo}
                                </span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo inspecionar-campo--coluna">
                                <span className="inspecionar-label">Motivo</span>
                                <span className="inspecionar-motivo">{selectedAdivert.motivo}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">Assinatura</span>
                                <span className={`assinada-badge ${selectedAdivert.assinada ? 'assinada-badge--sim' : 'assinada-badge--nao'}`}>
                                    {selectedAdivert.assinada
                                        ? <><CheckCircle size={14} weight="fill" /> Assinada</>
                                        : <><Square size={14} /> Pendente</>}
                                </span>
                            </div>
```

```tsx
{/* App.tsx — old */}
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo inspecionar-campo--coluna">
                                <span className="inspecionar-label">📎 Evidências</span>
```

```tsx
{/* App.tsx — new */}
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo inspecionar-campo--coluna">
                                <span className="inspecionar-label">Evidências</span>
```

```tsx
{/* App.tsx — old */}
                        <div className="inspecionar-rodape">
                            <button
                                className="btn add-btn-confirm"
                                onClick={() => { setInspecionarView(false); setUpdateView(true); }}
                                title="Editar esta advertência"
                            >
                                ✏️ Editar
                            </button>
```

```tsx
{/* App.tsx — new */}
                        <div className="inspecionar-rodape">
                            <button
                                className="btn add-btn-confirm"
                                onClick={() => { setInspecionarView(false); setUpdateView(true); }}
                                title="Editar esta advertência"
                            >
                                <PencilSimple size={16} /> Editar
                            </button>
```

Add the badge/icon-support CSS (the assinada-badge/assinada-toggle now hold an icon + text pair, both need flex):

```css
/* index.css — old */
.assinada-badge {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 999px;
    letter-spacing: 0.3px;
    white-space: nowrap;
}
```

```css
/* index.css — new */
.assinada-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 999px;
    letter-spacing: 0.3px;
    white-space: nowrap;
}
```

```css
/* index.css — old */
.assinada-toggle {
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 999px;
    cursor: pointer;
    letter-spacing: 0.2px;
    white-space: nowrap;
    transition: filter var(--transition), transform var(--transition-fast);
}
```

```css
/* index.css — new */
.assinada-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 999px;
    cursor: pointer;
    letter-spacing: 0.2px;
    white-space: nowrap;
    transition: filter var(--transition), transform var(--transition-fast);
}
```

```css
/* index.css — old */
.inspecionar-badge {
    font-size: 13px;
    font-weight: 700;
    padding: 4px 14px;
    border-radius: 999px;
    letter-spacing: 0.3px;
}
```

```css
/* index.css — new */
.inspecionar-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--gray-600);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    flex-shrink: 0;
}

.inspecionar-badge {
    font-size: 13px;
    font-weight: 700;
    padding: 4px 14px;
    border-radius: 999px;
    letter-spacing: 0.3px;
}
```

(The `.inspecionar-label` block is re-stated identically here only to confirm no change is needed there — the decorative emoji were plain text prefixes inside the span, already removed by the JSX edit above, no CSS change required for the label itself. Skip re-adding it if your diff tool reports it as a no-op.)

- [ ] **Step 6: Migrate the lightbox close button**

```tsx
{/* App.tsx — old */}
            {lightboxUrl && (
                <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
                    <button className="lightbox-fechar" onClick={() => setLightboxUrl(null)} title="Fechar">✕</button>
```

```tsx
{/* App.tsx — new */}
            {lightboxUrl && (
                <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
                    <button className="lightbox-fechar" onClick={() => setLightboxUrl(null)} title="Fechar">
                        <X size={20} />
                    </button>
```

- [ ] **Step 7: Migrate the acoes-bar (main action toolbar) and the confirm-download-lote copy**

```tsx
{/* App.tsx — old */}
                                <div className='acoes-bar'>
                                    <span className='acoes-bar__label'>AÇÕES:</span>
                                    <div className='acoes-bar__buttons'>
                                        <button
                                            className={`acoes-btn ${selectedIds.length !== 1 ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => selectedIds.length === 1 && setInspecionarView(true)}
                                            disabled={selectedIds.length !== 1}
                                            title="Inspecionar (selecione uma advertência)"
                                        >
                                            🔍 Inspecionar
                                        </button>
                                        <button
                                            className={`acoes-btn acoes-btn--excluir ${selectedIds.length === 0 ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => selectedIds.length > 0 && setExcluirView(true)}
                                            disabled={selectedIds.length === 0}
                                            title="Excluir advertência(s) selecionada(s)"
                                        >
                                            🗑️ Excluir{selectedIds.length > 1 ? ` (${selectedIds.length})` : ''}
                                        </button>
                                        <button
                                            className={`acoes-btn ${selectedIds.length !== 1 ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => selectedIds.length === 1 && setUpdateView(true)}
                                            disabled={selectedIds.length !== 1}
                                            title="Editar (selecione uma advertência)"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            className={`acoes-btn ${selectedIds.length === 0 ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => {
                                                if (selectedIds.length === 1 && selectedAdivert) downloadPdfLinha(selectedAdivert)
                                                else if (selectedIds.length > 1) setBaixarLoteView(true)
                                            }}
                                            disabled={selectedIds.length === 0}
                                            title="Baixar PDF da(s) advertência(s) selecionada(s)"
                                        >
                                            📄 Baixar PDF{selectedIds.length > 1 ? ` (${selectedIds.length})` : ''}
                                        </button>
                                    </div>
                                </div>
```

```tsx
{/* App.tsx — new */}
                                <div className='acoes-bar'>
                                    <span className='acoes-bar__label'>AÇÕES:</span>
                                    <div className='acoes-bar__buttons'>
                                        <button
                                            className={`acoes-btn ${selectedIds.length !== 1 ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => selectedIds.length === 1 && setInspecionarView(true)}
                                            disabled={selectedIds.length !== 1}
                                            title="Inspecionar (selecione uma advertência)"
                                        >
                                            <MagnifyingGlass size={16} /> Inspecionar
                                        </button>
                                        <button
                                            className={`acoes-btn acoes-btn--excluir ${selectedIds.length === 0 ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => selectedIds.length > 0 && setExcluirView(true)}
                                            disabled={selectedIds.length === 0}
                                            title="Excluir advertência(s) selecionada(s)"
                                        >
                                            <Trash size={16} /> Excluir{selectedIds.length > 1 ? ` (${selectedIds.length})` : ''}
                                        </button>
                                        <button
                                            className={`acoes-btn ${selectedIds.length !== 1 ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => selectedIds.length === 1 && setUpdateView(true)}
                                            disabled={selectedIds.length !== 1}
                                            title="Editar (selecione uma advertência)"
                                        >
                                            <PencilSimple size={16} /> Editar
                                        </button>
                                        <button
                                            className={`acoes-btn ${selectedIds.length === 0 ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => {
                                                if (selectedIds.length === 1 && selectedAdivert) downloadPdfLinha(selectedAdivert)
                                                else if (selectedIds.length > 1) setBaixarLoteView(true)
                                            }}
                                            disabled={selectedIds.length === 0}
                                            title="Baixar PDF da(s) advertência(s) selecionada(s)"
                                        >
                                            <FilePdf size={16} /> Baixar PDF{selectedIds.length > 1 ? ` (${selectedIds.length})` : ''}
                                        </button>
                                    </div>
                                </div>
```

```tsx
{/* App.tsx — old */}
                                <h5>
                                    Você vai baixar <strong>{selectedIds.length}</strong> advertências — um PDF por advertência, em um arquivo <strong>.zip</strong>.
                                </h5>
```

```tsx
{/* App.tsx — new */}
                                <h5>
                                    Você vai baixar <strong>{selectedIds.length}</strong> advertências: um PDF por advertência, em um arquivo <strong>.zip</strong>.
                                </h5>
```

- [ ] **Step 8: Verify**

Run: `grep -n "src=\"/plus.png\"\|src=\"/colab.png\"\|src=\"/settings.png\"\|src=\"/search.png\"\|src=\"close.png\"\|buttons-menu" "front-end/src/App.tsx"`
Expected: no output.

Run: `grep -nP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" "front-end/src/App.tsx"`
Expected: no output (no emoji left in App.tsx). If this grep flags something inside a string you intentionally kept (there should be none after this task), investigate before proceeding.

Run: `grep -n " — " "front-end/src/App.tsx"`
Expected: no output.

Run: `cd front-end && npm run build`
Expected: exits 0.

Visual check: use the `run` skill. Confirm the side menu icons render (white, correctly sized), the search button shows a magnifying glass, the main action bar shows icon+label on all four buttons, the Inspecionar modal shows a magnifying-glass title icon and no emoji in any field label, and the Assinada badge shows a filled green check or an outline square instead of ✅/⬜.

- [ ] **Step 9: Commit**

```bash
git add front-end/package.json front-end/package-lock.json front-end/src/index.css front-end/src/App.tsx
git commit -m "feat: install Phosphor Icons, migrate App.tsx off PNG/emoji icons"
```

---

### Task 11: Migrate Add.tsx and Update.tsx

**Files:**
- Modify: `front-end/src/components/Add.tsx`
- Modify: `front-end/src/components/Update.tsx`

**Interfaces:**
- Consumes: Task 10's `.titulo-com-icone` utility and icon-import pattern.
- Produces: both files import their needed Phosphor icons directly (no shared barrel file — matches this codebase's existing per-file import style) and no longer reference `close.png`, `edit.png`, `lixeira.png`, or any emoji/typed glyph.

- [ ] **Step 1: Update imports and the header (Add.tsx)**

```tsx
{/* Add.tsx — old */}
import React, { useState, useEffect, useRef } from "react";
import MotivosSelect from "./MotivosSelect";
```

```tsx
{/* Add.tsx — new */}
import React, { useState, useEffect, useRef } from "react";
import { X, PencilSimple, Trash, User, Users, Warning, Paperclip, NotePencil, ClipboardText } from "@phosphor-icons/react";
import MotivosSelect from "./MotivosSelect";
```

```tsx
{/* Add.tsx — old */}
            <div className="add-header">
                <h2 className="add-titulo-principal">📋 Nova Advertência</h2>
                <button className="add-btn-fechar" onClick={() => setAddAberto(false)} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>
```

```tsx
{/* Add.tsx — new */}
            <div className="add-header">
                <h2 className="add-titulo-principal"><ClipboardText size={20} /> Nova Advertência</h2>
                <button className="add-btn-fechar" onClick={() => setAddAberto(false)} title="Fechar">
                    <X size={20} />
                </button>
            </div>
```

- [ ] **Step 2: Migrate the remove-collaborator button and the em-dash placeholders in `ColaboradorRow`**

```tsx
{/* Add.tsx — old */}
                {canRemove && (
                    <button
                        className="add-btn-remover-colab"
                        onClick={() => onRemove(entry.id)}
                        title="Remover colaborador"
                    >
                        ✕
                    </button>
                )}
            </div>

            {individual && (
                <div className="add-colab-individual-extra">
                    <textarea
                        className="add-input add-textarea"
                        value={entry.complemento}
                        onChange={e => onChangeCampo(entry.id, "complemento", e.target.value)}
                        placeholder="Complemento (opcional) — deste colaborador"
                        rows={3}
                    />
                    <EvidenciasUploader
                        novas={entry.evidencias}
                        onChangeNovas={evs => onChangeEvidencias(entry.id, evs)}
                        label="Evidências (opcional) — deste colaborador:"
                    />
                </div>
            )}
```

```tsx
{/* Add.tsx — new */}
                {canRemove && (
                    <button
                        className="add-btn-remover-colab"
                        onClick={() => onRemove(entry.id)}
                        title="Remover colaborador"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {individual && (
                <div className="add-colab-individual-extra">
                    <textarea
                        className="add-input add-textarea"
                        value={entry.complemento}
                        onChange={e => onChangeCampo(entry.id, "complemento", e.target.value)}
                        placeholder="Complemento (opcional): deste colaborador"
                        rows={3}
                    />
                    <EvidenciasUploader
                        novas={entry.evidencias}
                        onChangeNovas={evs => onChangeEvidencias(entry.id, evs)}
                        label="Evidências deste colaborador (opcional):"
                    />
                </div>
            )}
```

- [ ] **Step 3: Migrate the mode-selector tabs**

```tsx
{/* Add.tsx — old */}
                <button
                    type="button"
                    className={`add-modo-tab ${ativo === "individual" ? "add-modo-tab--ativo" : ""}`}
                    onClick={() => { setModoMultiplo(false); setErroForm(null); }}
                >
                    <span className="add-modo-tab-icone">👤</span>
                    <span className="add-modo-tab-texto">
                        <strong>Individual</strong>
                        <small>Um colaborador</small>
                    </span>
                </button>
                <button
                    type="button"
                    className={`add-modo-tab ${ativo === "multiplo" ? "add-modo-tab--ativo" : ""}`}
                    onClick={() => { setModoMultiplo(true); setErroForm(null); }}
                >
                    <span className="add-modo-tab-icone">👥</span>
                    <span className="add-modo-tab-texto">
                        <strong>Vários colaboradores</strong>
                        <small>Aplica a mesma advertência a vários de uma vez</small>
                    </span>
                </button>
```

```tsx
{/* Add.tsx — new */}
                <button
                    type="button"
                    className={`add-modo-tab ${ativo === "individual" ? "add-modo-tab--ativo" : ""}`}
                    onClick={() => { setModoMultiplo(false); setErroForm(null); }}
                >
                    <span className="add-modo-tab-icone"><User size={22} /></span>
                    <span className="add-modo-tab-texto">
                        <strong>Individual</strong>
                        <small>Um colaborador</small>
                    </span>
                </button>
                <button
                    type="button"
                    className={`add-modo-tab ${ativo === "multiplo" ? "add-modo-tab--ativo" : ""}`}
                    onClick={() => { setModoMultiplo(true); setErroForm(null); }}
                >
                    <span className="add-modo-tab-icone"><Users size={22} /></span>
                    <span className="add-modo-tab-texto">
                        <strong>Vários colaboradores</strong>
                        <small>Aplica a mesma advertência a vários de uma vez</small>
                    </span>
                </button>
```

- [ ] **Step 4: Migrate the em-dash placeholders and warning banners in `renderFormUnico`**

```tsx
{/* Add.tsx — old */}
                        onColabSelect={(nome, matricula) => { onChange({ ...form, Nome: nome, matricula }); setErroForm(null); }}
                        placeholder="Digite o nome — matrícula será preenchida automaticamente"
                    />
```

```tsx
{/* Add.tsx — new */}
                        onColabSelect={(nome, matricula) => { onChange({ ...form, Nome: nome, matricula }); setErroForm(null); }}
                        placeholder="Digite o nome; a matrícula será preenchida automaticamente"
                    />
```

```tsx
{/* Add.tsx — old */}
                <textarea
                    className="add-input add-textarea"
                    value={form.complemento}
                    onChange={e => { onChange({ ...form, complemento: e.target.value }); setErroForm(null); }}
                    placeholder="Texto complementar — aparece abaixo do motivo, na 1ª página do PDF"
                    rows={4}
                />
            </div>

            <EvidenciasUploader
                novas={form.evidencias}
                onChangeNovas={evs => onChange({ ...form, evidencias: evs })}
            />

            {erroForm && <div className="add-erro-form">⚠️ {erroForm}</div>}
```

```tsx
{/* Add.tsx — new */}
                <textarea
                    className="add-input add-textarea"
                    value={form.complemento}
                    onChange={e => { onChange({ ...form, complemento: e.target.value }); setErroForm(null); }}
                    placeholder="Texto complementar (aparece abaixo do motivo, na 1ª página do PDF)"
                    rows={4}
                />
            </div>

            <EvidenciasUploader
                novas={form.evidencias}
                onChangeNovas={evs => onChange({ ...form, evidencias: evs })}
            />

            {erroForm && <div className="add-erro-form"><Warning size={14} /> {erroForm}</div>}
```

- [ ] **Step 5: Migrate `renderFormMultiplo`'s placeholders, warning banner, and evidence label**

```tsx
{/* Add.tsx — old */}
                            <textarea
                                className="add-input add-textarea"
                                value={novaForm.complemento}
                                onChange={e => { setNovaForm(prev => ({ ...prev, complemento: e.target.value })); setErroForm(null); }}
                                placeholder="Texto complementar — aplicado a todos os colaboradores"
                                rows={4}
                            />
                        </div>
                        <EvidenciasUploader
                            novas={novaForm.evidencias}
                            onChangeNovas={evs => setNovaForm(prev => ({ ...prev, evidencias: evs }))}
                            label="Evidências (opcional) — aplicadas a todos:"
                        />
                    </>
                )}
            </div>

            {erroForm && <div className="add-erro-form">⚠️ {erroForm}</div>}
```

```tsx
{/* Add.tsx — new */}
                            <textarea
                                className="add-input add-textarea"
                                value={novaForm.complemento}
                                onChange={e => { setNovaForm(prev => ({ ...prev, complemento: e.target.value })); setErroForm(null); }}
                                placeholder="Texto complementar, aplicado a todos os colaboradores"
                                rows={4}
                            />
                        </div>
                        <EvidenciasUploader
                            novas={novaForm.evidencias}
                            onChangeNovas={evs => setNovaForm(prev => ({ ...prev, evidencias: evs }))}
                            label="Evidências aplicadas a todos (opcional):"
                        />
                    </>
                )}
            </div>

            {erroForm && <div className="add-erro-form"><Warning size={14} /> {erroForm}</div>}
```

- [ ] **Step 6: Migrate the card list (edit/delete icons, complemento/evidência indicators) and the remaining error banner**

```tsx
{/* Add.tsx — old */}
                                <div className="add-card-conteudo">
                                    <div className="add-card-info">
                                        <span className="add-card-nome">{adv.Nome || "—"}</span>
                                        <span className="add-card-sub">
                                            Mat: {adv.matricula} &nbsp;|&nbsp; {adv.data} &nbsp;|&nbsp; {adv.tipo}
                                            {adv.evidencias.length > 0 && <> &nbsp;|&nbsp; 📎 {adv.evidencias.length}</>}
                                            {adv.complemento.trim() && <> &nbsp;|&nbsp; 📝</>}
                                        </span>
                                        <span className="add-card-motivo" title={adv.motivo}>
                                            {adv.motivo.length > 85 ? adv.motivo.substring(0, 85) + "…" : adv.motivo}
                                        </span>
                                    </div>
                                    <div className="add-card-acoes">
                                        <button className="add-btn-icone" onClick={() => iniciarEdicao(idx)} title="Editar">
                                            <img className="icon" src="edit.png" alt="editar" />
                                        </button>
                                        <button className="add-btn-icone" onClick={() => excluir(idx)} title="Excluir">
                                            <img className="icon" src="lixeira.png" alt="excluir" />
                                        </button>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                ))}

                {criandoNova && (
                    modoMultiplo
                        ? renderFormMultiplo()
                        : renderFormUnico(
                            novaForm, setNovaForm,
                            confirmarNova,
                            () => { setCriandoNova(false); setErroForm(null); },
                            "Adicionar",
                            "nova",
                            true
                        )
                )}
            </div>

            {erroForm && !criandoNova && editandoIdx === null && (
                <div className="add-erro-form">⚠️ {erroForm}</div>
            )}
```

```tsx
{/* Add.tsx — new (the "—" fallback for an unnamed draft row stays as-is
   — this is a placeholder-value idiom, not a connector, out of scope
   for the em-dash cleanup) */}
                                <div className="add-card-conteudo">
                                    <div className="add-card-info">
                                        <span className="add-card-nome">{adv.Nome || "—"}</span>
                                        <span className="add-card-sub">
                                            Mat: {adv.matricula} &nbsp;|&nbsp; {adv.data} &nbsp;|&nbsp; {adv.tipo}
                                            {adv.evidencias.length > 0 && <> &nbsp;|&nbsp; <Paperclip size={12} /> {adv.evidencias.length}</>}
                                            {adv.complemento.trim() && <> &nbsp;|&nbsp; <NotePencil size={12} /></>}
                                        </span>
                                        <span className="add-card-motivo" title={adv.motivo}>
                                            {adv.motivo.length > 85 ? adv.motivo.substring(0, 85) + "…" : adv.motivo}
                                        </span>
                                    </div>
                                    <div className="add-card-acoes">
                                        <button className="add-btn-icone" onClick={() => iniciarEdicao(idx)} title="Editar">
                                            <PencilSimple size={16} />
                                        </button>
                                        <button className="add-btn-icone" onClick={() => excluir(idx)} title="Excluir">
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                ))}

                {criandoNova && (
                    modoMultiplo
                        ? renderFormMultiplo()
                        : renderFormUnico(
                            novaForm, setNovaForm,
                            confirmarNova,
                            () => { setCriandoNova(false); setErroForm(null); },
                            "Adicionar",
                            "nova",
                            true
                        )
                )}
            </div>

            {erroForm && !criandoNova && editandoIdx === null && (
                <div className="add-erro-form"><Warning size={14} /> {erroForm}</div>
            )}
```

Add flex support for the error banner (it now holds an icon + text):

```css
/* index.css — old */
.add-erro-form {
    background: #fff5f5;
    border: 1px solid #f5c2c2;
    border-left: 4px solid var(--red-primary);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    font-size: 13px;
    color: var(--red-dark);
    font-weight: 600;
    animation: fadeIn 0.2s ease;
}
```

```css
/* index.css — new */
.add-erro-form {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #fff5f5;
    border: 1px solid #f5c2c2;
    border-left: 4px solid var(--red-primary);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    font-size: 13px;
    color: var(--red-dark);
    font-weight: 600;
    animation: fadeIn 0.2s ease;
}
```

Also add flex support for `.add-card-icone` buttons (they still hold a single icon, already sized via `.add-btn-icone` at 30x30 flex-centered — no CSS change needed there, confirmed from the existing rule already having `display:flex;align-items:center;justify-content:center`).

- [ ] **Step 7: Update Update.tsx (close button and the em-dash complemento placeholder)**

```tsx
{/* Update.tsx — old */}
import React, { useState, useEffect } from "react";
import MotivosSelect from "./MotivosSelect";
```

```tsx
{/* Update.tsx — new */}
import React, { useState, useEffect } from "react";
import { X } from "@phosphor-icons/react";
import MotivosSelect from "./MotivosSelect";
```

```tsx
{/* Update.tsx — old */}
            <div className="d-flex">
                <button className="add-btn-fechar" onClick={() => setUpdateView(false)} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>
```

```tsx
{/* Update.tsx — new */}
            <div className="d-flex">
                <button className="add-btn-fechar" onClick={() => setUpdateView(false)} title="Fechar">
                    <X size={20} />
                </button>
            </div>
```

```tsx
{/* Update.tsx — old */}
                        <textarea
                            className="add-input add-textarea"
                            value={form.complemento}
                            onChange={e => setForm({ ...form, complemento: e.target.value })}
                            placeholder="Texto complementar — aparece abaixo do motivo, na 1ª página do PDF"
                            rows={4}
                        />
```

```tsx
{/* Update.tsx — new */}
                        <textarea
                            className="add-input add-textarea"
                            value={form.complemento}
                            onChange={e => setForm({ ...form, complemento: e.target.value })}
                            placeholder="Texto complementar (aparece abaixo do motivo, na 1ª página do PDF)"
                            rows={4}
                        />
```

- [ ] **Step 8: Verify**

Run: `grep -n "src=\"close.png\"\|src=\"edit.png\"\|src=\"lixeira.png\"" "front-end/src/components/Add.tsx" "front-end/src/components/Update.tsx"`
Expected: no output.

Run: `grep -n " — " "front-end/src/components/Add.tsx" "front-end/src/components/Update.tsx"`
Expected: no output.

Run: `grep -nP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" "front-end/src/components/Add.tsx" "front-end/src/components/Update.tsx"`
Expected: no output.

Run: `cd front-end && npm run build`
Expected: exits 0.

Visual check: open "Nova Advertência" (both Individual and Vários colaboradores modes) and edit an existing advertência via "Editar" — confirm every icon renders, no broken image icons, no leftover em dashes in placeholders/hints, and the mode-selector tabs show a person/people icon.

- [ ] **Step 9: Commit**

```bash
git add front-end/src/index.css front-end/src/components/Add.tsx front-end/src/components/Update.tsx
git commit -m "feat: migrate Add.tsx and Update.tsx to Phosphor icons, remove em dashes"
```

---

### Task 12: Migrate Colaboradores.tsx and Configuracoes.tsx

**Files:**
- Modify: `front-end/src/components/Colaboradores.tsx`
- Modify: `front-end/src/components/Configuracoes.tsx`
- Modify: `front-end/src/index.css`

**Interfaces:**
- Consumes: Task 10's utilities; Task 9's flattened remove-by-name flow in `Colaboradores.tsx`.
- Produces: both files use Phosphor icons, drop the redundant `✔`/`⏳` glyphs in favor of plain text, and drop the emoji from search placeholders.

- [ ] **Step 1: Update imports and header (Colaboradores.tsx)**

```tsx
{/* Colaboradores.tsx — old */}
import React, { useState, useEffect } from "react";
import ColabSelect from "./ColabSelect";
```

```tsx
{/* Colaboradores.tsx — new */}
import React, { useState, useEffect } from "react";
import { X, Trash, Users } from "@phosphor-icons/react";
import ColabSelect from "./ColabSelect";
```

```tsx
{/* Colaboradores.tsx — old */}
            <div className="colab-header">
                <h2 className="colab-titulo">👥 Gerenciar Colaboradores</h2>
                <button className="add-btn-fechar" onClick={() => setColabAberto(false)} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>
```

```tsx
{/* Colaboradores.tsx — new */}
            <div className="colab-header">
                <h2 className="colab-titulo"><Users size={20} /> Gerenciar Colaboradores</h2>
                <button className="add-btn-fechar" onClick={() => setColabAberto(false)} title="Fechar">
                    <X size={20} />
                </button>
            </div>
```

- [ ] **Step 2: Migrate the toggle/confirm/search buttons**

```tsx
{/* Colaboradores.tsx — old */}
                <button
                    className="btn colab-btn-novo"
                    onClick={() => { setCriandoColab(v => !v); setRemovendoAtivo(false); setConfirmRemoverId(null); }}
                >
                    {criandoColab ? "✕ Cancelar" : "+ Novo Colaborador"}
                </button>

                <button
                    className={`btn colab-btn-remover${removendoAtivo ? " colab-btn-remover--ativo" : ""}`}
                    onClick={toggleRemover}
                >
                    {removendoAtivo ? "✕ Cancelar Remoção" : "🗑 Remover"}
                </button>
```

```tsx
{/* Colaboradores.tsx — new */}
                <button
                    className="btn colab-btn-novo"
                    onClick={() => { setCriandoColab(v => !v); setRemovendoAtivo(false); setConfirmRemoverId(null); }}
                >
                    {criandoColab ? <><X size={14} /> Cancelar</> : "+ Novo Colaborador"}
                </button>

                <button
                    className={`btn colab-btn-remover${removendoAtivo ? " colab-btn-remover--ativo" : ""}`}
                    onClick={toggleRemover}
                >
                    {removendoAtivo ? <><X size={14} /> Cancelar Remoção</> : <><Trash size={14} /> Remover</>}
                </button>
```

```tsx
{/* Colaboradores.tsx — old */}
                        <button className="btn add-btn-confirm" onClick={criarColab} disabled={salvando}>
                            {salvando ? "Salvando..." : "✔ Criar"}
                        </button>
```

```tsx
{/* Colaboradores.tsx — new */}
                        <button className="btn add-btn-confirm" onClick={criarColab} disabled={salvando}>
                            {salvando ? "Salvando..." : "Criar"}
                        </button>
```

```tsx
{/* Colaboradores.tsx — old */}
                    <button
                        className="btn colab-btn-remover-exec"
                        onClick={removerPorNome}
                        disabled={removendo}
                    >
                        {removendo ? "⏳" : "🗑 Buscar e Remover"}
                    </button>
```

```tsx
{/* Colaboradores.tsx — new */}
                    <button
                        className="btn colab-btn-remover-exec"
                        onClick={removerPorNome}
                        disabled={removendo}
                    >
                        {removendo ? "Buscando..." : <><Trash size={14} /> Buscar e Remover</>}
                    </button>
```

(The "Sim, remover" confirm button inside the `.colab-remover-confirm` block from Task 9 gets its `✔ ` prefix dropped in this task too:)

```tsx
{/* Colaboradores.tsx — old */}
                                    <button
                                        className="btn excluir-btn"
                                        onClick={() => removerPorId(confirmRemoverId)}
                                        disabled={removendo}
                                    >
                                        {removendo ? "Removendo..." : "✔ Sim, remover"}
                                    </button>
```

```tsx
{/* Colaboradores.tsx — new */}
                                    <button
                                        className="btn excluir-btn"
                                        onClick={() => removerPorId(confirmRemoverId)}
                                        disabled={removendo}
                                    >
                                        {removendo ? "Removendo..." : "Sim, remover"}
                                    </button>
```

- [ ] **Step 3: Migrate the search placeholder, loading text, and row-delete icon**

```tsx
{/* Colaboradores.tsx — old */}
                    <input
                        className="add-input"
                        placeholder="🔍 Pesquisar por nome ou matrícula..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                    />
```

```tsx
{/* Colaboradores.tsx — new */}
                    <input
                        className="add-input"
                        placeholder="Pesquisar por nome ou matrícula..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                    />
```

```tsx
{/* Colaboradores.tsx — old */}
                {carregando ? (
                    <p className="add-vazio">⏳ Carregando colaboradores...</p>
                ) : colabs.length === 0 ? (
```

```tsx
{/* Colaboradores.tsx — new */}
                {carregando ? (
                    <p className="add-vazio">Carregando colaboradores...</p>
                ) : colabs.length === 0 ? (
```

```tsx
{/* Colaboradores.tsx — old */}
                                            <button
                                                className="add-btn-icone"
                                                title="Remover"
                                                onClick={() => setConfirmRemoverId(c.id)}
                                            >
                                                <img className="icon" src="lixeira.png" alt="remover" />
                                            </button>
```

```tsx
{/* Colaboradores.tsx — new */}
                                            <button
                                                className="add-btn-icone"
                                                title="Remover"
                                                onClick={() => setConfirmRemoverId(c.id)}
                                            >
                                                <Trash size={16} />
                                            </button>
```

- [ ] **Step 4: Update imports and header (Configuracoes.tsx)**

```tsx
{/* Configuracoes.tsx — old */}
import React, { useState, useEffect } from "react";
import { showToast } from "./Toast";
```

```tsx
{/* Configuracoes.tsx — new */}
import React, { useState, useEffect } from "react";
import { X, Trash, Gear, ClipboardText } from "@phosphor-icons/react";
import { showToast } from "./Toast";
```

```tsx
{/* Configuracoes.tsx — old */}
            <div className="colab-header">
                <h2 className="colab-titulo">⚙️ Configurações</h2>
                <button className="add-btn-fechar" onClick={() => setConfigAberto(false)} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>

            {/* ── Abas ── */}
            <div className="config-tabs">
                <button
                    className={`config-tab${aba === "motivos" ? " config-tab--ativa" : ""}`}
                    onClick={() => setAba("motivos")}
                >
                    📝 Motivos
                </button>
            </div>
```

```tsx
{/* Configuracoes.tsx — new */}
            <div className="colab-header">
                <h2 className="colab-titulo"><Gear size={20} /> Configurações</h2>
                <button className="add-btn-fechar" onClick={() => setConfigAberto(false)} title="Fechar">
                    <X size={20} />
                </button>
            </div>

            {/* ── Abas ── */}
            <div className="config-tabs">
                <button
                    className={`config-tab${aba === "motivos" ? " config-tab--ativa" : ""}`}
                    onClick={() => setAba("motivos")}
                >
                    <ClipboardText size={16} /> Motivos
                </button>
            </div>
```

- [ ] **Step 5: Add flex support to `.config-tab` (also fixes its ad hoc transition duration)**

```css
/* index.css — old */
.config-tab {
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-600);
    cursor: pointer;
    transition: color .15s, border-color .15s;
}
```

```css
/* index.css — new */
.config-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-600);
    cursor: pointer;
    transition: color var(--transition), border-color var(--transition);
}
```

- [ ] **Step 6: Migrate the remaining buttons/placeholders/loading text in Configuracoes.tsx**

```tsx
{/* Configuracoes.tsx — old */}
                        <button
                            className="btn colab-btn-novo"
                            onClick={() => { setCriando(v => !v); setConfirmRemoverId(null); }}
                        >
                            {criando ? "✕ Cancelar" : "+ Novo Motivo"}
                        </button>
```

```tsx
{/* Configuracoes.tsx — new */}
                        <button
                            className="btn colab-btn-novo"
                            onClick={() => { setCriando(v => !v); setConfirmRemoverId(null); }}
                        >
                            {criando ? <><X size={14} /> Cancelar</> : "+ Novo Motivo"}
                        </button>
```

```tsx
{/* Configuracoes.tsx — old */}
                                <button className="btn add-btn-confirm" onClick={criarMotivo} disabled={salvando}>
                                    {salvando ? "Salvando..." : "✔ Criar"}
                                </button>
```

```tsx
{/* Configuracoes.tsx — new */}
                                <button className="btn add-btn-confirm" onClick={criarMotivo} disabled={salvando}>
                                    {salvando ? "Salvando..." : "Criar"}
                                </button>
```

```tsx
{/* Configuracoes.tsx — old */}
                                    <button
                                        className="btn excluir-btn"
                                        onClick={() => removerPorId(confirmRemoverId)}
                                        disabled={removendo}
                                    >
                                        {removendo ? "Removendo..." : "✔ Sim, remover"}
                                    </button>
```

```tsx
{/* Configuracoes.tsx — new */}
                                    <button
                                        className="btn excluir-btn"
                                        onClick={() => removerPorId(confirmRemoverId)}
                                        disabled={removendo}
                                    >
                                        {removendo ? "Removendo..." : "Sim, remover"}
                                    </button>
```

```tsx
{/* Configuracoes.tsx — old */}
                            <input
                                className="add-input"
                                placeholder="🔍 Pesquisar motivo..."
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                            />
```

```tsx
{/* Configuracoes.tsx — new */}
                            <input
                                className="add-input"
                                placeholder="Pesquisar motivo..."
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                            />
```

```tsx
{/* Configuracoes.tsx — old */}
                        {carregando ? (
                            <p className="add-vazio">⏳ Carregando motivos...</p>
                        ) : motivos.length === 0 ? (
```

```tsx
{/* Configuracoes.tsx — new */}
                        {carregando ? (
                            <p className="add-vazio">Carregando motivos...</p>
                        ) : motivos.length === 0 ? (
```

```tsx
{/* Configuracoes.tsx — old */}
                                                <td className="colab-td">
                                                    <button
                                                        className="add-btn-icone"
                                                        title="Remover"
                                                        onClick={() => setConfirmRemoverId(m.id)}
                                                    >
                                                        <img className="icon" src="lixeira.png" alt="remover" />
                                                    </button>
                                                </td>
```

```tsx
{/* Configuracoes.tsx — new */}
                                                <td className="colab-td">
                                                    <button
                                                        className="add-btn-icone"
                                                        title="Remover"
                                                        onClick={() => setConfirmRemoverId(m.id)}
                                                    >
                                                        <Trash size={16} />
                                                    </button>
                                                </td>
```

- [ ] **Step 7: Verify**

Run: `grep -n "src=\"close.png\"\|src=\"lixeira.png\"" "front-end/src/components/Colaboradores.tsx" "front-end/src/components/Configuracoes.tsx"`
Expected: no output.

Run: `grep -nP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" "front-end/src/components/Colaboradores.tsx" "front-end/src/components/Configuracoes.tsx"`
Expected: no output.

Run: `cd front-end && npm run build`
Expected: exits 0.

Visual check: open "Gerenciar Colaboradores" — create, search, and remove a test collaborator via both the row-delete icon and "Buscar e Remover", confirming icons render and no "⏳"/"✔" glyphs remain. Repeat for "Configurações" → Motivos.

- [ ] **Step 8: Commit**

```bash
git add front-end/src/index.css front-end/src/components/Colaboradores.tsx front-end/src/components/Configuracoes.tsx
git commit -m "feat: migrate Colaboradores.tsx and Configuracoes.tsx to Phosphor icons"
```

---

### Task 13: Migrate Tabela.tsx and Toast.tsx

**Files:**
- Modify: `front-end/src/components/Tabela.tsx`
- Modify: `front-end/src/components/Toast.tsx`
- Modify: `front-end/src/index.css`

**Interfaces:**
- Consumes: Task 10's icon-import pattern.
- Produces: the Assinada toggle uses `CheckCircle`/`Square`, the tooltip's em dash is gone, and Toast renders Phosphor icons instead of emoji.

- [ ] **Step 1: Migrate the Assinada toggle and its tooltip**

```tsx
{/* Tabela.tsx — old */}
import type { MouseEvent } from "react";
```

```tsx
{/* Tabela.tsx — new */}
import type { MouseEvent } from "react";
import { CheckCircle, Square } from "@phosphor-icons/react";
```

```tsx
{/* Tabela.tsx — old */}
                    <button
                        type='button'
                        className={`assinada-toggle ${assinada ? 'assinada-toggle--sim' : 'assinada-toggle--nao'}`}
                        onClick={() => onToggleAssinatura(id, !assinada)}
                        aria-pressed={assinada}
                        title={assinada ? 'Assinada — clique para desmarcar' : 'Pendente — clique para marcar como assinada'}
                    >
                        {assinada ? '✅ Assinada' : '⬜ Pendente'}
                    </button>
```

```tsx
{/* Tabela.tsx — new */}
                    <button
                        type='button'
                        className={`assinada-toggle ${assinada ? 'assinada-toggle--sim' : 'assinada-toggle--nao'}`}
                        onClick={() => onToggleAssinatura(id, !assinada)}
                        aria-pressed={assinada}
                        title={assinada ? 'Assinada. Clique para desmarcar.' : 'Pendente. Clique para marcar como assinada.'}
                    >
                        {assinada
                            ? <><CheckCircle size={14} weight="fill" /> Assinada</>
                            : <><Square size={14} /> Pendente</>}
                    </button>
```

- [ ] **Step 2: Migrate Toast.tsx**

```tsx
{/* Toast.tsx — old */}
import { useState, useEffect } from 'react'
```

```tsx
{/* Toast.tsx — new */}
import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Info } from '@phosphor-icons/react'
```

```tsx
{/* Toast.tsx — old */}
                    <span className="toast-icon">
                        {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
                    </span>
```

```tsx
{/* Toast.tsx — new */}
                    <span className="toast-icon">
                        {t.type === 'success'
                            ? <CheckCircle size={18} weight="fill" />
                            : t.type === 'error'
                                ? <XCircle size={18} weight="fill" />
                                : <Info size={18} weight="fill" />}
                    </span>
```

- [ ] **Step 3: Verify**

Run: `grep -n " — " "front-end/src/components/Tabela.tsx"`
Expected: no output.

Run: `grep -nP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" "front-end/src/components/Tabela.tsx" "front-end/src/components/Toast.tsx"`
Expected: no output.

Run: `cd front-end && npm run build`
Expected: exits 0.

Visual check: in the main table, toggle a row's Assinada state — confirm a filled green check / outline square renders instead of ✅/⬜, and the tooltip text still makes sense. Trigger a toast (e.g. create then delete an advertência) and confirm the success/error icons render.

- [ ] **Step 4: Commit**

```bash
git add front-end/src/components/Tabela.tsx front-end/src/components/Toast.tsx
git commit -m "feat: migrate Tabela.tsx and Toast.tsx to Phosphor icons"
```

---

### Task 14: Migrate HistoricoMenu.tsx, HistoricoColaborador.tsx, and HistoricoMotivo.tsx

**Files:**
- Modify: `front-end/src/components/HistoricoMenu.tsx`
- Modify: `front-end/src/components/HistoricoColaborador.tsx`
- Modify: `front-end/src/components/HistoricoMotivo.tsx`

**Interfaces:**
- Consumes: Task 10's `.titulo-com-icone` utility (icon rendered as a sibling of `.hist-titulo`, inside the existing `.hist-header`/`.hist-header-left` flex row) and icon-import pattern.
- Produces: all three files use Phosphor icons for close/back/header/badge/aviso, and the histórico result-header copy drops its decorative pin and (for the colaborador variant) its em dash.

- [ ] **Step 1: Migrate HistoricoMenu.tsx**

```tsx
{/* HistoricoMenu.tsx — old */}
import React from 'react'

type Props = {
    onFechar: () => void
    onEscolherColaborador: () => void
    onEscolherMotivo: () => void
}

const HistoricoMenu: React.FC<Props> = ({ onFechar, onEscolherColaborador, onEscolherMotivo }) => {
    return (
        <div className="hist-popup">
            <div className="hist-header">
                <h2 className="hist-titulo">📊 Analise e Emissão de advertências</h2>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>

            <p className="hist-subtitulo">
                Selecione como deseja analisar o histórico:
            </p>

            <div className="hist-menu-grid">
                <button className="hist-menu-card" onClick={onEscolherColaborador}>
                    <span className="hist-menu-icon">👤</span>
                    <span className="hist-menu-label">Analisar Advertências por colaborador</span>
                    <span className="hist-menu-desc">
                        Ver e exportar todas as advertências de um colaborador específico.
                    </span>
                </button>

                <button className="hist-menu-card" onClick={onEscolherMotivo}>
                    <span className="hist-menu-icon">📋</span>
                    <span className="hist-menu-label">Analisar Advertências por motivo</span>
                    <span className="hist-menu-desc">
                        Ver e exportar todas as advertências agrupadas por motivo.
                    </span>
                </button>
            </div>
        </div>
    )
}

export default HistoricoMenu
```

```tsx
{/* HistoricoMenu.tsx — new */}
import React from 'react'
import { X, ChartBar, User, ClipboardText } from '@phosphor-icons/react'

type Props = {
    onFechar: () => void
    onEscolherColaborador: () => void
    onEscolherMotivo: () => void
}

const HistoricoMenu: React.FC<Props> = ({ onFechar, onEscolherColaborador, onEscolherMotivo }) => {
    return (
        <div className="hist-popup">
            <div className="hist-header">
                <span className="titulo-com-icone">
                    <ChartBar size={20} />
                    <h2 className="hist-titulo">Analise e Emissão de advertências</h2>
                </span>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <X size={20} />
                </button>
            </div>

            <p className="hist-subtitulo">
                Selecione como deseja analisar o histórico:
            </p>

            <div className="hist-menu-grid">
                <button className="hist-menu-card" onClick={onEscolherColaborador}>
                    <span className="hist-menu-icon"><User size={40} /></span>
                    <span className="hist-menu-label">Analisar Advertências por colaborador</span>
                    <span className="hist-menu-desc">
                        Ver e exportar todas as advertências de um colaborador específico.
                    </span>
                </button>

                <button className="hist-menu-card" onClick={onEscolherMotivo}>
                    <span className="hist-menu-icon"><ClipboardText size={40} /></span>
                    <span className="hist-menu-label">Analisar Advertências por motivo</span>
                    <span className="hist-menu-desc">
                        Ver e exportar todas as advertências agrupadas por motivo.
                    </span>
                </button>
            </div>
        </div>
    )
}

export default HistoricoMenu
```

Add flex support for `.hist-menu-icon` (it goes from holding a big emoji character to a Phosphor `<svg>` — the existing rule needs `display:flex;justify-content:center` so the icon centers the same way the emoji did):

```css
/* index.css — old */
.hist-menu-icon {
    font-size: 44px;
    line-height: 1;
}
```

```css
/* index.css — new */
.hist-menu-icon {
    display: flex;
    color: var(--red-primary);
}
```

- [ ] **Step 2: Migrate HistoricoColaborador.tsx**

```tsx
{/* HistoricoColaborador.tsx — old */}
import React, { useState, useMemo, useEffect } from 'react'
import { MESES_NOMES, getAnoMesAtual, listaAnos, isMesFuturo, filtrarPorMes, parseDataLocal } from '../utils/datas'
import ColabSelect from './ColabSelect'
```

```tsx
{/* HistoricoColaborador.tsx — new */}
import React, { useState, useMemo, useEffect } from 'react'
import { X, ArrowLeft, User, CheckCircle, Square, Warning, DownloadSimple } from '@phosphor-icons/react'
import { MESES_NOMES, getAnoMesAtual, listaAnos, isMesFuturo, filtrarPorMes, parseDataLocal } from '../utils/datas'
import ColabSelect from './ColabSelect'
```

```tsx
{/* HistoricoColaborador.tsx — old */}
            <div className="hist-header">
                <div className="hist-header-left">
                    <button className="hist-btn-voltar" onClick={onVoltar} title="Voltar">
                        ← Voltar
                    </button>
                    <h2 className="hist-titulo">👤 Advertências por Colaborador</h2>
                </div>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>
```

```tsx
{/* HistoricoColaborador.tsx — new */}
            <div className="hist-header">
                <div className="hist-header-left">
                    <button className="hist-btn-voltar" onClick={onVoltar} title="Voltar">
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <span className="titulo-com-icone">
                        <User size={20} />
                        <h2 className="hist-titulo">Advertências por Colaborador</h2>
                    </span>
                </div>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <X size={20} />
                </button>
            </div>
```

```tsx
{/* HistoricoColaborador.tsx — old */}
                            <div className="hist-resultado-header">
                                <span className="hist-resultado-nome">
                                    📌 {historicoColaborador[0].nome} — {historicoColaborador.length} advertência(s)
                                </span>
                            </div>
```

```tsx
{/* HistoricoColaborador.tsx — new */}
                            <div className="hist-resultado-header">
                                <span className="hist-resultado-nome">
                                    {historicoColaborador[0].nome}: {historicoColaborador.length} advertência(s)
                                </span>
                            </div>
```

```tsx
{/* HistoricoColaborador.tsx — old */}
                                                <td>
                                                    <span className={`assinada-badge ${a.assinada ? 'assinada-badge--sim' : 'assinada-badge--nao'}`}>
                                                        {a.assinada ? '✅ Assinada' : '⬜ Pendente'}
                                                    </span>
                                                </td>
```

```tsx
{/* HistoricoColaborador.tsx — new */}
                                                <td>
                                                    <span className={`assinada-badge ${a.assinada ? 'assinada-badge--sim' : 'assinada-badge--nao'}`}>
                                                        {a.assinada
                                                            ? <><CheckCircle size={14} weight="fill" /> Assinada</>
                                                            : <><Square size={14} /> Pendente</>}
                                                    </span>
                                                </td>
```

```tsx
{/* HistoricoColaborador.tsx — old */}
                                        {isMesFuturo(filtroAno, filtroMes) && (
                                            <span className="hist-aviso">⚠️ Mês futuro</span>
                                        )}
```

```tsx
{/* HistoricoColaborador.tsx — new */}
                                        {isMesFuturo(filtroAno, filtroMes) && (
                                            <span className="hist-aviso"><Warning size={14} /> Mês futuro</span>
                                        )}
```

```tsx
{/* HistoricoColaborador.tsx — old */}
                                <button
                                    className="btn add-btn-confirm hist-btn-gerar"
                                    onClick={() => onGerar(historicoColaborador[0].nome)}
                                >
                                    📥 Gerar histórico de {historicoColaborador[0].nome}
                                </button>
```

```tsx
{/* HistoricoColaborador.tsx — new */}
                                <button
                                    className="btn add-btn-confirm hist-btn-gerar"
                                    onClick={() => onGerar(historicoColaborador[0].nome)}
                                >
                                    <DownloadSimple size={16} /> Gerar histórico de {historicoColaborador[0].nome}
                                </button>
```

- [ ] **Step 3: Migrate HistoricoMotivo.tsx**

```tsx
{/* HistoricoMotivo.tsx — old */}
import React, { useState, useMemo, useEffect } from 'react'
import MotivosSelect from './MotivosSelect'
```

```tsx
{/* HistoricoMotivo.tsx — new */}
import React, { useState, useMemo, useEffect } from 'react'
import { X, ArrowLeft, ClipboardText, CheckCircle, Square, Warning, DownloadSimple } from '@phosphor-icons/react'
import MotivosSelect from './MotivosSelect'
```

```tsx
{/* HistoricoMotivo.tsx — old */}
            <div className="hist-header">
                <div className="hist-header-left">
                    <button className="hist-btn-voltar" onClick={onVoltar} title="Voltar">
                        ← Voltar
                    </button>
                    <h2 className="hist-titulo">📋 Advertências por Motivo</h2>
                </div>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>
```

```tsx
{/* HistoricoMotivo.tsx — new */}
            <div className="hist-header">
                <div className="hist-header-left">
                    <button className="hist-btn-voltar" onClick={onVoltar} title="Voltar">
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <span className="titulo-com-icone">
                        <ClipboardText size={20} />
                        <h2 className="hist-titulo">Advertências por Motivo</h2>
                    </span>
                </div>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <X size={20} />
                </button>
            </div>
```

```tsx
{/* HistoricoMotivo.tsx — old */}
                            <div className="hist-resultado-header">
                                <span className="hist-resultado-motivo" title={motivoConfirmado}>
                                    📌 {historicoMotivo.length} advertência(s) com esse motivo
                                </span>
                            </div>
```

```tsx
{/* HistoricoMotivo.tsx — new */}
                            <div className="hist-resultado-header">
                                <span className="hist-resultado-motivo" title={motivoConfirmado}>
                                    {historicoMotivo.length} advertência(s) com esse motivo
                                </span>
                            </div>
```

```tsx
{/* HistoricoMotivo.tsx — old */}
                                                <td>
                                                    <span className={`assinada-badge ${a.assinada ? 'assinada-badge--sim' : 'assinada-badge--nao'}`}>
                                                        {a.assinada ? '✅ Assinada' : '⬜ Pendente'}
                                                    </span>
                                                </td>
```

```tsx
{/* HistoricoMotivo.tsx — new */}
                                                <td>
                                                    <span className={`assinada-badge ${a.assinada ? 'assinada-badge--sim' : 'assinada-badge--nao'}`}>
                                                        {a.assinada
                                                            ? <><CheckCircle size={14} weight="fill" /> Assinada</>
                                                            : <><Square size={14} /> Pendente</>}
                                                    </span>
                                                </td>
```

```tsx
{/* HistoricoMotivo.tsx — old */}
                                            {isMesFuturo(filtroAno, filtroMes) && (
                                                <span className="hist-aviso">⚠️ Mês futuro</span>
                                            )}
```

```tsx
{/* HistoricoMotivo.tsx — new */}
                                            {isMesFuturo(filtroAno, filtroMes) && (
                                                <span className="hist-aviso"><Warning size={14} /> Mês futuro</span>
                                            )}
```

```tsx
{/* HistoricoMotivo.tsx — old */}
                                            {isDataFutura(filtroAno, filtroMes, filtroDia) && (
                                                <span className="hist-aviso">⚠️ Data futura</span>
                                            )}
```

```tsx
{/* HistoricoMotivo.tsx — new */}
                                            {isDataFutura(filtroAno, filtroMes, filtroDia) && (
                                                <span className="hist-aviso"><Warning size={14} /> Data futura</span>
                                            )}
```

```tsx
{/* HistoricoMotivo.tsx — old */}
                            <div className="hist-rodape">
                                <button
                                    className="btn add-btn-confirm hist-btn-gerar"
                                    onClick={() => onGerar(motivoConfirmado)}
                                >
                                    📥 Gerar advertências por motivo
                                </button>
                            </div>
```

```tsx
{/* HistoricoMotivo.tsx — new */}
                            <div className="hist-rodape">
                                <button
                                    className="btn add-btn-confirm hist-btn-gerar"
                                    onClick={() => onGerar(motivoConfirmado)}
                                >
                                    <DownloadSimple size={16} /> Gerar advertências por motivo
                                </button>
                            </div>
```

- [ ] **Step 4: Add flex support for `.hist-aviso` (icon + text)**

```css
/* index.css — old */
.hist-aviso {
    color: var(--orange);
    font-weight: 600;
    font-size: 12px;
}
```

```css
/* index.css — new */
.hist-aviso {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--orange);
    font-weight: 600;
    font-size: 12px;
}
```

- [ ] **Step 5: Verify**

Run: `grep -n "src=\"close.png\"" "front-end/src/components/HistoricoMenu.tsx" "front-end/src/components/HistoricoColaborador.tsx" "front-end/src/components/HistoricoMotivo.tsx"`
Expected: no output.

Run: `grep -n " — " "front-end/src/components/HistoricoColaborador.tsx" "front-end/src/components/HistoricoMotivo.tsx"`
Expected: no output.

Run: `grep -nP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" "front-end/src/components/HistoricoMenu.tsx" "front-end/src/components/HistoricoColaborador.tsx" "front-end/src/components/HistoricoMotivo.tsx"`
Expected: no output.

Run: `cd front-end && npm run build`
Expected: exits 0.

Visual check: open Histórico → both branches (colaborador and motivo). Confirm the menu cards show a person/clipboard icon, the "Voltar"/close buttons show real icons, the result-header line reads without a pin or em dash, Assinada badges render with icon+text, and picking a future month/day shows the warning icon.

- [ ] **Step 6: Commit**

```bash
git add front-end/src/index.css front-end/src/components/HistoricoMenu.tsx front-end/src/components/HistoricoColaborador.tsx front-end/src/components/HistoricoMotivo.tsx
git commit -m "feat: migrate HistoricoMenu/HistoricoColaborador/HistoricoMotivo to Phosphor icons"
```

---

### Task 15: Migrate GerarHistoricoColaborador.tsx, GerarHistoricoMotivo.tsx, and EvidenciasUploader.tsx

**Files:**
- Modify: `front-end/src/components/GerarHistoricoColaborador.tsx`
- Modify: `front-end/src/components/GerarHistoricoMotivo.tsx`
- Modify: `front-end/src/components/EvidenciasUploader.tsx`
- Modify: `front-end/src/index.css`

**Interfaces:**
- Consumes: Task 10's utilities.
- Produces: all three files use Phosphor icons; "⏳ Gerando..."/"⏳ Processando..." become plain "Gerando..."/"Processando..." (already the existing pattern in most of the codebase).

- [ ] **Step 1: Migrate GerarHistoricoColaborador.tsx**

```tsx
{/* GerarHistoricoColaborador.tsx — old */}
import React, { useState, useMemo } from 'react'
import { MESES_NOMES, getAnoMesAtual, listaAnos, isMesFuturo, filtrarPorMes } from '../utils/datas'
import { downloadHistoricoExcel } from '../utils/excelHistorico'
import { showToast } from './Toast'
```

```tsx
{/* GerarHistoricoColaborador.tsx — new (FileXls, not FilePdf — this file
   calls downloadHistoricoExcel, so the icon on its "Gerar arquivo"
   button must match the .xlsx file it actually produces) */}
import React, { useState, useMemo } from 'react'
import { X, ArrowLeft, DownloadSimple, Warning, FileXls } from '@phosphor-icons/react'
import { MESES_NOMES, getAnoMesAtual, listaAnos, isMesFuturo, filtrarPorMes } from '../utils/datas'
import { downloadHistoricoExcel } from '../utils/excelHistorico'
import { showToast } from './Toast'
```

```tsx
{/* GerarHistoricoColaborador.tsx — old */}
            <div className="hist-header">
                <div className="hist-header-left">
                    <button className="hist-btn-voltar" onClick={onVoltar} title="Voltar">
                        ← Voltar
                    </button>
                    <h2 className="hist-titulo">
                        📥 Gerar histórico de <span className="hist-nome-destaque">{nomeColaborador}</span>
                    </h2>
                </div>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>
```

```tsx
{/* GerarHistoricoColaborador.tsx — new */}
            <div className="hist-header">
                <div className="hist-header-left">
                    <button className="hist-btn-voltar" onClick={onVoltar} title="Voltar">
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <span className="titulo-com-icone">
                        <DownloadSimple size={20} />
                        <h2 className="hist-titulo">
                            Gerar histórico de <span className="hist-nome-destaque">{nomeColaborador}</span>
                        </h2>
                    </span>
                </div>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <X size={20} />
                </button>
            </div>
```

```tsx
{/* GerarHistoricoColaborador.tsx — old */}
                <div className={`hist-msg-box ${qtd === 0 ? 'hist-msg-box--vazio' : 'hist-msg-box--ok'}`}>
                    {futuro ? (
                        <>⚠️ Mês selecionado ainda não ocorreu.</>
                    ) : qtd === 0 ? (
```

```tsx
{/* GerarHistoricoColaborador.tsx — new */}
                <div className={`hist-msg-box ${qtd === 0 ? 'hist-msg-box--vazio' : 'hist-msg-box--ok'}`}>
                    {futuro ? (
                        <><Warning size={14} /> Mês selecionado ainda não ocorreu.</>
                    ) : qtd === 0 ? (
```

```tsx
{/* GerarHistoricoColaborador.tsx — old */}
                    <button
                        className="btn add-btn-confirm hist-btn-gerar"
                        onClick={gerar}
                        disabled={baixando || futuro || qtd === 0}
                    >
                        {baixando ? '⏳ Gerando...' : '📄 Gerar arquivo'}
                    </button>
```

```tsx
{/* GerarHistoricoColaborador.tsx — new */}
                    <button
                        className="btn add-btn-confirm hist-btn-gerar"
                        onClick={gerar}
                        disabled={baixando || futuro || qtd === 0}
                    >
                        {baixando ? 'Gerando...' : <><FileXls size={16} /> Gerar arquivo</>}
                    </button>
```

- [ ] **Step 2: Migrate GerarHistoricoMotivo.tsx**

```tsx
{/* GerarHistoricoMotivo.tsx — old */}
import React, { useState, useMemo } from 'react'
import {
    MESES_NOMES, getAnoMesAtual, listaAnos,
    isMesFuturo, isDataFutura, diasNoMes,
    filtrarPorMes, filtrarPorDia,
} from '../utils/datas'
import { downloadAdvertenciasMultiPdf } from '../utils/pdfAdvertencia'
import type { AdvertenciaDoc } from '../utils/pdfAdvertencia'
import { downloadHistoricoExcel } from '../utils/excelHistorico'
import { showToast } from './Toast'
```

```tsx
{/* GerarHistoricoMotivo.tsx — new */}
import React, { useState, useMemo } from 'react'
import { X, ArrowLeft, DownloadSimple, Warning, Calendar, FilePdf, FileXls } from '@phosphor-icons/react'
import {
    MESES_NOMES, getAnoMesAtual, listaAnos,
    isMesFuturo, isDataFutura, diasNoMes,
    filtrarPorMes, filtrarPorDia,
} from '../utils/datas'
import { downloadAdvertenciasMultiPdf } from '../utils/pdfAdvertencia'
import type { AdvertenciaDoc } from '../utils/pdfAdvertencia'
import { downloadHistoricoExcel } from '../utils/excelHistorico'
import { showToast } from './Toast'
```

```tsx
{/* GerarHistoricoMotivo.tsx — old */}
            <div className="hist-header">
                <div className="hist-header-left">
                    <button className="hist-btn-voltar" onClick={onVoltar} title="Voltar">
                        ← Voltar
                    </button>
                    <h2 className="hist-titulo">📥 Gerar histórico por motivo</h2>
                </div>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>
```

```tsx
{/* GerarHistoricoMotivo.tsx — new */}
            <div className="hist-header">
                <div className="hist-header-left">
                    <button className="hist-btn-voltar" onClick={onVoltar} title="Voltar">
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <span className="titulo-com-icone">
                        <DownloadSimple size={20} />
                        <h2 className="hist-titulo">Gerar histórico por motivo</h2>
                    </span>
                </div>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <X size={20} />
                </button>
            </div>
```

```tsx
{/* GerarHistoricoMotivo.tsx — old */}
            <div className="hist-modo-grid">
                <button
                    className={`hist-modo-btn ${modo === 'mes' ? 'hist-modo-btn--ativo' : ''}`}
                    onClick={() => setModo('mes')}
                >
                    📅 Gerar por mês
                </button>
                <button
                    className={`hist-modo-btn ${modo === 'dia' ? 'hist-modo-btn--ativo' : ''}`}
                    onClick={() => setModo('dia')}
                >
                    📆 Gerar por dia
                </button>
            </div>
```

```tsx
{/* GerarHistoricoMotivo.tsx — new */}
            <div className="hist-modo-grid">
                <button
                    className={`hist-modo-btn ${modo === 'mes' ? 'hist-modo-btn--ativo' : ''}`}
                    onClick={() => setModo('mes')}
                >
                    <Calendar size={18} /> Gerar por mês
                </button>
                <button
                    className={`hist-modo-btn ${modo === 'dia' ? 'hist-modo-btn--ativo' : ''}`}
                    onClick={() => setModo('dia')}
                >
                    <Calendar size={18} /> Gerar por dia
                </button>
            </div>
```

```tsx
{/* GerarHistoricoMotivo.tsx — old */}
                    <div className={`hist-msg-box ${doMes.length === 0 ? 'hist-msg-box--vazio' : 'hist-msg-box--ok'}`}>
                        {futuroMes ? (
                            <>⚠️ Mês selecionado ainda não ocorreu.</>
                        ) : (
```

```tsx
{/* GerarHistoricoMotivo.tsx — new */}
                    <div className={`hist-msg-box ${doMes.length === 0 ? 'hist-msg-box--vazio' : 'hist-msg-box--ok'}`}>
                        {futuroMes ? (
                            <><Warning size={14} /> Mês selecionado ainda não ocorreu.</>
                        ) : (
```

```tsx
{/* GerarHistoricoMotivo.tsx — old */}
                    <div className="hist-rodape">
                        <button
                            className="btn hist-btn-pdf hist-btn-gerar"
                            onClick={gerarMes}
                            disabled={baixando || futuroMes || doMes.length === 0}
                        >
                            {baixando ? '⏳ Gerando...' : '📄 Gerar PDF'}
                        </button>
                        <button
                            className="btn add-btn-confirm hist-btn-gerar"
                            onClick={gerarMesExcel}
                            disabled={baixando || futuroMes || doMes.length === 0}
                        >
                            {baixando ? '⏳ Gerando...' : '📊 Gerar Excel'}
                        </button>
                    </div>
                </div>
            )}

            {modo === 'dia' && (
```

```tsx
{/* GerarHistoricoMotivo.tsx — new */}
                    <div className="hist-rodape">
                        <button
                            className="btn hist-btn-pdf hist-btn-gerar"
                            onClick={gerarMes}
                            disabled={baixando || futuroMes || doMes.length === 0}
                        >
                            {baixando ? 'Gerando...' : <><FilePdf size={16} /> Gerar PDF</>}
                        </button>
                        <button
                            className="btn add-btn-confirm hist-btn-gerar"
                            onClick={gerarMesExcel}
                            disabled={baixando || futuroMes || doMes.length === 0}
                        >
                            {baixando ? 'Gerando...' : <><FileXls size={16} /> Gerar Excel</>}
                        </button>
                    </div>
                </div>
            )}

            {modo === 'dia' && (
```

```tsx
{/* GerarHistoricoMotivo.tsx — old */}
                    <div className={`hist-msg-box ${doDia.length === 0 ? 'hist-msg-box--vazio' : 'hist-msg-box--ok'}`}>
                        {futuroDia ? (
                            <>⚠️ Data selecionada ainda não ocorreu.</>
                        ) : (
```

```tsx
{/* GerarHistoricoMotivo.tsx — new */}
                    <div className={`hist-msg-box ${doDia.length === 0 ? 'hist-msg-box--vazio' : 'hist-msg-box--ok'}`}>
                        {futuroDia ? (
                            <><Warning size={14} /> Data selecionada ainda não ocorreu.</>
                        ) : (
```

```tsx
{/* GerarHistoricoMotivo.tsx — old */}
                    <div className="hist-rodape">
                        <button
                            className="btn hist-btn-pdf hist-btn-gerar"
                            onClick={gerarDia}
                            disabled={baixando || futuroDia || doDia.length === 0}
                        >
                            {baixando ? '⏳ Gerando...' : '📄 Gerar PDF'}
                        </button>
                        <button
                            className="btn add-btn-confirm hist-btn-gerar"
                            onClick={gerarDiaExcel}
                            disabled={baixando || futuroDia || doDia.length === 0}
                        >
                            {baixando ? '⏳ Gerando...' : '📊 Gerar Excel'}
                        </button>
                    </div>
                </div>
            )}
```

```tsx
{/* GerarHistoricoMotivo.tsx — new */}
                    <div className="hist-rodape">
                        <button
                            className="btn hist-btn-pdf hist-btn-gerar"
                            onClick={gerarDia}
                            disabled={baixando || futuroDia || doDia.length === 0}
                        >
                            {baixando ? 'Gerando...' : <><FilePdf size={16} /> Gerar PDF</>}
                        </button>
                        <button
                            className="btn add-btn-confirm hist-btn-gerar"
                            onClick={gerarDiaExcel}
                            disabled={baixando || futuroDia || doDia.length === 0}
                        >
                            {baixando ? 'Gerando...' : <><FileXls size={16} /> Gerar Excel</>}
                        </button>
                    </div>
                </div>
            )}
```

- [ ] **Step 3: Migrate EvidenciasUploader.tsx**

```tsx
{/* EvidenciasUploader.tsx — old */}
import { useRef, useState } from "react";
import { fileParaEvidencia } from "../utils/imagem";
import type { EvidenciaLocal } from "../utils/imagem";
```

```tsx
{/* EvidenciasUploader.tsx — new */}
import { useRef, useState } from "react";
import { Paperclip, X } from "@phosphor-icons/react";
import { fileParaEvidencia } from "../utils/imagem";
import type { EvidenciaLocal } from "../utils/imagem";
```

```tsx
{/* EvidenciasUploader.tsx — old */}
                <button
                    type="button"
                    className="evid-add-btn btn"
                    onClick={() => inputRef.current?.click()}
                    disabled={processando}
                    title="Anexar imagens (JPG, PNG ou WEBP)"
                >
                    {processando ? "⏳ Processando..." : "📎 Anexar imagens"}
                </button>
```

```tsx
{/* EvidenciasUploader.tsx — new */}
                <button
                    type="button"
                    className="evid-add-btn btn"
                    onClick={() => inputRef.current?.click()}
                    disabled={processando}
                    title="Anexar imagens (JPG, PNG ou WEBP)"
                >
                    {processando ? "Processando..." : <><Paperclip size={16} /> Anexar imagens</>}
                </button>
```

```tsx
{/* EvidenciasUploader.tsx — old */}
                    {existentes.map(ex => (
                        <div key={`ex-${ex.id}`} className="evid-thumb">
                            <img src={ex.url} alt={ex.nome ?? "evidência"} />
                            {onRemoverExistente && (
                                <button
                                    type="button"
                                    className="evid-thumb-remover"
                                    title="Remover"
                                    onClick={() => onRemoverExistente(ex.id)}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                    {novas.map((ev, idx) => (
                        <div key={`nova-${idx}`} className="evid-thumb">
                            <img src={ev.previewUrl} alt={ev.nomeArquivo ?? "evidência"} />
                            <button
                                type="button"
                                className="evid-thumb-remover"
                                title="Remover"
                                onClick={() => removerNova(idx)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
```

```tsx
{/* EvidenciasUploader.tsx — new */}
                    {existentes.map(ex => (
                        <div key={`ex-${ex.id}`} className="evid-thumb">
                            <img src={ex.url} alt={ex.nome ?? "evidência"} />
                            {onRemoverExistente && (
                                <button
                                    type="button"
                                    className="evid-thumb-remover"
                                    title="Remover"
                                    onClick={() => onRemoverExistente(ex.id)}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                    {novas.map((ev, idx) => (
                        <div key={`nova-${idx}`} className="evid-thumb">
                            <img src={ev.previewUrl} alt={ev.nomeArquivo ?? "evidência"} />
                            <button
                                type="button"
                                className="evid-thumb-remover"
                                title="Remover"
                                onClick={() => removerNova(idx)}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
```

- [ ] **Step 4: Verify**

Run: `grep -n "src=\"close.png\"" "front-end/src/components/GerarHistoricoColaborador.tsx" "front-end/src/components/GerarHistoricoMotivo.tsx"`
Expected: no output.

Run: `grep -nP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" "front-end/src/components/GerarHistoricoColaborador.tsx" "front-end/src/components/GerarHistoricoMotivo.tsx" "front-end/src/components/EvidenciasUploader.tsx"`
Expected: no output.

Run: `cd front-end && npm run build`
Expected: exits 0.

Visual check: open Histórico → por colaborador → Gerar (confirm the file-export icon and "Gerando..." text). Open Histórico → por motivo → Gerar → both "Gerar por mês"/"Gerar por dia" and both PDF/Excel export buttons. In "Nova Advertência", attach and remove an evidence image, confirming the paperclip and X icons render.

- [ ] **Step 5: Commit**

```bash
git add front-end/src/index.css front-end/src/components/GerarHistoricoColaborador.tsx front-end/src/components/GerarHistoricoMotivo.tsx front-end/src/components/EvidenciasUploader.tsx
git commit -m "feat: migrate remaining histórico components and EvidenciasUploader to Phosphor icons"
```

---

### Task 16: Remove unused PNG icons and do the final verification pass

**Files:**
- Delete: `front-end/public/plus.png`
- Delete: `front-end/public/colab.png`
- Delete: `front-end/public/settings.png`
- Delete: `front-end/public/search.png`
- Delete: `front-end/public/close.png`
- Delete: `front-end/public/download.png`
- Delete: `front-end/public/edit.png`
- Delete: `front-end/public/lixeira.png`
- Modify: `front-end/src/index.css`

**Interfaces:**
- Consumes: the fully icon-migrated codebase from Tasks 10-15.
- Produces: a repository with no orphaned icon assets or dead CSS, and a final confirmation that the whole refinement (Blocks A-D of the spec) builds and looks right.

- [ ] **Step 1: Confirm zero remaining references before deleting**

Run: `grep -rn "plus\.png\|colab\.png\|settings\.png\|search\.png\|close\.png\|download\.png\|edit\.png\|lixeira\.png" "front-end/src"`
Expected: no output. If anything matches, stop and fix that reference before deleting the corresponding file (it means an earlier task's migration was incomplete).

- [ ] **Step 2: Delete the unused PNGs**

```bash
git rm front-end/public/plus.png front-end/public/colab.png front-end/public/settings.png front-end/public/search.png front-end/public/close.png front-end/public/download.png front-end/public/edit.png front-end/public/lixeira.png
```

`front-end/public/danlex.png` and `front-end/public/favicon.ico` are not touched.

- [ ] **Step 3: Remove the now-dead `.icon` CSS rule**

Every `<img className="icon" ...>` in the codebase was replaced with a Phosphor icon component across Tasks 10-15 (the logo uses `.logo`, a separate class, and is untouched). Confirm first:

Run: `grep -rn "className=.icon" "front-end/src" --include="*.tsx"`
Expected: no output.

```css
/* index.css — old */
.icon {
    width: 22px;
    height: 22px;
    display: block;
}

/* Ícone + título lado a lado em cabeçalhos de modal — usado com uma
   classe de título existente (add-titulo-principal, colab-titulo,
   hist-titulo) ou envolvendo [ícone, h2] quando o próprio título
   precisa manter seu próprio overflow/ellipsis (hist-titulo). */
.titulo-com-icone {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}
```

```css
/* index.css — new */
/* Ícone + título lado a lado em cabeçalhos de modal — usado com uma
   classe de título existente (add-titulo-principal, colab-titulo,
   hist-titulo) ou envolvendo [ícone, h2] quando o próprio título
   precisa manter seu próprio overflow/ellipsis (hist-titulo). */
.titulo-com-icone {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}
```

- [ ] **Step 4: Full-project sweep for anything the per-task greps might have missed**

Run: `grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" "front-end/src" --include="*.tsx"`
Expected: no output.

Run: `grep -rn " — " "front-end/src" --include="*.tsx"`
Expected: no output.

Run: `cd front-end && npm run build`
Expected: exits 0, no missing-asset warnings.

- [ ] **Step 5: Full visual regression pass**

Use the `run` skill to start the dev server. Walk through, at both a normal desktop size and a notebook-height window (≤850px tall, per the 2026-07-20 responsiveness spec):
- Main screen: search, select multiple rows with Ctrl+click, toggle Assinada, use all four action-bar buttons.
- Nova Advertência: individual mode and modo múltiplo (add/remove a row).
- Editar and Excluir an advertência.
- Gerenciar Colaboradores: create, search, remove (both by row and by name).
- Configurações: create and remove a Motivo.
- Histórico: both branches (colaborador, motivo), including the "mês"/"dia" filters and both PDF/Excel export buttons.
- Confirm no broken image icons anywhere, no leftover emoji, no em dashes, and the app still generates real PDF/Excel/zip files at the end of each flow (the export logic itself was never touched by this plan, but confirm nothing was accidentally broken).

- [ ] **Step 6: Final commit**

```bash
git add -A front-end/public front-end/src/index.css
git commit -m "chore: remove unused PNG icons and the now-dead .icon CSS rule"
```
