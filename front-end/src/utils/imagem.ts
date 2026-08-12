// Utilitario para transformar arquivos de imagem (jpg/png/webp) em evidencias
// prontas para envio: redimensiona e comprime no navegador, sempre gerando JPEG
// (formato que o pdfmake consegue embutir no PDF).

export type EvidenciaLocal = {
    contentType: string   // sempre 'image/jpeg' apos a compressao
    base64: string        // base64 puro (sem o prefixo data:)
    nomeArquivo?: string
    previewUrl: string    // data URL usada apenas para o <img> de preview
}

const MAX_DIM = 1600      // maior lado da imagem, em pixels
const QUALITY = 0.8       // qualidade do JPEG (0..1)

/**
 * Le um File de imagem, corrige orientacao (EXIF), redimensiona para no maximo
 * MAX_DIM no maior lado e comprime como JPEG. Retorna null se nao for possivel
 * processar (arquivo invalido / formato nao suportado pelo navegador).
 */
export async function fileParaEvidencia(file: File): Promise<EvidenciaLocal | null> {
    try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

        const maior = Math.max(bitmap.width, bitmap.height) || 1
        const escala = Math.min(1, MAX_DIM / maior)
        const w = Math.max(1, Math.round(bitmap.width * escala))
        const h = Math.max(1, Math.round(bitmap.height * escala))

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            bitmap.close()
            return null
        }
        // Fundo branco: JPEG nao tem canal alfa; sem isso, areas transparentes
        // de PNG/WEBP ficariam pretas.
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(bitmap, 0, 0, w, h)
        bitmap.close()

        const previewUrl = canvas.toDataURL('image/jpeg', QUALITY)
        const base64 = previewUrl.split(',')[1] ?? ''
        if (!base64) return null

        return {
            contentType: 'image/jpeg',
            base64,
            nomeArquivo: file.name,
            previewUrl,
        }
    } catch {
        return null
    }
}
