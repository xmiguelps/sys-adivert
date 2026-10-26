import { useState, useEffect } from 'react'
import { Warning, X } from '@phosphor-icons/react'

export type AvisoSuspensao = { matricula: string; nome: string; total: number }

type Item = AvisoSuspensao & { id: number; exiting: boolean }

let _add: ((aviso: AvisoSuspensao) => void) | null = null

// Emissor global (mesmo padrão do showToast): o Add desmonta ao salvar, então
// só repassa as contagens; o container fica no App.
export function notificarSuspensao(aviso: AvisoSuspensao) {
    _add?.(aviso)
}

const SAIDA_MS = 300

type Props = {
    onAplicar: (matricula: string, nome: string) => void
}

export function NotificacaoContainer({ onAplicar }: Props) {
    const [itens, setItens] = useState<Item[]>([])

    useEffect(() => {
        _add = aviso => {
            const id = Date.now() + Math.random()
            // Um aviso por colaborador: um novo substitui o anterior
            setItens(prev => [
                ...prev.filter(i => i.matricula !== aviso.matricula),
                { ...aviso, id, exiting: false },
            ])
        }
        return () => { _add = null }
    }, [])

    const fechar = (id: number) => {
        setItens(prev => prev.map(i => i.id === id ? { ...i, exiting: true } : i))
        setTimeout(() => setItens(prev => prev.filter(i => i.id !== id)), SAIDA_MS)
    }

    if (itens.length === 0) return null

    return (
        <div className="notif-container">
            {itens.map(i => (
                <div
                    key={i.id}
                    className={`notif ${i.exiting ? 'notif--exit' : 'notif--enter'}`}
                    role="alert"
                >
                    <button className="notif-fechar" onClick={() => fechar(i.id)} title="Fechar">
                        <X size={14} />
                    </button>
                    <div className="notif-corpo">
                        <span className="notif-icone"><Warning size={20} weight="fill" /></span>
                        <p className="notif-texto">
                            Esta já é a <strong>{i.total}ª advertência</strong> de{' '}
                            <strong>{i.nome}</strong> (mat. {i.matricula}). Deseja aplicar uma
                            suspensão em vez de uma nova advertência?
                        </p>
                    </div>
                    <div className="notif-acoes">
                        <button className="btn cancel-btn" onClick={() => fechar(i.id)}>
                            Agora não
                        </button>
                        <button
                            className="btn add-btn-confirm"
                            onClick={() => { onAplicar(i.matricula, i.nome); fechar(i.id) }}
                        >
                            Aplicar suspensão
                        </button>
                    </div>
                    {/* A barra anda da esquerda para a direita e, ao terminar, fecha o aviso; no hover a animação pausa */}
                    <div className="notif-barra">
                        <span
                            className="notif-barra__fill"
                            onAnimationEnd={() => { if (!i.exiting) fechar(i.id) }}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}
