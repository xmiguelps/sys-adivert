import React, { useState, useEffect, useRef } from "react";
import { Plus, X, PencilSimple, Trash, User, Users, Warning, Paperclip, NotePencil, ClipboardText } from "@phosphor-icons/react";
import MotivosSelect from "./MotivosSelect";
import TipoSelect from "./TipoSelect";
import ColabSelect from "./ColabSelect";
import EvidenciasUploader from "./EvidenciasUploader";
import type { EvidenciaLocal } from "../utils/imagem";
import { showToast } from "./Toast";

type Advertencia = {
    Nome: string;
    matricula: string;
    data: string;
    tipo: string;
    motivo: string;
    complemento: string;
    evidencias: EvidenciaLocal[];
}

type ColabEntry = {
    id: number;
    Nome: string;
    matricula: string;
    complemento: string;
    evidencias: EvidenciaLocal[];
}

type Colab = { id: number; nome: string; matricula: string }

/* Erro por item devolvido pelo POST /api/Adiverts/batch */
type ErroItem = { indice: number; erro: string }

type AddProps = {
    setAddAberto: React.Dispatch<React.SetStateAction<boolean>>;
    setData: React.Dispatch<React.SetStateAction<any[]>>;
    data: any[];
    setAdiverts: React.Dispatch<React.SetStateAction<any[]>>;
    getAdiverts: () => void;
}

const dataAtualBrasil = () =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

const campoVazio = (): Advertencia => ({
    Nome: "",
    matricula: "",
    data: dataAtualBrasil(),
    tipo: "Escrita",
    motivo: "",
    complemento: "",
    evidencias: [],
});

// Monta o corpo do POST a partir do form (remove o previewUrl das evidencias
// para nao duplicar os dados da imagem no envio).
const toCreatePayload = (adv: Advertencia) => ({
    data: adv.data,
    matricula: adv.matricula,
    nome: adv.Nome,
    tipo: adv.tipo,
    motivo: adv.motivo,
    complemento: adv.complemento.trim() ? adv.complemento : null,
    evidencias: adv.evidencias.map(e => ({
        contentType: e.contentType,
        base64: e.base64,
        nomeArquivo: e.nomeArquivo,
    })),
});

/* Fatiamento do lote.
   O teto de itens espelha AdivertService.LimiteLote; o de bytes fica bem
   abaixo do MaxRequestBodySize do Kestrel (50 MB), porque as evidencias
   trafegam em base64 e um lote com fotos passa disso facil. */
const LIMITE_ITENS_LOTE = 200;
const LIMITE_BYTES_LOTE = 20 * 1024 * 1024;

const encoder = new TextEncoder();

// Agrupa os itens ja serializados respeitando os dois tetos. Um item que
// sozinho estoura o limite de bytes vai em um bloco proprio.
function fatiarLote(itensJson: string[]) {
    const blocos: { inicio: number; corpo: string }[] = [];
    let inicio = 0;
    let atual: string[] = [];
    let bytes = 0;

    const fechar = () => {
        if (atual.length === 0) return;
        blocos.push({ inicio, corpo: `[${atual.join(",")}]` });
        inicio += atual.length;
        atual = [];
        bytes = 0;
    };

    for (const json of itensJson) {
        const tamanho = encoder.encode(json).length;
        if (atual.length > 0 && (atual.length >= LIMITE_ITENS_LOTE || bytes + tamanho > LIMITE_BYTES_LOTE)) {
            fechar();
        }
        atual.push(json);
        bytes += tamanho;
    }
    fechar();

    return blocos;
}

function useDebounce(value: string, delay: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

function validarForm(form: Advertencia): string | null {
    if (!form.Nome.trim())       return "O campo Colaborador é obrigatório.";
    if (!form.matricula.trim())  return "O campo Matrícula é obrigatório.";
    if (!form.data.trim())       return "O campo Data é obrigatório.";
    if (!form.tipo.trim())       return "O campo Tipo é obrigatório.";
    if (!form.motivo.trim())     return "O campo Motivo é obrigatório.";
    return null;
}

/* Sub-componente para linha de colaborador no modo múltiplo */
type ColabRowProps = {
    entry: ColabEntry;
    onChangeCampo: (id: number, field: "Nome" | "matricula" | "complemento", value: string) => void;
    onColabSelect: (id: number, nome: string, matricula: string) => void;
    onChangeEvidencias: (id: number, evs: EvidenciaLocal[]) => void;
    onRemove: (id: number) => void;
    canRemove: boolean;
    colabs: Colab[];
    individual: boolean;
}

function ColaboradorRow({
    entry, onChangeCampo, onColabSelect, onChangeEvidencias, onRemove, canRemove, colabs, individual,
}: ColabRowProps) {
    return (
        <div className={`add-colab-row ${individual ? "add-colab-row--individual" : ""}`}>
            <div className="add-colab-linha-principal">
                <div className="add-colab-nome-wrapper">
                    <ColabSelect
                        nome={entry.Nome}
                        colabs={colabs}
                        onNomeChange={v => onChangeCampo(entry.id, "Nome", v)}
                        onColabSelect={(nome, matricula) => onColabSelect(entry.id, nome, matricula)}
                        placeholder="Nome do colaborador"
                    />
                </div>
                <input
                    className="add-input add-input--matricula"
                    value={entry.matricula}
                    onChange={e => onChangeCampo(entry.id, "matricula", e.target.value)}
                    placeholder="Matrícula"
                />
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
        </div>
    );
}

/* Componente principal */
function Add({ setAddAberto, getAdiverts }: AddProps) {

    const [colabs, setColabs] = useState<Colab[]>([]);
    const [motivos, setMotivos] = useState<string[]>([]);
    const [lista, setLista] = useState<Advertencia[]>([]);
    const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Advertencia>(campoVazio());
    const [criandoNova, setCriandoNova] = useState(false);
    const [novaForm, setNovaForm] = useState<Advertencia>(campoVazio());
    const [salvando, setSalvando] = useState(false);
    const [erroForm, setErroForm] = useState<string | null>(null);
    const [errosItens, setErrosItens] = useState<ErroItem[]>([]);
    const [_buscandoMatricula, setBuscandoMatricula] = useState<"nova" | number | null>(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/Colabs`)
            .then(r => r.ok ? r.json() : [])
            .then(setColabs)
            .catch(() => {});
        fetch(`${import.meta.env.VITE_API_URL}/api/Motivos`)
            .then(r => r.ok ? r.json() : [])
            .then((data: { id: number; descricao: string }[]) => setMotivos(data.map(m => m.descricao)))
            .catch(() => {});
    }, []);

    /* Modo múltiplos colaboradores */
    const [modoMultiplo, setModoMultiplo] = useState(false);
    const [loteMesmoParaTodos, setLoteMesmoParaTodos] = useState(true);
    const [colabsMultiplo, setColabsMultiplo] = useState<ColabEntry[]>([
        { id: 1, Nome: "", matricula: "", complemento: "", evidencias: [] }
    ]);
    const nextId = useRef(2);

    /* Debounce para modo único */
    const debouncedNovoNome = useDebounce(novaForm.Nome, 700);
    const debouncedEditNome = useDebounce(editForm.Nome, 700);
    const prevNovoNomeRef = useRef("");
    const prevEditNomeRef = useRef("");

    /* Modo único - nova: uppercase + busca matrícula via debounce */
    useEffect(() => {

        if (!debouncedNovoNome || debouncedNovoNome === prevNovoNomeRef.current || !criandoNova) return;
        const upper = debouncedNovoNome.toUpperCase();
        prevNovoNomeRef.current = upper;
        setNovaForm(prev => ({ ...prev, Nome: upper }));
        buscarMatricula(upper, "nova");
    }, [debouncedNovoNome, criandoNova]);

    /* Modo único - edição: uppercase + busca matrícula via debounce */
    useEffect(() => {
        if (!debouncedEditNome || debouncedEditNome === prevEditNomeRef.current || editandoIdx === null) return;
        const upper = debouncedEditNome.toUpperCase();
        prevEditNomeRef.current = upper;
        setEditForm(prev => ({ ...prev, Nome: upper }));
        buscarMatricula(upper, editandoIdx);
    }, [debouncedEditNome, editandoIdx]);

    const buscarMatricula = async (nome: string, origem: "nova" | number) => {
        if (!nome.trim()) return;
        setBuscandoMatricula(origem);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/Colabs/matricula?nome=${encodeURIComponent(nome)}`
            );
            if (!res.ok) return;
            const { matricula } = await res.json();
            if (origem === "nova") {
                setNovaForm(prev => ({ ...prev, matricula }));
            } else {
                setEditForm(prev => ({ ...prev, matricula }));
            }
        } catch {
            // silencia erro de busca automática
        } finally {
            setBuscandoMatricula(null);
        }
    };

    /* Ações modo único */
    const abrirNova = () => {
        setNovaForm(campoVazio());
        prevNovoNomeRef.current = "";
        setCriandoNova(true);
        setEditandoIdx(null);
        setErroForm(null);
        setModoMultiplo(false);
        setLoteMesmoParaTodos(true);
        setColabsMultiplo([{ id: nextId.current++, Nome: "", matricula: "", complemento: "", evidencias: [] }]);
    };

    const confirmarNova = () => {
        const erro = validarForm(novaForm);
        if (erro) { setErroForm(erro); return; }
        setErroForm(null);
        setErrosItens([]);
        setLista(prev => [...prev, { ...novaForm }]);
        setCriandoNova(false);
    };

    const iniciarEdicao = (idx: number) => {
        setEditandoIdx(idx);
        setEditForm({ ...lista[idx] });
        prevEditNomeRef.current = lista[idx].Nome;
        setCriandoNova(false);
        setErroForm(null);
    };

    const salvarEdicao = (idx: number) => {
        const erro = validarForm(editForm);
        if (erro) { setErroForm(erro); return; }
        setErroForm(null);
        setErrosItens([]);
        setLista(prev => prev.map((a, i) => i === idx ? { ...editForm } : a));
        setEditandoIdx(null);
    };

    const cancelarEdicao = () => { setEditandoIdx(null); setErroForm(null); };

    const excluir = (idx: number) => {
        setErrosItens([]);
        setLista(prev => prev.filter((_, i) => i !== idx));
        if (editandoIdx === idx) setEditandoIdx(null);
    };

    /* Ações modo múltiplo */
    const alterarColabCampo = (id: number, field: "Nome" | "matricula" | "complemento", value: string) => {
        setColabsMultiplo(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const selecionarColab = (id: number, nome: string, matricula: string) => {
        setColabsMultiplo(prev => prev.map(c => c.id === id ? { ...c, Nome: nome, matricula } : c));
    };

    const alterarColabEvidencias = (id: number, evs: EvidenciaLocal[]) => {
        setColabsMultiplo(prev => prev.map(c => c.id === id ? { ...c, evidencias: evs } : c));
    };

    const adicionarColab = () => {
        setColabsMultiplo(prev => [...prev, { id: nextId.current++, Nome: "", matricula: "", complemento: "", evidencias: [] }]);
    };

    const removerColab = (id: number) => {
        setColabsMultiplo(prev => prev.filter(c => c.id !== id));
    };

    const confirmarLote = () => {
        const validos = colabsMultiplo.filter(c => c.Nome.trim() && c.matricula.trim());
        if (validos.length === 0) {
            setErroForm("Preencha ao menos um colaborador com nome e matrícula.");
            return;
        }
        if (!novaForm.data.trim() || !novaForm.tipo.trim() || !novaForm.motivo.trim()) {
            setErroForm("Preencha os campos Data, Tipo e Motivo.");
            return;
        }
        setErroForm(null);
        setErrosItens([]);
        const novas: Advertencia[] = validos.map(c => ({
            Nome: c.Nome,
            matricula: c.matricula,
            data: novaForm.data,
            tipo: novaForm.tipo,
            motivo: novaForm.motivo,
            complemento: loteMesmoParaTodos ? novaForm.complemento : c.complemento,
            evidencias: [...(loteMesmoParaTodos ? novaForm.evidencias : c.evidencias)],
        }));
        setLista(prev => [...prev, ...novas]);
        setCriandoNova(false);
        setModoMultiplo(false);
        setColabsMultiplo([{ id: nextId.current++, Nome: "", matricula: "", complemento: "", evidencias: [] }]);
    };

    /* Salvar tudo na API.
       Um POST /batch por bloco, sempre em sequencia: cada bloco e uma
       transacao no back e paralelizar aqui traria de volta o estouro do
       pooler que o endpoint em lote veio resolver. */
    const finalizarESalvar = async () => {
        if (lista.length === 0) {
            setErroForm("Adicione pelo menos uma advertência antes de salvar.");
            return;
        }
        setSalvando(true);
        setErroForm(null);
        setErrosItens([]);

        const total = lista.length;
        // Serializa uma vez so: o mesmo JSON serve para medir o bloco e para
        // montar o corpo da requisicao.
        const blocos = fatiarLote(lista.map(adv => JSON.stringify(toCreatePayload(adv))));
        let salvos = 0;

        try {
            for (const bloco of blocos) {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Adiverts/batch`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: bloco.corpo,
                });

                if (!res.ok) {
                    const corpo = await res.json().catch(() => null);
                    const detalhe: string = corpo?.mensagem ??
                        (res.status === 413
                            ? "Bloco grande demais para o servidor."
                            : `Erro ${res.status} ao salvar.`);

                    // Os indices vem relativos ao bloco, e o bloco que falhou
                    // comeca exatamente em 'salvos' (os anteriores gravaram
                    // inteiros). Depois do slice abaixo eles ja apontam para o
                    // item certo da lista que sobrou.
                    setErrosItens(corpo?.erros ?? []);

                    if (salvos > 0) {
                        // Os blocos anteriores ja commitaram: tira-os da lista
                        // para que uma nova tentativa nao duplique o que gravou.
                        await getAdiverts();
                        setLista(prev => prev.slice(salvos));
                        setErroForm(`${salvos} de ${total} advertências foram salvas. O envio parou no restante: ${detalhe}`);
                        showToast(`${salvos} salvas, ${total - salvos} pendentes.`, "error");
                    } else {
                        setErroForm(detalhe);
                        showToast("Nenhuma advertência foi salva.", "error");
                    }
                    return;
                }

                const { ids } = await res.json() as { ids: number[]; total: number };
                salvos += ids.length;
            }

            await getAdiverts();
            setAddAberto(false);
            showToast(
                salvos === 1
                    ? "Advertência salva com sucesso!"
                    : `${salvos} advertências salvas com sucesso!`,
                "success"
            );
        } catch {
            if (salvos > 0) {
                await getAdiverts();
                setLista(prev => prev.slice(salvos));
                setErroForm(`${salvos} de ${total} advertências foram salvas antes da conexão cair. Tente salvar o restante.`);
            } else {
                setErroForm("Não foi possível falar com o servidor. Tente novamente.");
            }
            showToast("Erro ao salvar advertências.", "error");
        } finally {
            setSalvando(false);
        }
    };

    /* Seletor de modo: deixa claro que há duas formas de criar */
    const renderModoSeletor = (ativo: "individual" | "multiplo") => (
        <div className="add-modo-seletor">
            <span className="add-modo-seletor-titulo">Selecione um modo</span>
            <div className="add-modo-tabs">
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
            </div>
        </div>
    );

    /* Render: form modo único */
    const renderFormUnico = (
        form: Advertencia,
        onChange: (f: Advertencia) => void,
        onConfirm: () => void,
        onCancel: () => void,
        labelConfirm: string,
        _origemBusca: "nova" | number,
        mostrarToggle: boolean
    ) => (
        <div className="add-form-box">
            {mostrarToggle && renderModoSeletor("individual")}

            <div className="add-form-row">
                <label className="add-label">
                    Colaborador: <span className="campo-obrigatorio">*</span>
                </label>
                <div className="add-input-wrapper">
                    <ColabSelect
                        nome={form.Nome}
                        colabs={colabs}
                        onNomeChange={v => { onChange({ ...form, Nome: v }); setErroForm(null); }}
                        onColabSelect={(nome, matricula) => { onChange({ ...form, Nome: nome, matricula }); setErroForm(null); }}
                        placeholder="Digite o nome; a matrícula será preenchida automaticamente"
                    />
                </div>
            </div>

            <div className="add-form-row">
                <label className="add-label">
                    Matrícula: <span className="campo-obrigatorio">*</span>
                </label>
                <input
                    className="add-input add-input--matricula"
                    value={form.matricula}
                    onChange={e => { onChange({ ...form, matricula: e.target.value }); setErroForm(null); }}
                    placeholder="Ex: 00123"
                    required
                />
                <label className="add-label">
                    Data: <span className="campo-obrigatorio">*</span>
                </label>
                <input
                    type="date"
                    className="add-input add-input--data"
                    value={form.data}
                    onChange={e => { onChange({ ...form, data: e.target.value }); setErroForm(null); }}
                    required
                />
                <label className="add-label">
                    Tipo: <span className="campo-obrigatorio">*</span>
                </label>
                <TipoSelect
                    value={form.tipo}
                    onChange={v => { onChange({ ...form, tipo: v }); setErroForm(null); }}
                />
            </div>

            <div className="add-form-row">
                <label className="add-label">
                    Motivo: <span className="campo-obrigatorio">*</span>
                </label>
                <MotivosSelect
                    value={form.motivo}
                    motivos={motivos}
                    onChange={v => { onChange({ ...form, motivo: v }); setErroForm(null); }}
                    className="add-input--motivo"
                />
            </div>

            <div className="add-form-row add-form-row--coluna">
                <label className="add-label">Complemento (opcional):</label>
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

            <div className="add-form-acoes">
                <button className="add-btn-confirm btn" onClick={onConfirm}>{labelConfirm}</button>
                <button className="cancel-btn btn" onClick={onCancel}>Cancelar</button>
            </div>
        </div>
    );

    /* Render: form modo múltiplo */
    const qtdPreenchidos = colabsMultiplo.filter(c => c.Nome.trim()).length;

    const renderFormMultiplo = () => (
        <div className="add-form-box add-form-box--multiplo">
            {renderModoSeletor("multiplo")}

            {/* Como aplicar complemento/evidências */}
            <div className="add-lote-toggle">
                <span className="add-lote-toggle-label">Complemento e evidências:</span>
                <div className="add-lote-toggle-botoes">
                    <button
                        type="button"
                        className={`add-lote-opcao ${loteMesmoParaTodos ? "add-lote-opcao--ativo" : ""}`}
                        onClick={() => setLoteMesmoParaTodos(true)}
                    >
                        Iguais para todos
                    </button>
                    <button
                        type="button"
                        className={`add-lote-opcao ${!loteMesmoParaTodos ? "add-lote-opcao--ativo" : ""}`}
                        onClick={() => setLoteMesmoParaTodos(false)}
                    >
                        Individuais por colaborador
                    </button>
                </div>
            </div>

            {/* Lista de colaboradores */}
            <div className="add-multiplo-secao">
                <div className="add-multiplo-secao-header">
                    <span className="add-multiplo-secao-titulo">Colaboradores</span>
                    <span className="add-multiplo-hint">Nome preenchido → matrícula automática</span>
                </div>

                {!loteMesmoParaTodos && (
                    <div className="add-multiplo-cols-header">
                        <span>Nome <span className="campo-obrigatorio">*</span> / Matrícula <span className="campo-obrigatorio">*</span> + complemento e evidências</span>
                    </div>
                )}

                <div className="add-colabs-lista">
                    {colabsMultiplo.map(entry => (
                        <ColaboradorRow
                            key={entry.id}
                            entry={entry}
                            onChangeCampo={alterarColabCampo}
                            onColabSelect={selecionarColab}
                            onChangeEvidencias={alterarColabEvidencias}
                            onRemove={removerColab}
                            canRemove={colabsMultiplo.length > 1}
                            colabs={colabs}
                            individual={!loteMesmoParaTodos}
                        />
                    ))}
                </div>

                <button className="add-btn-mais-colab btn" onClick={adicionarColab}>
                    <Plus size={14} /> Adicionar Colaborador
                </button>
            </div>

            {/* Dados comuns */}
            <div className="add-multiplo-secao">
                <div className="add-multiplo-secao-header">
                    <span className="add-multiplo-secao-titulo">Dados da Advertência</span>
                    <span className="add-multiplo-hint">Aplicados a todos os colaboradores</span>
                </div>

                <div className="add-form-row">
                    <label className="add-label">
                        Data: <span className="campo-obrigatorio">*</span>
                    </label>
                    <input
                        type="date"
                        className="add-input add-input--data"
                        value={novaForm.data}
                        onChange={e => { setNovaForm(prev => ({ ...prev, data: e.target.value })); setErroForm(null); }}
                        required
                    />
                    <label className="add-label">
                        Tipo: <span className="campo-obrigatorio">*</span>
                    </label>
                    <TipoSelect
                        value={novaForm.tipo}
                        onChange={v => { setNovaForm(prev => ({ ...prev, tipo: v })); setErroForm(null); }}
                    />
                </div>

                <div className="add-form-row">
                    <label className="add-label">
                        Motivo: <span className="campo-obrigatorio">*</span>
                    </label>
                    <MotivosSelect
                        value={novaForm.motivo}
                        motivos={motivos}
                        onChange={v => { setNovaForm(prev => ({ ...prev, motivo: v })); setErroForm(null); }}
                        className="add-input--motivo"
                    />
                </div>

                {loteMesmoParaTodos && (
                    <>
                        <div className="add-form-row add-form-row--coluna">
                            <label className="add-label">Complemento (opcional):</label>
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

            <div className="add-form-acoes">
                <button className="add-btn-confirm btn" onClick={confirmarLote}>
                    {qtdPreenchidos > 0
                        ? `Adicionar ${qtdPreenchidos} Colaborador${qtdPreenchidos > 1 ? "es" : ""} à Lista`
                        : "Adicionar à Lista"}
                </button>
                <button
                    className="cancel-btn btn"
                    onClick={() => { setCriandoNova(false); setModoMultiplo(false); setErroForm(null); }}
                >
                    Cancelar
                </button>
            </div>
        </div>
    );

    /* Render principal */
    return (
        <div className="add-popup">
            <div className="add-header">
                <h2 className="add-titulo-principal"><ClipboardText size={20} /> Nova Advertência</h2>
                <button className="add-btn-fechar" onClick={() => setAddAberto(false)} title="Fechar">
                    <X size={20} />
                </button>
            </div>

            <div className="add-lista">
                {lista.length === 0 && !criandoNova && (
                    <p className="add-vazio">Nenhuma advertência adicionada ainda.</p>
                )}

                {lista.map((adv, idx) => (
                    <div key={idx} className="add-card">
                        {editandoIdx === idx
                            ? renderFormUnico(editForm, setEditForm, () => salvarEdicao(idx), cancelarEdicao, "Salvar", idx, false)
                            : (
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

            {errosItens.length > 0 && (
                <ul className="add-erro-itens">
                    {errosItens.map(e => (
                        <li key={e.indice}>
                            <strong>#{e.indice + 1} {lista[e.indice]?.Nome ?? "—"}:</strong> {e.erro}
                        </li>
                    ))}
                </ul>
            )}

            <div className="add-rodape">
                <button className="add-btn-nova btn" onClick={abrirNova}>
                    <Plus size={14} /> Nova Advertência
                </button>
                <button className="add-btn-salvar btn" onClick={finalizarESalvar} disabled={salvando}>
                    {salvando ? "Salvando..." : "Finalizar e Salvar"}
                </button>
            </div>
        </div>
    );
}

export default Add;
