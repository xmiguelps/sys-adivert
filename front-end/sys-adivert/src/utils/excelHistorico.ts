import * as XLSX from 'xlsx'

export type AdvertenciaExcel = {
    data: string            // ISO date
    matricula: string | number
    nome: string
    tipo: string
    motivo: string
}

function formatDataBR(iso: string): string {
    const [yyyy, mm, dd] = iso.slice(0, 10).split('-')
    if (!yyyy || !mm || !dd) return iso
    return `${dd}/${mm}/${yyyy}`
}

/**
 * Gera e baixa um arquivo XLSX no modelo:
 * | Data | Matrícula | Nome | Tipo | Motivo |
 */
export function downloadHistoricoExcel(
    advertencias: AdvertenciaExcel[],
    filename: string
) {
    const header = ['Data', 'Matrícula', 'Nome', 'Tipo', 'Motivo']
    const body = advertencias.map(a => [
        formatDataBR(a.data),
        a.matricula,
        a.nome,
        a.tipo,
        a.motivo,
    ])

    const aoa = [header, ...body]
    const ws = XLSX.utils.aoa_to_sheet(aoa)

    // Larguras de coluna aproximadas da imagem
    ws['!cols'] = [
        { wch: 11 },  // Data
        { wch: 11 },  // Matrícula
        { wch: 36 },  // Nome
        { wch: 10 },  // Tipo
        { wch: 60 },  // Motivo
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico')
    XLSX.writeFile(wb, filename)
}
