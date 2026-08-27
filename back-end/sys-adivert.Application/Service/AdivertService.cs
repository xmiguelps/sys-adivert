using sys_adivert.adivert.Entity;
using sys_adivert.Application.Adiverts.Dtos;
using sys_adivert.Application.Exceptions;
using sys_adivert.Application.Repository;

namespace sys_adivert.Application.Service;

public class AdivertService : IAdivertService
{
    public const int LimiteLote = 200;

    public readonly IAdivertRepository _repository;

    public AdivertService(IAdivertRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<AdivertReadDto>> GetAllAsync (string? nome, CancellationToken cancellationToken = default)
    {
        var Adiverts = await _repository.GetAllAsync(cancellationToken);
        if (!string.IsNullOrWhiteSpace(nome))
        {
            Adiverts = await _repository.GetByColabAsync(nome, cancellationToken);
        }

        return Adiverts.Select(a => new AdivertReadDto(a.Data, a.Matricula, a.Nome, a.Tipo, a.Motivo, a.Assinada, a.Id, a.Complemento));
    }

    public async Task<AdivertDetailDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var adivert = await _repository.GetByIdWithEvidenciasAsync(id, cancellationToken);
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

    public async Task<bool> CreateAsync(AdivertCreateDto dto, CancellationToken cancellationToken = default) {
        if (ValidarCreate(dto) is not null) return false;

        var adivert = MontarAdivert(dto);

        await _repository.CreateAsync(adivert, cancellationToken);

        return true;
    }

    public async Task<AdivertBatchResultDto> CreateBatchAsync(
        IReadOnlyList<AdivertCreateDto>? dtos,
        CancellationToken cancellationToken = default) {

        if (dtos is null || dtos.Count == 0)
        {
            return Falha(AdivertBatchStatus.ListaVazia, "Envie ao menos uma advertencia.");
        }

        if (dtos.Count > LimiteLote)
        {
            return Falha(
                AdivertBatchStatus.LimiteExcedido,
                $"O lote aceita no maximo {LimiteLote} advertencias por requisicao (recebidas: {dtos.Count}).");
        }

        // Valida o lote inteiro antes de tocar no banco: um item invalido
        // impede que qualquer insert seja disparado.
        var erros = new List<AdivertBatchItemErroDto>();
        for (int i = 0; i < dtos.Count; i++)
        {
            var erro = ValidarCreate(dtos[i]);
            if (erro is not null) erros.Add(new AdivertBatchItemErroDto(i, erro));
        }

        if (erros.Count > 0)
        {
            return new AdivertBatchResultDto(
                AdivertBatchStatus.ItensInvalidos,
                Array.Empty<int>(),
                erros,
                $"{erros.Count} de {dtos.Count} advertencias estao invalidas. Nada foi gravado.");
        }

        var adiverts = new List<Adivert>(dtos.Count);
        foreach (var dto in dtos) adiverts.Add(MontarAdivert(dto));

        try
        {
            await _repository.CreateRangeAsync(adiverts, cancellationToken);
        }
        catch (PersistenceException ex)
        {
            var status = ex.Kind == PersistenceErrorKind.Conflito
                ? AdivertBatchStatus.Conflito
                : AdivertBatchStatus.NaoProcessavel;

            return Falha(status, ex.Message);
        }

        // A lista preserva a ordem do payload, entao os ids saem na mesma
        // ordem em que os itens chegaram.
        return new AdivertBatchResultDto(
            AdivertBatchStatus.Sucesso,
            adiverts.Select(a => a.Id).ToList(),
            Array.Empty<AdivertBatchItemErroDto>(),
            null);
    }

    public async Task<bool> UpdateAsync(int id, AdivertUpdateDto dto, CancellationToken cancellationToken = default) {
        var adivert = await _repository.GetByIdWithEvidenciasAsync(id, cancellationToken);
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

        await _repository.UpdateAsync(adivert, cancellationToken);

        return true;
    }

    public async Task<bool> SetAssinaturaAsync(int id, bool assinada, CancellationToken cancellationToken = default) {
        var adivert = await _repository.GetByIdAsync(id, cancellationToken);
        if (adivert is null) return false;

        adivert.MarcarAssinatura(assinada);
        await _repository.UpdateAsync(adivert, cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default) {
        var adivert = await _repository.GetByIdAsync(id, cancellationToken);
        if (adivert is null) return false;

        await _repository.DeleteAsync(adivert, cancellationToken);
        return true;
    }

    private static string? LimitarNome(string? nome)
        => nome is { Length: > 255 } ? nome[..255] : nome;

    private static AdivertBatchResultDto Falha(AdivertBatchStatus status, string mensagem)
        => new(status, Array.Empty<int>(), Array.Empty<AdivertBatchItemErroDto>(), mensagem);

    // Compartilhado pelo POST unitario e pelo lote: mesma montagem da
    // entidade e das evidencias nos dois caminhos.
    private static Adivert MontarAdivert(AdivertCreateDto dto)
    {
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

        return adivert;
    }

    // Os limites espelham o mapeamento EF (AdivertConfiguration): estourar
    // aqui vira 400 com o indice do item, em vez de 500 vindo do Postgres.
    private static string? ValidarCreate(AdivertCreateDto? dto)
    {
        if (dto is null)                              return "Item nulo.";
        if (string.IsNullOrWhiteSpace(dto.Nome))      return "O campo Nome e obrigatorio.";
        if (dto.Nome.Length > 255)                    return "O campo Nome excede 255 caracteres.";
        if (string.IsNullOrWhiteSpace(dto.Matricula)) return "O campo Matricula e obrigatorio.";
        if (dto.Matricula.Length > 50)                return "O campo Matricula excede 50 caracteres.";
        if (string.IsNullOrWhiteSpace(dto.Tipo))      return "O campo Tipo e obrigatorio.";
        if (dto.Tipo.Length > 100)                    return "O campo Tipo excede 100 caracteres.";
        if (string.IsNullOrWhiteSpace(dto.Motivo))    return "O campo Motivo e obrigatorio.";
        if (dto.Motivo.Length > 455)                  return "O campo Motivo excede 455 caracteres.";
        if (dto.Data == default)                      return "O campo Data e obrigatorio.";
        return null;
    }

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
