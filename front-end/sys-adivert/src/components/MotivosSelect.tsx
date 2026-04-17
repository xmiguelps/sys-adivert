import { useState, useRef, useEffect } from 'react'
import motivos from '../context'

type Props = {
    value: string
    onChange: (v: string) => void
    className?: string
}

function MotivosSelect({ value, onChange, className }: Props) {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

    return (
        <div
            ref={containerRef}
            className={`motivos-select ${className ?? ''} ${open ? 'motivos-select--open' : ''}`}
        >
            <button
                type="button"
                className="motivos-select__trigger"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={value ? 'motivos-select__value' : 'motivos-select__placeholder'}>
                    {value || 'Selecione um motivo...'}
                </span>
                <span className="motivos-select__arrow">▾</span>
            </button>

            {open && (
                <div className="motivos-select__dropdown" role="listbox">
                    <div
                        className="motivos-select__option motivos-select__option--empty"
                        onClick={() => { onChange(''); setOpen(false) }}
                        role="option"
                    >
                        Selecione um motivo...
                    </div>
                    {motivos.map(m => (
                        <div
                            key={m.motivo}
                            className={`motivos-select__option ${m.motivo === value ? 'motivos-select__option--selected' : ''}`}
                            onClick={() => { onChange(m.motivo); setOpen(false) }}
                            role="option"
                            aria-selected={m.motivo === value}
                        >
                            {m.motivo}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MotivosSelect
