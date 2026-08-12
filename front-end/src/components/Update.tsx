import React, { useState, useEffect } from "react";
import { X } from "@phosphor-icons/react";
import MotivosSelect from "./MotivosSelect";
import TipoSelect from "./TipoSelect";
import ColabSelect from "./ColabSelect";
import EvidenciasUploader from "./EvidenciasUploader";
import type { EvidenciaExistente } from "./EvidenciasUploader";
import type { EvidenciaLocal } from "../utils/imagem";
import { showToast } from "./Toast";

type Colab = { id: number; nome: string; matricula: string }

type UpdateProps = {
    setUpdateView: React.Dispatch<React.SetStateAction<boolean>>
    getAdiverts: () => void;
    id: number
    data: string;
    matricula: string;
    nome: string;
    tipo: string;
    motivo: string;
    complemento?: string | null;
}

function Update({ setUpdateView, getAdiverts, id, data, matricula, nome, tipo, motivo, complemento }: UpdateProps) {

    const [colabs, setColabs] = useState<Colab[]>([])
    const [motivos, setMotivos] = useState<string[]>([])
    const [form, setForm] = useState({
        Nome: nome,
        matricula: matricula,
        data: data,
        tipo: tipo,
        motivo: motivo,
        complemento: complemento ?? "",
    });
    const [salvando, setSalvando] = useState(false);

    // Evidencias ja salvas (do servidor), novas (a adicionar) e ids a remover
    const [existentes, setExistentes] = useState<EvidenciaExistente[]>([]);
    const [novasEvidencias, setNovasEvidencias] = useState<EvidenciaLocal[]>([]);
    const [removerIds, setRemoverIds] = useState<number[]>([]);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/Colabs`)
            .then(r => r.ok ? r.json() : [])
            .then(setColabs)
            .catch(() => {})
        fetch(`${import.meta.env.VITE_API_URL}/api/Motivos`)
            .then(r => r.ok ? r.json() : [])
            .then((data: { id: number; descricao: string }[]) => setMotivos(data.map(m => m.descricao)))
            .catch(() => {})

        // Carrega detalhe (complemento autoritativo + evidencias existentes)
        fetch(`${import.meta.env.VITE_API_URL}/api/Adiverts/${id}`, { headers: { Accept: "application/json" } })
            .then(r => r.ok ? r.json() : null)
            .then((det: any) => {
                if (!det) return
                // Nao sobrescreve complemento: a lista (prop) ja traz o valor autoritativo,
                // e um overwrite tardio apagaria o que o usuario ja tivesse digitado.
                const evs: EvidenciaExistente[] = (det.evidencias ?? []).map((e: any) => ({
                    id: e.id,
                    url: `data:${e.contentType || "image/jpeg"};base64,${e.base64}`,
                    nome: e.nomeArquivo,
                }))
                setExistentes(evs)
            })
            .catch(() => {})
    }, [id])

    const removerExistente = (evId: number) => {
        setExistentes(prev => prev.filter(e => e.id !== evId))
        setRemoverIds(prev => prev.includes(evId) ? prev : [...prev, evId])
    }

    const handleSalvar = async () => {
        setSalvando(true);
        try {
            const body = {
                data: form.data,
                matricula: form.matricula,
                nome: form.Nome,
                tipo: form.tipo,
                motivo: form.motivo,
                complemento: form.complemento.trim() ? form.complemento : null,
                evidenciasParaAdicionar: novasEvidencias.map(e => ({
                    contentType: e.contentType,
                    base64: e.base64,
                    nomeArquivo: e.nomeArquivo,
                })),
                evidenciasParaRemoverIds: removerIds,
            }
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Adiverts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
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
                    <X size={20} />
                </button>
            </div>

            <div className="add-lista">
                <div className="add-form-box">
                    <div className="add-form-row">
                        <label className="add-label">Colaborador:</label>
                        <ColabSelect
                            nome={form.Nome}
                            colabs={colabs}
                            onNomeChange={v => setForm({ ...form, Nome: v })}
                            onColabSelect={(nome, matricula) => setForm({ ...form, Nome: nome, matricula })}
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
                            motivos={motivos}
                            onChange={v => setForm({ ...form, motivo: v })}
                            className="add-input--motivo"
                        />
                    </div>
                    <div className="add-form-row add-form-row--coluna">
                        <label className="add-label">Complemento (opcional):</label>
                        <textarea
                            className="add-input add-textarea"
                            value={form.complemento}
                            onChange={e => setForm({ ...form, complemento: e.target.value })}
                            placeholder="Texto complementar (aparece abaixo do motivo, na 1ª página do PDF)"
                            rows={4}
                        />
                    </div>

                    <EvidenciasUploader
                        novas={novasEvidencias}
                        onChangeNovas={setNovasEvidencias}
                        existentes={existentes}
                        onRemoverExistente={removerExistente}
                    />

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
