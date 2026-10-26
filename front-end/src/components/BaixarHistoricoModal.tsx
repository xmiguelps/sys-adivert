import React from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import HistoricoModalBase from './HistoricoModalBase'

export type AlvoHistorico =
    | { tipo: 'colaborador'; nome: string; matricula: string }
    | { tipo: 'motivos'; motivos: string[] }

type Props = { alvo: AlvoHistorico; onFechar: () => void }

// Histórico do colaborador (por matrícula) ou dos motivos selecionados (todos os colaboradores)
const BaixarHistoricoModal: React.FC<Props> = ({ alvo, onFechar }) => {
    const porColab = alvo.tipo === 'colaborador'
    return (
        <HistoricoModalBase
            titulo="Baixar histórico"
            icone={<DownloadSimple size={20} />}
            rotuloAmbas="Ambos"
            filtro={porColab ? { matricula: alvo.matricula } : { motivos: alvo.motivos }}
            escopo={porColab ? alvo.nome : alvo.motivos.length > 1 ? 'motivos' : `motivo_${alvo.motivos[0]}`.slice(0, 60)}
            onFechar={onFechar}
        >
            <span className="hist-subtitulo">
                {porColab
                    ? <>Colaborador: <strong>{alvo.nome}</strong> (matrícula {alvo.matricula})</>
                    : <>{alvo.motivos.length} motivo(s) selecionado(s), de todos os colaboradores.</>}
            </span>
        </HistoricoModalBase>
    )
}

export default BaixarHistoricoModal
