import * as XLSX from 'xlsx'

export type AdvertenciaExcel = {
    data: string            // ISO date
    matricula: string | number
    nome: string
    tipo: string
    motivo: string
    assinada?: boolean
}

export type SuspensaoExcel = {
    dataEmissao: string     // ISO date
    matricula: string | number
    nome: string
    dias: number
    dataInicio: string
    dataRetorno: string
    motivo: string
    assinada?: boolean
}

function formatDataBR(iso: string): string {
    const [yyyy, mm, dd] = iso.slice(0, 10).split('-')
    if (!yyyy || !mm || !dd) return iso
    return `${dd}/${mm}/${yyyy}`
}

const sim = (v?: boolean) => (v ? 'Sim' : 'Não')

function abaAdvertencias(lista: AdvertenciaExcel[]) {
    const header = ['Data', 'Matrícula', 'Nome', 'Tipo', 'Motivo', 'Assinada']
    const body = lista.map(a => [
        formatDataBR(a.data), a.matricula, a.nome, a.tipo, a.motivo, sim(a.assinada),
    ])
    const ws = XLSX.utils.aoa_to_sheet([header, ...body])
    ws['!cols'] = [
        { wch: 11 },  // Data
        { wch: 11 },  // Matrícula
        { wch: 36 },  // Nome
        { wch: 10 },  // Tipo
        { wch: 60 },  // Motivo
        { wch: 10 },  // Assinada
    ]
    return ws
}

function abaSuspensoes(lista: SuspensaoExcel[]) {
    const header = ['Emissão', 'Matrícula', 'Nome', 'Dias', 'Início', 'Retorno', 'Motivo', 'Assinada']
    const body = lista.map(s => [
        formatDataBR(s.dataEmissao), s.matricula, s.nome, s.dias,
        formatDataBR(s.dataInicio), formatDataBR(s.dataRetorno), s.motivo, sim(s.assinada),
    ])
    const ws = XLSX.utils.aoa_to_sheet([header, ...body])
    ws['!cols'] = [
        { wch: 11 },  // Emissão
        { wch: 11 },  // Matrícula
        { wch: 36 },  // Nome
        { wch: 6 },   // Dias
        { wch: 11 },  // Início
        { wch: 11 },  // Retorno
        { wch: 60 },  // Motivo
        { wch: 10 },  // Assinada
    ]
    return ws
}

/**
 * Gera e baixa um XLSX com uma aba por tipo informado
 * ("Advertências" e/ou "Suspensões").
 */
export function downloadHistoricoExcel(
    dados: { advertencias?: AdvertenciaExcel[]; suspensoes?: SuspensaoExcel[] },
    filename: string
) {
    const wb = XLSX.utils.book_new()
    if (dados.advertencias) XLSX.utils.book_append_sheet(wb, abaAdvertencias(dados.advertencias), 'Advertências')
    if (dados.suspensoes) XLSX.utils.book_append_sheet(wb, abaSuspensoes(dados.suspensoes), 'Suspensões')
    XLSX.writeFile(wb, filename)
}
