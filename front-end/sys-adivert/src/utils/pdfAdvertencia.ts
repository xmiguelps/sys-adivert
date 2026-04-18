import jsPDF from 'jspdf'

export type AdvertenciaDoc = {
    data: string            // ISO date
    nome: string
    matricula: string | number
    motivo: string
    tipo?: string
}

const MESES_EXTENSO = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
]

/**
 * Formata uma data ISO no padrão "São Paulo, 30 de março de 2026."
 */
function formatDataExtenso(isoDate: string): string {
    const d = new Date(isoDate)
    if (isNaN(d.getTime())) return ''
    const dia = d.getDate()
    const mes = MESES_EXTENSO[d.getMonth()]
    const ano = d.getFullYear()
    return `São Paulo, ${dia} de ${mes} de ${ano}.`
}

/**
 * Desenha UMA advertência no PDF, no modelo padrão da empresa.
 * Se `doc` for passado, desenha na página atual; caso contrário cria um novo doc.
 * Retorna o doc (para encadeamento em multi-página).
 */
export function renderAdvertenciaPagina(adv: AdvertenciaDoc, doc?: jsPDF): jsPDF {
    const pdf = doc ?? new jsPDF({ unit: 'pt', format: 'a4' })

    // Dimensões A4 em pt: 595.28 x 841.89
    const pageW = pdf.internal.pageSize.getWidth()
    const marginX = 56          // ~2cm
    const contentW = pageW - marginX * 2

    let y = 70

    // ── Título ─────────────────────────────────────────────
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.text('ADVERTÊNCIA DISCIPLINAR', pageW / 2, y, { align: 'center' })
    y += 40

    // ── Empregador ─────────────────────────────────────────
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.text('Nome do Empregador: ', marginX, y)
    const labelEmpregadorW = pdf.getTextWidth('Nome do Empregador: ')
    pdf.setFont('helvetica', 'bolditalic')
    pdf.text('DANLEX SERVIÇOS LTDA.', marginX + labelEmpregadorW, y)
    y += 28

    // ── Empregado ──────────────────────────────────────────
    pdf.setFont('helvetica', 'normal')
    pdf.text('Nome do Empregado: ', marginX, y)
    const labelEmpregadoW = pdf.getTextWidth('Nome do Empregado: ')
    pdf.setFont('helvetica', 'bold')
    const nomeEmpregado = `${adv.nome.toUpperCase()} – ${adv.matricula}`
    pdf.text(nomeEmpregado, marginX + labelEmpregadoW, y)
    y += 34

    // ── Parágrafo inicial ──────────────────────────────────
    pdf.setFont('helvetica', 'normal')
    const introLinhas = pdf.splitTextToSize(
        'Esta tem a finalidade de aplicar lhe a pena de advertência disciplinar, em razão das seguintes ocorrências:',
        contentW
    )
    pdf.text(introLinhas, marginX, y)
    y += introLinhas.length * 14 + 4

    // ── Motivo (em negrito) ────────────────────────────────
    pdf.setFont('helvetica', 'bold')
    const motivoLinhas = pdf.splitTextToSize(adv.motivo, contentW)
    pdf.text(motivoLinhas, marginX, y)
    y += motivoLinhas.length * 14 + 14

    // ── Parágrafo pós-motivo ───────────────────────────────
    pdf.setFont('helvetica', 'normal')
    const esclarece = pdf.splitTextToSize(
        'Esclarecemos ainda que a repetição de procedimentos como este possa ser considerado como ato faltoso, passível de dispensa por justa causa.',
        contentW
    )
    pdf.text(esclarece, marginX, y)
    y += esclarece.length * 14 + 2

    const futuro = pdf.splitTextToSize(
        'Para que não tenhamos, no futuro, de tomar as medidas que nos facultam a legislação vigente, solicitamo-lhe que observe as normas reguladoras de relação de emprego.',
        contentW
    )
    pdf.text(futuro, marginX, y)
    y += futuro.length * 14 + 20

    // ── Ciente ─────────────────────────────────────────────
    pdf.setFont('helvetica', 'italic')
    pdf.text('Favor dar seu ciente na cópia ', marginX, y)
    const cienteW = pdf.getTextWidth('Favor dar seu ciente na cópia ')
    pdf.setFont('helvetica', 'bolditalic')
    pdf.text('deste', marginX + cienteW, y)
    pdf.setFont('helvetica', 'italic')
    pdf.text('.', marginX + cienteW + pdf.getTextWidth('deste'), y)
    y += 34

    // ── Local e data ───────────────────────────────────────
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text(formatDataExtenso(adv.data), marginX, y)
    y += 30

    pdf.setFont('helvetica', 'bold')
    pdf.text('Ciente em _____ / _____ / _______', marginX, y)
    y += 60

    // ── Linhas de assinatura (empregador + empregado) ──────
    const col1X = marginX
    const col2X = pageW / 2 + 10
    const linhaLen = (pageW / 2) - marginX - 20

    pdf.setDrawColor(0)
    pdf.setLineWidth(0.8)
    pdf.line(col1X, y, col1X + linhaLen, y)
    pdf.line(col2X, y, col2X + linhaLen, y)
    y += 14

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    // Centraliza o label de cada coluna
    pdf.text('DANLEX SERVIÇOS LTDA', col1X + linhaLen / 2, y, { align: 'center' })
    pdf.text(`${adv.nome.toUpperCase()} - ${adv.matricula}`, col2X + linhaLen / 2, y, { align: 'center' })
    y += 50

    // ── Linhas de testemunha ───────────────────────────────
    pdf.line(col1X, y, col1X + linhaLen, y)
    pdf.line(col2X, y, col2X + linhaLen, y)
    y += 14
    pdf.text('TESTEMUNHA', col1X + linhaLen / 2, y, { align: 'center' })
    pdf.text('TESTEMUNHA', col2X + linhaLen / 2, y, { align: 'center' })

    return pdf
}

/**
 * Gera e baixa um PDF com UMA advertência (para botão "Baixar PDF" da linha selecionada).
 */
export function downloadAdvertenciaPDF(adv: AdvertenciaDoc, filename?: string) {
    const doc = renderAdvertenciaPagina(adv)
    const nomeArq = filename ?? `advertencia-${adv.nome.replace(/\s+/g, '_')}.pdf`
    doc.save(nomeArq)
}

/**
 * Gera e baixa um PDF com MÚLTIPLAS advertências (uma por página).
 * Usado nos históricos "por motivo" (mensal ou diário).
 */
export function downloadAdvertenciasMultiPDF(
    advertencias: AdvertenciaDoc[],
    filename: string
) {
    if (advertencias.length === 0) return
    let doc: jsPDF | undefined
    advertencias.forEach((adv, idx) => {
        if (idx === 0) {
            doc = renderAdvertenciaPagina(adv)
        } else {
            doc!.addPage()
            renderAdvertenciaPagina(adv, doc)
        }
    })
    doc!.save(filename)
}
