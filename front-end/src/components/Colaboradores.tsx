import React, { useState, useEffect } from "react";
import { Plus, X, Trash, Users } from "@phosphor-icons/react";
import ColabSelect from "./ColabSelect";

function normalizar(s: string) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

type Colab = {
    id: number;
    nome: string;
    matricula: string;
};

type ColabsProps = {
    setColabAberto: React.Dispatch<React.SetStateAction<boolean>>;
};

function Colaboradores({ setColabAberto }: ColabsProps) {
    const [colabs, setColabs] = useState<Colab[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [busca, setBusca] = useState("");

    const colabsFiltrados = busca.trim()
        ? colabs.filter(c =>
            normalizar(c.nome).includes(normalizar(busca)) ||
            c.matricula.toLowerCase().includes(busca.trim().toLowerCase())
        )
        : colabs;

    const [criandoColab, setCriandoColab] = useState(false);
    const [novoNome, setNovoNome] = useState("");
    const [novaMatricula, setNovaMatricula] = useState("");
    const [salvando, setSalvando] = useState(false);

    const [removendoAtivo, setRemovendoAtivo] = useState(false);
    const [nomeRemover, setNomeRemover] = useState("");
    const [removendo, setRemovendo] = useState(false);
    const [confirmRemoverId, setConfirmRemoverId] = useState<number | null>(null);

    // Carrega a lista automaticamente ao abrir
    useEffect(() => {
        listarColabs();
    }, []);

    const listarColabs = async () => {
        setCarregando(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Colabs`, {
                headers: { Accept: "application/json" },
            });
            if (!res.ok) throw new Error("Erro ao buscar colaboradores");
            const data: Colab[] = await res.json();
            setColabs(data);
        } catch {
            alert("Erro ao buscar colaboradores.");
        } finally {
            setCarregando(false);
        }
    };

    const criarColab = async () => {
        if (!novoNome.trim() || !novaMatricula.trim()) {
            alert("Preencha o nome e a matrícula.");
            return;
        }
        setSalvando(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Colabs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome: novoNome.trim(), matricula: novaMatricula.trim() }),
            });
            if (!res.ok) throw new Error("Erro ao criar colaborador");
            setNovoNome("");
            setNovaMatricula("");
            setCriandoColab(false);
            await listarColabs();
        } catch {
            alert("Erro ao criar colaborador.");
        } finally {
            setSalvando(false);
        }
    };

    const removerPorId = async (id: number) => {
        setRemovendo(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Colabs/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Não encontrado");
            setColabs(prev => prev.filter(c => c.id !== id));
            setConfirmRemoverId(null);
        } catch {
            alert("Erro ao remover colaborador.");
        } finally {
            setRemovendo(false);
        }
    };

    const removerPorNome = async () => {
        if (!nomeRemover.trim()) {
            alert("Digite o nome do colaborador para remover.");
            return;
        }
        setRemovendo(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/Colabs/matricula?nome=${encodeURIComponent(nomeRemover.trim())}`
            );
            if (!res.ok) {
                alert(`Colaborador "${nomeRemover}" não encontrado.`);
                return;
            }
            const todos: Colab[] = await fetch(`${import.meta.env.VITE_API_URL}/api/Colabs`, {
                headers: { Accept: "application/json" },
            }).then(r => r.json());
            const encontrado = todos.find(
                c => c.nome.toLowerCase() === nomeRemover.trim().toLowerCase()
            );
            if (!encontrado) {
                alert(`Colaborador "${nomeRemover}" não encontrado.`);
                return;
            }
            setConfirmRemoverId(encontrado.id);
            setColabs(todos);
        } catch {
            alert("Erro ao buscar colaborador pelo nome.");
        } finally {
            setRemovendo(false);
        }
    };

    const toggleRemover = () => {
        setRemovendoAtivo(v => !v);
        setNomeRemover("");
        setConfirmRemoverId(null);
        setCriandoColab(false);
    };

    return (
        <div className="colab-popup">
            {/* ── Cabeçalho ── */}
            <div className="colab-header">
                <h2 className="colab-titulo"><Users size={20} /> Gerenciar Colaboradores</h2>
                <button className="add-btn-fechar" onClick={() => setColabAberto(false)} title="Fechar">
                    <X size={20} />
                </button>
            </div>

            {/* ── Barra de ações ── */}
            <div className="colab-acoes-bar">
                <button
                    className="btn colab-btn-novo"
                    onClick={() => { setCriandoColab(v => !v); setRemovendoAtivo(false); setConfirmRemoverId(null); }}
                >
                    {criandoColab ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Novo Colaborador</>}
                </button>

                <button
                    className={`btn colab-btn-remover${removendoAtivo ? " colab-btn-remover--ativo" : ""}`}
                    onClick={toggleRemover}
                >
                    {removendoAtivo ? <><X size={14} /> Cancelar Remoção</> : <><Trash size={14} /> Remover</>}
                </button>
            </div>

            {/* ── Formulário: criar colaborador ── */}
            {criandoColab && (
                <div className="colab-form-box">
                    <h3 className="colab-form-titulo">Novo Colaborador</h3>
                    <div className="add-form-row">
                        <label className="add-label">Nome:</label>
                        <input
                            className="add-input"
                            placeholder="Nome completo"
                            value={novoNome}
                            onChange={e => setNovoNome(e.target.value)}
                        />
                    </div>
                    <div className="add-form-row">
                        <label className="add-label">Matrícula:</label>
                        <input
                            className="add-input add-input--matricula"
                            placeholder="Ex: 00123"
                            value={novaMatricula}
                            onChange={e => setNovaMatricula(e.target.value)}
                        />
                    </div>
                    <div className="add-form-acoes">
                        <button className="btn add-btn-confirm" onClick={criarColab} disabled={salvando}>
                            {salvando ? "Salvando..." : "Criar"}
                        </button>
                        <button className="btn cancel-btn" onClick={() => setCriandoColab(false)}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

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
                        {removendo ? "Buscando..." : <><Trash size={14} /> Buscar e Remover</>}
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
                                        {removendo ? "Removendo..." : "Sim, remover"}
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

            {/* ── Busca na lista ── */}
            {!carregando && colabs.length > 0 && (
                <div className="lista-busca">
                    <input
                        className="add-input"
                        placeholder="Pesquisar por nome ou matrícula..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                    />
                </div>
            )}

            {/* ── Lista de colaboradores ── */}
            <div className="colab-lista">
                {carregando ? (
                    <p className="add-vazio">Carregando colaboradores...</p>
                ) : colabs.length === 0 ? (
                    <p className="add-vazio">Nenhum colaborador cadastrado.</p>
                ) : colabsFiltrados.length === 0 ? (
                    <p className="add-vazio">Nenhum colaborador encontrado para "{busca}".</p>
                ) : (
                    <>
                        <div className="colab-lista-info">
                            <span className="colab-total">
                                {busca.trim()
                                    ? <><strong>{colabsFiltrados.length}</strong> de {colabs.length} colaborador(es)</>
                                    : <>Total: <strong>{colabs.length}</strong> colaborador(es)</>}
                            </span>
                        </div>
                        <table className="colab-table">
                            <thead>
                                <tr>
                                    <th className="colab-th">#</th>
                                    <th className="colab-th">Nome</th>
                                    <th className="colab-th">Matrícula</th>
                                    <th className="colab-th">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {colabsFiltrados.map((c, i) => (
                                    <tr
                                        key={c.id}
                                        className={confirmRemoverId === c.id ? "colab-row colab-row--selecionada" : "colab-row"}
                                    >
                                        <td className="colab-td colab-td--num">{i + 1}</td>
                                        <td className="colab-td">{c.nome}</td>
                                        <td className="colab-td">{c.matricula}</td>
                                        <td className="colab-td">
                                            <button
                                                className="add-btn-icone"
                                                title="Remover"
                                                onClick={() => setConfirmRemoverId(c.id)}
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    );
}

export default Colaboradores;