using System.IO.Compression;
using System.Text;

namespace sys_adivert.Infrastructure.Seed;

/// <summary>
/// Gera um PNG de cor solida sem depender de biblioteca de imagem nem de arquivo binario
/// no repositorio. Existe apenas para o seed poder criar evidencias de teste.
/// </summary>
internal static class PngSimples
{
    public static byte[] CorSolida(int largura, int altura, byte r, byte g, byte b)
    {
        // Scanlines RGB, cada linha precedida pelo byte de filtro (0 = None).
        var raw = new byte[altura * (1 + largura * 3)];
        var pos = 0;
        for (var y = 0; y < altura; y++)
        {
            raw[pos++] = 0;
            for (var x = 0; x < largura; x++)
            {
                raw[pos++] = r;
                raw[pos++] = g;
                raw[pos++] = b;
            }
        }

        byte[] idat;
        using (var comprimido = new MemoryStream())
        {
            using (var z = new ZLibStream(comprimido, CompressionLevel.Optimal, true))
            {
                z.Write(raw, 0, raw.Length);
            }

            idat = comprimido.ToArray();
        }

        var ihdr = new byte[13];
        EscreverUInt32(ihdr, 0, (uint)largura);
        EscreverUInt32(ihdr, 4, (uint)altura);
        ihdr[8] = 8;  // bits por canal
        ihdr[9] = 2;  // truecolor RGB
        ihdr[10] = 0; // compressao deflate
        ihdr[11] = 0; // metodo de filtro padrao
        ihdr[12] = 0; // sem entrelacamento

        using var png = new MemoryStream();
        png.Write([0x89, (byte)'P', (byte)'N', (byte)'G', 0x0D, 0x0A, 0x1A, 0x0A]);
        EscreverChunk(png, "IHDR", ihdr);
        EscreverChunk(png, "IDAT", idat);
        EscreverChunk(png, "IEND", []);
        return png.ToArray();
    }

    private static void EscreverChunk(Stream destino, string tipo, byte[] dados)
    {
        var tamanho = new byte[4];
        EscreverUInt32(tamanho, 0, (uint)dados.Length);
        destino.Write(tamanho);

        var tipoBytes = Encoding.ASCII.GetBytes(tipo);
        destino.Write(tipoBytes);
        destino.Write(dados);

        var crc = new byte[4];
        EscreverUInt32(crc, 0, Crc32(tipoBytes, dados));
        destino.Write(crc);
    }

    private static void EscreverUInt32(byte[] destino, int offset, uint valor)
    {
        destino[offset] = (byte)(valor >> 24);
        destino[offset + 1] = (byte)(valor >> 16);
        destino[offset + 2] = (byte)(valor >> 8);
        destino[offset + 3] = (byte)valor;
    }

    private static readonly uint[] TabelaCrc = CriarTabelaCrc();

    private static uint[] CriarTabelaCrc()
    {
        var tabela = new uint[256];
        for (uint n = 0; n < 256; n++)
        {
            var c = n;
            for (var k = 0; k < 8; k++)
            {
                if ((c & 1) != 0)
                {
                    c = 0xEDB88320u ^ (c >> 1);
                }
                else
                {
                    c >>= 1;
                }
            }

            tabela[n] = c;
        }

        return tabela;
    }

    private static uint Crc32(byte[] primeiro, byte[] segundo)
    {
        var c = 0xFFFFFFFFu;
        foreach (var b in primeiro)
        {
            c = TabelaCrc[(c ^ b) & 0xFF] ^ (c >> 8);
        }

        foreach (var b in segundo)
        {
            c = TabelaCrc[(c ^ b) & 0xFF] ^ (c >> 8);
        }

        return c ^ 0xFFFFFFFFu;
    }
}
