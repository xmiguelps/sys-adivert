import React, { useState } from "react";
import MotivosSelect from "./MotivosSelect";
import TipoSelect from "./TipoSelect";
import { showToast } from "./Toast";

type UpdateProps = {
    setUpdateView: React.Dispatch<React.SetStateAction<boolean>>
    getAdiverts: () => void;
    id: number
    data: string;
    matricula: string;
    nome: string;
    tipo: string;
    motivo: string;
}

function Update({ setUpdateView, getAdiverts, id, data, matricula, nome, tipo, motivo }: UpdateProps) {

    const [form, setForm] = useState({
        Nome: nome,
        matricula: matricula,
        data: data,
        tipo: tipo,
        motivo: motivo,
    });
    const [salvando, setSalvando] = useState(false);

    const handleSalvar = async () => {
        setSalvando(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Adiverts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (!response.ok) {
                showToast('Erro ao atualizar advertência.', 'error');
            } else {
                await getAdiverts();
                setUpdateView(false);
                showToast('Advertência atualizada com sucesso!', 'success');
            }
        } catch {
            showToast('Erro ao atualizar advertência.', 'error');
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="add-popup">

            <div className="d-flex">
                <button className="add-btn-fechar" onClick={() => setUpdateView(false)} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>

            <div className="add-lista">
                <div className="add-form-box">
                    <div className="add-form-row">
                        <label className="add-label">Colaborador:</label>
                        <input
                            className="add-input"
                            value={form.Nome}
                            onChange={e => setForm({ ...form, Nome: e.target.value })}
                        />
                    </div>
                    <div className="add-form-row">
                        <label className="add-label">Matrícula:</label>
                        <input
                            className="add-input add-input--matricula"
                            value={form.matricula}
                            onChange={e => setForm({ ...form, matricula: e.target.value })}
                        />
                        <label className="add-label">Data:</label>
                        <input
                            type="date"
                            className="add-input add-input--data"
                            value={form.data}
                            onChange={e => setForm({ ...form, data: e.target.value })}
                        />
                        <label className="add-label">Tipo:</label>
                        <TipoSelect
                            value={form.tipo}
                            onChange={v => setForm({ ...form, tipo: v })}
                        />
                    </div>
                    <div className="add-form-row">
                        <label className="add-label">Motivo:</label>
                        <MotivosSelect
                            value={form.motivo}
                            onChange={v => setForm({ ...form, motivo: v })}
                            className="add-input--motivo"
                        />
                    </div>
                    <div className="add-form-acoes">
                        <button className="add-btn-confirm btn" onClick={handleSalvar} disabled={salvando}>
                            {salvando ? "Salvando..." : "Salvar"}
                        </button>
                        <button className="cancel-btn btn" onClick={() => setUpdateView(false)}>Cancelar</button>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default Update;
