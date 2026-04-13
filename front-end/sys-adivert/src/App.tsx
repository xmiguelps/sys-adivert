import { useEffect, useState } from 'react'
import Tabela from './components/Tabela'
import Add from './components/Add'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function App() {

    const [nome, setNome] = useState<string>('')
    const [addAberto, setAddAberto] = useState<boolean>(false)
    const [adiverts, setAdiverts] = useState<any[]>([])
    const [data, setData] = useState<any[]>([])

    const downloadPDF = () => {
        const doc = new jsPDF()

        doc.text('Sistema de Advertências', 14, 16)

        autoTable(doc, {
            startY: 25,
            head: [['Data', 'Matrícula', 'Nome', 'Tipo', 'Motivo']],
            body: adiverts.map(a => [
                new Date(a.data).toLocaleDateString('pt-BR'),
                a.matricula,
                a.nome,
                a.tipo,
                a.motivo
            ]),
        })

        doc.save('advertencias.pdf')
    }

    const getAdiverts = async () => {
        if (nome === '') {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/Adiverts`, 
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );
            if (!response.ok) {
                throw new Error(`Erro: ${response.status}`);
            } else {
                const data = await response.json();
                setAdiverts(data);
            }
        } else {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/Adiverts?nome=${nome}`, 
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );
            if (!response.ok) {
                throw new Error(`Erro: ${response.status}`);
            } else {
                const data = await response.json();
                setAdiverts(data);
            }
        } 
    }

    useEffect(() => {
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
                    setAdiverts={setAdiverts}
                    getAdiverts={getAdiverts}
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
            <form className='box-search' onSubmit={e => {e.preventDefault(); getAdiverts();}}>
                <input type="text" className='search-input' name="search" id="search" onChange={e => {setNome(e.target.value)}} /> 
                <button className='search-buttom'><img className='icon' src="/search.png" alt="botão de pesquisa"/></button>
            </form>
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
                            {adiverts.map(adivert => (
                                <Tabela
                                key            = {adivert.id}
                                data           = {adivert.data}
                                matricula      = {adivert.matricula}
                                nome           = {adivert.nome}
                                tipo           = {adivert.tipo}
                                motivo         = {adivert.motivo}
                                id             = {adivert.id}
                                getAdiverts    = {getAdiverts}
                                />
                            ))}
                    </table>
                    </div>
                </div>
                <div className='d-flex box-menu flex-column'>
                <button onClick={() => setAddAberto(true)}><img className='icon buttons-menu' src="/plus.png" alt="botão de adicionar" /></button>
                <button onClick={downloadPDF} ><img className='icon buttons-menu' src="/download.png" alt="botão de download" /></button>
                </div>
            </div>
            </div>
        </div>
        </>
    )

}
export default App