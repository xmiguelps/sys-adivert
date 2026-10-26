namespace sys_adivert.Application.Helpers;

// Helpers compartilhados pelos services de Adivert e Suspensao.
public static class TextoHelper
{
    // Chave de comparacao de Nome/Matricula: trim + maiusculas.
    // Zeros a esquerda NAO sao normalizados ("0123" != "123").
    public static string Normalizar(string? valor)
        => (valor ?? string.Empty).Trim().ToUpperInvariant();

    public static string? NormalizarOuNulo(string? valor)
        => string.IsNullOrWhiteSpace(valor) ? null : Normalizar(valor);

    public static string? LimitarNome(string? nome)
        => nome is { Length: > 255 } ? nome[..255] : nome;

    public static byte[] DecodeBase64(string? base64)
    {
        if (string.IsNullOrWhiteSpace(base64)) return Array.Empty<byte>();

        var data = base64;
        if (data.StartsWith("data:"))
        {
            var comma = data.IndexOf(',');
            if (comma >= 0) data = data[(comma + 1)..];
        }

        try { return Convert.FromBase64String(data); }
        catch { return Array.Empty<byte>(); }
    }
}
