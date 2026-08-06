import pdfMake from 'pdfmake/build/pdfmake'
import vfs from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces'

// Registra o virtual file system das fontes (Roboto ja vem pre-configurado como
// fonte padrao no pdfmake). Feito uma unica vez.
let vfsRegistrado = false
function garantirFontes() {
    if (!vfsRegistrado) {
        // Métodos são chamados no objeto pdfMake (instância singleton do pdfmake 0.3.x);
        // chamá-los "soltos" perderia o `this` e quebraria em runtime.
        pdfMake.addVirtualFileSystem(vfs)
        vfsRegistrado = true
    }
}

export type EvidenciaDoc = {
    contentType: string
    base64: string        // base64 puro OU data URL
}

export type AdvertenciaDoc = {
    data: string            // ISO date ou YYYY-MM-DD
    nome: string
    matricula: string | number
    motivo: string
    tipo?: string
    complemento?: string | null
    evidencias?: EvidenciaDoc[]
}

// ── Geometria (equivalente ao Word original, convertida de DXA para pontos) ──
// US Letter; margens top/bottom 1000 DXA -> 50pt; left/right 1134 DXA -> ~56.7pt.
const PAGE_SIZE = 'LETTER'
const MARGENS: [number, number, number, number] = [56.7, 50, 56.7, 50]
const FONT_SIZE = 12
// Area util aproximada para as imagens (612-56.7*2 x 792-50*2).
const IMG_FIT: [number, number] = [498, 690]

const MESES_EXTENSO = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function parseDataLocal(isoDate: string): Date {
    const [yyyy, mm, dd] = isoDate.slice(0, 10).split('-').map(Number)
    return new Date(yyyy, mm - 1, dd)
}

function formatDataExtenso(isoDate: string): string {
    const d = parseDataLocal(isoDate)
    if (isNaN(d.getTime())) return ''
    return `São Paulo, ${d.getDate()} de ${MESES_EXTENSO[d.getMonth()]} de ${d.getFullYear()}.`
}

/** Linha em branco (mesma ideia do emptyLine() do Word). */
function blank(): Content {
    return { text: ' ', fontSize: FONT_SIZE }
}

function toDataUrl(ev: EvidenciaDoc): string {
    if (ev.base64.startsWith('data:')) return ev.base64
    const tipo = ev.contentType || 'image/jpeg'
    return `data:${tipo};base64,${ev.base64}`
}

/**
 * Constroi o conteudo de UMA advertencia (pagina 1 = carta, com o complemento
 * abaixo do motivo; imagens de evidencia comecam cada uma em uma nova pagina).
 */
function buildAdvertenciaContent(adv: AdvertenciaDoc, incluirEvidencias: boolean): Content[] {
    const nomeCompleto = `${String(adv.nome).toUpperCase()} – ${adv.matricula}`
    const UNDERSCORES = '_'.repeat(37)

    const twoCol = (esq: string, dir: string, bold = false): Content => ({
        columns: [
            { text: esq, alignment: 'center', width: '*', bold },
            { text: dir, alignment: 'center', width: '*', bold },
        ],
    })

    const content: Content[] = [
        { text: 'ADVERTÊNCIA DISCIPLINAR', bold: true, alignment: 'center' },
        blank(),
        blank(),
        { text: ['Nome do Empregador: ', { text: 'DANLEX SERVIÇOS LTDA.', bold: true }] },
        blank(),
        blank(),
        { text: ['Nome do Empregado: ', { text: nomeCompleto, bold: true }] },
        blank(),
        blank(),
        { text: 'Esta tem a finalidade de aplicar lhe a pena de advertência disciplinar, em razão das seguintes ocorrências:' },
        blank(),
        { text: adv.motivo, bold: true },
        blank(),
    ]

    // ── Complemento (opcional), logo abaixo do motivo ──
    const complemento = (adv.complemento ?? '').trim()
    if (complemento) {
        content.push({ text: complemento, bold: true })
        content.push(blank())
    }

    content.push(
        { text: 'Esclarecemos ainda que a repetição de procedimentos como este possa ser considerado como ato faltoso, passível de dispensa por justa causa.' },
        { text: 'Para que não tenhamos, no futuro, de tomar as medidas que nos facultam a legislação vigente, solicitamo-lhe que observe as normas reguladoras de relação de emprego.' },
        blank(),
        blank(),
        { text: 'Favor dar seu ciente na cópia deste.' },
        blank(),
        blank(),
        { text: formatDataExtenso(adv.data) },
        blank(),
        blank(),
        { text: 'Ciente em ____/____/______' },
        blank(),
        blank(),
        blank(),
        twoCol(UNDERSCORES, UNDERSCORES),
        twoCol('DANLEX SERVIÇOS LTDA', nomeCompleto, true),
        blank(),
        blank(),
        twoCol(UNDERSCORES, UNDERSCORES),
        twoCol('TESTEMUNHA', 'TESTEMUNHA', true),
    )

    // ── Evidencias: uma imagem por pagina, comecando na pagina seguinte ──
    if (incluirEvidencias) {
        const evidencias = adv.evidencias ?? []
        for (const ev of evidencias) {
            content.push({
                image: toDataUrl(ev),
                fit: IMG_FIT,
                alignment: 'center',
                pageBreak: 'before',
            })
        }
    }

    return content
}

function baixar(dd: TDocumentDefinitions, filename: string): Promise<void> {
    garantirFontes()
    return pdfMake.createPdf(dd).download(filename)
}

/**
 * Gera e baixa o PDF de UMA advertencia (com complemento e evidencias).
 */
export async function downloadAdvertenciaPdf(adv: AdvertenciaDoc, filename?: string) {
    const dd: TDocumentDefinitions = {
        pageSize: PAGE_SIZE,
        pageMargins: MARGENS,
        defaultStyle: { fontSize: FONT_SIZE },
        content: buildAdvertenciaContent(adv, true),
    }
    const nome = filename ?? `advertencia-${String(adv.nome).replace(/\s+/g, '_')}.pdf`
    await baixar(dd, nome)
}

/**
 * Gera o PDF de UMA advertencia (com complemento e evidencias) e retorna o Blob,
 * sem disparar download — usado para empacotar varios PDFs em um .zip.
 */
export async function getAdvertenciaPdfBlob(adv: AdvertenciaDoc): Promise<Blob> {
    garantirFontes()
    const dd: TDocumentDefinitions = {
        pageSize: PAGE_SIZE,
        pageMargins: MARGENS,
        defaultStyle: { fontSize: FONT_SIZE },
        content: buildAdvertenciaContent(adv, true),
    }
    return pdfMake.createPdf(dd).getBlob()
}

/**
 * Gera e baixa o PDF em lote (uma advertencia por pagina). Inclui o complemento,
 * mas NAO inclui as imagens de evidencia (mantem o arquivo do historico enxuto).
 */
export async function downloadAdvertenciasMultiPdf(
    advertencias: AdvertenciaDoc[],
    filename: string,
    incluirEvidencias = false,
) {
    if (advertencias.length === 0) return

    const content: Content[] = []
    advertencias.forEach((adv, idx) => {
        const bloco = buildAdvertenciaContent(adv, incluirEvidencias)
        if (idx > 0 && bloco.length > 0) {
            // cada advertencia comeca em uma nova pagina
            ;(bloco[0] as { pageBreak?: 'before' }).pageBreak = 'before'
        }
        content.push(...bloco)
    })

    const dd: TDocumentDefinitions = {
        pageSize: PAGE_SIZE,
        pageMargins: MARGENS,
        defaultStyle: { fontSize: FONT_SIZE },
        content,
    }
    await baixar(dd, filename)
}
