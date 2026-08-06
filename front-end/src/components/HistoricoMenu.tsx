import React from 'react'

type Props = {
    onFechar: () => void
    onEscolherColaborador: () => void
    onEscolherMotivo: () => void
}

const HistoricoMenu: React.FC<Props> = ({ onFechar, onEscolherColaborador, onEscolherMotivo }) => {
    return (
        <div className="hist-popup">
            <div className="hist-header">
                <h2 className="hist-titulo">📊 Analise e Emissão de advertências</h2>
                <button className="add-btn-fechar" onClick={onFechar} title="Fechar">
                    <img className="icon" src="close.png" alt="fechar" />
                </button>
            </div>

            <p className="hist-subtitulo">
                Selecione como deseja analisar o histórico:
            </p>

            <div className="hist-menu-grid">
                <button className="hist-menu-card" onClick={onEscolherColaborador}>
                    <span className="hist-menu-icon">👤</span>
                    <span className="hist-menu-label">Analisar Advertências por colaborador</span>
                    <span className="hist-menu-desc">
                        Ver e exportar todas as advertências de um colaborador específico.
                    </span>
                </button>

                <button className="hist-menu-card" onClick={onEscolherMotivo}>
                    <span className="hist-menu-icon">📋</span>
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
