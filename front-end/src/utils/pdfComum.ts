import pdfMake from 'pdfmake/build/pdfmake'
import vfs from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces'
import { parseDataLocal } from './datas'

// Registra o virtual file system das fontes (Roboto ja vem pre-configurado como
// fonte padrao no pdfmake). Feito uma unica vez.
let vfsRegistrado = false
export function garantirFontes() {
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

// ── Geometria (equivalente ao Word original, convertida de DXA para pontos) ──
// US Letter; margens top/bottom 1000 DXA -> 50pt; left/right 1134 DXA -> ~56.7pt.
export const PAGE_SIZE = 'LETTER'
export const MARGENS: [number, number, number, number] = [56.7, 50, 56.7, 50]
export const FONT_SIZE = 12
// Area util aproximada para as imagens (612-56.7*2 x 792-50*2).
const IMG_FIT: [number, number] = [498, 690]

export const UNDERSCORES = '_'.repeat(37)

const MESES_EXTENSO = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

export function formatDataExtenso(isoDate: string): string {
    const d = parseDataLocal(isoDate)
    if (isNaN(d.getTime())) return ''
    return `São Paulo, ${d.getDate()} de ${MESES_EXTENSO[d.getMonth()]} de ${d.getFullYear()}.`
}

/** Linha em branco (mesma ideia do emptyLine() do Word). */
export function blank(): Content {
    return { text: ' ', fontSize: FONT_SIZE }
}

export function twoCol(esq: string, dir: string, bold = false): Content {
    return {
        columns: [
            { text: esq, alignment: 'center', width: '*', bold },
            { text: dir, alignment: 'center', width: '*', bold },
        ],
    }
}

function toDataUrl(ev: EvidenciaDoc): string {
    if (ev.base64.startsWith('data:')) return ev.base64
    const tipo = ev.contentType || 'image/jpeg'
    return `data:${tipo};base64,${ev.base64}`
}

/** Evidencias: uma imagem por pagina, comecando na pagina seguinte. */
export function evidenciasContent(evidencias: EvidenciaDoc[]): Content[] {
    return evidencias.map(ev => ({
        image: toDataUrl(ev),
        fit: IMG_FIT,
        alignment: 'center',
        pageBreak: 'before',
    }))
}

export function docDefinition(content: Content[]): TDocumentDefinitions {
    return {
        pageSize: PAGE_SIZE,
        pageMargins: MARGENS,
        defaultStyle: { fontSize: FONT_SIZE },
        content,
    }
}

export function baixar(dd: TDocumentDefinitions, filename: string): Promise<void> {
    garantirFontes()
    return pdfMake.createPdf(dd).download(filename)
}

export function gerarBlob(dd: TDocumentDefinitions): Promise<Blob> {
    garantirFontes()
    return pdfMake.createPdf(dd).getBlob()
}
