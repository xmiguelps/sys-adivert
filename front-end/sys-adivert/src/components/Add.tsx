import motivos from "../context"
import React, { useState, useEffect, useRef } from "react";

type Advertencia = {
    Nome: string;
    matricula: string;
    data: string;
    tipo: string;
    motivo: string;
}

type AddProps = {
    setAddAberto: React.Dispatch<React.SetStateAction<boolean>>;
    setData: React.Dispatch<React.SetStateAction<any[]>>;
    data: any[];
    setAdiverts: React.Dispatch<React.SetStateAction<any[]>>;
    getAdiverts: () => void;
}

const campoVazio = (): Advertencia => ({
    Nome: "",
    matricula: "",
    data: new Date().toISOString().split('T')[0],
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

function Add({ setAddAberto, getAdiverts}: AddProps) {

    const [lista, setLista] = useState<Advertencia[]>([]);
    const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Advertencia>(campoVazio());
    const [criandoNova, setCriandoNova] = useState(false);
    const [novaForm, setNovaForm] = useState<Advertencia>(campoVazio());
    const [salvando, setSalvando] = useState(false);

    const [buscandoMatricula, setBuscandoMatricula] = useState<"nova" | number | null>(null);

    const debouncedNovoNome = useDebounce(novaForm.Nome, 600);
    const debouncedEditNome = useDebounce(editForm.Nome, 600);

    const prevNovoNomeRef = useRef("");
    const prevEditNomeRef = useRef("");

    useEffect(() => {
        if (debouncedNovoNome && debouncedNovoNome !== prevNovoNomeRef.current && criandoNova) {
            prevNovoNomeRef.current = debouncedNovoNome;
            buscarMatricula(debouncedNovoNome, "nova");
        }
    }, [debouncedNovoNome, criandoNova]);

    useEffect(() => {
        if (debouncedEditNome && debouncedEditNome !== prevEditNomeRef.current && editandoIdx !== null) {
            prevEditNomeRef.current = debouncedEditNome;
            buscarMatricula(debouncedEditNome, editandoIdx);
        }
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

    const abrirNova = () => {
        setNovaForm(campoVazio());
        prevNovoNomeRef.current = "";
        setCriandoNova(true);
        setEditandoIdx(null);
    };

    const confirmarNova = () => {
        if (!novaForm.Nome.trim()) return;
        setLista(prev => [...prev, { ...novaForm }]);
        setCriandoNova(false);
    };

    const iniciarEdicao = (idx: number) => {
        setEditandoIdx(idx);
        setEditForm({ ...lista[idx] });
        prevEditNomeRef.current = lista[idx].Nome;
        setCriandoNova(false);
    };

    const salvarEdicao = (idx: number) => {
        setLista(prev => prev.map((a, i) => i === idx ? { ...editForm } : a));
        setEditandoIdx(null);
    };

    const cancelarEdicao = () => setEditandoIdx(null);

    const excluir = (idx: number) => {
        setLista(prev => prev.filter((_, i) => i !== idx));
        if (editandoIdx === idx) setEditandoIdx(null);
    };

    const finalizarESalvar = async () => {
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
        } finally {
            setSalvando(false);
        }
    };

    const renderForm = (
        form: Advertencia,
        onChange: (f: Advertencia) => void,
        onConfirm: () => void,
        onCancel: () => void,
        labelConfirm: string,
        origemBusca: "nova" | number
    ) => (
        <div className="add-form-box">
            <div className="add-form-row">
                <label className="add-label">Colaborador:</label>
                <div className="add-input-wrapper">
                    <input
                        className="add-input"
                        value={form.Nome}
                        onChange={e => onChange({ ...form, Nome: e.target.value })}
                        placeholder="Digite o nome — matrícula será preenchida automaticamente"
                    />
                    {buscandoMatricula === origemBusca && (
                        <span className="add-matricula-loading">⏳ buscando...</span>
                    )}
                </div>
            </div>

            <div className="add-form-row">
                <label className="add-label">Matrícula:</label>
                <input
                    className="add-input add-input--matricula"
                    value={form.matricula}
                    onChange={e => onChange({ ...form, matricula: e.target.value })}
                />
                <label className="add-label">Data:</label>
                <input
                    type="date"
                    className="add-input add-input--data"
                    value={form.data}
                    onChange={e => onChange({ ...form, data: e.target.value })}
                />
                <label className="add-label">Tipo:</label>
                <select
                    className="add-input add-input--tipo"
                    value={form.tipo}
                    onChange={e => onChange({ ...form, tipo: e.target.value })}
                >
                    <option value="Escrita">Escrita</option>
                    <option value="Verbal">Verbal</option>
                </select>
            </div>
            <div className="add-form-row">
                <label className="add-label">Motivo:</label>
                <select
                    className="add-input add-input--motivo"
                    value={form.motivo}
                    onChange={e => onChange({ ...form, motivo: e.target.value })}
                >
                    {motivos.map(m => (
                        <option key={m.motivo} value={m.motivo}>{m.motivo}</option>
                    ))}
                </select>
            </div>
            <div className="add-form-acoes">
                <button className="add-btn-confirm btn" onClick={onConfirm}>{labelConfirm}</button>
                <button className="cancel-btn btn" onClick={onCancel}>Cancelar</button>
            </div>
        </div>
    );

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
                            ? renderForm(editForm, setEditForm, () => salvarEdicao(idx), cancelarEdicao, "Salvar", idx)
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

                {criandoNova && renderForm(novaForm, setNovaForm, confirmarNova, () => setCriandoNova(false), "Adicionar", "nova")}
            </div>

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
