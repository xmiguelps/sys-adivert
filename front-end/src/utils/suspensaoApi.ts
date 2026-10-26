const API = () => `${import.meta.env.VITE_API_URL}/api/Suspensoes`

export type Suspensao = {
    id: number
    dataEmissao: string
    matricula: string
    nome: string
    dias: number
    dataInicio: string
    dataRetorno: string
    motivo: string
    complemento?: string | null
    assinada: boolean
}

export type SuspensaoEvidenciaRead = {
    id: number
    contentType: string
    base64: string
    nomeArquivo?: string | null
    ordem: number
}

export type SuspensaoDetalhe = Suspensao & { evidencias: SuspensaoEvidenciaRead[] }

export type EvidenciaEnvio = { contentType: string; base64: string; nomeArquivo?: string }

export type SuspensaoPayload = {
    dataEmissao: string
    matricula: string
    nome: string
    dias: number
    dataInicio: string
    dataRetorno: string
    motivo: string
    complemento?: string | null
}

export type FiltroSuspensao = {
    matricula?: string
    nome?: string
    motivos?: string[]
    de?: string
    ate?: string
}

// Erros 400/409/422 trazem { mensagem }
async function falhar(res: Response, padrao: string): Promise<never> {
    const corpo = await res.json().catch(() => null)
    throw new Error(corpo?.mensagem ?? `${padrao} (erro ${res.status}).`)
}

export async function listarSuspensoes(filtro: FiltroSuspensao = {}): Promise<Suspensao[]> {
    const q = new URLSearchParams()
    if (filtro.matricula) q.set('matricula', filtro.matricula)
    if (filtro.nome) q.set('nome', filtro.nome)
    filtro.motivos?.forEach(m => q.append('motivos', m))
    if (filtro.de) q.set('de', filtro.de)
    if (filtro.ate) q.set('ate', filtro.ate)
    const qs = q.toString()
    const res = await fetch(qs ? `${API()}?${qs}` : API(), { headers: { Accept: 'application/json' } })
    if (!res.ok) await falhar(res, 'Não foi possível carregar as suspensões')
    return res.json()
}

export async function obterSuspensao(id: number): Promise<SuspensaoDetalhe | null> {
    const res = await fetch(`${API()}/${id}`, { headers: { Accept: 'application/json' } })
    return res.ok ? res.json() : null
}

export async function criarSuspensao(
    payload: SuspensaoPayload,
    evidencias: EvidenciaEnvio[],
): Promise<number> {
    const res = await fetch(API(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, evidencias }),
    })
    if (!res.ok) await falhar(res, 'Erro ao salvar a suspensão')
    const { id } = await res.json()
    return id as number
}

export async function atualizarSuspensao(
    id: number,
    payload: SuspensaoPayload,
    evidenciasParaAdicionar: EvidenciaEnvio[],
    evidenciasParaRemoverIds: number[],
): Promise<void> {
    const res = await fetch(`${API()}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, evidenciasParaAdicionar, evidenciasParaRemoverIds }),
    })
    if (!res.ok) await falhar(res, 'Erro ao atualizar a suspensão')
}

export async function assinarSuspensao(id: number, assinada: boolean): Promise<void> {
    const res = await fetch(`${API()}/${id}/assinatura`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assinada }),
    })
    if (!res.ok) await falhar(res, 'Erro ao atualizar a assinatura')
}

export async function excluirSuspensao(id: number): Promise<boolean> {
    const res = await fetch(`${API()}/${id}`, { method: 'DELETE' })
    return res.ok
}
