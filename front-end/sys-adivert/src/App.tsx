import { useEffect, useState } from 'react'
import Tabela from './components/Tabela'
import Add from './components/Add'
import Colaboradores from './components/Colaboradores'
import Excluir from './components/Excluir'
import Update from './components/Update'
import { ToastContainer, showToast } from './components/Toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function App() {

    const [nome, setNome] = useState<string>('')
    const [addAberto, setAddAberto] = useState<boolean>(false)
    const [colabAberto, setColabAberto] = useState<boolean>(false)
    const [adiverts, setAdiverts] = useState<any[]>([])
    const [data, setData] = useState<any[]>([])
    const [carregando, setCarregando] = useState<boolean>(false)
    const [baixando, setBaixando] = useState<boolean>(false)

    // Seleção de linha
    const [selectedId, setSelectedId] = useState<number | null>(null)

    // Modais de ação (movidos de Tabela para cá)
    const [excluirView, setExcluirView] = useState<boolean>(false)
    const [updateView, setUpdateView] = useState<boolean>(false)
    const [inspecionarView, setInspecionarView] = useState<boolean>(false)

    const selectedAdivert = adiverts.find(a => a.id === selectedId) ?? null

    const downloadPDF = () => {
        setBaixando(true);
        try {
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
        } finally {
            setBaixando(false);
        }
    }

    const downloadPDFLinha = (adivert: any) => {
        const doc = new jsPDF()
        doc.text('Sistema de Advertências', 14, 16)
        autoTable(doc, {
            startY: 25,
            head: [['Data', 'Matrícula', 'Nome', 'Tipo', 'Motivo']],
            body: [[
                new Date(adivert.data).toLocaleDateString('pt-BR'),
                adivert.matricula,
                adivert.nome,
                adivert.tipo,
                adivert.motivo
            ]],
        })
        doc.save('advertencia.pdf')
        showToast('PDF gerado com sucesso!', 'success')
    }

    const getAdiverts = async () => {
        setCarregando(true);
        try {
            if (nome === '') {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/Adiverts`,
                    {
                        method: "GET",
                        headers: { "Accept": "application/json" }
                    }
                );
                if (!response.ok) throw new Error(`Erro: ${response.status}`);
                const data = await response.json();
                setAdiverts(data);
            } else {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/Adiverts?nome=${nome}`,
                    {
                        method: "GET",
                        headers: { "Accept": "application/json" }
                    }
                );
                if (!response.ok) throw new Error(`Erro: ${response.status}`);
                const data = await response.json();
                setAdiverts(data);
            }
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        getAdiverts();
    }, [])

    const dataFormatada = (data: string) => new Date(data).toLocaleDateString('pt-BR')

    return (
        <>
            {/* ── Toast Notifications ── */}
            <ToastContainer />

            {/* ── Overlay: Nova Advertência ── */}
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

            {/* ── Overlay: Gerenciar Colaboradores ── */}
            {colabAberto && (
                <div className='overlay'>
                    <div className='caixa caixa--colab'>
                        <Colaboradores setColabAberto={setColabAberto} />
                    </div>
                </div>
            )}

            {/* ── Overlay: Excluir ── */}
            {excluirView && selectedAdivert && (
                <div className='overlay'>
                    <div className='caixa'>
                        <Excluir
                            getAdiverts={getAdiverts}
                            setExcluirView={setExcluirView}
                            id={selectedAdivert.id}
                            setSelectedId={setSelectedId}
                        />
                    </div>
                </div>
            )}

            {/* ── Overlay: Update ── */}
            {updateView && selectedAdivert && (
                <div className="overlay">
                    <div className="caixa">
                        <Update
                            getAdiverts={getAdiverts}
                            setUpdateView={setUpdateView}
                            id={selectedAdivert.id}
                            matricula={selectedAdivert.matricula}
                            nome={selectedAdivert.nome}
                            tipo={selectedAdivert.tipo}
                            motivo={selectedAdivert.motivo}
                            data={selectedAdivert.data}
                        />
                    </div>
                </div>
            )}

            {/* ── Overlay: Inspecionar ── */}
            {inspecionarView && selectedAdivert && (
                <div className="overlay" onClick={() => setInspecionarView(false)}>
                    <div className="caixa inspecionar-caixa" onClick={e => e.stopPropagation()}>
                        <div className="inspecionar-header">
                            <h2 className="inspecionar-titulo">🔍 Detalhes da Advertência</h2>
                            <button
                                className="add-btn-fechar"
                                onClick={() => setInspecionarView(false)}
                                title="Fechar"
                            >
                                <img className="icon" src="close.png" alt="fechar" />
                            </button>
                        </div>

                        <div className="inspecionar-body">
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">📅 Data</span>
                                <span className="inspecionar-valor">{dataFormatada(selectedAdivert.data)}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">👤 Nome do Colaborador</span>
                                <span className="inspecionar-valor">{selectedAdivert.nome}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">🪪 Matrícula</span>
                                <span className="inspecionar-valor">{selectedAdivert.matricula}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">📝 Tipo</span>
                                <span className={`inspecionar-badge ${selectedAdivert.tipo === 'Escrita' ? 'badge-escrita' : 'badge-verbal'}`}>
                                    {selectedAdivert.tipo}
                                </span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo inspecionar-campo--coluna">
                                <span className="inspecionar-label">⚠️ Motivo</span>
                                <span className="inspecionar-motivo">{selectedAdivert.motivo}</span>
                            </div>
                        </div>

                        <div className="inspecionar-rodape">
                            <button
                                className="btn add-btn-confirm"
                                onClick={() => { setInspecionarView(false); setUpdateView(true); }}
                                title="Editar esta advertência"
                            >
                                ✏️ Editar
                            </button>
                            <button
                                className="btn cancel-btn"
                                onClick={() => setInspecionarView(false)}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className='d-flex box-site'>
                <div className='d-flex box-body flex-column'>
                    <div className='d-flex'>
                        <img className='logo' src="/danlex.png" alt="logo-empresa" />
                        <h1>Sistema de Adivertencias</h1>
                    </div>
                    <form className='box-search' onSubmit={e => { e.preventDefault(); getAdiverts(); }}>
                        <input type="text" className='search-input' name="search" id="search" onChange={e => { setNome(e.target.value) }} />
                        <button className='search-buttom' disabled={carregando}>
                            {carregando
                                ? <span className="search-loading">...</span>
                                : <img className='icon' src="/search.png" alt="botão de pesquisa" />
                            }
                        </button>
                    </form>
                    <div className='d-flex box-content'>
                        <div className='d-flex box-main'>
                            <div className='box-adiverts-wrapper'>
                                <div className='box-adiverts'>
                                    <table className='adivert'>
                                        <thead>
                                            <tr>
                                                <th className='adivert-column' id='data'>Data</th>
                                                <th className='adivert-column' id='matricula'>Matricula</th>
                                                <th className='adivert-column' id='nome'>Nome</th>
                                                <th className='adivert-column' id='tipo'>Tipo</th>
                                                <th className='adivert-column' id='motivo'>Motivo</th>
                                            </tr>
                                        </thead>
                                        {adiverts.map(adivert => (
                                            <Tabela
                                                key={adivert.id}
                                                data={adivert.data}
                                                matricula={adivert.matricula}
                                                nome={adivert.nome}
                                                tipo={adivert.tipo}
                                                motivo={adivert.motivo}
                                                id={adivert.id}
                                                selectedId={selectedId}
                                                setSelectedId={setSelectedId}
                                            />
                                        ))}
                                    </table>
                                </div>

                                {/* ── Barra de Ações ── */}
                                <div className='acoes-bar'>
                                    <span className='acoes-bar__label'>AÇÕES:</span>
                                    <div className='acoes-bar__buttons'>
                                        <button
                                            className={`acoes-btn ${!selectedId ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => selectedId && setInspecionarView(true)}
                                            disabled={!selectedId}
                                            title="Inspecionar advertência selecionada"
                                        >
                                            🔍 Inspecionar
                                        </button>
                                        <button
                                            className={`acoes-btn acoes-btn--excluir ${!selectedId ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => selectedId && setExcluirView(true)}
                                            disabled={!selectedId}
                                            title="Excluir advertência selecionada"
                                        >
                                            🗑️ Excluir
                                        </button>
                                        <button
                                            className={`acoes-btn acoes-btn--editar ${!selectedId ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => selectedId && setUpdateView(true)}
                                            disabled={!selectedId}
                                            title="Editar advertência selecionada"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            className={`acoes-btn acoes-btn--pdf ${!selectedId ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => selectedAdivert && downloadPDFLinha(selectedAdivert)}
                                            disabled={!selectedId}
                                            title="Baixar PDF da advertência selecionada"
                                        >
                                            📄 Baixar PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='d-flex box-menu flex-column'>
                            {/* Botão: Nova Advertência */}
                            <button
                                onClick={() => { setAddAberto(true); setColabAberto(false); }}
                                title="Nova Advertência"
                            >
                                <img className='icon buttons-menu' src="/plus.png" alt="botão de adicionar" />
                            </button>

                            {/* Botão: Gerenciar Colaboradores */}
                            <button
                                onClick={() => { setColabAberto(true); setAddAberto(false); }}
                                title="Gerenciar Colaboradores"
                                className="btn-menu-colab"
                            >
                                <span className="colab-menu-icon">👥</span>
                            </button>

                            {/* Botão: Download PDF */}
                            <button onClick={downloadPDF} title="Baixar PDF" disabled={baixando}>
                                {baixando
                                    ? <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>...</span>
                                    : <img className='icon buttons-menu' src="/download.png" alt="botão de download" />
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )

}
export default App
