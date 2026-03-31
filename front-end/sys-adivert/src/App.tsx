import { useEffect, useState } from 'react'
import Tabela from './components/Tabela'
import Add from './components/Add'

function App() {

    const [addAberto, setAddAberto] = useState(false)
    const [adiverts, setAdiverts] = useState<any[]>([])
    const [data, setData] = useState<any[]>([])

    useEffect(() => {
        const getAdiverts = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/Adiverts`, 
                    {
                        method: "GET",
                        headers: {
                            "Accept": "application/son"
                        }
                    }
                );
                const data = await response.json();
                setAdiverts(data)
            } catch (error) {
                console.error("Falha ao puxar os dados ", error)
            }
        }
        getAdiverts();
    }, [])

    return (
        <>
        {addAberto && (
            <div className='overlay'>
                <div className='caixa'>
                    <Add
                    setAddAberto={setAddAberto}
                    setData={setData}
                    data={data}
                    />
                </div>
            </div>
        )}
        <div className='d-flex box-site'>
            <div className='d-flex box-body flex-column'>
            <div className='d-flex'>
                <img className='logo' src="/logo.png" alt="logo-empresa" />
                <h1>Sistema de Adivertencias</h1>
            </div>
            <div className='box-search'>
                <input type="text" className='search-input' name="search" id="search"/> <button className='search-buttom'><img className='icon' src="/search.png" alt="botão de pesquisa"/></button>
            </div>
            <div className='d-flex'>
                <div className='d-flex box-main'>
                    <div className='box-adiverts'>
                    <table className='adivert'>
                        <thead>
                            <tr>
                                <th className='adivert-column' id='data'>Data</th>
                                <th className='adivert-column' id='matricula'>Matricula</th>
                                <th className='adivert-column' id='nome'>Nome</th>
                                <th className='adivert-column' id='tipo'>Tipo</th>
                                <th className='adivert-column' id='motivo'>Motivo</th>
                                <th className='adivert-column' id='actions'>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adiverts.map(adivert => (
                                    <Tabela
                                    key={adivert.id}
                                    data={adivert.data}
                                    matricula={adivert.matricula}
                                    nome={adivert.nome}
                                    tipo={adivert.tipo}
                                    motivo={adivert.motivo}
                                    id={adivert.id}
                                    />
                                ))}
                        </tbody>
                    </table>
                    </div>
                </div>
                <div className='d-flex box-menu flex-column'>
                <button onClick={() => setAddAberto(true)}><img className='icon buttons-menu' src="/plus.png" alt="botão de adicionar" /></button>
                <button><img className='icon buttons-menu' src="/download.png" alt="botão de download" /></button>
                </div>
            </div>
            </div>
        </div>
        </>
    )

}
export default App