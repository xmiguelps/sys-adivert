import { useState, useRef, useLayoutEffect, useEffect } from "react";

const TIPOS = ["Escrita", "Verbal"];

type TipoSelectProps = {
    value: string;
    onChange: (value: string) => void;
    className?: string;
};

function TipoSelect({ value, onChange, className }: TipoSelectProps) {
    const [open, setOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                containerRef.current && !containerRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    useLayoutEffect(() => {
        if (!open || !triggerRef.current) return;
        const recalculate = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        };
        recalculate();
        window.addEventListener("resize", recalculate);
        window.addEventListener("scroll", recalculate, true);
        return () => {
            window.removeEventListener("resize", recalculate);
            window.removeEventListener("scroll", recalculate, true);
        };
    }, [open]);

    return (
        <div
            ref={containerRef}
            className={`tipo-select ${className ?? ""} ${open ? "tipo-select--open" : ""}`}
        >
            <button
                ref={triggerRef}
                type="button"
                className="tipo-select__trigger"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="tipo-select__value">{value || "Selecione..."}</span>
                <span className="tipo-select__arrow">▾</span>
            </button>

            {open && (
                <div
                    ref={dropdownRef}
                    className="tipo-select__dropdown"
                    role="listbox"
                    style={{ top: dropdownPos.top, left: dropdownPos.left, minWidth: dropdownPos.width }}
                >
                    {TIPOS.map(t => (
                        <div
                            key={t}
                            className={`tipo-select__option ${t === value ? "tipo-select__option--selected" : ""}`}
                            onClick={() => { onChange(t); setOpen(false); }}
                            role="option"
                            aria-selected={t === value}
                        >
                            {t}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TipoSelect;
