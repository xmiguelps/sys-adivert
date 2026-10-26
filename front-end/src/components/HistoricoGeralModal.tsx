import React, { useState } from 'react'
import { ChartBar } from '@phosphor-icons/react'
import HistoricoModalBase from './HistoricoModalBase'

type Props = { onFechar: () => void }

// Histórico geral: todos os colaboradores, com período opcional
const HistoricoGeralModal: React.FC<Props> = ({ onFechar }) => {
    const [de, setDe] = useState('')
    const [ate, setAte] = useState('')

    const invalido = de && ate && ate < de ? 'A data final não pode ser anterior à data inicial.' : null

    return (
        <HistoricoModalBase
            titulo="Gerar histórico geral"
            icone={<ChartBar size={20} />}
            rotuloAmbas="Ambas"
            filtro={{ de: de || undefined, ate: ate || undefined }}
            escopo="geral"
            bloqueado={invalido}
            onFechar={onFechar}
        >
            <div className="hist-filtro-row">
                <label className="add-label">Data inicial:</label>
                <input type="date" className="add-input add-input--data" value={de} onChange={e => setDe(e.target.value)} />
                <label className="add-label">Data final:</label>
                <input type="date" className="add-input add-input--data" value={ate} onChange={e => setAte(e.target.value)} />
            </div>
            <span className="hist-subtitulo">Deixe as datas em branco para incluir todo o período.</span>
        </HistoricoModalBase>
    )
}

export default HistoricoGeralModal
