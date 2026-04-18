import React, { useState, useMemo } from 'react'
import { MESES_NOMES, getAnoMesAtual, listaAnos, isMesFuturo, filtrarPorMes } from '../utils/datas'

type Adivert = {
    id: number
    data: string
    matricula: string | number
    nome: string
    tipo: string
    motivo: string
}

type Props = {
    adiverts: Adivert[]
    onVoltar: () => void
    onGerar: (nomeColaborador: string) => void
    onFechar: () => void
}

const HistoricoColaborador: React.FC<Props> = ({ adiverts, onVoltar, onGerar, onFechar }) => {
    const [nomeInput, setNomeInput] = useState('')
    const [nomeConfirmado, setNomeConfirmado] = useState<string | null>(null)
    const [filtroAno, setFiltroAno] = useState<number>(getAnoMesAtual().ano)
    const [filtroMes, setFiltroMes] = useState<number>(getAnoMesAtual().mes)
    const [filtroAtivo, setFiltroAtivo] = useState(false)

    const formatDataBR = (iso: string) => {
        const d = new Date(iso)
        return isNaN(d.getTime()) ? iso :
            `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    }

    const historicoColaborador = useMemo(() => {
        if (!nomeConfirmado) return []
        const alvo = nomeConfirmado.trim().toLowerCase()
        return adiverts.filter(a => a.nome.trim().toLowerCase().includes(alvo))
    }, [adiverts, nomeConfirmado])

    const historicoFiltrado = useMemo(() => {
        if (!filtroAtivo) return historicoColaborador
        return filtrarPorMes(historicoColaborador, filtroAno, filtroMes)
    }, [historicoColaborador, filtroAno, filtroMes, filtroAtivo])

    const confirmarBusca = () => {
        if (nomeInput.trim()) {
            setNomeConfirmado(nomeInput.trim())
            setFiltroAtivo(false)
        }
    }

    return (
        <div className="hist-popup">
            <div className="hist-header">
                <div className="hist-header-left">
                    <button className="hist-btn-voltar" onClick={onVoltar} title="Voltar">
                        ← Voltar
                    </button>
                    <h2 className="hist-titulo">👤 Advertências por Colaborador</h2>
                </div>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>

            {/* Campo de busca por nome */}
            <div className="hist-busca-box">
                <label className="add-label">Digite o nome do colaborador:</label>
                <div className="hist-busca-row">
                    <input
                        className="add-input"
                        value={nomeInput}
                        placeholder="Ex: THIAGO LUCIUS MARTINS"
                        onChange={e => setNomeInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmarBusca() }}
                    />
                    <button className="btn add-btn-confirm" onClick={confirmarBusca} disabled={!nomeInput.trim()}>
                        Buscar
                    </button>
                </div>
            </div>

            {/* Resultado da busca */}
            {nomeConfirmado && (
                <>
                    {historicoColaborador.length === 0 ? (
                        <div className="hist-vazio">
                            Nenhuma advertência encontrada para <strong>{nomeConfirmado}</strong>.
                        </div>
                    ) : (
                        <>
                            <div className="hist-resultado-header">
                                <span className="hist-resultado-nome">
                                    📌 {historicoColaborador[0].nome} — {historicoColaborador.length} advertência(s)
                                </span>
                            </div>

                            {/* Tabela de advertências */}
                            <div className="hist-tabela-wrap">
                                <table className="hist-tabela">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Matrícula</th>
                                            <th>Nome</th>
                                            <th>Tipo</th>
                                            <th>Motivo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historicoFiltrado.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="hist-td-vazio">
                                                    Nenhuma advertência no período selecionado.
                                                </td>
                                            </tr>
                                        ) : historicoFiltrado.map(a => (
                                            <tr key={a.id}>
                                                <td>{formatDataBR(a.data)}</td>
                                                <td>{a.matricula}</td>
                                                <td>{a.nome}</td>
                                                <td>{a.tipo}</td>
                                                <td className="hist-td-motivo" title={a.motivo}>{a.motivo}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Filtro por mês */}
                            <div className="hist-filtro-row">
                                <label className="hist-filtro-check">
                                    <input
                                        type="checkbox"
                                        checked={filtroAtivo}
                                        onChange={e => setFiltroAtivo(e.target.checked)}
                                    />
                                    Filtrar por mês:
                                </label>
                                {filtroAtivo && (
                                    <>
                                        <select
                                            className="add-input add-input--tipo"
                                            value={filtroMes}
                                            onChange={e => setFiltroMes(Number(e.target.value))}
                                        >
                                            {MESES_NOMES.map((m, i) => (
                                                <option key={i} value={i}>{m}</option>
                                            ))}
                                        </select>
                                        <select
                                            className="add-input add-input--tipo"
                                            value={filtroAno}
                                            onChange={e => setFiltroAno(Number(e.target.value))}
                                        >
                                            {listaAnos().map(a => (
                                                <option key={a} value={a}>{a}</option>
                                            ))}
                                        </select>
                                        {isMesFuturo(filtroAno, filtroMes) && (
                                            <span className="hist-aviso">⚠️ Mês futuro</span>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Botão "Gerar histórico de [nome]" — só aparece depois do histórico gerado */}
                            <div className="hist-rodape">
                                <button
                                    className="btn add-btn-confirm hist-btn-gerar"
                                    onClick={() => onGerar(historicoColaborador[0].nome)}
                                >
                                    📥 Gerar histórico de {historicoColaborador[0].nome}
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    )
}

export default HistoricoColaborador
