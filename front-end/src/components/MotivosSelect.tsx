import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { CaretDown } from '@phosphor-icons/react'

type Props = {
    value: string
    onChange: (v: string) => void
    motivos: string[]
    className?: string
}

function normalizar(s: string) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function MotivosSelect({ value, onChange, motivos, className }: Props) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)

    const filtrados = query.trim()
        ? motivos.filter(m => normalizar(m).includes(normalizar(query)))
        : motivos

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            if (
                containerRef.current && !containerRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) { setOpen(false); setQuery('') }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setQuery('') } }
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
            setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
        }
        recalculate()
        window.addEventListener('resize', recalculate)
        window.addEventListener('scroll', recalculate, true)
        return () => {
            window.removeEventListener('resize', recalculate)
            window.removeEventListener('scroll', recalculate, true)
        }
    }, [open])

    const handleSelect = (m: string) => {
        onChange(m)
        setOpen(false)
        setQuery('')
    }

    const triggerLabel = value || 'Selecione um motivo...'

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div
                ref={containerRef}
                className={`motivos-select ${className ?? ''} ${open ? 'motivos-select--open' : ''}`}
            >
                <button
                    ref={triggerRef}
                    type="button"
                    className="motivos-select__trigger"
                    onClick={() => setOpen(o => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                >
                    <span className={value ? 'motivos-select__value' : 'motivos-select__placeholder'}>
                        {triggerLabel}
                    </span>
                    <span className="motivos-select__arrow"><CaretDown size={12} /></span>
                </button>

                {open && (
                    <div
                        ref={dropdownRef}
                        className="motivos-select__dropdown"
                        role="listbox"
                        style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
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

                        <div className="motivos-select__lista">
                            {!query.trim() && (
                                <div
                                    className="motivos-select__option motivos-select__option--empty"
                                    onClick={() => { onChange(''); setOpen(false); setQuery('') }}
                                    role="option"
                                >
                                    Selecione um motivo...
                                </div>
                            )}
                            {filtrados.length === 0 ? (
                                <div className="motivos-select__option motivos-select__option--empty">
                                    {motivos.length === 0 ? 'Nenhum motivo cadastrado.' : 'Nenhum motivo encontrado.'}
                                </div>
                            ) : filtrados.map(m => (
                                <div
                                    key={m}
                                    className={`motivos-select__option ${m === value ? 'motivos-select__option--selected' : ''}`}
                                    onClick={() => handleSelect(m)}
                                    role="option"
                                    aria-selected={m === value}
                                >
                                    {m}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MotivosSelect
