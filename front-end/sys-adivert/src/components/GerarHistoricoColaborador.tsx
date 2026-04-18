import React, { useState, useMemo } from 'react'
import { MESES_NOMES, getAnoMesAtual, listaAnos, isMesFuturo, filtrarPorMes } from '../utils/datas'
import { downloadHistoricoExcel } from '../utils/excelHistorico'
import { showToast } from './Toast'

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
    nomeColaborador: string
    onVoltar: () => void
    onFechar: () => void
}

const GerarHistoricoColaborador: React.FC<Props> = ({ adiverts, nomeColaborador, onVoltar, onFechar }) => {
    const atual = getAnoMesAtual()
    const [ano, setAno] = useState<number>(atual.ano)
    const [mes, setMes] = useState<number>(atual.mes)
    const [baixando, setBaixando] = useState(false)

    // advertências do colaborador (independente do mês escolhido)
    const doColaborador = useMemo(() => {
        const alvo = nomeColaborador.trim().toLowerCase()
        return adiverts.filter(a => a.nome.trim().toLowerCase().includes(alvo))
    }, [adiverts, nomeColaborador])

    const doMes = useMemo(() => filtrarPorMes(doColaborador, ano, mes), [doColaborador, ano, mes])

    const futuro = isMesFuturo(ano, mes)
    const qtd = doMes.length

    const gerar = () => {
        if (futuro) return
        if (qtd === 0) {
            showToast('Não há advertências para gerar nesse período.', 'info')
            return
        }
        setBaixando(true)
        try {
            const filename = `historico_${nomeColaborador.replace(/\s+/g, '_')}_${MESES_NOMES[mes]}_${ano}.xlsx`
            downloadHistoricoExcel(doMes, filename)
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
                        ← Voltar
                    </button>
                    <h2 className="hist-titulo">
                        📥 Gerar histórico de <span className="hist-nome-destaque">{nomeColaborador}</span>
                    </h2>
                </div>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>

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
                            // Se o mês atual virar futuro após a mudança, ajusta
                            if (isMesFuturo(novoAno, mes)) {
                                setMes(getAnoMesAtual().mes)
                            }
                        }}
                    >
                        {listaAnos().map(a => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                </div>

                {/* Mensagem de resultado */}
                <div className={`hist-msg-box ${qtd === 0 ? 'hist-msg-box--vazio' : 'hist-msg-box--ok'}`}>
                    {futuro ? (
                        <>⚠️ Mês selecionado ainda não ocorreu.</>
                    ) : qtd === 0 ? (
                        <>
                            O Colaborador <strong>{nomeColaborador}</strong> não teve nenhuma advertência
                            no mês de <strong>{MESES_NOMES[mes]}</strong> em <strong>{ano}</strong>.
                        </>
                    ) : (
                        <>
                            O Colaborador tem <strong>{qtd}</strong> advertência{qtd > 1 ? 's' : ''} no
                            mês de <strong>{MESES_NOMES[mes]}</strong> em <strong>{ano}</strong>.
                        </>
                    )}
                </div>

                <div className="hist-rodape">
                    <button
                        className="btn add-btn-confirm hist-btn-gerar"
                        onClick={gerar}
                        disabled={baixando || futuro || qtd === 0}
                    >
                        {baixando ? '⏳ Gerando...' : '📄 Gerar arquivo'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default GerarHistoricoColaborador
