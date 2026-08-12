export const MESES_NOMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export const MESES_NOMES_LOWER = MESES_NOMES.map(m => m.toLowerCase())

/**
 * Ano e mês atuais (mês zero-based, como Date.getMonth()).
 */
export function getAnoMesAtual() {
    const now = new Date()
    return { ano: now.getFullYear(), mes: now.getMonth() }
}

/**
 * Retorna ano, mês e dia atuais (mês zero-based).
 */
export function getAnoMesDiaAtual() {
    const now = new Date()
    return { ano: now.getFullYear(), mes: now.getMonth(), dia: now.getDate() }
}

/**
 * Retorna a lista de anos de (atual-5) até o atual, em ordem decrescente.
 */
export function listaAnos(): number[] {
    const atual = new Date().getFullYear()
    const out: number[] = []
    for (let a = atual; a >= atual - 5; a--) out.push(a)
    return out
}

/**
 * Verifica se a combinação (ano, mes) está no futuro em relação ao mês/ano atuais.
 * mes é zero-based.
 */
export function isMesFuturo(ano: number, mes: number): boolean {
    const atual = new Date()
    const anoA = atual.getFullYear()
    const mesA = atual.getMonth()
    if (ano > anoA) return true
    if (ano === anoA && mes > mesA) return true
    return false
}

/**
 * Verifica se a data (ano, mes, dia) está no futuro em relação a hoje.
 * mes é zero-based.
 */
export function isDataFutura(ano: number, mes: number, dia: number): boolean {
    const alvo = new Date(ano, mes, dia)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    return alvo.getTime() > hoje.getTime()
}

/**
 * Número de dias em um mês/ano.
 */
export function diasNoMes(ano: number, mes: number): number {
    return new Date(ano, mes + 1, 0).getDate()
}

/**
 * Parses a date string (ISO or YYYY-MM-DD) as a LOCAL date,
 * avoiding the UTC-offset bug where "2026-04-21" becomes April 20 in UTC-3.
 */
export function parseDataLocal(iso: string): Date {
    const [yyyy, mm, dd] = iso.slice(0, 10).split('-').map(Number)
    return new Date(yyyy, mm - 1, dd)
}

/**
 * Filtra advertências por mês/ano (mes zero-based).
 */
export function filtrarPorMes<T extends { data: string }>(
    lista: T[],
    ano: number,
    mes: number
): T[] {
    return lista.filter(a => {
        const d = parseDataLocal(a.data)
        return d.getFullYear() === ano && d.getMonth() === mes
    })
}

/**
 * Filtra advertências por dia/mês/ano (mes zero-based).
 */
export function filtrarPorDia<T extends { data: string }>(
    lista: T[],
    ano: number,
    mes: number,
    dia: number
): T[] {
    return lista.filter(a => {
        const d = parseDataLocal(a.data)
        return d.getFullYear() === ano && d.getMonth() === mes && d.getDate() === dia
    })
}
