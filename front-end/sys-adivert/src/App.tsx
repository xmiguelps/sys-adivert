import { useEffect, useState } from 'react'
import Tabela from './components/Tabela'
import Add from './components/Add'
import Colaboradores from './components/Colaboradores'
import Excluir from './components/Excluir'
import Update from './components/Update'
import HistoricoMenu from './components/HistoricoMenu'
import HistoricoColaborador from './components/HistoricoColaborador'
import GerarHistoricoColaborador from './components/GerarHistoricoColaborador'
import HistoricoMotivo from './components/HistoricoMotivo'
import GerarHistoricoMotivo from './components/GerarHistoricoMotivo'
import { ToastContainer, showToast } from './components/Toast'
import { downloadAdvertenciaWord } from './utils/wordAdvertencia'

type HistView =
    | null
    | 'menu'
    | 'colaborador'
    | 'gerar-colaborador'
    | 'motivo'
    | 'gerar-motivo'

function App() {

    const [nome, setNome] = useState<string>('')
    const [addAberto, setAddAberto] = useState<boolean>(false)
    const [colabAberto, setColabAberto] = useState<boolean>(false)
    const [adiverts, setAdiverts] = useState<any[]>([])
    const [data, setData] = useState<any[]>([])
    const [carregando, setCarregando] = useState<boolean>(false)

    // Seleção de linha
    const [selectedId, setSelectedId] = useState<number | null>(null)

    // Modais de ação
    const [excluirView, setExcluirView] = useState<boolean>(false)
    const [updateView, setUpdateView] = useState<boolean>(false)
    const [inspecionarView, setInspecionarView] = useState<boolean>(false)

    // Fluxo de histórico
    const [histView, setHistView] = useState<HistView>(null)
    const [histNomeColab, setHistNomeColab] = useState<string>('')
    const [histMotivo, setHistMotivo] = useState<string>('')

    const selectedAdivert = adiverts.find(a => a.id === selectedId) ?? null

    const fecharHistorico = () => {
        setHistView(null)
        setHistNomeColab('')
        setHistMotivo('')
    }

    // Baixa o Word da advertência selecionada
    const downloadWordLinha = async (adivert: any) => {
        try {
            await downloadAdvertenciaWord({
                data: adivert.data,
                nome: adivert.nome,
                matricula: adivert.matricula,
                motivo: adivert.motivo,
                tipo: adivert.tipo,
            })
            showToast('Documento Word gerado com sucesso!', 'success')
        } catch {
            showToast('Erro ao gerar documento Word.', 'error')
        }
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

    const dataFormatada = (data: string) => {
        const [yyyy, mm, dd] = data.slice(0, 10).split('-')
        return `${dd}/${mm}/${yyyy}`
    }

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

            {/* ── Overlay: Histórico (fluxo completo) ── */}
            {histView === 'menu' && (
                <div className='overlay'>
                    <div className='caixa caixa--hist'>
                        <HistoricoMenu
                            onFechar={fecharHistorico}
                            onEscolherColaborador={() => setHistView('colaborador')}
                            onEscolherMotivo={() => setHistView('motivo')}
                        />
                    </div>
                </div>
            )}

            {histView === 'colaborador' && (
                <div className='overlay'>
                    <div className='caixa caixa--hist'>
                        <HistoricoColaborador
                            adiverts={adiverts}
                            onVoltar={() => setHistView('menu')}
                            onFechar={fecharHistorico}
                            onGerar={(nomeColab) => {
                                setHistNomeColab(nomeColab)
                                setHistView('gerar-colaborador')
                            }}
                        />
                    </div>
                </div>
            )}

            {histView === 'gerar-colaborador' && (
                <div className='overlay'>
                    <div className='caixa caixa--hist'>
                        <GerarHistoricoColaborador
                            adiverts={adiverts}
                            nomeColaborador={histNomeColab}
                            onVoltar={() => setHistView('colaborador')}
                            onFechar={fecharHistorico}
                        />
                    </div>
                </div>
            )}

            {histView === 'motivo' && (
                <div className='overlay'>
                    <div className='caixa caixa--hist'>
                        <HistoricoMotivo
                            adiverts={adiverts}
                            onVoltar={() => setHistView('menu')}
                            onFechar={fecharHistorico}
                            onGerar={(motivo) => {
                                setHistMotivo(motivo)
                                setHistView('gerar-motivo')
                            }}
                        />
                    </div>
                </div>
            )}

            {histView === 'gerar-motivo' && (
                <div className='overlay'>
                    <div className='caixa caixa--hist'>
                        <GerarHistoricoMotivo
                            adiverts={adiverts}
                            motivoConfirmado={histMotivo}
                            onVoltar={() => setHistView('motivo')}
                            onFechar={fecharHistorico}
                        />
                    </div>
                </div>
            )}

            <div className='d-flex box-site'>
                <div className='d-flex box-body flex-column'>
                    <div className='d-flex'>
                        <img className='logo' src="/danlex.png" alt="logo-empresa" />
                        <h1>Sistema de Advertências</h1>
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
                                                <th className='adivert-column' id='matricula'>Matrícula</th>
                                                <th className='adivert-column' id='nome'>Nome</th>
                                                <th className='adivert-column' id='tipo'>Tipo</th>
                                                <th className='adivert-column' id='motivo'>Motivo</th>
                                            </tr>
                                        </thead>
                                        {adiverts.length === 0 ? (
                                            <tbody>
                                                <tr>
                                                    <td colSpan={5} className="tabela-vazia">
                                                        <span className="tabela-vazia__icone">📋</span>
                                                        <span className="tabela-vazia__texto">Nenhuma advertência registrada</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        ) : adiverts.map(adivert => (
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
                                            onClick={() => selectedAdivert && downloadWordLinha(selectedAdivert)}
                                            disabled={!selectedId}
                                            title="Baixar Word da advertência selecionada"
                                        >
                                            📝 Baixar Arquivo
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
                                <img className='icon buttons-menu' src="/colab.png" alt="botão de colaboradores" />
                            </button>

                            {/* Botão: Histórico (abre o menu com as duas opções) */}
                            <button
                                onClick={() => setHistView('menu')}
                                title="Histórico de advertências"
                            >
                                <img className='icon buttons-menu' src="/download.png" alt="botão de histórico" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )

}
export default App
