import motivos from "../context"
import React, { useState } from "react";

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
    tipo: "",
    motivo: motivos[0]?.motivo ?? "",
});

function Add({ setAddAberto, setData, setAdiverts, getAdiverts, data }: AddProps) {

    const [lista, setLista] = useState<Advertencia[]>([]);
    const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Advertencia>(campoVazio());
    const [criandoNova, setCriandoNova] = useState(false);
    const [novaForm, setNovaForm] = useState<Advertencia>(campoVazio());

    const abrirNova = () => {
        setNovaForm(campoVazio());
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
        await Promise.all(
            lista.map(adv =>
                fetch(`${import.meta.env.VITE_API_URL}/api/Adiverts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(adv),
                })
            )
        );
        await getAdiverts()
        setAddAberto(false);
    };

    const renderForm = (
        form: Advertencia,
        onChange: (f: Advertencia) => void,
        onConfirm: () => void,
        onCancel: () => void,
        labelConfirm: string
    ) => (
        <div className="add-form-box">
            <div className="add-form-row">
                <label className="add-label">Colaborador:</label>
                <input
                    className="add-input"
                    value={form.Nome}
                    onChange={e => onChange({ ...form, Nome: e.target.value })}
                />
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
                <input
                    className="add-input add-input--tipo"
                    value={form.tipo}
                    onChange={e => onChange({ ...form, tipo: e.target.value })}
                />
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
                <button className="add-btn-confirm" onClick={onConfirm}>{labelConfirm}</button>
                <button className="add-btn-cancel" onClick={onCancel}>Cancelar</button>
            </div>
        </div>
    );

    return (
        <div className="add-popup">

            <div className="d-flex">
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
                            ? renderForm(editForm, setEditForm, () => salvarEdicao(idx), cancelarEdicao, "Salvar")
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

                {criandoNova && renderForm(novaForm, setNovaForm, confirmarNova, () => setCriandoNova(false), "Adicionar")}
            </div>

            <div className="add-rodape">
                <button className="add-btn-nova" onClick={abrirNova}>
                    + Nova Advertência
                </button>
                <button className="add-btn-salvar" onClick={finalizarESalvar}>
                    Finalizar e Salvar
                </button>
            </div>
        </div>
    );
}

export default Add;