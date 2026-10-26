import React, { useState } from 'react'
import { X, FilePdf, FileXls } from '@phosphor-icons/react'
import { gerarHistorico } from '../utils/historico'
import type { FiltroHistorico, TipoHistorico, FormatoHistorico } from '../utils/historico'
import { showToast } from './Toast'

type Props = {
    titulo: string
    icone: React.ReactNode
    rotuloAmbas: string
    filtro: FiltroHistorico
    escopo: string                  // descreve o filtro no nome do arquivo
    bloqueado?: string | null       // mensagem que impede gerar (ex.: período inválido)
    onFechar: () => void
    children?: React.ReactNode      // campos extras acima de tipo/formato
}

// Estrutura comum dos modais de download: tipo + formato + gerar
const HistoricoModalBase: React.FC<Props> = ({
    titulo, icone, rotuloAmbas, filtro, escopo, bloqueado, onFechar, children,
}) => {
    const [tipo, setTipo] = useState<TipoHistorico>('advertencia')
    const [formato, setFormato] = useState<FormatoHistorico>('excel')
    const [gerando, setGerando] = useState(false)

    const gerar = async () => {
        setGerando(true)
        try {
            const r = await gerarHistorico({ filtro, tipo, formato, escopo })
            const total = r.advertencias + r.suspensoes
            if (total === 0) {
                showToast('Nenhum registro encontrado para gerar o histórico.', 'info')
                return
            }
            const partes = [
                r.advertencias > 0 ? `${r.advertencias} advertência(s)` : '',
                r.suspensoes > 0 ? `${r.suspensoes} suspensão(ões)` : '',
            ].filter(Boolean).join(' e ')
            showToast(`${partes} em ${formato === 'pdf' ? 'PDF' : 'Excel'}!`, 'success')
            onFechar()
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Erro ao gerar o histórico.', 'error')
        } finally {
            setGerando(false)
        }
    }

    const radio = <T extends string>(nome: string, valor: T, atual: T, set: (v: T) => void, rotulo: string) => (
        <label className="hist-filtro-check">
            <input type="radio" name={nome} checked={atual === valor} onChange={() => set(valor)} disabled={gerando} />
            {rotulo}
        </label>
    )

    return (
        <div className="hist-popup">
            <div className="hist-header">
                <span className="titulo-com-icone">
                    {icone}
                    <h2 className="hist-titulo">{titulo}</h2>
                </span>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar" disabled={gerando}>
                    <X size={20} />
                </button>
            </div>

            {children}

            <div className="hist-modal-grupo">
                <span className="add-label">Tipo</span>
                <div className="hist-filtro-opcoes">
                    {radio('hist-tipo', 'advertencia', tipo, setTipo, 'Advertência')}
                    {radio('hist-tipo', 'suspensao', tipo, setTipo, 'Suspensão')}
                    {radio('hist-tipo', 'ambas', tipo, setTipo, rotuloAmbas)}
                </div>
            </div>

            <div className="hist-modal-grupo">
                <span className="add-label">Formato</span>
                <div className="hist-filtro-opcoes">
                    {radio('hist-formato', 'excel', formato, setFormato, 'Excel')}
                    {radio('hist-formato', 'pdf', formato, setFormato, 'PDF')}
                </div>
            </div>

            {bloqueado && <span className="hist-aviso">{bloqueado}</span>}

            <div className="hist-rodape">
                <button className="btn cancel-btn" onClick={onFechar} disabled={gerando}>Cancelar</button>
                <button
                    className={`btn ${formato === 'pdf' ? 'hist-btn-pdf' : 'add-btn-confirm'} hist-btn-gerar`}
                    onClick={gerar}
                    disabled={gerando || !!bloqueado}
                >
                    {gerando
                        ? 'Gerando...'
                        : formato === 'pdf' ? <><FilePdf size={16} /> Gerar PDF</> : <><FileXls size={16} /> Gerar Excel</>}
                </button>
            </div>
        </div>
    )
}

export default HistoricoModalBase
