import React, { useState, useEffect, useRef } from "react";

const TIPOS_PADRAO = ["Escrita", "Verbal"];

type TipoSelectProps = {
    value: string;
    onChange: (value: string) => void;
    className?: string;
};

function TipoSelect({ value, onChange, className }: TipoSelectProps) {
    const isCustom = value !== "" && !TIPOS_PADRAO.includes(value);
    const [mostrarCustom, setMostrarCustom] = useState(isCustom);
    const [customValue, setCustomValue] = useState(isCustom ? value : "");
    const skipNextEffect = useRef(false);

    useEffect(() => {
        if (skipNextEffect.current) {
            skipNextEffect.current = false;
            return;
        }
        const custom = value !== "" && !TIPOS_PADRAO.includes(value);
        setMostrarCustom(custom);
        if (custom) setCustomValue(value);
    }, [value]);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = e.target.value;
        if (selected === "__outro__") {
            skipNextEffect.current = true;
            setMostrarCustom(true);
            setCustomValue("");
            onChange("");
        } else {
            setMostrarCustom(false);
            setCustomValue("");
            onChange(selected);
        }
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomValue(e.target.value);
        onChange(e.target.value);
    };

    const selectValue = mostrarCustom ? "__outro__" : value;

    return (
        <div className="tipo-select-wrapper" style={{ display: "flex", gap: "8px", flex: 1 }}>
            <select
                className={`add-input add-input--tipo ${className ?? ""}`}
                value={selectValue}
                onChange={handleSelectChange}
                required
            >
                {TIPOS_PADRAO.map(t => (
                    <option key={t} value={t}>{t}</option>
                ))}
                <option value="__outro__">Outro...</option>
            </select>

            {mostrarCustom && (
                <input
                    className="add-input add-input--tipo"
                    value={customValue}
                    onChange={handleCustomChange}
                    placeholder="Digite o tipo..."
                    autoFocus
                    required
                />
            )}
        </div>
    );
}

export default TipoSelect;
