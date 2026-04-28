import motivos from "../context"
import React, { useState, useEffect, useRef } from "react";
import MotivosSelect from "./MotivosSelect";
import TipoSelect from "./TipoSelect";
import ColabSelect from "./ColabSelect";
import { showToast } from "./Toast";

type Advertencia = {
    Nome: string;
    matricula: string;
    data: string;
    tipo: string;
    motivo: string;
}

type ColabEntry = {
    id: number;
    Nome: string;
    matricula: string;
}

type Colab = { id: number; nome: string; matricula: string }

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
    motivo: motivos[0]?.motivo ?? "",
});

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
    onChange: (id: number, field: "Nome" | "matricula", value: string) => void;
    onRemove: (id: number) => void;
    canRemove: boolean;
    colabs: Colab[];
}

function ColaboradorRow({ entry, onChange, onRemove, canRemove, colabs }: ColabRowProps) {
    return (
        <div className="add-colab-row">
            <div className="add-colab-nome-wrapper">
                <ColabSelect
                    nome={entry.Nome}
                    colabs={colabs}
                    onNomeChange={v => onChange(entry.id, "Nome", v)}
                    onColabSelect={(nome, matricula) => {
                        onChange(entry.id, "Nome", nome);
                        onChange(entry.id, "matricula", matricula);
                    }}
                    placeholder="Nome do colaborador"
                />
            </div>
            <input
                className="add-input add-input--matricula"
                value={entry.matricula}
                onChange={e => onChange(entry.id, "matricula", e.target.value)}
                placeholder="Matrícula"
            />
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
    );
}

/* Componente principal */
function Add({ setAddAberto, getAdiverts }: AddProps) {

    const [colabs, setColabs] = useState<Colab[]>([]);
    const [lista, setLista] = useState<Advertencia[]>([]);
    const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Advertencia>(campoVazio());
    const [criandoNova, setCriandoNova] = useState(false);
    const [novaForm, setNovaForm] = useState<Advertencia>(campoVazio());
    const [salvando, setSalvando] = useState(false);
    const [erroForm, setErroForm] = useState<string | null>(null);
    const [buscandoMatricula, setBuscandoMatricula] = useState<"nova" | number | null>(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/Colabs`)
            .then(r => r.ok ? r.json() : [])
            .then(setColabs)
            .catch(() => {});
    }, []);

    /* Modo múltiplos colaboradores */
    const [modoMultiplo, setModoMultiplo] = useState(false);
    const [colabsMultiplo, setColabsMultiplo] = useState<ColabEntry[]>([
        { id: 1, Nome: "", matricula: "" }
    ]);
    const nextId = useRef(2);

    /* Debounce para modo único */
    const debouncedNovoNome = useDebounce(novaForm.Nome, 700);
    const debouncedEditNome = useDebounce(editForm.Nome, 700);
    const prevNovoNomeRef = useRef("");
    const prevEditNomeRef = useRef("");

    /* Modo único — nova: uppercase + busca matrícula via debounce */
    useEffect(() => {
        if (!debouncedNovoNome || debouncedNovoNome === prevNovoNomeRef.current || !criandoNova) return;
        const upper = debouncedNovoNome.toUpperCase();
        prevNovoNomeRef.current = upper;
        setNovaForm(prev => ({ ...prev, Nome: upper }));
        buscarMatricula(upper, "nova");
    }, [debouncedNovoNome, criandoNova]);

    /* Modo único — edição: uppercase + busca matrícula via debounce */
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
        setColabsMultiplo([{ id: nextId.current++, Nome: "", matricula: "" }]);
    };

    const confirmarNova = () => {
        const erro = validarForm(novaForm);
        if (erro) { setErroForm(erro); return; }
        setErroForm(null);
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
        setLista(prev => prev.map((a, i) => i === idx ? { ...editForm } : a));
        setEditandoIdx(null);
    };

    const cancelarEdicao = () => { setEditandoIdx(null); setErroForm(null); };

    const excluir = (idx: number) => {
        setLista(prev => prev.filter((_, i) => i !== idx));
        if (editandoIdx === idx) setEditandoIdx(null);
    };

    /* Ações modo múltiplo */
    const alterarColab = (id: number, field: "Nome" | "matricula", value: string) => {
        setColabsMultiplo(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const adicionarColab = () => {
        setColabsMultiplo(prev => [...prev, { id: nextId.current++, Nome: "", matricula: "" }]);
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
        const novas: Advertencia[] = validos.map(c => ({
            Nome: c.Nome,
            matricula: c.matricula,
            data: novaForm.data,
            tipo: novaForm.tipo,
            motivo: novaForm.motivo,
        }));
        setLista(prev => [...prev, ...novas]);
        setCriandoNova(false);
        setModoMultiplo(false);
        setColabsMultiplo([{ id: nextId.current++, Nome: "", matricula: "" }]);
    };

    /* Salvar tudo na API */
    const finalizarESalvar = async () => {
        if (lista.length === 0) {
            setErroForm("Adicione pelo menos uma advertência antes de salvar.");
            return;
        }
        setSalvando(true);
        try {
            await Promise.all(
                lista.map(adv =>
                    fetch(`${import.meta.env.VITE_API_URL}/api/Adiverts`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(adv),
                    })
                )
            );
            await getAdiverts();
            setAddAberto(false);
            showToast(
                lista.length === 1
                    ? "Advertência salva com sucesso!"
                    : `${lista.length} advertências salvas com sucesso!`,
                "success"
            );
        } catch {
            showToast("Erro ao salvar advertências.", "error");
        } finally {
            setSalvando(false);
        }
    };

    /* Render: form modo único */
    const renderFormUnico = (
        form: Advertencia,
        onChange: (f: Advertencia) => void,
        onConfirm: () => void,
        onCancel: () => void,
        labelConfirm: string,
        origemBusca: "nova" | number,
        mostrarToggle: boolean
    ) => (
        <div className="add-form-box">
            {mostrarToggle && (
                <div className="add-modo-toggle-bar">
                    <button
                        className="add-btn-modo-toggle btn"
                        onClick={() => { setModoMultiplo(true); setErroForm(null); }}
                        title="Ativar modo múltiplos colaboradores"
                    >
                        👥 Múltiplos Colaboradores
                    </button>
                </div>
            )}

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
                        placeholder="Digite o nome — matrícula será preenchida automaticamente"
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
                    onChange={v => { onChange({ ...form, motivo: v }); setErroForm(null); }}
                    className="add-input--motivo"
                />
            </div>

            {erroForm && <div className="add-erro-form">⚠️ {erroForm}</div>}

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
            <div className="add-modo-toggle-bar">
                <span className="add-modo-label">👥 Múltiplos Colaboradores</span>
                <button
                    className="add-btn-modo-voltar btn"
                    onClick={() => { setModoMultiplo(false); setErroForm(null); }}
                    title="Voltar para modo individual"
                >
                    ← Modo Individual
                </button>
            </div>

            {/* Lista de colaboradores */}
            <div className="add-multiplo-secao">
                <div className="add-multiplo-secao-header">
                    <span className="add-multiplo-secao-titulo">Colaboradores</span>
                    <span className="add-multiplo-hint">Nome preenchido → matrícula automática</span>
                </div>

                <div className="add-multiplo-cols-header">
                    <span>Nome <span className="campo-obrigatorio">*</span></span>
                    <span>Matrícula <span className="campo-obrigatorio">*</span></span>
                </div>

                <div className="add-colabs-lista">
                    {colabsMultiplo.map(entry => (
                        <ColaboradorRow
                            key={entry.id}
                            entry={entry}
                            onChange={alterarColab}
                            onRemove={removerColab}
                            canRemove={colabsMultiplo.length > 1}
                            colabs={colabs}
                        />
                    ))}
                </div>

                <button className="add-btn-mais-colab btn" onClick={adicionarColab}>
                    + Adicionar Colaborador
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
                        onChange={v => { setNovaForm(prev => ({ ...prev, motivo: v })); setErroForm(null); }}
                        className="add-input--motivo"
                    />
                </div>
            </div>

            {erroForm && <div className="add-erro-form">⚠️ {erroForm}</div>}

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
                <h2 className="add-titulo-principal">📋 Nova Advertência</h2>
                <button className="add-btn-fechar" onClick={() => setAddAberto(false)} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
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

            <div className="add-rodape">
                <button className="add-btn-nova btn" onClick={abrirNova}>
                    + Nova Advertência
                </button>
                <button className="add-btn-salvar btn" onClick={finalizarESalvar} disabled={salvando}>
                    {salvando ? "Salvando..." : "Finalizar e Salvar"}
                </button>
            </div>
        </div>
    );
}

export default Add;
