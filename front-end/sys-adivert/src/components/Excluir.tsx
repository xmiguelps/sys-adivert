import React, { useState } from "react"

type ExcluirProps = {
    setExcluirView: React.Dispatch<React.SetStateAction<boolean>>
    getAdiverts: () => void;
    id: number
}

function Excluir( { setExcluirView, id, getAdiverts } : ExcluirProps) {
    const [excluindo, setExcluindo] = useState(false);

    const ExcluirAdivert = async () => {
            setExcluindo(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Adiverts/${id}`, {
                    method: "DELETE"
                });
                if (!response.ok) {
                    throw new Error(`Erro: ${response.status}`)
                } else {
                    await getAdiverts();
                    setExcluirView(false);
                }
            } finally {
                setExcluindo(false);
            }
    }

    return (
        <div className="d-flex justify-content-center align-itens-center h-100">
            <div className="d-flex flex-column justify-content-center h-75">
                <h5>Tem certeza que quer <strong>apagar</strong> essa adivertencia?</h5>
                <div className="d-flex justify-content-center">
                    <button className="cancel-btn btn" onClick={() => setExcluirView(false)} title="Fechar">
                        Cancelar
                    </button>
                    <button className="btn excluir-btn" onClick={ExcluirAdivert} disabled={excluindo}>
                        {excluindo ? "Excluindo..." : "Excluir"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Excluir