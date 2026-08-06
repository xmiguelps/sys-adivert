import React, { useState, useEffect } from "react";
import { showToast } from "./Toast";

function normalizar(s: string) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

type Motivo = {
    id: number;
    descricao: string;
};

type Aba = "motivos";

type ConfiguracoesProps = {
    setConfigAberto: React.Dispatch<React.SetStateAction<boolean>>;
};

function Configuracoes({ setConfigAberto }: ConfiguracoesProps) {
    const [aba, setAba] = useState<Aba>("motivos");

    const [motivos, setMotivos] = useState<Motivo[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [busca, setBusca] = useState("");

    const motivosFiltrados = busca.trim()
        ? motivos.filter(m => normalizar(m.descricao).includes(normalizar(busca)))
        : motivos;

    const [criando, setCriando] = useState(false);
    const [novoMotivo, setNovoMotivo] = useState("");
    const [salvando, setSalvando] = useState(false);

    const [confirmRemoverId, setConfirmRemoverId] = useState<number | null>(null);
    const [removendo, setRemovendo] = useState(false);

    // Carrega a lista automaticamente ao abrir
    useEffect(() => {
        listarMotivos();
    }, []);

    const listarMotivos = async () => {
        setCarregando(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Motivos`, {
                headers: { Accept: "application/json" },
            });
            if (!res.ok) throw new Error("Erro ao buscar motivos");
            const data: Motivo[] = await res.json();
            setMotivos(data);
        } catch {
            showToast("Erro ao buscar motivos.", "error");
        } finally {
            setCarregando(false);
        }
    };

    const criarMotivo = async () => {
        if (!novoMotivo.trim()) {
            showToast("Digite o texto do motivo.", "error");
            return;
        }
        setSalvando(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Motivos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ descricao: novoMotivo.trim() }),
            });
            if (res.status === 400) {
                showToast("Motivo inválido ou já cadastrado.", "error");
                return;
            }
            if (!res.ok) throw new Error("Erro ao criar motivo");
            setNovoMotivo("");
            setCriando(false);
            await listarMotivos();
            showToast("Motivo cadastrado com sucesso!", "success");
        } catch {
            showToast("Erro ao criar motivo.", "error");
        } finally {
            setSalvando(false);
        }
    };

    const removerPorId = async (id: number) => {
        setRemovendo(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Motivos/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Não encontrado");
            setMotivos(prev => prev.filter(m => m.id !== id));
            setConfirmRemoverId(null);
            showToast("Motivo removido.", "success");
        } catch {
            showToast("Erro ao remover motivo.", "error");
        } finally {
            setRemovendo(false);
        }
    };

    return (
        <div className="colab-popup">
            {/* ── Cabeçalho ── */}
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

            {/* ── Aba: Motivos ── */}
            {aba === "motivos" && (
                <>
                    {/* Barra de ações */}
                    <div className="colab-acoes-bar">
                        <button
                            className="btn colab-btn-novo"
                            onClick={() => { setCriando(v => !v); setConfirmRemoverId(null); }}
                        >
                            {criando ? "✕ Cancelar" : "+ Novo Motivo"}
                        </button>
                    </div>

                    {/* Formulário: criar motivo */}
                    {criando && (
                        <div className="colab-form-box">
                            <h3 className="colab-form-titulo">Novo Motivo</h3>
                            <div className="add-form-row">
                                <textarea
                                    className="add-input"
                                    placeholder="Digite o texto do motivo..."
                                    value={novoMotivo}
                                    onChange={e => setNovoMotivo(e.target.value)}
                                    rows={3}
                                    autoFocus
                                />
                            </div>
                            <div className="add-form-acoes">
                                <button className="btn add-btn-confirm" onClick={criarMotivo} disabled={salvando}>
                                    {salvando ? "Salvando..." : "✔ Criar"}
                                </button>
                                <button className="btn cancel-btn" onClick={() => { setCriando(false); setNovoMotivo(""); }}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Confirmação de remoção */}
                    {confirmRemoverId !== null && (() => {
                        const alvo = motivos.find(m => m.id === confirmRemoverId);
                        return alvo ? (
                            <div className="colab-form-box">
                                <p>Tem certeza que deseja remover este motivo?</p>
                                <p><em>"{alvo.descricao}"</em></p>
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

                    {/* Busca na lista */}
                    {!carregando && motivos.length > 0 && (
                        <div className="lista-busca">
                            <input
                                className="add-input"
                                placeholder="🔍 Pesquisar motivo..."
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Lista de motivos */}
                    <div className="colab-lista">
                        {carregando ? (
                            <p className="add-vazio">⏳ Carregando motivos...</p>
                        ) : motivos.length === 0 ? (
                            <p className="add-vazio">Nenhum motivo cadastrado.</p>
                        ) : motivosFiltrados.length === 0 ? (
                            <p className="add-vazio">Nenhum motivo encontrado para "{busca}".</p>
                        ) : (
                            <>
                                <div className="colab-lista-info">
                                    <span className="colab-total">
                                        {busca.trim()
                                            ? <><strong>{motivosFiltrados.length}</strong> de {motivos.length} motivo(s)</>
                                            : <>Total: <strong>{motivos.length}</strong> motivo(s)</>}
                                    </span>
                                </div>
                                <table className="colab-table">
                                    <thead>
                                        <tr>
                                            <th className="colab-th">#</th>
                                            <th className="colab-th">Motivo</th>
                                            <th className="colab-th">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {motivosFiltrados.map((m, i) => (
                                            <tr
                                                key={m.id}
                                                className={confirmRemoverId === m.id ? "colab-row colab-row--selecionada" : "colab-row"}
                                            >
                                                <td className="colab-td colab-td--num">{i + 1}</td>
                                                <td className="colab-td">{m.descricao}</td>
                                                <td className="colab-td">
                                                    <button
                                                        className="add-btn-icone"
                                                        title="Remover"
                                                        onClick={() => setConfirmRemoverId(m.id)}
                                                    >
                                                        <img className="icon" src="lixeira.png" alt="remover" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default Configuracoes;
