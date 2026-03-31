import type React from "react"
import motivos from "../context"
import { useState } from "react";

type AddProps = {
    setAddAberto: React.Dispatch<React.SetStateAction<boolean>>;
    setData: React.Dispatch<React.SetStateAction<any[]>>;
    data: any[];
}

function Add({ setAddAberto, setData, data }: AddProps) {

    const [colaborador, setColaborador] = useState("");
    const [matricula, setMatricula] = useState("");
    const [data_input, setDataInput] = useState(new Date().toISOString().split('T')[0]);
    const [tipo, setTipo] = useState("");
    const [motivo, setMotivo] = useState("");
    const [count, setCount] = useState<number>(1);

    const criarAdiverts = () => {
        setData(prev => [...prev, {
            colaborador, matricula, data: data_input, tipo, motivo
        }])
    }

    const salvarData = () => {
        setData(prev => [...prev, {
            colaborador, matricula, data: data_input, tipo, motivo
        }]);

        setColaborador("");
        setMatricula("");
        setDataInput(new Date().toISOString().split('T')[0]);
        setTipo("");
        setMotivo("");
        setCount(count + 1);
    }

    const voltar = () => {
        const anterior = data[count - 2]; // pega o registro anterior
        setColaborador(anterior.colaborador);
        setMatricula(anterior.matricula);
        setDataInput(anterior.data);
        setTipo(anterior.tipo);
        setMotivo(anterior.motivo);
        setCount(count - 1);
    }

    return (
        <>
            <button onClick={() => setAddAberto(false)}>
                <img className='icon' src="close.png" alt="botão de fechar" />
            </button>
            <p>{count}° Advertência:</p>

            {count > 1 && (
                <button onClick={voltar}>Voltar</button>
            )}

            <div>
                <label>Colaborador:</label>
                <input type="text" value={colaborador} onChange={(e) => setColaborador(e.target.value)} />
            </div>
            <div>
                <label>Matricula:</label>
                <input type="text" value={matricula} onChange={(e) => setMatricula(e.target.value)} />
                <label>Data:</label>
                <input type="date" value={data_input} onChange={(e) => setDataInput(e.target.value)} />
            </div>
            <div>
                <label>Tipo:</label>
                <input type="text" value={tipo} onChange={(e) => setTipo(e.target.value)} />
            </div>
            <div>
                <label>Motivo:</label>
                <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                    {motivos.map(m => (
                        <option key={m.motivo} value={m.motivo}>{m.motivo}</option>
                    ))}
                </select>
            </div>

            <button onClick={salvarData}>Fazer mais advertências</button>
            {!data[count] && (
                <button>Criar adivertencias</button>
            )}
        </>
    )
}

export default Add