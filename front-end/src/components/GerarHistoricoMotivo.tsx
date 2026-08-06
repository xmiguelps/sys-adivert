import React, { useState, useMemo } from 'react'
import {
    MESES_NOMES, getAnoMesAtual, listaAnos,
    isMesFuturo, isDataFutura, diasNoMes,
    filtrarPorMes, filtrarPorDia,
} from '../utils/datas'
import { downloadAdvertenciasMultiPdf } from '../utils/pdfAdvertencia'
import type { AdvertenciaDoc } from '../utils/pdfAdvertencia'
import { downloadHistoricoExcel } from '../utils/excelHistorico'
import { showToast } from './Toast'

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
    motivoConfirmado: string
    onVoltar: () => void
    onFechar: () => void
}

type Modo = null | 'mes' | 'dia'

const GerarHistoricoMotivo: React.FC<Props> = ({ adiverts, motivoConfirmado, onVoltar, onFechar }) => {
    const atual = getAnoMesAtual()
    const hoje = new Date()

    const [modo, setModo] = useState<Modo>(null)
    const [ano, setAno] = useState<number>(atual.ano)
    const [mes, setMes] = useState<number>(atual.mes)
    const [dia, setDia] = useState<number>(hoje.getDate())
    const [baixando, setBaixando] = useState(false)

    // advertências deste motivo
    const doMotivo = useMemo(
        () => adiverts.filter(a => a.motivo === motivoConfirmado),
        [adiverts, motivoConfirmado]
    )

    const doMes = useMemo(() => filtrarPorMes(doMotivo, ano, mes), [doMotivo, ano, mes])
    const doDia = useMemo(() => filtrarPorDia(doMotivo, ano, mes, dia), [doMotivo, ano, mes, dia])

    const futuroMes = isMesFuturo(ano, mes)
    const futuroDia = isDataFutura(ano, mes, dia)

    // Ajusta o dia caso ele exceda o número de dias do mês/ano selecionado
    const totalDiasMes = diasNoMes(ano, mes)
    const diaAjustado = Math.min(dia, totalDiasMes)
    if (diaAjustado !== dia) setDia(diaAjustado)

    const toDoc = (a: Adivert): AdvertenciaDoc => ({
        data: a.data,
        nome: a.nome,
        matricula: a.matricula,
        motivo: a.motivo,
        tipo: a.tipo,
        complemento: a.complemento ?? null,
    })

    const gerarMes = async () => {
        if (futuroMes) return
        if (doMes.length === 0) {
            showToast('Não há advertências nesse período para esse motivo.', 'info')
            return
        }
        setBaixando(true)
        try {
            const filename = `historico_motivo_${MESES_NOMES[mes]}_${ano}.pdf`
            await downloadAdvertenciasMultiPdf(doMes.map(toDoc), filename)
            showToast(`${doMes.length} advertência(s) gerada(s) em PDF!`, 'success')
        } catch {
            showToast('Erro ao gerar o PDF.', 'error')
        } finally {
            setBaixando(false)
        }
    }

    const gerarDia = async () => {
        if (futuroDia) return
        if (doDia.length === 0) {
            showToast('Não há advertências nesse dia para esse motivo.', 'info')
            return
        }
        setBaixando(true)
        try {
            const ddStr = String(dia).padStart(2, '0')
            const mmStr = String(mes + 1).padStart(2, '0')
            const filename = `historico_motivo_${ddStr}-${mmStr}-${ano}.pdf`
            await downloadAdvertenciasMultiPdf(doDia.map(toDoc), filename)
            showToast(`${doDia.length} advertência(s) gerada(s) em PDF!`, 'success')
        } catch {
            showToast('Erro ao gerar o PDF.', 'error')
        } finally {
            setBaixando(false)
        }
    }

    const gerarMesExcel = () => {
        if (futuroMes) return
        if (doMes.length === 0) {
            showToast('Não há advertências nesse período para esse motivo.', 'info')
            return
        }
        setBaixando(true)
        try {
            const filename = `historico_motivo_${MESES_NOMES[mes]}_${ano}.xlsx`
            downloadHistoricoExcel(doMes, filename)
            showToast(`${doMes.length} advertência(s) exportada(s) em Excel!`, 'success')
        } catch {
            showToast('Erro ao gerar o Excel.', 'error')
        } finally {
            setBaixando(false)
        }
    }

    const gerarDiaExcel = () => {
        if (futuroDia) return
        if (doDia.length === 0) {
            showToast('Não há advertências nesse dia para esse motivo.', 'info')
            return
        }
        setBaixando(true)
        try {
            const ddStr = String(dia).padStart(2, '0')
            const mmStr = String(mes + 1).padStart(2, '0')
            const filename = `historico_motivo_${ddStr}-${mmStr}-${ano}.xlsx`
            downloadHistoricoExcel(doDia, filename)
            showToast(`${doDia.length} advertência(s) exportada(s) em Excel!`, 'success')
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
                        ← Voltar
                    </button>
                    <h2 className="hist-titulo">📥 Gerar histórico por motivo</h2>
                </div>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>

            <div className="hist-motivo-preview" title={motivoConfirmado}>
                <span className="hist-motivo-label">Motivo:</span>
                <span className="hist-motivo-texto">{motivoConfirmado}</span>
            </div>

            <div className="hist-modo-grid">
                <button
                    className={`hist-modo-btn ${modo === 'mes' ? 'hist-modo-btn--ativo' : ''}`}
                    onClick={() => setModo('mes')}
                >
                    📅 Gerar por mês
                </button>
                <button
                    className={`hist-modo-btn ${modo === 'dia' ? 'hist-modo-btn--ativo' : ''}`}
                    onClick={() => setModo('dia')}
                >
                    📆 Gerar por dia
                </button>
            </div>

            {modo === 'mes' && (
                <div className="hist-gerar-box">
                    <div className="hist-filtro-row">
                        <label className="add-label">Mês:</label>
                        <select
                            className="add-input add-input--tipo"
                            value={mes}
                            onChange={e => setMes(Number(e.target.value))}
                        >
                            {MESES_NOMES.map((m, i) => {
                                const disabled = isMesFuturo(ano, i)
                                return (
                                    <option key={i} value={i} disabled={disabled}>
                                        {m}{disabled ? ' (futuro)' : ''}
                                    </option>
                                )
                            })}
                        </select>
                        <label className="add-label">Ano:</label>
                        <select
                            className="add-input add-input--tipo"
                            value={ano}
                            onChange={e => {
                                const novoAno = Number(e.target.value)
                                setAno(novoAno)
                                if (isMesFuturo(novoAno, mes)) setMes(getAnoMesAtual().mes)
                            }}
                        >
                            {listaAnos().map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>

                    <div className={`hist-msg-box ${doMes.length === 0 ? 'hist-msg-box--vazio' : 'hist-msg-box--ok'}`}>
                        {futuroMes ? (
                            <>⚠️ Mês selecionado ainda não ocorreu.</>
                        ) : (
                            <>
                                <strong>{doMes.length}</strong> advertência{doMes.length === 1 ? '' : 's'} encontrada{doMes.length === 1 ? '' : 's'} em
                                {' '}<strong>{MESES_NOMES[mes]}/{ano}</strong>.
                            </>
                        )}
                    </div>

                    <div className="hist-rodape">
                        <button
                            className="btn hist-btn-pdf hist-btn-gerar"
                            onClick={gerarMes}
                            disabled={baixando || futuroMes || doMes.length === 0}
                        >
                            {baixando ? '⏳ Gerando...' : '📄 Gerar PDF'}
                        </button>
                        <button
                            className="btn add-btn-confirm hist-btn-gerar"
                            onClick={gerarMesExcel}
                            disabled={baixando || futuroMes || doMes.length === 0}
                        >
                            {baixando ? '⏳ Gerando...' : '📊 Gerar Excel'}
                        </button>
                    </div>
                </div>
            )}

            {modo === 'dia' && (
                <div className="hist-gerar-box">
                    <div className="hist-filtro-row">
                        <label className="add-label">Dia:</label>
                        <select
                            className="add-input add-input--tipo"
                            value={dia}
                            onChange={e => setDia(Number(e.target.value))}
                        >
                            {Array.from({ length: totalDiasMes }, (_, i) => i + 1).map(d => {
                                const disabled = isDataFutura(ano, mes, d)
                                return (
                                    <option key={d} value={d} disabled={disabled}>
                                        {String(d).padStart(2, '0')}{disabled ? ' (futuro)' : ''}
                                    </option>
                                )
                            })}
                        </select>
                        <label className="add-label">Mês:</label>
                        <select
                            className="add-input add-input--tipo"
                            value={mes}
                            onChange={e => setMes(Number(e.target.value))}
                        >
                            {MESES_NOMES.map((m, i) => {
                                const disabled = isMesFuturo(ano, i)
                                return (
                                    <option key={i} value={i} disabled={disabled}>
                                        {m}{disabled ? ' (futuro)' : ''}
                                    </option>
                                )
                            })}
                        </select>
                        <label className="add-label">Ano:</label>
                        <select
                            className="add-input add-input--tipo"
                            value={ano}
                            onChange={e => {
                                const novoAno = Number(e.target.value)
                                setAno(novoAno)
                                if (isMesFuturo(novoAno, mes)) setMes(getAnoMesAtual().mes)
                            }}
                        >
                            {listaAnos().map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>

                    <div className={`hist-msg-box ${doDia.length === 0 ? 'hist-msg-box--vazio' : 'hist-msg-box--ok'}`}>
                        {futuroDia ? (
                            <>⚠️ Data selecionada ainda não ocorreu.</>
                        ) : (
                            <>
                                <strong>{doDia.length}</strong> advertência{doDia.length === 1 ? '' : 's'} encontrada{doDia.length === 1 ? '' : 's'} em
                                {' '}<strong>
                                    {String(dia).padStart(2, '0')}/{String(mes + 1).padStart(2, '0')}/{ano}
                                </strong>.
                            </>
                        )}
                    </div>

                    <div className="hist-rodape">
                        <button
                            className="btn hist-btn-pdf hist-btn-gerar"
                            onClick={gerarDia}
                            disabled={baixando || futuroDia || doDia.length === 0}
                        >
                            {baixando ? '⏳ Gerando...' : '📄 Gerar PDF'}
                        </button>
                        <button
                            className="btn add-btn-confirm hist-btn-gerar"
                            onClick={gerarDiaExcel}
                            disabled={baixando || futuroDia || doDia.length === 0}
                        >
                            {baixando ? '⏳ Gerando...' : '📊 Gerar Excel'}
                        </button>
                    </div>
                </div>
            )}

            {modo === null && (
                <div className="hist-dica">
                    Escolha <strong>"Gerar por mês"</strong> para filtrar todas as advertências de um mês,
                    ou <strong>"Gerar por dia"</strong> para filtrar as advertências de um dia específico.
                </div>
            )}
        </div>
    )
}

export default GerarHistoricoMotivo
