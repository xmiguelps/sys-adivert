using sys_adivert.Application.Adiverts.Dtos;
using sys_adivert.Application.Exceptions;
using sys_adivert.Application.Helpers;
using sys_adivert.Application.Repository;
using sys_adivert.Application.Suspensoes.Dtos;
using sys_adivert.suspensao.Entity;

namespace sys_adivert.Application.Service;

public class SuspensaoService : ISuspensaoService
{
    private readonly ISuspensaoRepository _repository;

    public SuspensaoService(ISuspensaoRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<SuspensaoReadDto>> GetAllAsync(RegistroFiltro filtro, CancellationToken cancellationToken = default)
    {
        var suspensoes = await _repository.GetAllAsync(filtro, cancellationToken);

        return suspensoes.Select(s => new SuspensaoReadDto(
            s.Id, s.DataEmissao, s.Matricula, s.Nome, s.Dias, s.DataInicio, s.DataRetorno,
            s.Motivo, s.Complemento, s.Assinada));
    }

    public async Task<SuspensaoDetailDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var s = await _repository.GetByIdWithEvidenciasAsync(id, cancellationToken);
        if (s is null) return null;

        var evidencias = s.Evidencias
            .OrderBy(e => e.Ordem)
            .Select(e => new EvidenciaReadDto(e.Id, e.ContentType, Convert.ToBase64String(e.Conteudo), e.NomeArquivo, e.Ordem))
            .ToList();

        return new SuspensaoDetailDto(
            s.Id, s.DataEmissao, s.Matricula, s.Nome, s.Dias, s.DataInicio, s.DataRetorno,
            s.Motivo, s.Complemento, s.Assinada, evidencias);
    }

    public async Task<SuspensaoResultDto> CreateAsync(SuspensaoCreateDto dto, CancellationToken cancellationToken = default)
    {
        if (dto is null) return Invalida("Corpo da requisicao ausente.");

        var erro = Validar(dto.Matricula, dto.Nome, dto.Dias, dto.DataEmissao, dto.DataInicio, dto.DataRetorno, dto.Motivo);
        if (erro is not null) return Invalida(erro);

        var suspensao = new Suspensao(
            dto.DataEmissao,
            TextoHelper.Normalizar(dto.Matricula),
            TextoHelper.Normalizar(dto.Nome),
            dto.Dias,
            dto.DataInicio,
            dto.DataRetorno,
            dto.Motivo,
            dto.Complemento);

        AdicionarEvidencias(suspensao, dto.Evidencias, 0);

        try
        {
            await _repository.CreateAsync(suspensao, cancellationToken);
        }
        catch (PersistenceException ex)
        {
            return Falha(ex);
        }

        return new SuspensaoResultDto(SuspensaoStatus.Sucesso, suspensao.Id);
    }

    public async Task<SuspensaoResultDto> UpdateAsync(int id, SuspensaoUpdateDto dto, CancellationToken cancellationToken = default)
    {
        if (dto is null) return Invalida("Corpo da requisicao ausente.");

        var erro = Validar(dto.Matricula, dto.Nome, dto.Dias, dto.DataEmissao, dto.DataInicio, dto.DataRetorno, dto.Motivo);
        if (erro is not null) return Invalida(erro);

        var suspensao = await _repository.GetByIdWithEvidenciasAsync(id, cancellationToken);
        if (suspensao is null) return new SuspensaoResultDto(SuspensaoStatus.NaoEncontrada);

        suspensao.Update(
            dto.DataEmissao,
            TextoHelper.Normalizar(dto.Matricula),
            TextoHelper.Normalizar(dto.Nome),
            dto.Dias,
            dto.DataInicio,
            dto.DataRetorno,
            dto.Motivo,
            dto.Complemento);

        if (dto.EvidenciasParaRemoverIds is { Count: > 0 })
        {
            var remover = suspensao.Evidencias
                .Where(e => dto.EvidenciasParaRemoverIds.Contains(e.Id))
                .ToList();
            foreach (var e in remover) suspensao.Evidencias.Remove(e);
        }

        if (dto.EvidenciasParaAdicionar != null)
        {
            int ordem = suspensao.Evidencias.Count > 0 ? suspensao.Evidencias.Max(e => e.Ordem) + 1 : 0;
            AdicionarEvidencias(suspensao, dto.EvidenciasParaAdicionar, ordem);
        }

        try
        {
            await _repository.UpdateAsync(suspensao, cancellationToken);
        }
        catch (PersistenceException ex)
        {
            return Falha(ex);
        }

        return new SuspensaoResultDto(SuspensaoStatus.Sucesso, suspensao.Id);
    }

    public async Task<SuspensaoResultDto> SetAssinaturaAsync(int id, bool assinada, CancellationToken cancellationToken = default)
    {
        var suspensao = await _repository.GetByIdAsync(id, cancellationToken);
        if (suspensao is null) return new SuspensaoResultDto(SuspensaoStatus.NaoEncontrada);

        suspensao.MarcarAssinatura(assinada);

        try
        {
            await _repository.UpdateAsync(suspensao, cancellationToken);
        }
        catch (PersistenceException ex)
        {
            return Falha(ex);
        }

        return new SuspensaoResultDto(SuspensaoStatus.Sucesso, id);
    }

    public async Task<SuspensaoResultDto> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var suspensao = await _repository.GetByIdAsync(id, cancellationToken);
        if (suspensao is null) return new SuspensaoResultDto(SuspensaoStatus.NaoEncontrada);

        try
        {
            await _repository.DeleteAsync(suspensao, cancellationToken);
        }
        catch (PersistenceException ex)
        {
            return Falha(ex);
        }

        return new SuspensaoResultDto(SuspensaoStatus.Sucesso, id);
    }

    private static SuspensaoResultDto Invalida(string mensagem)
        => new(SuspensaoStatus.Invalida, Mensagem: mensagem);

    private static SuspensaoResultDto Falha(PersistenceException ex)
        => new(
            ex.Kind == PersistenceErrorKind.Conflito ? SuspensaoStatus.Conflito : SuspensaoStatus.NaoProcessavel,
            Mensagem: ex.Message);

    private static void AdicionarEvidencias(Suspensao suspensao, IEnumerable<EvidenciaInputDto>? evidencias, int ordem)
    {
        if (evidencias is null) return;

        foreach (var ev in evidencias)
        {
            var bytes = TextoHelper.DecodeBase64(ev.Base64);
            if (bytes.Length == 0) continue;
            suspensao.Evidencias.Add(new SuspensaoEvidencia
            {
                Conteudo = bytes,
                ContentType = string.IsNullOrWhiteSpace(ev.ContentType) ? "image/jpeg" : ev.ContentType,
                NomeArquivo = TextoHelper.LimitarNome(ev.NomeArquivo),
                Ordem = ordem++
            });
        }
    }

    // Os limites espelham o mapeamento EF (SuspensaoConfiguration). Dias nao
    // precisa bater com (retorno - inicio): so exige Dias >= 1 e retorno >= inicio.
    private static string? Validar(
        string? matricula, string? nome, int dias, DateOnly dataEmissao,
        DateOnly dataInicio, DateOnly dataRetorno, string? motivo)
    {
        if (string.IsNullOrWhiteSpace(nome))          return "O campo Nome e obrigatorio.";
        if (nome.Length > 255)                        return "O campo Nome excede 255 caracteres.";
        if (string.IsNullOrWhiteSpace(matricula))     return "O campo Matricula e obrigatorio.";
        if (matricula.Length > 50)                    return "O campo Matricula excede 50 caracteres.";
        if (string.IsNullOrWhiteSpace(motivo))        return "O campo Motivo e obrigatorio.";
        if (motivo.Length > 455)                      return "O campo Motivo excede 455 caracteres.";
        if (dias < 1)                                 return "O campo Dias deve ser maior ou igual a 1.";
        if (dataEmissao == default)                   return "O campo DataEmissao e obrigatorio.";
        if (dataInicio == default)                    return "O campo DataInicio e obrigatorio.";
        if (dataRetorno == default)                   return "O campo DataRetorno e obrigatorio.";
        if (dataRetorno < dataInicio)                 return "A DataRetorno nao pode ser anterior a DataInicio.";
        return null;
    }
}
