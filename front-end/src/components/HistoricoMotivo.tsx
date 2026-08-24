import React, { useState, useMemo, useEffect } from 'react'
import { X, ArrowLeft, ClipboardText, CheckCircle, Square, Warning, FilePdf, FileXls } from '@phosphor-icons/react'
import MotivosSelect from './MotivosSelect'
import { downloadAdvertenciasMultiPdf } from '../utils/pdfAdvertencia'
import type { AdvertenciaDoc } from '../utils/pdfAdvertencia'
import { downloadHistoricoExcel } from '../utils/excelHistorico'
import { showToast } from './Toast'
import {
    MESES_NOMES,
    getAnoMesDiaAtual,
    listaAnos,
    isMesFuturo,
    isDataFutura,
    diasNoMes,
    filtrarPorMes,
    filtrarPorDia,
    parseDataLocal
} from '../utils/datas'

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

const HistoricoMotivo: React.FC<Props> = ({ adiverts, onVoltar, onFechar }) => {
    const [motivosSelect, setMotivosSelect] = useState<string[]>([])
    const [motivosConfirmados, setMotivosConfirmados] = useState<string[] | null>(null)
    const [motivos, setMotivos] = useState<string[]>([])
    const [baixando, setBaixando] = useState(false)

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

    // Mantém o dia dentro do mês/ano escolhidos (ex.: 31 -> 30 ao trocar para Abril)
    const totalDiasMes = diasNoMes(filtroAno, filtroMes)
    useEffect(() => {
        setFiltroDia(d => Math.min(d, totalDiasMes))
    }, [totalDiasMes])

    const formatDataBR = (iso: string) => {
        // Usa parseDataLocal (mesmo helper dos filtros) para evitar o off-by-one
        // de fuso: new Date("2026-07-20T00:00:00Z") vira 19/07 em UTC-3.
        const d = parseDataLocal(iso)
        return isNaN(d.getTime()) ? iso :
            `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    }

    const historicoMotivo = useMemo(() => {
        if (!motivosConfirmados || motivosConfirmados.length === 0) return []
        return adiverts.filter(a => motivosConfirmados.includes(a.motivo))
    }, [adiverts, motivosConfirmados])

    const historicoFiltrado = useMemo(() => {
        if (tipoFiltro === 'mes') return filtrarPorMes(historicoMotivo, filtroAno, filtroMes)
        if (tipoFiltro === 'dia') return filtrarPorDia(historicoMotivo, filtroAno, filtroMes, filtroDia)
        return historicoMotivo
    }, [historicoMotivo, filtroAno, filtroMes, filtroDia, tipoFiltro])

    const confirmar = () => {
        if (motivosSelect.length > 0) {
            setMotivosConfirmados(motivosSelect)
            setTipoFiltro('nenhum')
        }
    }

    const periodoFuturo =
        (tipoFiltro === 'mes' && isMesFuturo(filtroAno, filtroMes)) ||
        (tipoFiltro === 'dia' && isDataFutura(filtroAno, filtroMes, filtroDia))

    const toDoc = (a: Adivert): AdvertenciaDoc => ({
        data: a.data,
        nome: a.nome,
        matricula: a.matricula,
        motivo: a.motivo,
        tipo: a.tipo,
        complemento: a.complemento ?? null,
    })

    // Nome do arquivo reflete o filtro de período aplicado na própria tela
    const nomeArquivo = (ext: 'pdf' | 'xlsx') => {
        const plural = (motivosConfirmados?.length ?? 0) > 1 ? 'motivos' : 'motivo'
        if (tipoFiltro === 'mes') return `historico_${plural}_${MESES_NOMES[filtroMes]}_${filtroAno}.${ext}`
        if (tipoFiltro === 'dia') {
            const dd = String(filtroDia).padStart(2, '0')
            const mm = String(filtroMes + 1).padStart(2, '0')
            return `historico_${plural}_${dd}-${mm}-${filtroAno}.${ext}`
        }
        return `historico_${plural}.${ext}`
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
            showToast(`${historicoFiltrado.length} advertência(s) exportada(s) em Excel!`, 'success')
        } catch {
            showToast('Erro ao gerar o Excel.', 'error')
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
                        <ClipboardText size={20} />
                        <h2 className="hist-titulo">Advertências por Motivo</h2>
                    </span>
                </div>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <X size={20} />
                </button>
            </div>

            <div className="hist-busca-box">
                <label className="add-label">Selecione um ou mais motivos:</label>
                <div className="hist-busca-row">
                    <MotivosSelect
                        multiple
                        values={motivosSelect}
                        motivos={motivos}
                        onChange={setMotivosSelect}
                    />
                    <button
                        className="btn add-btn-confirm"
                        onClick={confirmar}
                        disabled={motivosSelect.length === 0}
                    >
                        Buscar
                    </button>
                </div>
            </div>

            {motivosConfirmados && (
                <>
                    {historicoMotivo.length === 0 ? (
                        <div className="hist-vazio">
                            Nenhuma advertência encontrada
                            {motivosConfirmados.length > 1 ? ' para os motivos selecionados.' : ' com esse motivo.'}
                        </div>
                    ) : (
                        <>
                            <div className="hist-resultado-header">
                                <span className="hist-resultado-motivo">
                                    {historicoMotivo.length} advertência(s) em{' '}
                                    {motivosConfirmados.length} motivo(s) selecionado(s)
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

                            <div className="hist-filtro-bloco">
                                {/* Radio buttons para escolher tipo de filtro */}
                                <div className="hist-filtro-opcoes">
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
                                    <div className="hist-filtro-row">
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
                                            <span className="hist-aviso"><Warning size={14} /> Mês futuro</span>
                                        )}
                                    </div>
                                )}

                                {/* Filtros por dia */}
                                {tipoFiltro === 'dia' && (
                                    <div className="hist-filtro-row">
                                        <label className="add-label">Dia:</label>
                                        <select
                                            className="add-input add-input--tipo"
                                            value={filtroDia}
                                            onChange={e => setFiltroDia(Number(e.target.value))}
                                        >
                                            {Array.from({ length: totalDiasMes }, (_, i) => i + 1).map(d => (
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
                                            <span className="hist-aviso"><Warning size={14} /> Data futura</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="hist-rodape">
                                <span className="hist-rodape__resumo">
                                    {periodoFuturo && (
                                        <span className="hist-aviso"><Warning size={14} /> Período futuro</span>
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

export default HistoricoMotivo
