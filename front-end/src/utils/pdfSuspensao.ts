import type { Content } from 'pdfmake/interfaces'
import {
    blank, twoCol, UNDERSCORES, formatDataExtenso, evidenciasContent,
    docDefinition, baixar, gerarBlob,
} from './pdfComum'
import type { EvidenciaDoc } from './pdfComum'
import { formatarDataBr } from './datas'

export type SuspensaoDoc = {
    dataEmissao: string     // YYYY-MM-DD
    nome: string
    matricula: string | number
    dias: number
    dataInicio: string
    dataRetorno: string
    motivo: string
    complemento?: string | null
    evidencias?: EvidenciaDoc[]
}

/**
 * Conteudo de UMA suspensao, no modelo do PDF de referencia
 * (docs/referencias/suspensao-disciplinar-1-dia.pdf); evidencias em paginas proprias.
 */
export function buildSuspensaoContent(s: SuspensaoDoc, incluirEvidencias: boolean): Content[] {
    const nome = String(s.nome).toUpperCase()
    const nomeCompleto = `${nome} - ${s.matricula}`
    const dias = `${s.dias} ${s.dias === 1 ? 'dia' : 'dias'}`

    const content: Content[] = [
        { text: 'SUSPENSÃO DISCIPLINAR', bold: true, alignment: 'center' },
        blank(),
        blank(),
        { text: ['Nome do Empregador: ', { text: 'DANLEX SERVIÇOS LTDA.', bold: true }] },
        blank(),
        blank(),
        { text: ['Nome do Empregado: ', { text: nomeCompleto, bold: true }] },
        blank(),
        blank(),
        {
            text: `Esta tem a finalidade de aplicar-lhe a pena de suspensão disciplinar, por ${dias} a partir de ${formatarDataBr(s.dataInicio)}, tendo que retornar ao trabalho no dia ${formatarDataBr(s.dataRetorno)} (Conforme sua escala), em razão da seguinte ocorrência:`,
        },
        blank(),
        { text: s.motivo, bold: true },
        blank(),
    ]

    const complemento = (s.complemento ?? '').trim()
    if (complemento) {
        content.push({ text: complemento, bold: true })
        content.push(blank())
    }

    content.push(
        { text: 'Esclarecemos ainda que a repetição de procedimentos como este possa ser considerada como ato faltoso, passível de dispensa por justa causa.' },
        { text: 'Para que não tenhamos, no futuro, de tomar as medidas que nos facultam a legislação vigente, solicitamo-lhe que observe as normas reguladoras de relação de emprego.' },
        blank(),
        blank(),
        { text: 'Favor dar seu ciente na cópia deste.' },
        blank(),
        blank(),
        { text: formatDataExtenso(s.dataEmissao) },
        blank(),
        blank(),
        { text: 'Ciente em ____/____/______' },
        blank(),
        blank(),
        blank(),
        twoCol(UNDERSCORES, UNDERSCORES),
        twoCol('DANLEX SERVIÇOS LTDA', nome, true),
        blank(),
        blank(),
        twoCol(UNDERSCORES, UNDERSCORES),
        twoCol('TESTEMUNHA', 'TESTEMUNHA', true),
    )

    if (incluirEvidencias) content.push(...evidenciasContent(s.evidencias ?? []))

    return content
}

/** Gera e baixa o PDF de UMA suspensao (com complemento e evidencias). */
export async function downloadSuspensaoPdf(s: SuspensaoDoc, filename?: string) {
    const nome = filename ?? `suspensao-${String(s.nome).trim().replace(/\s+/g, '_').replace(/[/:*?"<>|]+/g, '')}.pdf`
    await baixar(docDefinition(buildSuspensaoContent(s, true)), nome)
}

/** Mesmo PDF, devolvido como Blob (para empacotar varios em um .zip). */
export function getSuspensaoPdfBlob(s: SuspensaoDoc): Promise<Blob> {
    return gerarBlob(docDefinition(buildSuspensaoContent(s, true)))
}
