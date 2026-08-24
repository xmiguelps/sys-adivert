import React, { useState, useMemo, useEffect } from 'react'
import { X, ArrowLeft, User, CheckCircle, Square, Warning, FilePdf, FileXls } from '@phosphor-icons/react'
import { MESES_NOMES, getAnoMesAtual, listaAnos, isMesFuturo, filtrarPorMes, parseDataLocal } from '../utils/datas'
import { downloadAdvertenciasMultiPdf } from '../utils/pdfAdvertencia'
import type { AdvertenciaDoc } from '../utils/pdfAdvertencia'
import { downloadHistoricoExcel } from '../utils/excelHistorico'
import { showToast } from './Toast'
import ColabSelect from './ColabSelect'

type Colab = { id: number; nome: string; matricula: string }

type Adivert = {
    id: number
    data: string
    matricula: string | number
    nome: string
    tipo: string
    motivo: string
    complemento?: string | null
    assinada?: boolean
}

type Props = {
    adiverts: Adivert[]
    onVoltar: () => void
    onFechar: () => void
}

const HistoricoColaborador: React.FC<Props> = ({ adiverts, onVoltar, onFechar }) => {
    const [colabs, setColabs] = useState<Colab[]>([])
    const [nomeInput, setNomeInput] = useState('')
    const [nomeConfirmado, setNomeConfirmado] = useState<string | null>(null)
    const [baixando, setBaixando] = useState(false)

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/Colabs`)
            .then(r => r.ok ? r.json() : [])
            .then(setColabs)
            .catch(() => {})
    }, [])
    const [filtroAno, setFiltroAno] = useState<number>(getAnoMesAtual().ano)
    const [filtroMes, setFiltroMes] = useState<number>(getAnoMesAtual().mes)
    const [filtroAtivo, setFiltroAtivo] = useState(false)

    const formatDataBR = (iso: string) => {
        // Usa parseDataLocal (mesmo helper dos filtros) para evitar o off-by-one
        // de fuso: new Date("2026-07-20T00:00:00Z") vira 19/07 em UTC-3.
        const d = parseDataLocal(iso)
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
            const nomeUpper = nomeInput.trim().toUpperCase()
            setNomeInput(nomeUpper)
            setNomeConfirmado(nomeUpper)
            setFiltroAtivo(false)
        }
    }

    const periodoFuturo = filtroAtivo && isMesFuturo(filtroAno, filtroMes)

    const toDoc = (a: Adivert): AdvertenciaDoc => ({
        data: a.data,
        nome: a.nome,
        matricula: a.matricula,
        motivo: a.motivo,
        tipo: a.tipo,
        complemento: a.complemento ?? null,
    })

    // Nome do arquivo reflete o filtro de mês aplicado na própria tela
    const nomeArquivo = (ext: 'pdf' | 'xlsx') => {
        const nomeColab = (historicoColaborador[0]?.nome ?? nomeConfirmado ?? 'colaborador')
            .trim().replace(/\s+/g, '_')
        const periodo = filtroAtivo ? `_${MESES_NOMES[filtroMes]}_${filtroAno}` : ''
        return `historico_${nomeColab}${periodo}.${ext}`
    }

    const gerarPdf = async () => {
        if (historicoFiltrado.length === 0) {
            showToast('Não há advertências para gerar nesse período.', 'info')
            return
        }
        setBaixando(true)
        try {
            await downloadAdvertenciasMultiPdf(historicoFiltrado.map(toDoc), nomeArquivo('pdf'))
            showToast(`${historicoFiltrado.length} advertência(s) gerada(s) em PDF!`, 'success')
        } catch {
            showToast('Erro ao gerar o PDF.', 'error')
        } finally {
            setBaixando(false)
        }
    }

    const gerarExcel = () => {
        if (historicoFiltrado.length === 0) {
            showToast('Não há advertências para gerar nesse período.', 'info')
            return
        }
        setBaixando(true)
        try {
            downloadHistoricoExcel(historicoFiltrado, nomeArquivo('xlsx'))
            showToast('Histórico gerado com sucesso!', 'success')
        } catch {
            showToast('Erro ao gerar histórico.', 'error')
        } finally {
            setBaixando(false)
        }
    }

    return (
        <div className="hist-popup">
            <div className="hist-header">
                <div className="hist-header-left">
                    <button className="hist-btn-voltar" onClick={onVoltar} title="Voltar">
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <span className="titulo-com-icone">
                        <User size={20} />
                        <h2 className="hist-titulo">Advertências por Colaborador</h2>
                    </span>
                </div>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <X size={20} />
                </button>
            </div>

            {/* Campo de busca por nome */}
            <div className="hist-busca-box">
                <label className="add-label">Digite o nome do colaborador:</label>
                <div className="hist-busca-row">
                    <ColabSelect
                        nome={nomeInput}
                        colabs={colabs}
                        onNomeChange={setNomeInput}
                        onColabSelect={(nome) => {
                            const upper = nome.toUpperCase()
                            setNomeInput(upper)
                            setNomeConfirmado(upper)
                            setFiltroAtivo(false)
                        }}
                        placeholder="Ex: THIAGO LUCIUS MARTINS"
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
                                    {historicoColaborador[0].nome}: {historicoColaborador.length} advertência(s)
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
                                                        {a.assinada
                                                            ? <><CheckCircle size={14} weight="fill" /> Assinada</>
                                                            : <><Square size={14} /> Pendente</>}
                                                    </span>
                                                </td>
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
                                            <span className="hist-aviso"><Warning size={14} /> Mês futuro</span>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Exportação — age sobre exatamente o que está na tabela acima */}
                            <div className="hist-rodape">
                                <span className="hist-rodape__resumo">
                                    {periodoFuturo && (
                                        <span className="hist-aviso"><Warning size={14} /> Mês futuro</span>
                                    )}
                                    <span>
                                        <strong>{historicoFiltrado.length}</strong> advertência
                                        {historicoFiltrado.length === 1
                                            ? ' será exportada'
                                            : 's serão exportadas'}
                                    </span>
                                </span>
                                <button
                                    className="btn hist-btn-pdf hist-btn-gerar"
                                    onClick={gerarPdf}
                                    disabled={baixando || historicoFiltrado.length === 0}
                                >
                                    {baixando ? 'Gerando...' : <><FilePdf size={16} /> Gerar PDF</>}
                                </button>
                                <button
                                    className="btn add-btn-confirm hist-btn-gerar"
                                    onClick={gerarExcel}
                                    disabled={baixando || historicoFiltrado.length === 0}
                                >
                                    {baixando ? 'Gerando...' : <><FileXls size={16} /> Gerar Excel</>}
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
