import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import motivosRaw from '../context'

// Já vem ordenado do context, mas garantimos aqui também
const motivosPadrao = [...motivosRaw].sort((a, b) =>
    a.motivo.localeCompare(b.motivo, 'pt-BR', { sensitivity: 'base' })
).map(m => m.motivo)

type Props = {
    value: string
    onChange: (v: string) => void
    className?: string
}

function MotivosSelect({ value, onChange, className }: Props) {
    const isCustomValue = (v: string) => v !== '' && !motivosPadrao.includes(v)

    const [open, setOpen] = useState(false)
    const [mostrarCustom, setMostrarCustom] = useState(() => isCustomValue(value))
    const [customValue, setCustomValue] = useState(() => isCustomValue(value) ? value : '')
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const skipNextEffect = useRef(false)

    useEffect(() => {
        if (skipNextEffect.current) {
            skipNextEffect.current = false
            return
        }
        const custom = isCustomValue(value)
        setMostrarCustom(custom)
        if (custom) setCustomValue(value)
        else if (!custom && value !== '') setCustomValue('')
    }, [value])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            if (
                containerRef.current && !containerRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

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
        setOpen(false)
        if (m === '__outro__') {
            skipNextEffect.current = true
            setMostrarCustom(true)
            setCustomValue('')
            onChange('')
        } else {
            setMostrarCustom(false)
            setCustomValue('')
            onChange(m)
        }
    }

    const handleCustomChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCustomValue(e.target.value)
        onChange(e.target.value)
    }

    const triggerLabel = mostrarCustom
        ? '✏️ Outro (digitar motivo)...'
        : (value || 'Selecione um motivo...')

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
                    <span className={value && !mostrarCustom ? 'motivos-select__value' : 'motivos-select__placeholder'}>
                        {triggerLabel}
                    </span>
                    <span className="motivos-select__arrow">▾</span>
                </button>

                {open && (
                    <div
                        ref={dropdownRef}
                        className="motivos-select__dropdown"
                        role="listbox"
                        style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
                    >
                        <div
                            className="motivos-select__option motivos-select__option--empty"
                            onClick={() => { onChange(''); setMostrarCustom(false); setCustomValue(''); setOpen(false) }}
                            role="option"
                        >
                            Selecione um motivo...
                        </div>
                        {motivosPadrao.map(m => (
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
                        {/* Opção "Outro" sempre por último */}
                        <div
                            className={`motivos-select__option motivos-select__option--outro ${mostrarCustom ? 'motivos-select__option--selected' : ''}`}
                            onClick={() => handleSelect('__outro__')}
                            role="option"
                            aria-selected={mostrarCustom}
                        >
                            ✏️ Outro (digitar motivo)...
                        </div>
                    </div>
                )}
            </div>

            {mostrarCustom && (
                <textarea
                    className="add-input motivos-custom-textarea"
                    value={customValue}
                    onChange={handleCustomChange}
                    placeholder="Digite o motivo personalizado..."
                    rows={3}
                    autoFocus
                />
            )}
        </div>
    )
}

export default MotivosSelect
