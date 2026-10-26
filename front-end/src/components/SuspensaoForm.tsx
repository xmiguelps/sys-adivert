import { useState, useEffect } from "react";
import { X, Warning, CalendarX } from "@phosphor-icons/react";
import MotivosSelect from "./MotivosSelect";
import ColabSelect from "./ColabSelect";
import EvidenciasUploader from "./EvidenciasUploader";
import type { EvidenciaExistente } from "./EvidenciasUploader";
import type { EvidenciaLocal } from "../utils/imagem";
import { showToast } from "./Toast";
import { dataAtualBrasil, parseDataLocal } from "../utils/datas";
import { downloadSuspensaoPdf } from "../utils/pdfSuspensao";
import {
    criarSuspensao, atualizarSuspensao, obterSuspensao,
} from "../utils/suspensaoApi";
import type { Suspensao, SuspensaoPayload } from "../utils/suspensaoApi";

type Colab = { id: number; nome: string; matricula: string }

// Limites espelham o EF (Matrícula 50, Nome 255, Motivo 455)
const MAX_MATRICULA = 50;
const MAX_NOME = 255;
const MAX_MOTIVO = 455;

type SuspensaoFormProps = {
    // Pré-preenchimento na criação (vem da notificação)
    matricula?: string;
    nome?: string;
    // Presente = modo edição
    editar?: Suspensao;
    onFechar: () => void;
    onSalvo: () => void;
}

// Dias entre início e retorno (diferença de datas, sem fuso)
const diasEntre = (inicio: string, retorno: string) =>
    Math.round((parseDataLocal(retorno).getTime() - parseDataLocal(inicio).getTime()) / 86400000);

function SuspensaoForm({ matricula, nome, editar, onFechar, onSalvo }: SuspensaoFormProps) {

    const [colabs, setColabs] = useState<Colab[]>([]);
    const [motivos, setMotivos] = useState<string[]>([]);
    const [form, setForm] = useState({
        Nome: editar?.nome ?? nome ?? "",
        matricula: editar?.matricula ?? matricula ?? "",
        dias: editar ? String(editar.dias) : "",
        dataInicio: editar?.dataInicio.slice(0, 10) ?? "",
        dataRetorno: editar?.dataRetorno.slice(0, 10) ?? "",
        motivo: editar?.motivo ?? "",
        complemento: editar?.complemento ?? "",
    });
    const [novas, setNovas] = useState<EvidenciaLocal[]>([]);
    const [existentes, setExistentes] = useState<EvidenciaExistente[]>([]);
    const [removerIds, setRemoverIds] = useState<number[]>([]);
    const [salvando, setSalvando] = useState(false);
    const [erroForm, setErroForm] = useState<string | null>(null);

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

    const editarId = editar?.id;
    useEffect(() => {
        if (editarId === undefined) return;
        let cancelado = false;
        obterSuspensao(editarId)
            .then(det => {
                if (cancelado || !det) return;
                setExistentes(det.evidencias.map(e => ({
                    id: e.id,
                    url: `data:${e.contentType || "image/jpeg"};base64,${e.base64}`,
                    nome: e.nomeArquivo ?? undefined,
                })));
            })
            .catch(() => {});
        return () => { cancelado = true; };
    }, [editarId]);

    const alterar = (parcial: Partial<typeof form>) => {
        setForm(prev => ({ ...prev, ...parcial }));
        setErroForm(null);
    };

    const removerExistente = (evId: number) => {
        setExistentes(prev => prev.filter(e => e.id !== evId));
        setRemoverIds(prev => prev.includes(evId) ? prev : [...prev, evId]);
    };

    const diasNum = Number(form.dias);
    const diasValido = form.dias.trim() !== "" && Number.isInteger(diasNum) && diasNum >= 1;
    const intervaloValido = !!form.dataInicio && !!form.dataRetorno && form.dataRetorno >= form.dataInicio;
    const intervalo = intervaloValido ? diasEntre(form.dataInicio, form.dataRetorno) : null;
    // Só aviso: não bloqueia o salvamento
    const avisoDias = diasValido && intervalo !== null && intervalo !== diasNum;

    const validar = (): string | null => {
        if (!form.Nome.trim())                  return "O campo Colaborador é obrigatório.";
        if (!form.matricula.trim())             return "O campo Matrícula é obrigatório.";
        if (!diasValido)                        return "Informe a quantidade de dias (número inteiro, no mínimo 1).";
        if (!form.dataInicio)                   return "O campo Início é obrigatório.";
        if (!form.dataRetorno)                  return "O campo Retorno é obrigatório.";
        if (form.dataRetorno < form.dataInicio) return "A data de retorno não pode ser anterior à data de início.";
        if (!form.motivo.trim())                return "O campo Motivo é obrigatório.";
        if (form.Nome.trim().length > MAX_NOME)           return `O nome deve ter no máximo ${MAX_NOME} caracteres.`;
        if (form.matricula.trim().length > MAX_MATRICULA) return `A matrícula deve ter no máximo ${MAX_MATRICULA} caracteres.`;
        if (form.motivo.trim().length > MAX_MOTIVO)       return `O motivo deve ter no máximo ${MAX_MOTIVO} caracteres.`;
        return null;
    };

    const handleSalvar = async () => {
        const erro = validar();
        if (erro) { setErroForm(erro); return; }
        setSalvando(true);
        setErroForm(null);

        const complemento = form.complemento.trim() ? form.complemento : null;
        const payload: SuspensaoPayload = {
            dataEmissao: editar?.dataEmissao.slice(0, 10) ?? dataAtualBrasil(),
            matricula: form.matricula.trim(),
            nome: form.Nome.trim().toUpperCase(),
            dias: diasNum,
            dataInicio: form.dataInicio,
            dataRetorno: form.dataRetorno,
            motivo: form.motivo.trim(),
            complemento,
        };
        const evidenciasEnvio = novas.map(e => ({
            contentType: e.contentType,
            base64: e.base64,
            nomeArquivo: e.nomeArquivo,
        }));

        try {
            if (editar) {
                await atualizarSuspensao(editar.id, payload, evidenciasEnvio, removerIds);
                onSalvo();
                showToast("Suspensão atualizada com sucesso!", "success");
                return;
            }
            await criarSuspensao(payload, evidenciasEnvio);
        } catch (e) {
            setErroForm(e instanceof Error && e.message ? e.message : "Não foi possível falar com o servidor. Tente novamente.");
            showToast(editar ? "Erro ao atualizar suspensão." : "Erro ao salvar suspensão.", "error");
            setSalvando(false);
            return;
        }

        // Criada: a partir daqui o registro já existe, mesmo que o PDF falhe
        onSalvo();
        try {
            await downloadSuspensaoPdf({
                dataEmissao: payload.dataEmissao,
                nome: payload.nome,
                matricula: payload.matricula,
                dias: payload.dias,
                dataInicio: payload.dataInicio,
                dataRetorno: payload.dataRetorno,
                motivo: payload.motivo,
                complemento,
                evidencias: novas.map(e => ({ contentType: e.contentType, base64: e.base64 })),
            });
            showToast("Suspensão salva e PDF gerado!", "success");
        } catch {
            showToast("Suspensão salva, mas houve erro ao gerar o PDF. Baixe-o pela lista.", "error");
        }
    };

    return (
        <div className="add-popup">
            <div className="add-header">
                <h2 className="add-titulo-principal">
                    <CalendarX size={20} /> {editar ? "Editar Suspensão" : "Nova Suspensão"}
                </h2>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar" disabled={salvando}>
                    <X size={20} />
                </button>
            </div>

            <div className="add-lista">
                <div className="add-form-box">
                    <div className="add-form-row">
                        <label className="add-label">
                            Colaborador: <span className="campo-obrigatorio">*</span>
                        </label>
                        <div className="add-input-wrapper">
                            <ColabSelect
                                nome={form.Nome}
                                colabs={colabs}
                                onNomeChange={v => alterar({ Nome: v })}
                                onColabSelect={(n, m) => alterar({ Nome: n, matricula: m })}
                                placeholder="Nome do colaborador"
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
                            onChange={e => alterar({ matricula: e.target.value })}
                            placeholder="Ex: 00123"
                        />
                        <label className="add-label">
                            Dias: <span className="campo-obrigatorio">*</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            step={1}
                            className="add-input susp-input-dias"
                            value={form.dias}
                            onChange={e => alterar({ dias: e.target.value })}
                        />
                    </div>

                    <div className="add-form-row">
                        <label className="add-label">
                            Início: <span className="campo-obrigatorio">*</span>
                        </label>
                        <input
                            type="date"
                            className="add-input add-input--data"
                            value={form.dataInicio}
                            onChange={e => alterar({ dataInicio: e.target.value })}
                        />
                        <label className="add-label">
                            Retorno: <span className="campo-obrigatorio">*</span>
                        </label>
                        <input
                            type="date"
                            className="add-input add-input--data"
                            value={form.dataRetorno}
                            onChange={e => alterar({ dataRetorno: e.target.value })}
                        />
                    </div>

                    {avisoDias && (
                        <div className="susp-aviso">
                            <Warning size={14} /> Os {diasNum} dia(s) informados não batem com o intervalo
                            entre início e retorno ({intervalo} dia(s)). Você pode salvar assim mesmo.
                        </div>
                    )}

                    <div className="add-form-row">
                        <label className="add-label">
                            Motivo: <span className="campo-obrigatorio">*</span>
                        </label>
                        <MotivosSelect
                            value={form.motivo}
                            motivos={motivos}
                            onChange={v => alterar({ motivo: v })}
                            className="add-input--motivo"
                        />
                    </div>

                    <div className="add-form-row add-form-row--coluna">
                        <label className="add-label">Complemento (opcional):</label>
                        <textarea
                            className="add-input add-textarea"
                            value={form.complemento}
                            onChange={e => alterar({ complemento: e.target.value })}
                            placeholder="Texto complementar (aparece abaixo do motivo, na 1ª página do PDF)"
                            rows={4}
                        />
                    </div>

                    <EvidenciasUploader
                        novas={novas}
                        onChangeNovas={setNovas}
                        existentes={editar ? existentes : undefined}
                        onRemoverExistente={editar ? removerExistente : undefined}
                    />

                    {erroForm && <div className="add-erro-form"><Warning size={14} /> {erroForm}</div>}

                    <div className="add-form-acoes">
                        <button className="add-btn-confirm btn" onClick={handleSalvar} disabled={salvando}>
                            {salvando ? "Salvando..." : (editar ? "Salvar" : "Salvar e baixar PDF")}
                        </button>
                        <button className="cancel-btn btn" onClick={onFechar} disabled={salvando}>
                            {editar ? "Cancelar" : "Sair"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SuspensaoForm;
