import type { Content } from 'pdfmake/interfaces'
import {
    blank, twoCol, UNDERSCORES, formatDataExtenso, evidenciasContent,
    docDefinition, baixar, gerarBlob,
} from './pdfComum'
import type { EvidenciaDoc } from './pdfComum'

export type { EvidenciaDoc }

export type AdvertenciaDoc = {
    data: string            // ISO date ou YYYY-MM-DD
    nome: string
    matricula: string | number
    motivo: string
    tipo?: string
    complemento?: string | null
    evidencias?: EvidenciaDoc[]
}

/**
 * Constroi o conteudo de UMA advertencia (pagina 1 = carta, com o complemento
 * abaixo do motivo; imagens de evidencia comecam cada uma em uma nova pagina).
 */
export function buildAdvertenciaContent(adv: AdvertenciaDoc, incluirEvidencias: boolean): Content[] {
    const nomeCompleto = `${String(adv.nome).toUpperCase()} – ${adv.matricula}`

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
        content.push(...evidenciasContent(adv.evidencias ?? []))
    }

    return content
}

/**
 * Gera e baixa o PDF de UMA advertencia (com complemento e evidencias).
 */
export async function downloadAdvertenciaPdf(adv: AdvertenciaDoc, filename?: string) {
    const dd = docDefinition(buildAdvertenciaContent(adv, true))
    const nome = filename ?? `advertencia-${String(adv.nome).replace(/\s+/g, '_')}.pdf`
    await baixar(dd, nome)
}

/**
 * Gera o PDF de UMA advertencia (com complemento e evidencias) e retorna o Blob,
 * sem disparar download — usado para empacotar varios PDFs em um .zip.
 */
export async function getAdvertenciaPdfBlob(adv: AdvertenciaDoc): Promise<Blob> {
    return gerarBlob(docDefinition(buildAdvertenciaContent(adv, true)))
}
