import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'

type Colab = { id: number; nome: string; matricula: string }

type Props = {
    nome: string
    onNomeChange: (nome: string) => void
    onColabSelect: (nome: string, matricula: string) => void
    colabs: Colab[]
    placeholder?: string
    className?: string
    inputClassName?: string
}

function normalizar(s: string) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function ColabSelect({ nome, onNomeChange, onColabSelect, colabs, placeholder, className, inputClassName }: Props) {
    const [open, setOpen] = useState(false)
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const filtrados = nome.trim()
        ? colabs.filter(c => normalizar(c.nome).includes(normalizar(nome)))
        : colabs

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
        if (!open || !inputRef.current) return
        const recalculate = () => {
            if (!inputRef.current) return
            const rect = inputRef.current.getBoundingClientRect()
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

    const handleSelect = (colab: Colab) => {
        setOpen(false)
        onColabSelect(colab.nome, colab.matricula)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onNomeChange(e.target.value)
        setOpen(true)
    }

    const handleFocus = () => setOpen(true)

    return (
        <div ref={containerRef} className={`colab-select ${className ?? ''}`}>
            <input
                ref={inputRef}
                type="text"
                className={inputClassName ?? `add-input colab-select__input`}
                value={nome}
                onChange={handleChange}
                onFocus={handleFocus}
                placeholder={placeholder ?? 'Digite o nome do colaborador'}
                autoComplete="off"
            />

            {open && (
                <div
                    ref={dropdownRef}
                    className="colab-select__dropdown"
                    role="listbox"
                    style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
                >
                    {filtrados.length === 0 ? (
                        <div className="colab-select__option colab-select__option--vazio">
                            Nenhum colaborador encontrado
                        </div>
                    ) : (
                        filtrados.map(c => (
                            <div
                                key={c.id}
                                className={`colab-select__option ${c.nome === nome ? 'colab-select__option--selected' : ''}`}
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => handleSelect(c)}
                                role="option"
                                aria-selected={c.nome === nome}
                            >
                                <span className="colab-select__option-nome">{c.nome}</span>
                                <span className="colab-select__option-matricula">{c.matricula}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default ColabSelect
