import { useEffect, useState } from 'react'
import {
    Plus, X, MagnifyingGlass, PencilSimple, Trash, Users, Gear,
    DownloadSimple, FilePdf, CheckCircle, Square, Info, ClipboardText,
    CircleNotch, WarningCircle, ArrowClockwise,
} from '@phosphor-icons/react'
import Tabela from './components/Tabela'
import Add from './components/Add'
import Colaboradores from './components/Colaboradores'
import Excluir from './components/Excluir'
import Update from './components/Update'
import HistoricoMenu from './components/HistoricoMenu'
import HistoricoColaborador from './components/HistoricoColaborador'
import HistoricoMotivo from './components/HistoricoMotivo'
import ColabSelect from './components/ColabSelect'
import Configuracoes from './components/Configuracoes'
import { ToastContainer, showToast } from './components/Toast'
import { downloadAdvertenciaPdf, getAdvertenciaPdfBlob } from './utils/pdfAdvertencia'
import JSZip from 'jszip'

type Colab = { id: number; nome: string; matricula: string }

type HistView =
    | null
    | 'menu'
    | 'colaborador'
    | 'motivo'

// Quantidade de linhas "fantasma" exibidas enquanto a lista carrega
const SKELETON_LINHAS = 7

// Dispara o download de um Blob no navegador
const baixarBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

// Nome de arquivo seguro a partir do nome do colaborador
const sanitizeNome = (nome: string) =>
    (nome || 'advertencia').trim().replace(/\s+/g, '_').replace(/[\\/:*?"<>|]+/g, '')

function App() {

    const [nome, setNome] = useState<string>('')
    const [colabs, setColabs] = useState<Colab[]>([])
    const [addAberto, setAddAberto] = useState<boolean>(false)
    const [colabAberto, setColabAberto] = useState<boolean>(false)
    const [configAberto, setConfigAberto] = useState<boolean>(false)
    const [adiverts, setAdiverts] = useState<any[]>([])
    const [data, setData] = useState<any[]>([])
    // Já começa carregando: o fetch inicial dispara no primeiro efeito e, sem
    // isso, a tabela pisca o estado "Nenhuma advertência registrada" antes dos dados.
    const [carregando, setCarregando] = useState<boolean>(true)
    const [erroCarregar, setErroCarregar] = useState<boolean>(false)

    // Seleção de linha (múltipla - segure Ctrl para selecionar várias)
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const selectedId = selectedIds.length === 1 ? selectedIds[0] : null

    const onRowSelect = (id: number, ctrl: boolean) => {
        setSelectedIds(prev => {
            if (ctrl) {
                return prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            }
            // clique simples: seleciona só essa (ou desmarca se já era a única)
            return prev.length === 1 && prev[0] === id ? [] : [id]
        })
    }

    // Modais de ação
    const [excluirView, setExcluirView] = useState<boolean>(false)
    const [updateView, setUpdateView] = useState<boolean>(false)
    const [inspecionarView, setInspecionarView] = useState<boolean>(false)
    const [inspDetalhe, setInspDetalhe] = useState<{ complemento?: string | null; evidencias?: any[] } | null>(null)
    const [inspCarregando, setInspCarregando] = useState<boolean>(false)
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
    const [baixarLoteView, setBaixarLoteView] = useState<boolean>(false)
    const [baixandoLote, setBaixandoLote] = useState<boolean>(false)

    // Fluxo de histórico
    const [histView, setHistView] = useState<HistView>(null)

    const selectedAdivert = adiverts.find(a => a.id === selectedId) ?? null

    const fecharHistorico = () => setHistView(null)

    // Baixa o PDF da advertência selecionada (com complemento e evidências)
    const downloadPdfLinha = async (adivert: any) => {
        try {
            const resp = await fetch(
                `${import.meta.env.VITE_API_URL}/api/Adiverts/${adivert.id}`,
                { headers: { Accept: 'application/json' } }
            )
            const detalhe = resp.ok ? await resp.json() : null
            await downloadAdvertenciaPdf({
                data: adivert.data,
                nome: adivert.nome,
                matricula: adivert.matricula,
                motivo: adivert.motivo,
                tipo: adivert.tipo,
                complemento: detalhe?.complemento ?? adivert.complemento ?? null,
                evidencias: (detalhe?.evidencias ?? []).map((e: any) => ({
                    contentType: e.contentType,
                    base64: e.base64,
                })),
            })
            showToast('PDF gerado com sucesso!', 'success')
        } catch {
            showToast('Erro ao gerar o PDF.', 'error')
        }
    }

    // Baixa TODAS as advertências selecionadas - um PDF por advertência, tudo em um .zip
    const confirmarDownloadLote = async () => {
        setBaixandoLote(true)
        try {
            const zip = new JSZip()
            const usados = new Set<string>()
            let adicionados = 0

            for (const id of selectedIds) {
                const base = adiverts.find(a => a.id === id)
                if (!base) continue

                let det: any = null
                try {
                    const resp = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/Adiverts/${id}`,
                        { headers: { Accept: 'application/json' } }
                    )
                    det = resp.ok ? await resp.json() : null
                } catch {
                    det = null
                }

                const blob = await getAdvertenciaPdfBlob({
                    data: base.data,
                    nome: base.nome,
                    matricula: base.matricula,
                    motivo: base.motivo,
                    tipo: base.tipo,
                    complemento: det?.complemento ?? base.complemento ?? null,
                    evidencias: (det?.evidencias ?? []).map((e: any) => ({
                        contentType: e.contentType,
                        base64: e.base64,
                    })),
                })

                const baseNome = `advertencia-${sanitizeNome(base.nome)}-${base.matricula}`
                let nomeArq = `${baseNome}.pdf`
                let n = 2
                while (usados.has(nomeArq)) { nomeArq = `${baseNome}-${n}.pdf`; n++ }
                usados.add(nomeArq)

                zip.file(nomeArq, blob)
                adicionados++
            }

            if (adicionados === 0) {
                setBaixarLoteView(false)
                showToast('Nenhuma advertência para baixar.', 'error')
                return
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' })
            baixarBlob(zipBlob, `advertencias_${adicionados}.zip`)
            setBaixarLoteView(false)
            showToast(`${adicionados} advertências geradas (arquivo .zip)!`, 'success')
        } catch {
            showToast('Erro ao gerar o arquivo.', 'error')
        } finally {
            setBaixandoLote(false)
        }
    }

    // Marca/desmarca uma advertência como assinada (persiste no backend)
    const toggleAssinatura = async (id: number, assinada: boolean) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/Adiverts/${id}/assinatura`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ assinada })
                }
            );
            if (!response.ok) throw new Error(`Erro: ${response.status}`);
            await getAdiverts();
            showToast(
                assinada ? 'Advertência marcada como assinada.' : 'Marcação de assinatura removida.',
                'success'
            );
        } catch {
            showToast('Erro ao atualizar a assinatura.', 'error');
        }
    }

    const getAdiverts = async (nomeParam?: string) => {
        const buscaNome = nomeParam !== undefined ? nomeParam : nome
        const url = buscaNome === ''
            ? `${import.meta.env.VITE_API_URL}/api/Adiverts`
            : `${import.meta.env.VITE_API_URL}/api/Adiverts?nome=${encodeURIComponent(buscaNome)}`
        setCarregando(true);
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: { "Accept": "application/json" }
            });
            if (!response.ok) throw new Error(`Erro: ${response.status}`);
            const data = await response.json();
            setAdiverts(data);
            setErroCarregar(false);
        } catch {
            // Falha de rede/servidor: sinaliza na própria tabela em vez de cair
            // no estado vazio, que passaria a impressão de que os dados sumiram.
            setErroCarregar(true);
            showToast('Não foi possível carregar as advertências.', 'error');
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        getAdiverts();
        fetch(`${import.meta.env.VITE_API_URL}/api/Colabs`)
            .then(r => r.ok ? r.json() : [])
            .then(setColabs)
            .catch(() => {})
    }, [])

    // Ao abrir a inspeção, busca o detalhe (complemento + evidências/imagens)
    useEffect(() => {
        if (!inspecionarView || selectedId == null) {
            setInspDetalhe(null)
            return
        }
        let cancelado = false
        setInspCarregando(true)
        fetch(`${import.meta.env.VITE_API_URL}/api/Adiverts/${selectedId}`, { headers: { Accept: 'application/json' } })
            .then(r => r.ok ? r.json() : null)
            .then(det => { if (!cancelado) setInspDetalhe(det) })
            .catch(() => { if (!cancelado) setInspDetalhe(null) })
            .finally(() => { if (!cancelado) setInspCarregando(false) })
        return () => { cancelado = true }
    }, [inspecionarView, selectedId])

    // Mantém a seleção coerente com a lista visível: remove ids que sumiram
    // (após busca/filtro/atualização/exclusão) para não sobrar "seleção fantasma".
    useEffect(() => {
        setSelectedIds(prev => {
            const filtrado = prev.filter(id => adiverts.some(a => a.id === id))
            return filtrado.length === prev.length ? prev : filtrado
        })
    }, [adiverts])

    const dataFormatada = (data: string) => {
        const [yyyy, mm, dd] = data.slice(0, 10).split('-')
        return `${dd}/${mm}/${yyyy}`
    }

    // Enquanto a lista recarrega a tabela mostra esqueletos: liberar as ações aí
    // deixaria botões ativos apontando para linhas que não estão mais visíveis.
    const podeUma = selectedIds.length === 1 && !carregando
    const podeVarias = selectedIds.length > 0 && !carregando

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

            {/* ── Overlay: Configurações ── */}
            {configAberto && (
                <div className='overlay'>
                    <div className='caixa caixa--config'>
                        <Configuracoes setConfigAberto={setConfigAberto} />
                    </div>
                </div>
            )}

            {/* ── Overlay: Excluir ── */}
            {excluirView && selectedIds.length > 0 && (
                <div className='overlay'>
                    <div className='caixa'>
                        <Excluir
                            getAdiverts={getAdiverts}
                            setExcluirView={setExcluirView}
                            ids={selectedIds}
                        />
                    </div>
                </div>
            )}

            {/* ── Overlay: Confirmar download em lote ── */}
            {baixarLoteView && selectedIds.length > 0 && (
                <div className='overlay' onClick={() => !baixandoLote && setBaixarLoteView(false)}>
                    <div className='caixa' onClick={e => e.stopPropagation()}>
                        <div className="d-flex justify-content-center align-itens-center h-100">
                            <div className="d-flex flex-column justify-content-center h-75">
                                <h5>
                                    Você vai baixar <strong>{selectedIds.length}</strong> advertências: um PDF por advertência, em um arquivo <strong>.zip</strong>.
                                </h5>
                                <div className="d-flex justify-content-center modal-confirm-acoes">
                                    <button
                                        className="cancel-btn btn"
                                        onClick={() => setBaixarLoteView(false)}
                                        disabled={baixandoLote}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="btn add-btn-confirm"
                                        onClick={confirmarDownloadLote}
                                        disabled={baixandoLote}
                                    >
                                        {baixandoLote ? 'Gerando...' : `Baixar ${selectedIds.length}`}
                                    </button>
                                </div>
                            </div>
                        </div>
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
                            complemento={selectedAdivert.complemento}
                        />
                    </div>
                </div>
            )}

            {/* ── Overlay: Inspecionar ── */}
            {inspecionarView && selectedAdivert && (
                <div className="overlay" onClick={() => setInspecionarView(false)}>
                    <div className="caixa inspecionar-caixa" onClick={e => e.stopPropagation()}>
                        <div className="inspecionar-header">
                            <span className="titulo-com-icone">
                                <MagnifyingGlass size={20} />
                                <h2 className="inspecionar-titulo">Detalhes da Advertência</h2>
                            </span>
                            <button
                                className="add-btn-fechar"
                                onClick={() => setInspecionarView(false)}
                                title="Fechar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="inspecionar-body">
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">Data</span>
                                <span className="inspecionar-valor">{dataFormatada(selectedAdivert.data)}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">Nome do Colaborador</span>
                                <span className="inspecionar-valor">{selectedAdivert.nome}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">Matrícula</span>
                                <span className="inspecionar-valor">{selectedAdivert.matricula}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">Tipo</span>
                                <span className={`inspecionar-badge ${selectedAdivert.tipo === 'Escrita' ? 'badge-escrita' : 'badge-verbal'}`}>
                                    {selectedAdivert.tipo}
                                </span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo inspecionar-campo--coluna">
                                <span className="inspecionar-label">Motivo</span>
                                <span className="inspecionar-motivo">{selectedAdivert.motivo}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">Assinatura</span>
                                <span className={`assinada-badge ${selectedAdivert.assinada ? 'assinada-badge--sim' : 'assinada-badge--nao'}`}>
                                    {selectedAdivert.assinada
                                        ? <><CheckCircle size={14} weight="fill" /> Assinada</>
                                        : <><Square size={14} /> Pendente</>}
                                </span>
                            </div>

                            {(inspDetalhe?.complemento ?? selectedAdivert.complemento) && (
                                <>
                                    <div className="inspecionar-divider" />
                                    <div className="inspecionar-campo inspecionar-campo--coluna">
                                        <span className="inspecionar-label">Complemento</span>
                                        <span className="inspecionar-motivo">
                                            {inspDetalhe?.complemento ?? selectedAdivert.complemento}
                                        </span>
                                    </div>
                                </>
                            )}

                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo inspecionar-campo--coluna">
                                <span className="inspecionar-label">Evidências</span>
                                {inspCarregando ? (
                                    <span className="inspecionar-valor">Carregando...</span>
                                ) : (inspDetalhe?.evidencias && inspDetalhe.evidencias.length > 0) ? (
                                    <div className="evid-grid inspecionar-evid-grid">
                                        {inspDetalhe.evidencias.map((e: any) => {
                                            const url = `data:${e.contentType || 'image/jpeg'};base64,${e.base64}`
                                            return (
                                                <button
                                                    key={e.id}
                                                    type="button"
                                                    className="evid-thumb inspecionar-evid-thumb"
                                                    onClick={() => setLightboxUrl(url)}
                                                    title="Ampliar imagem"
                                                >
                                                    <img src={url} alt={e.nomeArquivo ?? 'evidência'} />
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <span className="inspecionar-valor inspecionar-sem-evid">Nenhuma evidência anexada.</span>
                                )}
                            </div>
                        </div>

                        <div className="inspecionar-rodape">
                            <button
                                className="btn add-btn-confirm"
                                onClick={() => { setInspecionarView(false); setUpdateView(true); }}
                                title="Editar esta advertência"
                            >
                                <PencilSimple size={16} /> Editar
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

            {/* ── Lightbox: imagem de evidência ampliada ── */}
            {lightboxUrl && (
                <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
                    <button className="lightbox-fechar" onClick={() => setLightboxUrl(null)} title="Fechar">
                        <X size={20} />
                    </button>
                    <img
                        className="lightbox-img"
                        src={lightboxUrl}
                        alt="evidência ampliada"
                        onClick={e => e.stopPropagation()}
                    />
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
                    <form className='box-search' onSubmit={e => {
                        e.preventDefault();
                        const nomeUpper = nome.toUpperCase();
                        setNome(nomeUpper);
                        getAdiverts(nomeUpper);
                    }}>
                        <ColabSelect
                            nome={nome}
                            colabs={colabs}
                            onNomeChange={setNome}
                            onColabSelect={(nomeColab) => {
                                const upper = nomeColab.toUpperCase()
                                setNome(upper)
                                getAdiverts(upper)
                            }}
                            placeholder="Digite um colaborador para filtragem"
                            className="search-colab-select"
                        />
                        <button className='search-buttom' disabled={carregando}>
                            {carregando
                                ? <span className="search-loading">...</span>
                                : <MagnifyingGlass size={20} color="#fff" />
                            }
                        </button>
                    </form>
                    <div className='d-flex box-content'>
                        <div className='d-flex box-main'>
                            <div className='box-adiverts-wrapper'>
                                <div className="tabela-hint">
                                    {carregando ? (
                                        <>
                                            <CircleNotch size={14} className="girando" />
                                            Carregando advertências...
                                        </>
                                    ) : (
                                        <>
                                            <Info size={14} /> Segure <kbd>Ctrl</kbd> para selecionar mais de uma advertência.
                                            {selectedIds.length > 1 && (
                                                <strong className="tabela-hint__count"> · {selectedIds.length} selecionadas</strong>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className='box-adiverts'>
                                    <table className='adivert'>
                                        <thead>
                                            <tr>
                                                <th className='adivert-column' id='data'>Data</th>
                                                <th className='adivert-column' id='matricula'>Matrícula</th>
                                                <th className='adivert-column' id='nome'>Nome</th>
                                                <th className='adivert-column' id='tipo'>Tipo</th>
                                                <th className='adivert-column' id='motivo'>Motivo</th>
                                                <th className='adivert-column' id='assinada'>Assinada</th>
                                            </tr>
                                        </thead>
                                        {carregando ? (
                                            <tbody className="tabela-skeleton">
                                                {Array.from({ length: SKELETON_LINHAS }, (_, i) => (
                                                    <tr key={i} style={{ animationDelay: `${i * 70}ms` }}>
                                                        <td><span className="sk sk--curto" /></td>
                                                        <td><span className="sk sk--curto" /></td>
                                                        <td><span className="sk sk--medio" /></td>
                                                        <td><span className="sk sk--curto" /></td>
                                                        <td><span className="sk sk--longo" /></td>
                                                        <td><span className="sk sk--badge" /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        ) : erroCarregar ? (
                                            <tbody>
                                                <tr>
                                                    <td colSpan={6} className="tabela-vazia">
                                                        <span className="tabela-vazia__icone tabela-vazia__icone--erro">
                                                            <WarningCircle size={44} />
                                                        </span>
                                                        <span className="tabela-vazia__texto">
                                                            Não foi possível carregar as advertências.
                                                            <br />Seus dados continuam salvos — foi só a consulta que falhou.
                                                        </span>
                                                        <button className="tabela-vazia__retry" onClick={() => getAdiverts()}>
                                                            <ArrowClockwise size={14} /> Tentar novamente
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        ) : adiverts.length === 0 ? (
                                            <tbody>
                                                <tr>
                                                    <td colSpan={6} className="tabela-vazia">
                                                        <span className="tabela-vazia__icone"><ClipboardText size={44} /></span>
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
                                                assinada={!!adivert.assinada}
                                                id={adivert.id}
                                                selected={selectedIds.includes(adivert.id)}
                                                onRowSelect={onRowSelect}
                                                onToggleAssinatura={toggleAssinatura}
                                            />
                                        ))}
                                    </table>
                                </div>

                                {/* ── Barra de Ações ── */}
                                <div className='acoes-bar'>
                                    <span className='acoes-bar__label'>AÇÕES:</span>
                                    <div className='acoes-bar__buttons'>
                                        <button
                                            className={`acoes-btn ${!podeUma ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => podeUma && setInspecionarView(true)}
                                            disabled={!podeUma}
                                            title="Inspecionar (selecione uma advertência)"
                                        >
                                            <MagnifyingGlass size={16} /> Inspecionar
                                        </button>
                                        <button
                                            className={`acoes-btn acoes-btn--excluir ${!podeVarias ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => podeVarias && setExcluirView(true)}
                                            disabled={!podeVarias}
                                            title="Excluir advertência(s) selecionada(s)"
                                        >
                                            <Trash size={16} /> Excluir{selectedIds.length > 1 ? ` (${selectedIds.length})` : ''}
                                        </button>
                                        <button
                                            className={`acoes-btn ${!podeUma ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => podeUma && setUpdateView(true)}
                                            disabled={!podeUma}
                                            title="Editar (selecione uma advertência)"
                                        >
                                            <PencilSimple size={16} /> Editar
                                        </button>
                                        <button
                                            className={`acoes-btn ${!podeVarias ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => {
                                                if (!podeVarias) return
                                                if (selectedIds.length === 1 && selectedAdivert) downloadPdfLinha(selectedAdivert)
                                                else if (selectedIds.length > 1) setBaixarLoteView(true)
                                            }}
                                            disabled={!podeVarias}
                                            title="Baixar PDF da(s) advertência(s) selecionada(s)"
                                        >
                                            <FilePdf size={16} /> Baixar PDF{selectedIds.length > 1 ? ` (${selectedIds.length})` : ''}
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
                                <Plus size={22} color="#fff" />
                            </button>

                            {/* Botão: Gerenciar Colaboradores */}
                            <button
                                onClick={() => { setColabAberto(true); setAddAberto(false); }}
                                title="Gerenciar Colaboradores"
                                className="btn-menu-colab"
                            >
                                <Users size={22} color="#fff" />
                            </button>

                            {/* Botão: Histórico (abre o menu com as duas opções) */}
                            <button
                                onClick={() => setHistView('menu')}
                                title="Histórico de advertências"
                            >
                                <DownloadSimple size={22} color="#fff" />
                            </button>

                            {/* Botão: Configurações (sempre o último) */}
                            <button
                                onClick={() => { setConfigAberto(true); setAddAberto(false); setColabAberto(false); }}
                                title="Configurações"
                            >
                                <Gear size={22} color="#fff" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )

}
export default App
