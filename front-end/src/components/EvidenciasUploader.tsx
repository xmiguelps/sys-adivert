import { useRef, useState } from "react";
import { fileParaEvidencia } from "../utils/imagem";
import type { EvidenciaLocal } from "../utils/imagem";

export type EvidenciaExistente = { id: number; url: string; nome?: string };

type Props = {
    // evidencias novas (ainda nao enviadas), controladas pelo pai
    novas: EvidenciaLocal[];
    onChangeNovas: (evs: EvidenciaLocal[]) => void;
    // evidencias ja salvas (modo edicao) — opcional
    existentes?: EvidenciaExistente[];
    onRemoverExistente?: (id: number) => void;
    label?: string;
};

function EvidenciasUploader({
    novas,
    onChangeNovas,
    existentes = [],
    onRemoverExistente,
    label = "Evidências (opcional):",
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [processando, setProcessando] = useState(false);

    const adicionar = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setProcessando(true);
        try {
            const resultados: EvidenciaLocal[] = [];
            for (const f of Array.from(files)) {
                const ev = await fileParaEvidencia(f);
                if (ev) resultados.push(ev);
            }
            if (resultados.length > 0) onChangeNovas([...novas, ...resultados]);
        } finally {
            setProcessando(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const removerNova = (idx: number) => onChangeNovas(novas.filter((_, i) => i !== idx));

    const total = existentes.length + novas.length;

    return (
        <div className="evid-uploader">
            <div className="evid-uploader-header">
                <label className="add-label">{label}</label>
                <button
                    type="button"
                    className="evid-add-btn btn"
                    onClick={() => inputRef.current?.click()}
                    disabled={processando}
                    title="Anexar imagens (JPG, PNG ou WEBP)"
                >
                    {processando ? "⏳ Processando..." : "📎 Anexar imagens"}
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    style={{ display: "none" }}
                    onChange={e => adicionar(e.target.files)}
                />
            </div>

            {total > 0 && (
                <div className="evid-grid">
                    {existentes.map(ex => (
                        <div key={`ex-${ex.id}`} className="evid-thumb">
                            <img src={ex.url} alt={ex.nome ?? "evidência"} />
                            {onRemoverExistente && (
                                <button
                                    type="button"
                                    className="evid-thumb-remover"
                                    title="Remover"
                                    onClick={() => onRemoverExistente(ex.id)}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                    {novas.map((ev, idx) => (
                        <div key={`nova-${idx}`} className="evid-thumb">
                            <img src={ev.previewUrl} alt={ev.nomeArquivo ?? "evidência"} />
                            <button
                                type="button"
                                className="evid-thumb-remover"
                                title="Remover"
                                onClick={() => removerNova(idx)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default EvidenciasUploader;
