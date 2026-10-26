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
import SuspensaoForm from './components/SuspensaoForm'
import TabelaSuspensao from './components/TabelaSuspensao'
import HistoricoGeralModal from './components/HistoricoGeralModal'
import BaixarHistoricoModal from './components/BaixarHistoricoModal'
import type { AlvoHistorico } from './components/BaixarHistoricoModal'
import ColabSelect from './components/ColabSelect'
import MotivosSelect from './components/MotivosSelect'
import Configuracoes from './components/Configuracoes'
import { ToastContainer, showToast } from './components/Toast'
import { NotificacaoContainer } from './components/Notificacao'
import { downloadAdvertenciaPdf, getAdvertenciaPdfBlob } from './utils/pdfAdvertencia'
import { downloadSuspensaoPdf, getSuspensaoPdfBlob } from './utils/pdfSuspensao'
import { listarSuspensoes, obterSuspensao, assinarSuspensao } from './utils/suspensaoApi'
import type { Suspensao } from './utils/suspensaoApi'
import { listarAdvertencias } from './utils/historico'
import type { FiltroHistorico } from './utils/historico'
import { formatarDataBr } from './utils/datas'
import JSZip from 'jszip'

type Colab = { id: number; nome: string; matricula: string }

type Modo = 'advertencias' | 'suspensoes'

// Parametros explicitos de busca (o estado ainda nao refletiu a troca no mesmo clique)
type BuscaOpts = { nome?: string; motivos?: string[]; porMotivo?: boolean }

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
    (nome || 'documento').trim().replace(/\s+/g, '_').replace(/[\\/:*?"<>|]+/g, '')

function App() {

    const [nome, setNome] = useState<string>('')
    // Colaborador escolhido na lista (chave = matrícula) e modo "filtrar por motivo"
    const [colabSel, setColabSel] = useState<Colab | null>(null)
    const [porMotivo, setPorMotivo] = useState<boolean>(false)
    const [motivosSel, setMotivosSel] = useState<string[]>([])
    const [motivos, setMotivos] = useState<string[]>([])
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

    // Toggle da lista principal e dados de suspensões
    const [modo, setModo] = useState<Modo>('advertencias')
    const [suspensoes, setSuspensoes] = useState<Suspensao[]>([])
    const [carregandoSusp, setCarregandoSusp] = useState<boolean>(true)
    const [erroSusp, setErroSusp] = useState<boolean>(false)
    const ehSusp = modo === 'suspensoes'
    // Formulário de suspensão: criação (pré-preenchida pela notificação) ou edição
    const [suspForm, setSuspForm] = useState<{ matricula?: string; nome?: string; editar?: Suspensao } | null>(null)

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

    // Modais de histórico: geral e por colaborador/motivos
    const [histGeralView, setHistGeralView] = useState<boolean>(false)
    const [baixarHistView, setBaixarHistView] = useState<boolean>(false)

    const selectedAdivert = adiverts.find(a => a.id === selectedId) ?? null
    const selectedSusp = suspensoes.find(x => x.id === selectedId) ?? null

    const trocarModo = (novo: Modo) => {
        if (novo === modo) return
        setSelectedIds([])
        setModo(novo)
    }

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

    // Baixa o PDF da suspensão selecionada (com complemento e evidências)
    const downloadPdfSusp = async (susp: Suspensao) => {
        try {
            const detalhe = await obterSuspensao(susp.id)
            await downloadSuspensaoPdf({
                dataEmissao: susp.dataEmissao,
                nome: susp.nome,
                matricula: susp.matricula,
                dias: susp.dias,
                dataInicio: susp.dataInicio,
                dataRetorno: susp.dataRetorno,
                motivo: susp.motivo,
                complemento: detalhe?.complemento ?? susp.complemento ?? null,
                evidencias: (detalhe?.evidencias ?? []).map(e => ({
                    contentType: e.contentType,
                    base64: e.base64,
                })),
            })
            showToast('PDF gerado com sucesso!', 'success')
        } catch {
            showToast('Erro ao gerar o PDF.', 'error')
        }
    }

    // Baixa TODAS as advertências (ou suspensões) selecionadas - um PDF por advertência, tudo em um .zip
    const confirmarDownloadLote = async () => {
        setBaixandoLote(true)
        try {
            const zip = new JSZip()
            const usados = new Set<string>()
            let adicionados = 0

            for (const id of selectedIds) {
                const base: any = ehSusp
                    ? suspensoes.find(x => x.id === id)
                    : adiverts.find(a => a.id === id)
                if (!base) continue

                let det: any = null
                try {
                    det = ehSusp
                        ? await obterSuspensao(id)
                        : await fetch(
                            `${import.meta.env.VITE_API_URL}/api/Adiverts/${id}`,
                            { headers: { Accept: 'application/json' } }
                        ).then(r => r.ok ? r.json() : null)
                } catch {
                    det = null
                }

                const evidencias = (det?.evidencias ?? []).map((e: any) => ({
                    contentType: e.contentType,
                    base64: e.base64,
                }))
                const blob = ehSusp
                    ? await getSuspensaoPdfBlob({
                        dataEmissao: base.dataEmissao,
                        nome: base.nome,
                        matricula: base.matricula,
                        dias: base.dias,
                        dataInicio: base.dataInicio,
                        dataRetorno: base.dataRetorno,
                        motivo: base.motivo,
                        complemento: det?.complemento ?? base.complemento ?? null,
                        evidencias,
                    })
                    : await getAdvertenciaPdfBlob({
                        data: base.data,
                        nome: base.nome,
                        matricula: base.matricula,
                        motivo: base.motivo,
                        tipo: base.tipo,
                        complemento: det?.complemento ?? base.complemento ?? null,
                        evidencias,
                    })

                const baseNome = `${ehSusp ? 'suspensao' : 'advertencia'}-${sanitizeNome(base.nome)}-${base.matricula}`
                let nomeArq = `${baseNome}.pdf`
                let n = 2
                while (usados.has(nomeArq)) { nomeArq = `${baseNome}-${n}.pdf`; n++ }
                usados.add(nomeArq)

                zip.file(nomeArq, blob)
                adicionados++
            }

            if (adicionados === 0) {
                setBaixarLoteView(false)
                showToast(`Nenhuma ${ehSusp ? 'suspensão' : 'advertência'} para baixar.`, 'error')
                return
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' })
            baixarBlob(zipBlob, `${ehSusp ? 'suspensoes' : 'advertencias'}_${adicionados}.zip`)
            setBaixarLoteView(false)
            showToast(`${adicionados} ${ehSusp ? 'suspensões' : 'advertências'} geradas (arquivo .zip)!`, 'success')
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

    const toggleAssinaturaSusp = async (id: number, assinada: boolean) => {
        try {
            await assinarSuspensao(id, assinada)
            await getSuspensoes()
            showToast(
                assinada ? 'Suspensão marcada como assinada.' : 'Marcação de assinatura removida.',
                'success'
            )
        } catch {
            showToast('Erro ao atualizar a assinatura.', 'error')
        }
    }

    // Filtro da lista: por motivos OU por colaborador (nunca os dois)
    const filtroLista = (o: BuscaOpts = {}): FiltroHistorico => {
        if (o.porMotivo ?? porMotivo) {
            const ms = o.motivos ?? motivosSel
            return ms.length > 0 ? { motivos: ms } : {}
        }
        const n = o.nome ?? nome
        return n ? { nome: n } : {}
    }

    const getSuspensoes = async (opts?: BuscaOpts) => {
        setCarregandoSusp(true)
        try {
            setSuspensoes(await listarSuspensoes(filtroLista(opts)))
            setErroSusp(false)
        } catch {
            setErroSusp(true)
            showToast('Não foi possível carregar as suspensões.', 'error')
        } finally {
            setCarregandoSusp(false)
        }
    }

    // A busca (colaborador ou motivos) filtra as duas listas
    const buscar = (opts?: BuscaOpts) => {
        getAdiverts(opts)
        getSuspensoes(opts)
    }

    const alternarPorMotivo = (ligado: boolean) => {
        setPorMotivo(ligado)
        setNome('')
        setColabSel(null)
        setMotivosSel([])
        buscar({ nome: '', motivos: [], porMotivo: ligado })
    }

    const getAdiverts = async (opts?: BuscaOpts) => {
        setCarregando(true);
        try {
            const data = await listarAdvertencias(filtroLista(opts));
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
        getSuspensoes();
        fetch(`${import.meta.env.VITE_API_URL}/api/Colabs`)
            .then(r => r.ok ? r.json() : [])
            .then(setColabs)
            .catch(() => {})
        fetch(`${import.meta.env.VITE_API_URL}/api/Motivos`)
            .then(r => r.ok ? r.json() : [])
            .then((d: { id: number; descricao: string }[]) => setMotivos(d.map(m => m.descricao)))
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
        const req = ehSusp
            ? obterSuspensao(selectedId)
            : fetch(`${import.meta.env.VITE_API_URL}/api/Adiverts/${selectedId}`, { headers: { Accept: 'application/json' } })
                .then(r => r.ok ? r.json() : null)
        req
            .then(det => { if (!cancelado) setInspDetalhe(det) })
            .catch(() => { if (!cancelado) setInspDetalhe(null) })
            .finally(() => { if (!cancelado) setInspCarregando(false) })
        return () => { cancelado = true }
    }, [inspecionarView, selectedId, ehSusp])

    // Mantém a seleção coerente com a lista visível: remove ids que sumiram
    // (após busca/filtro/atualização/exclusão) para não sobrar "seleção fantasma".
    useEffect(() => {
        setSelectedIds(prev => {
            const lista: { id: number }[] = ehSusp ? suspensoes : adiverts
            const filtrado = prev.filter(id => lista.some(a => a.id === id))
            return filtrado.length === prev.length ? prev : filtrado
        })
    }, [adiverts, suspensoes, ehSusp])

    const dataFormatada = formatarDataBr

    // Enquanto a lista recarrega a tabela mostra esqueletos: liberar as ações aí
    // deixaria botões ativos apontando para linhas que não estão mais visíveis.
    const carregandoAtual = ehSusp ? carregandoSusp : carregando
    const podeUma = selectedIds.length === 1 && !carregandoAtual
    const podeVarias = selectedIds.length > 0 && !carregandoAtual
    const nomeItem = ehSusp ? 'suspensão' : 'advertência'
    const nomeItens = ehSusp ? 'suspensões' : 'advertências'
    const itemSel = ehSusp ? selectedSusp : selectedAdivert

    const alvoHistorico: AlvoHistorico | null = porMotivo
        ? (motivosSel.length > 0 ? { tipo: 'motivos', motivos: motivosSel } : null)
        : (colabSel ? { tipo: 'colaborador', nome: colabSel.nome, matricula: colabSel.matricula } : null)

    return (
        <>
            {/* ── Toast Notifications ── */}
            <ToastContainer />

            {/* ── Notificações (canto superior direito): 4ª advertência ── */}
            <NotificacaoContainer
                onAplicar={(matricula, nomeColab) => {
                    setAddAberto(false)
                    setSuspForm({ matricula, nome: nomeColab })
                }}
            />

            {/* ── Overlay: Suspensão (criação ou edição) ── */}
            {suspForm && (
                <div className='overlay'>
                    <div className='caixa'>
                        <SuspensaoForm
                            key={suspForm.editar?.id ?? suspForm.matricula ?? 'nova'}
                            matricula={suspForm.matricula}
                            nome={suspForm.nome}
                            editar={suspForm.editar}
                            onFechar={() => setSuspForm(null)}
                            onSalvo={() => {
                                setSuspForm(null)
                                setModo('suspensoes')
                                getSuspensoes()
                            }}
                        />
                    </div>
                </div>
            )}

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
                            recurso={ehSusp ? 'suspensao' : 'advertencia'}
                            getAdiverts={ehSusp ? getSuspensoes : getAdiverts}
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
                                    Você vai baixar <strong>{selectedIds.length}</strong> {nomeItens}: um PDF por {nomeItem}, em um arquivo <strong>.zip</strong>.
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
            {updateView && !ehSusp && selectedAdivert && (
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
            {inspecionarView && itemSel && (
                <div className="overlay" onClick={() => setInspecionarView(false)}>
                    <div className="caixa inspecionar-caixa" onClick={e => e.stopPropagation()}>
                        <div className="inspecionar-header">
                            <span className="titulo-com-icone">
                                <MagnifyingGlass size={20} />
                                <h2 className="inspecionar-titulo">{ehSusp ? 'Detalhes da Suspensão' : 'Detalhes da Advertência'}</h2>
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
                                <span className="inspecionar-label">{ehSusp ? 'Emissão' : 'Data'}</span>
                                <span className="inspecionar-valor">
                                    {dataFormatada(ehSusp ? selectedSusp!.dataEmissao : selectedAdivert!.data)}
                                </span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">Nome do Colaborador</span>
                                <span className="inspecionar-valor">{itemSel!.nome}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">Matrícula</span>
                                <span className="inspecionar-valor">{itemSel!.matricula}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            {ehSusp ? (
                                <>
                                    <div className="inspecionar-campo">
                                        <span className="inspecionar-label">Dias</span>
                                        <span className="inspecionar-valor">{selectedSusp!.dias}</span>
                                    </div>
                                    <div className="inspecionar-divider" />
                                    <div className="inspecionar-campo">
                                        <span className="inspecionar-label">Início</span>
                                        <span className="inspecionar-valor">{dataFormatada(selectedSusp!.dataInicio)}</span>
                                    </div>
                                    <div className="inspecionar-divider" />
                                    <div className="inspecionar-campo">
                                        <span className="inspecionar-label">Retorno</span>
                                        <span className="inspecionar-valor">{dataFormatada(selectedSusp!.dataRetorno)}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="inspecionar-campo">
                                    <span className="inspecionar-label">Tipo</span>
                                    <span className={`inspecionar-badge ${selectedAdivert!.tipo === 'Escrita' ? 'badge-escrita' : 'badge-verbal'}`}>
                                        {selectedAdivert!.tipo}
                                    </span>
                                </div>
                            )}
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo inspecionar-campo--coluna">
                                <span className="inspecionar-label">Motivo</span>
                                <span className="inspecionar-motivo">{itemSel!.motivo}</span>
                            </div>
                            <div className="inspecionar-divider" />
                            <div className="inspecionar-campo">
                                <span className="inspecionar-label">Assinatura</span>
                                <span className={`assinada-badge ${itemSel!.assinada ? 'assinada-badge--sim' : 'assinada-badge--nao'}`}>
                                    {itemSel!.assinada
                                        ? <><CheckCircle size={14} weight="fill" /> Assinada</>
                                        : <><Square size={14} /> Pendente</>}
                                </span>
                            </div>

                            {(inspDetalhe?.complemento ?? itemSel!.complemento) && (
                                <>
                                    <div className="inspecionar-divider" />
                                    <div className="inspecionar-campo inspecionar-campo--coluna">
                                        <span className="inspecionar-label">Complemento</span>
                                        <span className="inspecionar-motivo">
                                            {inspDetalhe?.complemento ?? itemSel!.complemento}
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
                                onClick={() => {
                                    setInspecionarView(false)
                                    if (ehSusp) setSuspForm({ editar: selectedSusp! })
                                    else setUpdateView(true)
                                }}
                                title={`Editar esta ${nomeItem}`}
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

            {/* ── Overlay: Histórico geral ── */}
            {histGeralView && (
                <div className='overlay'>
                    <div className='caixa caixa--hist-modal'>
                        <HistoricoGeralModal onFechar={() => setHistGeralView(false)} />
                    </div>
                </div>
            )}

            {/* ── Overlay: Baixar histórico (colaborador selecionado ou motivos) ── */}
            {baixarHistView && alvoHistorico && (
                <div className='overlay'>
                    <div className='caixa caixa--hist-modal'>
                        <BaixarHistoricoModal alvo={alvoHistorico} onFechar={() => setBaixarHistView(false)} />
                    </div>
                </div>
            )}

            <div className='d-flex box-site'>
                <div className='d-flex box-body flex-column'>
                    <div className='d-flex'>
                        <img className='logo' src="/danlex.png" alt="logo-empresa" />
                        <h1>Sistema de Advertências</h1>
                    </div>
                    <div className='busca-bloco'>
                        <form className='box-search' onSubmit={e => {
                            e.preventDefault();
                            if (porMotivo) {
                                buscar({ motivos: motivosSel });
                                return
                            }
                            const nomeUpper = nome.toUpperCase();
                            setNome(nomeUpper);
                            setColabSel(colabs.find(c => c.nome.toUpperCase() === nomeUpper) ?? null);
                            buscar({ nome: nomeUpper });
                        }}>
                            {porMotivo ? (
                                <div className="search-motivos">
                                    <MotivosSelect
                                        multiple
                                        values={motivosSel}
                                        motivos={motivos}
                                        onChange={setMotivosSel}
                                    />
                                </div>
                            ) : (
                                <ColabSelect
                                    nome={nome}
                                    colabs={colabs}
                                    onNomeChange={v => {
                                        setNome(v)
                                        if (colabSel && v.toUpperCase() !== colabSel.nome.toUpperCase()) setColabSel(null)
                                    }}
                                    onColabSelect={(nomeColab, matricula) => {
                                        const upper = nomeColab.toUpperCase()
                                        setNome(upper)
                                        setColabSel(colabs.find(c => c.matricula === matricula) ?? { id: 0, nome: nomeColab, matricula })
                                        buscar({ nome: upper })
                                    }}
                                    placeholder="Digite um colaborador para filtragem"
                                    className="search-colab-select"
                                />
                            )}
                            <button className='search-buttom' disabled={carregandoAtual}>
                                {carregandoAtual
                                    ? <span className="search-loading">...</span>
                                    : <MagnifyingGlass size={20} color="#fff" />
                                }
                            </button>
                        </form>
                        <div className="busca-opcoes">
                            <label className="hist-filtro-check">
                                <input
                                    type="checkbox"
                                    checked={porMotivo}
                                    onChange={e => alternarPorMotivo(e.target.checked)}
                                />
                                Filtrar por motivo
                            </label>
                            {alvoHistorico && (
                                <button
                                    type="button"
                                    className="btn add-btn-confirm busca-opcoes__baixar"
                                    onClick={() => setBaixarHistView(true)}
                                >
                                    <DownloadSimple size={16} /> Baixar Histórico
                                </button>
                            )}
                        </div>
                    </div>
                    <div className='d-flex box-content'>
                        <div className='d-flex box-main'>
                            <div className='box-adiverts-wrapper'>
                                <div className="lista-topo">
                                    <div className="modo-toggle" role="group" aria-label="Alternar lista">
                                        <button
                                            type="button"
                                            className={`modo-toggle__btn ${!ehSusp ? 'modo-toggle__btn--ativo' : ''}`}
                                            onClick={() => trocarModo('advertencias')}
                                            aria-pressed={!ehSusp}
                                        >
                                            Advertências
                                        </button>
                                        <button
                                            type="button"
                                            className={`modo-toggle__btn ${ehSusp ? 'modo-toggle__btn--ativo' : ''}`}
                                            onClick={() => trocarModo('suspensoes')}
                                            aria-pressed={ehSusp}
                                        >
                                            Suspensões
                                        </button>
                                    </div>
                                </div>
                                <div className="tabela-hint">
                                    {carregandoAtual ? (
                                        <>
                                            <CircleNotch size={14} className="girando" />
                                            Carregando {nomeItens}...
                                        </>
                                    ) : (
                                        <>
                                            <Info size={14} /> Segure <kbd>Ctrl</kbd> para selecionar mais de uma {nomeItem}.
                                            {selectedIds.length > 1 && (
                                                <strong className="tabela-hint__count"> · {selectedIds.length} selecionadas</strong>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className='box-adiverts'>
                                    <table className={`adivert ${ehSusp ? 'adivert--susp' : ''}`}>
                                        <thead>
                                            {ehSusp ? (
                                                <tr>
                                                    <th className='adivert-column' id='data'>Emissão</th>
                                                    <th className='adivert-column' id='matricula'>Matrícula</th>
                                                    <th className='adivert-column' id='nome'>Nome</th>
                                                    <th className='adivert-column' id='dias'>Dias</th>
                                                    <th className='adivert-column' id='inicio'>Início</th>
                                                    <th className='adivert-column' id='retorno'>Retorno</th>
                                                    <th className='adivert-column' id='motivo'>Motivo</th>
                                                    <th className='adivert-column' id='assinada'>Assinada</th>
                                                </tr>
                                            ) : (
                                                <tr>
                                                    <th className='adivert-column' id='data'>Data</th>
                                                    <th className='adivert-column' id='matricula'>Matrícula</th>
                                                    <th className='adivert-column' id='nome'>Nome</th>
                                                    <th className='adivert-column' id='tipo'>Tipo</th>
                                                    <th className='adivert-column' id='motivo'>Motivo</th>
                                                    <th className='adivert-column' id='assinada'>Assinada</th>
                                                </tr>
                                            )}
                                        </thead>
                                        {carregandoAtual ? (
                                            <tbody className="tabela-skeleton">
                                                {Array.from({ length: SKELETON_LINHAS }, (_, i) => (
                                                    <tr key={i} style={{ animationDelay: `${i * 70}ms` }}>
                                                        <td><span className="sk sk--curto" /></td>
                                                        <td><span className="sk sk--curto" /></td>
                                                        <td><span className="sk sk--medio" /></td>
                                                        {ehSusp && (
                                                            <>
                                                                <td><span className="sk sk--curto" /></td>
                                                                <td><span className="sk sk--curto" /></td>
                                                                <td><span className="sk sk--curto" /></td>
                                                            </>
                                                        )}
                                                        {!ehSusp && <td><span className="sk sk--curto" /></td>}
                                                        <td><span className="sk sk--longo" /></td>
                                                        <td><span className="sk sk--badge" /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        ) : (ehSusp ? erroSusp : erroCarregar) ? (
                                            <tbody>
                                                <tr>
                                                    <td colSpan={ehSusp ? 8 : 6} className="tabela-vazia">
                                                        <span className="tabela-vazia__icone tabela-vazia__icone--erro">
                                                            <WarningCircle size={44} />
                                                        </span>
                                                        <span className="tabela-vazia__texto">
                                                            Não foi possível carregar as {nomeItens}.
                                                            <br />Seus dados continuam salvos — foi só a consulta que falhou.
                                                        </span>
                                                        <button className="tabela-vazia__retry" onClick={() => ehSusp ? getSuspensoes() : getAdiverts()}>
                                                            <ArrowClockwise size={14} /> Tentar novamente
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        ) : (ehSusp ? suspensoes : adiverts).length === 0 ? (
                                            <tbody>
                                                <tr>
                                                    <td colSpan={ehSusp ? 8 : 6} className="tabela-vazia">
                                                        <span className="tabela-vazia__icone"><ClipboardText size={44} /></span>
                                                        <span className="tabela-vazia__texto">Nenhuma {nomeItem} registrada</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        ) : ehSusp ? suspensoes.map(susp => (
                                            <TabelaSuspensao
                                                key={susp.id}
                                                dataEmissao={susp.dataEmissao}
                                                matricula={susp.matricula}
                                                nome={susp.nome}
                                                dias={susp.dias}
                                                dataInicio={susp.dataInicio}
                                                dataRetorno={susp.dataRetorno}
                                                motivo={susp.motivo}
                                                assinada={!!susp.assinada}
                                                id={susp.id}
                                                selected={selectedIds.includes(susp.id)}
                                                onRowSelect={onRowSelect}
                                                onToggleAssinatura={toggleAssinaturaSusp}
                                            />
                                        )) : adiverts.map(adivert => (
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
                                            title={`Inspecionar (selecione uma ${nomeItem})`}
                                        >
                                            <MagnifyingGlass size={16} /> Inspecionar
                                        </button>
                                        <button
                                            className={`acoes-btn acoes-btn--excluir ${!podeVarias ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => podeVarias && setExcluirView(true)}
                                            disabled={!podeVarias}
                                            title={`Excluir ${nomeItem}(s) selecionada(s)`}
                                        >
                                            <Trash size={16} /> Excluir{selectedIds.length > 1 ? ` (${selectedIds.length})` : ''}
                                        </button>
                                        <button
                                            className={`acoes-btn ${!podeUma ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => {
                                                if (!podeUma) return
                                                if (ehSusp && selectedSusp) setSuspForm({ editar: selectedSusp })
                                                else setUpdateView(true)
                                            }}
                                            disabled={!podeUma}
                                            title={`Editar (selecione uma ${nomeItem})`}
                                        >
                                            <PencilSimple size={16} /> Editar
                                        </button>
                                        <button
                                            className={`acoes-btn ${!podeVarias ? 'acoes-btn--disabled' : ''}`}
                                            onClick={() => {
                                                if (!podeVarias) return
                                                if (selectedIds.length === 1 && ehSusp && selectedSusp) downloadPdfSusp(selectedSusp)
                                                else if (selectedIds.length === 1 && selectedAdivert) downloadPdfLinha(selectedAdivert)
                                                else if (selectedIds.length > 1) setBaixarLoteView(true)
                                            }}
                                            disabled={!podeVarias}
                                            title={`Baixar PDF da(s) ${nomeItem}(s) selecionada(s)`}
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

                            {/* Botão: Gerar histórico geral */}
                            <button
                                onClick={() => setHistGeralView(true)}
                                title="Gerar histórico geral"
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
