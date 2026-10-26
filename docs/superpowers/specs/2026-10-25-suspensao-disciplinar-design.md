# Suspensão disciplinar, históricos e downloads — design e plano

Status: rascunho para revisão (Opus 5.5) e aprovação do usuário. Nada foi implementado.

## Objetivo

1. Registrar **suspensões disciplinares** (modelo do PDF "SUSPENSÃO DISCIPLINAR DE 1 DIA").
2. Avisar, por notificação, quando um colaborador atinge a 4ª advertência, oferecendo aplicar suspensão.
3. Alternar a lista principal entre **Advertências** e **Suspensões**.
4. Históricos completos: por colaborador, por motivo e geral por período, em Excel ou PDF, com escolha de advertência, suspensão ou ambas.

## Decisões do usuário

- A 4ª advertência conta Escritas **e** Verbais.
- Na 4ª advertência (e nas seguintes, até existir suspensão) aparece uma notificação no canto superior direito: entra da direita para a esquerda, tem barra de tempo da esquerda para a direita, e dois botões: "Agora não" (fecha) e "Aplicar suspensão".
- "Aplicar suspensão" abre o formulário com colaborador e matrícula já preenchidos.
- Campos da suspensão, todos digitados: quantidade de dias (sem limite), data de início, data de retorno, motivo, complemento (opcional) e evidências.
- Suspensão também tem "Assinada" e PDF no modelo próprio.
- Toggle no topo da lista principal: Advertências | Suspensões.
- Botão "Gerar histórico geral" na tela principal: modal com data inicial, data final, tipo (advertência, suspensão ou ambas) e formato (Excel ou PDF).
- Fluxo por colaborador: buscar e selecionar na tela inicial → "Baixar Histórico" → escolher tipo (advertência, suspensão ou ambos) → Excel ou PDF.
- Flag "filtrar por motivo": a busca deixa de procurar colaborador e passa a procurar motivo, com seleção de vários motivos; "Baixar Histórico" baixa os registros desses motivos de todos os colaboradores. Não há combinação motivo + colaborador.
- Tabela nova `Suspensoes`. Sem testes automatizados.
- PDF de histórico: um documento por página; suspensões no modelo próprio.

## Premissas minhas (confirmar na revisão)

- **Identificação do colaborador**: contagem por Matrícula normalizada (trim + maiúsculas); se a matrícula for vazia, usa Nome (maiúsculas).
- **Janela da contagem**: conta as advertências posteriores à data da última suspensão do colaborador (ou todas, se não houver suspensão). Isso evita a notificação eterna depois que a suspensão é criada. Atingiu ≥ 4 → "pendente".
- **Quando a notificação aparece**: ao salvar advertências (lote) e o colaborador ficar com contagem ≥ 4. Uma notificação por colaborador do lote, empilhadas. Não aparece ao abrir o sistema. "Agora não" só fecha aquela notificação.
- **Formulário de suspensão**: criação unitária (sem lista/lote). Botões: **Sair** e **Salvar e baixar PDF** (salva no servidor e baixa o PDF). Se o usuário só sair sem salvar, nada é gravado.
- Em lote com vários colaboradores que atingem a 4ª, cada notificação abre o formulário do respectivo colaborador.

## Back-end

- Entidade `Suspensao` (Domain): Id, Data de emissão (date), Matricula, Nome, Dias (int ≥ 1), DataInicio, DataRetorno (≥ DataInicio), Motivo (≤ 455), Complemento (text), Assinada (bool, default false), Evidencias (1:N cascade). Nada de FK com Colab, igual a `Adivert`.
- Configuration EF, migration nova, repositório, service, DTOs, controller `Suspensoes`: `GET` (filtros), `POST`, `PATCH {id}/assinatura`, `DELETE`, `PUT`.
- Reaproveitar a entidade de evidências: avaliar se `Evidencia` ganha FK opcional para suspensão ou se nasce `SuspensaoEvidencia`. Decidir lendo o código.
- Endpoint de contagem: `GET /api/Adiverts/contagem?matricula=&nome=` retorna `{ total, desdeUltimaSuspensao }`; ou a resposta do `POST batch` já traz a contagem por colaborador do lote (preferido: evita 2ª chamada).
- Filtros no servidor para `GET /api/Adiverts` e `GET /api/Suspensoes`: `matricula`, `nome` (igualdade normalizada), `motivos[]`, `de`, `ate`. Os históricos deixam de depender do array da tela.

## Front-end

- Tipos e serviços de API para suspensão.
- Componente `Notificacao` (toast): CSS de entrada pela direita, barra de progresso, pausa no hover, empilhamento, container fixo no canto superior direito. Respeitar o refino visual existente (`2026-08-06-refino-visual-taste`).
- `Add.tsx`: após o sucesso do lote, ler a contagem retornada e disparar notificações.
- `SuspensaoForm` (novo, não inflar `Add.tsx`): campos acima, evidências reaproveitando o componente atual.
- `App.tsx`: toggle Advertências/Suspensões, tabela de suspensões (Emissão, Matrícula, Nome, Dias, Início, Retorno, Motivo, Assinada), ações iguais às da advertência; botão "Gerar histórico geral"; busca com flag "por motivo" e botão "Baixar Histórico".
- `HistoricoGeralModal` (novo): período, tipo, formato.
- `BaixarHistoricoModal` (novo) para o fluxo por colaborador/motivo: tipo + formato.
- Utils: `excelHistorico.ts` ganha colunas por tipo (e uma aba por tipo quando "ambas"); `pdfSuspensao.ts` com o modelo do PDF de referência (título, empregador, "pena de suspensão disciplinar, por N dia(s) a partir de DD/MM/AAAA, tendo que retornar ao trabalho no dia DD/MM/AAAA (Conforme sua escala)", motivo em negrito, assinaturas); PDF multi une advertências e suspensões, cada uma na página/modelo próprio, ordenadas por data.
- Remover/ajustar os componentes de histórico antigos (`HistoricoColaborador`, `HistoricoMotivo`, `HistoricoMenu`) para usar os novos endpoints, sem duplicar lógica.

## Fases de execução

1. Back-end suspensão: entidade, migration, CRUD, assinatura, evidências, filtros.
2. Back-end: filtros no endpoint de advertências + contagem no retorno do lote.
3. Front: API, tipos, toggle e tabela de suspensões, ações (inspecionar, excluir, editar, assinar).
4. Front: `SuspensaoForm` + PDF da suspensão + notificação e fluxo da 4ª advertência.
5. Front: históricos (geral, colaborador, motivo), Excel e PDF multi.
6. Verificação manual no app (sem testes automatizados) e build/typecheck.

## Riscos

- Matrícula em texto livre pode gerar contagem errada.
- Migration roda no startup (`Program.cs`): conferir antes de subir.
- Lote em blocos não é atômico entre blocos; a contagem deve vir do estado final.
- PDF com muitas páginas e imagens no navegador: manter evidências fora do histórico, como hoje.

## Ajustes após revisão (Opus 5.5)

Substituem o que estiver em conflito com as seções acima.

1. **PDF de referência**: copiar o PDF para `docs/referencias/` e transcrever no `pdfSuspensao.ts` o texto integral, empregador e blocos de assinatura antes de implementar.
2. **Evidências**: tabela própria `SuspensaoEvidencia` (FK obrigatória `SuspensaoId`, cascade), sem FK opcional dupla. Reaproveitar `EvidenciaInputDto`/`EvidenciaReadDto`. Mover `DecodeBase64` e `LimitarNome` de `AdivertService` para um helper compartilhado.
3. **Notificações**: o container fica no `App.tsx`, com emissor global no padrão do `showToast` (`Toast.tsx`). `Add.tsx` desmonta após salvar, então só repassa as contagens. O Toast atual fica embaixo no centro, sem conflito com o topo direito.
4. **Normalização na gravação**: trim + maiúsculas em Nome e Matrícula nos services de Adivert e Suspensao (create e update), mais migration de dados que normaliza `Adiverts` existentes. Comparação por igualdade simples. **Fase 1 começa por isso.**
5. **Chave do colaborador**: só a matrícula normalizada. Registros sem matrícula ficam fora da contagem (documentado). Sem fallback por nome.
6. **Contagem**: `Adivert.Data > Suspensao.DataEmissao` da última suspensão. Excluir/editar a suspensão reabre ou desloca a janela (aceito).
7. **Lote em blocos**: `AdivertBatchCreatedDto` ganha `Contagens` (por matrícula). O front junta as respostas dos blocos, fica com a última de cada matrícula, deduplica, e notifica também na falha parcial (blocos já gravados).
8. **Validação da suspensão**: espelhar limites do EF (Matrícula 50, Nome 255, Motivo 455). Se `Dias` não bater com retorno − início, só aviso, sem bloquear.
9. **Excel "ambas"**: uma aba por tipo (Advertências, Suspensões).
10. **Migration**: roda no startup; testar em homologação com backup antes de produção.
11. **Fase 5**: os históricos passam a usar os endpoints com filtro no servidor, substituindo o array `adiverts` do App.
