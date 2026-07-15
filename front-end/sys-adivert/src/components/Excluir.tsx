import React, { useState } from "react"
import { showToast } from "./Toast"

type ExcluirProps = {
    setExcluirView: React.Dispatch<React.SetStateAction<boolean>>
    getAdiverts: () => void;
    ids: number[]
}

function Excluir({ setExcluirView, ids, getAdiverts }: ExcluirProps) {
    const [excluindo, setExcluindo] = useState(false);
    const qtd = ids.length;

    const ExcluirAdivert = async () => {
        setExcluindo(true);
        try {
            const resultados = await Promise.allSettled(
                ids.map(id =>
                    fetch(`${import.meta.env.VITE_API_URL}/api/Adiverts/${id}`, { method: "DELETE" })
                )
            );
            const sucessos = resultados.filter(r => r.status === "fulfilled" && r.value.ok).length;
            const falhas = ids.length - sucessos;

            // Atualiza a lista; no App a seleção é podada automaticamente
            // (ids que deixaram de existir saem da seleção; os que falharam permanecem).
            await getAdiverts();

            if (falhas === 0) {
                setExcluirView(false);
                showToast(
                    sucessos === 1
                        ? "Advertência excluída com sucesso!"
                        : `${sucessos} advertências excluídas com sucesso!`,
                    "success"
                );
            } else if (sucessos === 0) {
                showToast("Não foi possível excluir. Tente novamente.", "error");
            } else {
                showToast(
                    `${sucessos} excluída(s), ${falhas} não excluída(s). Tente as restantes novamente.`,
                    "error"
                );
            }
        } catch {
            try { await getAdiverts(); } catch { /* ignora */ }
            showToast("Erro ao excluir advertência(s).", "error");
        } finally {
            setExcluindo(false);
        }
    }

    return (
        <div className="d-flex justify-content-center align-itens-center h-100">
            <div className="d-flex flex-column justify-content-center h-75">
                <h5>
                    Tem certeza que quer <strong>apagar</strong>{" "}
                    {qtd === 1
                        ? "essa advertência"
                        : <>essas <strong>{qtd}</strong> advertências</>}?
                </h5>
                <div className="d-flex justify-content-center modal-confirm-acoes">
                    <button className="cancel-btn btn" onClick={() => setExcluirView(false)} title="Fechar">
                        Cancelar
                    </button>
                    <button className="btn excluir-btn" onClick={ExcluirAdivert} disabled={excluindo}>
                        {excluindo
                            ? "Excluindo..."
                            : (qtd === 1 ? "Excluir" : `Excluir ${qtd}`)}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Excluir
