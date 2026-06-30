import React, { useState, useMemo, useEffect } from 'react'
import MotivosSelect from './MotivosSelect'
import { 
    MESES_NOMES, 
    getAnoMesDiaAtual,
    listaAnos, 
    isMesFuturo, 
    isDataFutura,
    diasNoMes,
    filtrarPorMes,
    filtrarPorDia
} from '../utils/datas'

type Adivert = {
    id: number
    data: string
    matricula: string | number
    nome: string
    tipo: string
    motivo: string
    assinada?: boolean
}

type Props = {
    adiverts: Adivert[]
    onVoltar: () => void
    onGerar: (motivoConfirmado: string) => void
    onFechar: () => void
}

const HistoricoMotivo: React.FC<Props> = ({ adiverts, onVoltar, onGerar, onFechar }) => {
    const [motivoSelect, setMotivoSelect] = useState('')
    const [motivoConfirmado, setMotivoConfirmado] = useState<string | null>(null)
    const [motivos, setMotivos] = useState<string[]>([])

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/Motivos`)
            .then(r => r.ok ? r.json() : [])
            .then((data: { id: number; descricao: string }[]) => setMotivos(data.map(m => m.descricao)))
            .catch(() => {})
    }, [])
    
    const atual = getAnoMesDiaAtual()
    const [filtroAno, setFiltroAno] = useState<number>(atual.ano)
    const [filtroMes, setFiltroMes] = useState<number>(atual.mes)
    const [filtroDia, setFiltroDia] = useState<number>(atual.dia)
    
    const [tipoFiltro, setTipoFiltro] = useState<'nenhum' | 'mes' | 'dia'>('nenhum')

    const formatDataBR = (iso: string) => {
        const d = new Date(iso)
        return isNaN(d.getTime()) ? iso :
            `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    }

    const historicoMotivo = useMemo(() => {
        if (!motivoConfirmado) return []
        return adiverts.filter(a => a.motivo === motivoConfirmado)
    }, [adiverts, motivoConfirmado])

    const historicoFiltrado = useMemo(() => {
        if (tipoFiltro === 'nenhum') return historicoMotivo
        if (tipoFiltro === 'mes') return filtrarPorMes(historicoMotivo, filtroAno, filtroMes)
        if (tipoFiltro === 'dia') return filtrarPorDia(historicoMotivo, filtroAno, filtroMes, filtroDia)
        return historicoMotivo
    }, [historicoMotivo, filtroAno, filtroMes, filtroDia, tipoFiltro])

    const confirmar = () => {
        if (motivoSelect) {
            setMotivoConfirmado(motivoSelect)
            setTipoFiltro('nenhum')
        }
    }

    return (
        <div className="hist-popup">
            <div className="hist-header">
                <div className="hist-header-left">
                    <button className="hist-btn-voltar" onClick={onVoltar} title="Voltar">
                        ← Voltar
                    </button>
                    <h2 className="hist-titulo">📋 Advertências por Motivo</h2>
                </div>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>

            <div className="hist-busca-box">
                <label className="add-label">Selecione o motivo:</label>
                <div className="hist-busca-row">
                    <div style={{ flex: 1 }}>
                        <MotivosSelect
                            value={motivoSelect}
                            motivos={motivos}
                            onChange={v => setMotivoSelect(v)}
                        />
                    </div>
                    <button
                        className="btn add-btn-confirm"
                        onClick={confirmar}
                        disabled={!motivoSelect}
                    >
                        Buscar
                    </button>
                </div>
            </div>

            {motivoConfirmado && (
                <>
                    {historicoMotivo.length === 0 ? (
                        <div className="hist-vazio">
                            Nenhuma advertência encontrada com esse motivo.
                        </div>
                    ) : (
                        <>
                            <div className="hist-resultado-header">
                                <span className="hist-resultado-motivo" title={motivoConfirmado}>
                                    📌 {historicoMotivo.length} advertência(s) com esse motivo
                                </span>
                            </div>

                            <div className="hist-tabela-wrap">
                                <table className="hist-tabela">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Matrícula</th>
                                            <th>Nome</th>
                                            <th>Tipo</th>
                                            <th>Motivo</th>
                                            <th>Assinada</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historicoFiltrado.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="hist-td-vazio">
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
                                                <td>
                                                    <span className={`assinada-badge ${a.assinada ? 'assinada-badge--sim' : 'assinada-badge--nao'}`}>
                                                        {a.assinada ? '✅ Assinada' : '⬜ Pendente'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="hist-filtro-row">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                    {/* Radio buttons para escolher tipo de filtro */}
                                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                        <label className="hist-filtro-check">
                                            <input
                                                type="radio"
                                                name="tipoFiltro"
                                                checked={tipoFiltro === 'nenhum'}
                                                onChange={() => setTipoFiltro('nenhum')}
                                            />
                                            Sem filtro
                                        </label>
                                        <label className="hist-filtro-check">
                                            <input
                                                type="radio"
                                                name="tipoFiltro"
                                                checked={tipoFiltro === 'mes'}
                                                onChange={() => setTipoFiltro('mes')}
                                            />
                                            Filtrar por mês
                                        </label>
                                        <label className="hist-filtro-check">
                                            <input
                                                type="radio"
                                                name="tipoFiltro"
                                                checked={tipoFiltro === 'dia'}
                                                onChange={() => setTipoFiltro('dia')}
                                            />
                                            Filtrar por dia
                                        </label>
                                    </div>

                                    {/* Filtros por mês */}
                                    {tipoFiltro === 'mes' && (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <label className="add-label">Mês:</label>
                                            <select
                                                className="add-input add-input--tipo"
                                                value={filtroMes}
                                                onChange={e => setFiltroMes(Number(e.target.value))}
                                            >
                                                {MESES_NOMES.map((m, i) => (
                                                    <option key={i} value={i}>{m}</option>
                                                ))}
                                            </select>
                                            <label className="add-label">Ano:</label>
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
                                        </div>
                                    )}

                                    {/* Filtros por dia */}
                                    {tipoFiltro === 'dia' && (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <label className="add-label">Dia:</label>
                                            <select
                                                className="add-input add-input--tipo"
                                                value={filtroDia}
                                                onChange={e => setFiltroDia(Number(e.target.value))}
                                            >
                                                {Array.from({ length: diasNoMes(filtroAno, filtroMes) }, (_, i) => i + 1).map(d => (
                                                    <option key={d} value={d}>
                                                        {String(d).padStart(2, '0')}
                                                    </option>
                                                ))}
                                            </select>
                                            <label className="add-label">Mês:</label>
                                            <select
                                                className="add-input add-input--tipo"
                                                value={filtroMes}
                                                onChange={e => setFiltroMes(Number(e.target.value))}
                                            >
                                                {MESES_NOMES.map((m, i) => (
                                                    <option key={i} value={i}>{m}</option>
                                                ))}
                                            </select>
                                            <label className="add-label">Ano:</label>
                                            <select
                                                className="add-input add-input--tipo"
                                                value={filtroAno}
                                                onChange={e => setFiltroAno(Number(e.target.value))}
                                            >
                                                {listaAnos().map(a => (
                                                    <option key={a} value={a}>{a}</option>
                                                ))}
                                            </select>
                                            {isDataFutura(filtroAno, filtroMes, filtroDia) && (
                                                <span className="hist-aviso">⚠️ Data futura</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="hist-rodape">
                                <button
                                    className="btn add-btn-confirm hist-btn-gerar"
                                    onClick={() => onGerar(motivoConfirmado)}
                                >
                                    📥 Gerar advertências por motivo
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    )
}

export default HistoricoMotivo
