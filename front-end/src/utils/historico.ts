import type { Content } from 'pdfmake/interfaces'
import { listarSuspensoes } from './suspensaoApi'
import type { FiltroSuspensao, Suspensao } from './suspensaoApi'
import { buildAdvertenciaContent } from './pdfAdvertencia'
import type { AdvertenciaDoc } from './pdfAdvertencia'
import { buildSuspensaoContent } from './pdfSuspensao'
import { docDefinition, baixar } from './pdfComum'
import { downloadHistoricoExcel } from './excelHistorico'
import { formatarDataBr } from './datas'

export type FiltroHistorico = FiltroSuspensao
export type TipoHistorico = 'advertencia' | 'suspensao' | 'ambas'
export type FormatoHistorico = 'excel' | 'pdf'

export type Advertencia = {
    id: number
    data: string
    matricula: string
    nome: string
    tipo: string
    motivo: string
    complemento?: string | null
    assinada?: boolean
}

export async function listarAdvertencias(filtro: FiltroHistorico = {}): Promise<Advertencia[]> {
    const q = new URLSearchParams()
    if (filtro.matricula) q.set('matricula', filtro.matricula)
    if (filtro.nome) q.set('nome', filtro.nome)
    filtro.motivos?.forEach(m => q.append('motivos', m))
    if (filtro.de) q.set('de', filtro.de)
    if (filtro.ate) q.set('ate', filtro.ate)
    const qs = q.toString()
    const base = `${import.meta.env.VITE_API_URL}/api/Adiverts`
    const res = await fetch(qs ? `${base}?${qs}` : base, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`Erro ao carregar as advertências (erro ${res.status}).`)
    return res.json()
}

const seguro = (s: string) => s.trim().replace(/\s+/g, '_').replace(/[\\/:*?"<>|]+/g, '')

const sufixoTipo: Record<TipoHistorico, string> = {
    advertencia: 'advertencias',
    suspensao: 'suspensoes',
    ambas: 'advertencias_suspensoes',
}

/** Nome de arquivo descritivo: historico_<escopo>_<tipo>[_<periodo>].<ext> */
export function nomeArquivoHistorico(
    escopo: string, tipo: TipoHistorico, ext: 'pdf' | 'xlsx', de?: string, ate?: string,
): string {
    const periodo = de || ate
        ? `_${de ? formatarDataBr(de).replace(/\//g, '-') : 'inicio'}_a_${ate ? formatarDataBr(ate).replace(/\//g, '-') : 'hoje'}`
        : ''
    return `historico_${seguro(escopo)}_${sufixoTipo[tipo]}${periodo}.${ext}`
}

/**
 * Busca no servidor com o filtro e gera o arquivo. Devolve a quantidade de
 * registros incluídos; 0 significa que nada foi gerado (resultado vazio).
 */
export async function gerarHistorico(opts: {
    filtro: FiltroHistorico
    tipo: TipoHistorico
    formato: FormatoHistorico
    escopo: string
}): Promise<{ advertencias: number; suspensoes: number }> {
    const { filtro, tipo, formato, escopo } = opts
    const [advs, susps] = await Promise.all([
        tipo !== 'suspensao' ? listarAdvertencias(filtro) : Promise.resolve<Advertencia[]>([]),
        tipo !== 'advertencia' ? listarSuspensoes(filtro) : Promise.resolve<Suspensao[]>([]),
    ])
    const resultado = { advertencias: advs.length, suspensoes: susps.length }
    if (advs.length + susps.length === 0) return resultado

    const nomeArq = nomeArquivoHistorico(escopo, tipo, formato === 'pdf' ? 'pdf' : 'xlsx', filtro.de, filtro.ate)

    if (formato === 'excel') {
        downloadHistoricoExcel({
            advertencias: tipo !== 'suspensao' ? advs : undefined,
            suspensoes: tipo !== 'advertencia' ? susps : undefined,
        }, nomeArq)
        return resultado
    }

    // PDF: um documento por página; todos ordenados por data (emissão, nas suspensões)
    const docs: { data: string; bloco: () => Content[] }[] = [
        ...advs.map(a => {
            const doc: AdvertenciaDoc = {
                data: a.data, nome: a.nome, matricula: a.matricula, motivo: a.motivo,
                tipo: a.tipo, complemento: a.complemento ?? null,
            }
            return { data: a.data, bloco: () => buildAdvertenciaContent(doc, false) }
        }),
        ...susps.map(s => ({
            data: s.dataEmissao,
            bloco: () => buildSuspensaoContent(s, false),
        })),
    ].sort((a, b) => a.data.slice(0, 10).localeCompare(b.data.slice(0, 10)))

    const content: Content[] = []
    docs.forEach((d, idx) => {
        const bloco = d.bloco()
        if (idx > 0 && bloco.length > 0) {
            ;(bloco[0] as { pageBreak?: 'before' }).pageBreak = 'before'
        }
        content.push(...bloco)
    })
    await baixar(docDefinition(content), nomeArq)
    return resultado
}
