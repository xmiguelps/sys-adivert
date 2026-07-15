using sys_adivert.adivert.Entity;
using sys_adivert.Application.Adiverts.Dtos;
using sys_adivert.Application.Repository;

namespace sys_adivert.Application.Service;

public class AdivertService : IAdivertService
{
    public readonly IAdivertRepository _repository;

    public AdivertService(IAdivertRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<AdivertReadDto>> GetAllAsync (string? nome)
    {
        var Adiverts = await _repository.GetAllAsync();
        if (!string.IsNullOrWhiteSpace(nome))
        {
            Adiverts = await _repository.GetByColabAsync(nome);
        }

        return Adiverts.Select(a => new AdivertReadDto(a.Data, a.Matricula, a.Nome, a.Tipo, a.Motivo, a.Assinada, a.Id, a.Complemento));
    }

    public async Task<AdivertDetailDto?> GetByIdAsync(int id)
    {
        var adivert = await _repository.GetByIdWithEvidenciasAsync(id);
        if (adivert is null)
        {
            return null;
        }

        var evidencias = adivert.Evidencias
            .OrderBy(e => e.Ordem)
            .Select(e => new EvidenciaReadDto(e.Id, e.ContentType, Convert.ToBase64String(e.Conteudo), e.NomeArquivo, e.Ordem))
            .ToList();

        return new AdivertDetailDto(adivert.Data, adivert.Matricula, adivert.Nome, adivert.Tipo, adivert.Motivo, adivert.Assinada, adivert.Id, adivert.Complemento, evidencias);
    }

    public async Task<bool> CreateAsync(AdivertCreateDto dto) {
        if (dto.Matricula == null || dto.Motivo == null || dto.Nome == null || dto.Tipo == null) return false;

        var adivert = new Adivert(dto.Data, dto.Matricula, dto.Motivo, dto.Nome, dto.Tipo, dto.Complemento);

        if (dto.Evidencias != null)
        {
            int ordem = 0;
            foreach (var ev in dto.Evidencias)
            {
                var bytes = DecodeBase64(ev.Base64);
                if (bytes.Length == 0) continue;
                adivert.Evidencias.Add(new AdivertEvidencia
                {
                    Conteudo = bytes,
                    ContentType = string.IsNullOrWhiteSpace(ev.ContentType) ? "image/jpeg" : ev.ContentType,
                    NomeArquivo = LimitarNome(ev.NomeArquivo),
                    Ordem = ordem++
                });
            }
        }

        await _repository.CreateAsync(adivert);

        return true;
    }

    public async Task<bool> UpdateAsync(int id, AdivertUpdateDto dto) {
        var adivert = await _repository.GetByIdWithEvidenciasAsync(id);
        if (adivert is null) return false;

        adivert.Update(dto.Data, dto.Matricula, dto.Nome, dto.Tipo, dto.Motivo, dto.Complemento);

        if (dto.EvidenciasParaRemoverIds != null && dto.EvidenciasParaRemoverIds.Count > 0)
        {
            var remover = adivert.Evidencias
                .Where(e => dto.EvidenciasParaRemoverIds.Contains(e.Id))
                .ToList();
            foreach (var e in remover) adivert.Evidencias.Remove(e);
        }

        if (dto.EvidenciasParaAdicionar != null)
        {
            int ordem = adivert.Evidencias.Count > 0 ? adivert.Evidencias.Max(e => e.Ordem) + 1 : 0;
            foreach (var ev in dto.EvidenciasParaAdicionar)
            {
                var bytes = DecodeBase64(ev.Base64);
                if (bytes.Length == 0) continue;
                adivert.Evidencias.Add(new AdivertEvidencia
                {
                    Conteudo = bytes,
                    ContentType = string.IsNullOrWhiteSpace(ev.ContentType) ? "image/jpeg" : ev.ContentType,
                    NomeArquivo = LimitarNome(ev.NomeArquivo),
                    Ordem = ordem++
                });
            }
        }

        await _repository.UpdateAsync(adivert);

        return true;
    }

    public async Task<bool> SetAssinaturaAsync(int id, bool assinada) {
        var adivert = await _repository.GetByIdAsync(id);
        if (adivert is null) return false;

        adivert.MarcarAssinatura(assinada);
        await _repository.UpdateAsync(adivert);

        return true;
    }

    public async Task<bool> DeleteAsync(int id) {
        var adivert = await _repository.GetByIdAsync(id);
        if (adivert is null) return false;

        await _repository.DeleteAsync(adivert);
        return true;
    }

    private static string? LimitarNome(string? nome)
        => nome is { Length: > 255 } ? nome[..255] : nome;

    private static byte[] DecodeBase64(string? base64)
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
