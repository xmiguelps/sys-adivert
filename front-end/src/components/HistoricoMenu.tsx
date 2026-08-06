import React from 'react'
import { X, ChartBar, User, ClipboardText } from '@phosphor-icons/react'

type Props = {
    onFechar: () => void
    onEscolherColaborador: () => void
    onEscolherMotivo: () => void
}

const HistoricoMenu: React.FC<Props> = ({ onFechar, onEscolherColaborador, onEscolherMotivo }) => {
    return (
        <div className="hist-popup">
            <div className="hist-header">
                <span className="titulo-com-icone">
                    <ChartBar size={20} />
                    <h2 className="hist-titulo">Analise e Emissão de advertências</h2>
                </span>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <X size={20} />
                </button>
            </div>

            <p className="hist-subtitulo">
                Selecione como deseja analisar o histórico:
            </p>

            <div className="hist-menu-grid">
                <button className="hist-menu-card" onClick={onEscolherColaborador}>
                    <span className="hist-menu-icon"><User size={40} /></span>
                    <span className="hist-menu-label">Analisar Advertências por colaborador</span>
                    <span className="hist-menu-desc">
                        Ver e exportar todas as advertências de um colaborador específico.
                    </span>
                </button>

                <button className="hist-menu-card" onClick={onEscolherMotivo}>
                    <span className="hist-menu-icon"><ClipboardText size={40} /></span>
                    <span className="hist-menu-label">Analisar Advertências por motivo</span>
                    <span className="hist-menu-desc">
                        Ver e exportar todas as advertências agrupadas por motivo.
                    </span>
                </button>
            </div>
        </div>
    )
}

export default HistoricoMenu
