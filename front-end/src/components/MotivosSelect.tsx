import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { CaretDown, Check, X } from '@phosphor-icons/react'

type BaseProps = {
    motivos: string[]
    className?: string
}

/** Seleção de um único motivo (Add / Update). */
type SingleProps = BaseProps & {
    multiple?: false
    value: string
    onChange: (v: string) => void
}

/** Seleção de vários motivos (Advertências por Motivo). */
type MultipleProps = BaseProps & {
    multiple: true
    values: string[]
    onChange: (v: string[]) => void
}

type Props = SingleProps | MultipleProps

type DropdownPos = {
    top?: number
    bottom?: number
    left: number
    width: number
    maxHeight: number
}

function normalizar(s: string) {
    // U+0300–U+036F = marcas diacríticas separadas pelo NFD (busca sem acento)
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function MotivosSelect(props: Props) {
    const { motivos, className } = props
    const multiplo = props.multiple === true
    const selecionados = props.multiple === true ? props.values : (props.value ? [props.value] : [])

    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [dropdownPos, setDropdownPos] = useState<DropdownPos>({ left: 0, width: 0, maxHeight: 300 })
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)

    const filtrados = query.trim()
        ? motivos.filter(m => normalizar(m).includes(normalizar(query)))
        : motivos

    const fechar = () => { setOpen(false); setQuery('') }

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            if (
                containerRef.current && !containerRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) fechar()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

    // Foca o campo de busca ao abrir
    useEffect(() => {
        if (open) searchRef.current?.focus()
    }, [open])

    useLayoutEffect(() => {
        if (!open || !triggerRef.current) return
        const recalculate = () => {
            if (!triggerRef.current) return
            const rect = triggerRef.current.getBoundingClientRect()
            const margem = 12
            const espacoAbaixo = window.innerHeight - rect.bottom - margem
            const espacoAcima = rect.top - margem
            // Em modais altos o gatilho pode ficar perto do rodapé da tela: nesse
            // caso a lista abre para cima, em vez de ficar cortada pela viewport.
            const paraCima = espacoAbaixo < 220 && espacoAcima > espacoAbaixo
            const disponivel = Math.max(160, paraCima ? espacoAcima : espacoAbaixo)
            setDropdownPos({
                top: paraCima ? undefined : rect.bottom + 4,
                bottom: paraCima ? window.innerHeight - rect.top + 4 : undefined,
                left: rect.left,
                width: rect.width,
                maxHeight: Math.min(300, disponivel),
            })
        }
        recalculate()
        window.addEventListener('resize', recalculate)
        window.addEventListener('scroll', recalculate, true)
        return () => {
            window.removeEventListener('resize', recalculate)
            window.removeEventListener('scroll', recalculate, true)
        }
        // selecionados.length entra aqui porque marcar/desmarcar um motivo
        // adiciona ou remove chips e pode deslocar o gatilho alguns pixels.
    }, [open, selecionados.length])

    // No modo múltiplo a lista continua aberta a cada marcação, para permitir
    // escolher vários motivos sem reabrir o dropdown a cada clique.
    const handleSelect = (m: string) => {
        if (props.multiple === true) {
            const atuais = props.values
            props.onChange(atuais.includes(m) ? atuais.filter(x => x !== m) : [...atuais, m])
            return
        }
        props.onChange(m)
        fechar()
    }

    const remover = (m: string) => {
        if (props.multiple !== true) return
        props.onChange(props.values.filter(x => x !== m))
    }

    const selecionarFiltrados = () => {
        if (props.multiple !== true) return
        const novos = filtrados.filter(m => !props.values.includes(m))
        props.onChange([...props.values, ...novos])
    }

    const limpar = () => {
        if (props.multiple === true) props.onChange([])
        else props.onChange('')
    }

    const todosFiltradosMarcados =
        filtrados.length > 0 && filtrados.every(m => selecionados.includes(m))

    const triggerLabel = multiplo
        ? (selecionados.length === 0
            ? 'Selecione um ou mais motivos...'
            : selecionados.length === 1
                ? selecionados[0]
                : `${selecionados.length} motivos selecionados`)
        : (selecionados[0] || 'Selecione um motivo...')

    const temValor = selecionados.length > 0

    return (
        <div className="motivos-select-wrap">
            <div
                ref={containerRef}
                className={`motivos-select ${className ?? ''} ${open ? 'motivos-select--open' : ''}`}
            >
                <button
                    ref={triggerRef}
                    type="button"
                    className="motivos-select__trigger"
                    onClick={() => (open ? fechar() : setOpen(true))}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                >
                    <span className={temValor ? 'motivos-select__value' : 'motivos-select__placeholder'}>
                        {triggerLabel}
                    </span>
                    <span className="motivos-select__arrow"><CaretDown size={12} /></span>
                </button>

                {open && (
                    <div
                        ref={dropdownRef}
                        className="motivos-select__dropdown"
                        role="listbox"
                        aria-multiselectable={multiplo || undefined}
                        style={{
                            top: dropdownPos.top,
                            bottom: dropdownPos.bottom,
                            left: dropdownPos.left,
                            width: dropdownPos.width,
                            maxHeight: dropdownPos.maxHeight,
                        }}
                    >
                        <div className="motivos-select__search-wrap">
                            <input
                                ref={searchRef}
                                type="text"
                                className="motivos-select__search"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Pesquisar motivo..."
                                autoComplete="off"
                            />
                        </div>

                        {multiplo && (
                            <div className="motivos-select__acoes">
                                <button
                                    type="button"
                                    className="motivos-select__acao"
                                    onClick={selecionarFiltrados}
                                    disabled={filtrados.length === 0 || todosFiltradosMarcados}
                                >
                                    Selecionar {query.trim() ? 'encontrados' : 'todos'} ({filtrados.length})
                                </button>
                                <button
                                    type="button"
                                    className="motivos-select__acao"
                                    onClick={limpar}
                                    disabled={selecionados.length === 0}
                                >
                                    Limpar seleção
                                </button>
                            </div>
                        )}

                        <div className="motivos-select__lista">
                            {!multiplo && !query.trim() && (
                                <div
                                    className="motivos-select__option motivos-select__option--empty"
                                    onClick={() => { limpar(); fechar() }}
                                    role="option"
                                    aria-selected={!temValor}
                                >
                                    Selecione um motivo...
                                </div>
                            )}
                            {filtrados.length === 0 ? (
                                <div className="motivos-select__option motivos-select__option--empty">
                                    {motivos.length === 0 ? 'Nenhum motivo cadastrado.' : 'Nenhum motivo encontrado.'}
                                </div>
                            ) : filtrados.map(m => {
                                const marcado = selecionados.includes(m)
                                return (
                                    <div
                                        key={m}
                                        className={`motivos-select__option ${marcado ? 'motivos-select__option--selected' : ''} ${multiplo ? 'motivos-select__option--check' : ''}`}
                                        onClick={() => handleSelect(m)}
                                        role="option"
                                        aria-selected={marcado}
                                    >
                                        {multiplo && (
                                            <span className={`motivos-select__box ${marcado ? 'motivos-select__box--on' : ''}`}>
                                                {marcado && <Check size={11} weight="bold" />}
                                            </span>
                                        )}
                                        <span className="motivos-select__option-texto">{m}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {multiplo && selecionados.length > 0 && (
                <div className="motivos-chips">
                    {selecionados.map(m => (
                        <span key={m} className="motivos-chip" title={m}>
                            <span className="motivos-chip__texto">{m}</span>
                            <button
                                type="button"
                                className="motivos-chip__remover"
                                onClick={() => remover(m)}
                                title="Remover este motivo"
                                aria-label={`Remover ${m}`}
                            >
                                <X size={11} weight="bold" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MotivosSelect
