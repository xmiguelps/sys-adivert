import React from "react"

type ExcluirProps = {
    setExcluirView: React.Dispatch<React.SetStateAction<boolean>>
    id: number
    setAdiverts: React.Dispatch<React.SetStateAction<any[]>>;
    getAdiverts: () => void;
}

function Excluir( { setExcluirView, id, getAdiverts } : ExcluirProps) {

    const ExcluirAdivert = async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Adiverts/${id}`, {
                method: "DELETE"
            });
            if (!response.ok) {
                throw new Error(`Erro: ${response.status}`)
            } else {
                await getAdiverts();
                setExcluirView(false);
            }
    }

    return (
        <div>
            <p>Deseja apagar essa adivertencia?</p>
            <div className="d-flex">
                <button onClick={() => setExcluirView(false)} title="Fechar">
                    Cancelar
                </button>
                <button onClick={ExcluirAdivert}>
                    Excluir
                </button>
            </div>
        </div>
    )
}

export default Excluir