import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    TabStopType,
} from 'docx'
import { saveAs } from 'file-saver'

export type AdvertenciaDoc = {
    data: string            // ISO date or YYYY-MM-DD
    nome: string
    matricula: string | number
    motivo: string
    tipo?: string
}

const FONT = 'Calibri'
const SIZE = 24          // 12pt em half-points

const MESES_EXTENSO = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/**
 * Parses a date string (ISO or YYYY-MM-DD) as a LOCAL date,
 * avoiding the UTC-offset bug where "2026-04-21" becomes April 20 in UTC-3.
 */
function parseDataLocal(isoDate: string): Date {
    const [yyyy, mm, dd] = isoDate.slice(0, 10).split('-').map(Number)
    return new Date(yyyy, mm - 1, dd)
}

/**
 * Formats a date to "São Paulo, 21 de abril de 2026."
 */
function formatDataExtenso(isoDate: string): string {
    const d = parseDataLocal(isoDate)
    if (isNaN(d.getTime())) return ''
    const dia = d.getDate()
    const mes = MESES_EXTENSO[d.getMonth()]
    const ano = d.getFullYear()
    return `São Paulo, ${dia} de ${mes} de ${ano}.`
}

/** Helper: empty paragraph for blank line */
function emptyLine(): Paragraph {
    return new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: '', font: FONT, size: SIZE })],
    })
}

/** Helper: TextRun with default font/size */
function run(text: string, opts: { bold?: boolean; italics?: boolean } = {}): TextRun {
    return new TextRun({ text, font: FONT, size: SIZE, ...opts })
}

/**
 * Builds a single advertência as an array of DOCX Paragraphs.
 *
 * Layout  (cada "espaço de 1 enter" = emptyLine()):
 *
 *   ADVERTÊNCIA DISCIPLINAR
 *   [blank][blank]
 *   Nome do Empregador: DANLEX SERVIÇOS LTDA.
 *   [blank][blank]
 *   Nome do Empregado: NOME – MATRICULA
 *   [blank][blank]
 *   Esta tem a finalidade...
 *   [blank]
 *   *motivo*
 *   [blank]
 *   Esclarecemos ainda...
 *   Para que não tenhamos...      ← sem linha em branco entre eles
 *   [blank][blank]
 *   Favor dar seu ciente na cópia deste.
 *   [blank][blank]
 *   São Paulo, DD de mês de YYYY.
 *   [blank][blank]
 *   Ciente em ____/____/______
 *   [blank][blank][blank]
 *   _____________________   _____________________
 *   DANLEX SERVIÇOS LTDA    NOME – MATRICULA
 *   [blank][blank]
 *   _____________________   _____________________
 *   TESTEMUNHA              TESTEMUNHA
 */
function buildAdvertenciaParagraphs(adv: AdvertenciaDoc): Paragraph[] {
    const nomeCompleto = `${adv.nome.toUpperCase()} – ${adv.matricula}`

    // Content area: US Letter (12 240 DXA) − margins (1 134 × 2) = 9 972 DXA
    // Each half = 4 986 DXA → center of left half ≈ 2 493, center of right half ≈ 7 479

    const LEFT_CENTER  = 2493
    const RIGHT_CENTER = 7479
    const UNDERSCORES = '_'.repeat(37)

    /**
     * Two-column paragraph with CENTER tab stops at each half's midpoint.
     * Leading \t jumps to the left-center; second \t jumps to the right-center.
     */
    function twoCol(leftText: string, rightText: string, bold = false): Paragraph {
        return new Paragraph({
            spacing: { before: 0, after: 0 },
            tabStops: [
                { type: TabStopType.CENTER, position: LEFT_CENTER },
                { type: TabStopType.CENTER, position: RIGHT_CENTER },
            ],
            children: [
                run('\t'),
                run(leftText, { bold }),
                run('\t'),
                run(rightText, { bold }),
            ],
        })
    }

    return [
        // ── Título ──────────────────────────────────────────────────────────
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [run('ADVERTÊNCIA DISCIPLINAR', { bold: true })],
        }),
        emptyLine(),
        emptyLine(),

        // ── Nome do Empregador ───────────────────────────────────────────────
        new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [
                run('Nome do Empregador: '),
                run('DANLEX SERVIÇOS LTDA.', { bold: true }),
            ],
        }),
        emptyLine(),
        emptyLine(),

        // ── Nome do Empregado ────────────────────────────────────────────────
        new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [
                run('Nome do Empregado: '),
                run(nomeCompleto, { bold: true }),
            ],
        }),
        emptyLine(),
        emptyLine(),

        // ── Parágrafo inicial ────────────────────────────────────────────────
        new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [
                run('Esta tem a finalidade de aplicar lhe a pena de advertência disciplinar, em razão das seguintes ocorrências:'),
            ],
        }),
        emptyLine(),

        // ── Motivo ───────────────────────────────────────────────────────────
        new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [run(adv.motivo, { bold: true })],
        }),
        emptyLine(),

        // ── Esclarecemos (sem blank antes de "Para que não") ─────────────────
        new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [
                run('Esclarecemos ainda que a repetição de procedimentos como este possa ser considerado como ato faltoso, passível de dispensa por justa causa.'),
            ],
        }),

        // ── Para que não (colado ao parágrafo anterior) ──────────────────────
        new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [
                run('Para que não tenhamos, no futuro, de tomar as medidas que nos facultam a legislação vigente, solicitamo-lhe que observe as normas reguladoras de relação de emprego.'),
            ],
        }),
        emptyLine(),
        emptyLine(),

        // ── Favor dar ciente ─────────────────────────────────────────────────
        new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [run('Favor dar seu ciente na cópia deste.')],
        }),
        emptyLine(),
        emptyLine(),

        // ── Data ─────────────────────────────────────────────────────────────
        new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [run(formatDataExtenso(adv.data))],
        }),
        emptyLine(),
        emptyLine(),

        // ── Ciente em ────────────────────────────────────────────────────────
        new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [run('Ciente em ____/____/______')],
        }),
        emptyLine(),
        emptyLine(),
        emptyLine(),

        // ── Linhas de assinatura (underscores) ───────────────────────────────
        twoCol(UNDERSCORES, UNDERSCORES),

        // ── Labels: empresa / empregado ──────────────────────────────────────
        twoCol('DANLEX SERVIÇOS LTDA', nomeCompleto, true),
        emptyLine(),
        emptyLine(),

        // ── Linhas de testemunha (underscores) ───────────────────────────────
        twoCol(UNDERSCORES, UNDERSCORES),

        // ── Labels: testemunhas ───────────────────────────────────────────────
        twoCol('TESTEMUNHA', 'TESTEMUNHA', true),
    ]
}

/**
 * Gera e baixa um arquivo Word (.docx) com UMA advertência.
 */
export async function downloadAdvertenciaWord(adv: AdvertenciaDoc, filename?: string) {
    const doc = new Document({
        styles: {
            default: {
                document: { run: { font: FONT, size: SIZE } },
            },
        },
        sections: [
            {
                properties: {
                    page: {
                        size: { width: 12240, height: 15840 },
                        margin: { top: 1000, right: 1134, bottom: 1000, left: 1134 },
                    },
                },
                children: buildAdvertenciaParagraphs(adv),
            },
        ],
    })

    const blob = await Packer.toBlob(doc)
    const nomeArq = filename ?? `advertencia-${adv.nome.replace(/\s+/g, '_')}.docx`
    saveAs(blob, nomeArq)
}

/**
 * Gera e baixa um arquivo Word (.docx) com MÚLTIPLAS advertências (uma por página).
 */
export async function downloadAdvertenciasMultiWord(
    advertencias: AdvertenciaDoc[],
    filename: string,
) {
    if (advertencias.length === 0) return

    const sections = advertencias.map((adv) => ({
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1000, right: 1134, bottom: 1000, left: 1134 },
            },
        },
        children: buildAdvertenciaParagraphs(adv),
    }))

    const doc = new Document({
        styles: {
            default: {
                document: { run: { font: FONT, size: SIZE } },
            },
        },
        sections,
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, filename)
}
