using sys_adivert.Application.Adiverts.Dtos;

namespace sys_adivert.Application.Suspensoes.Dtos;

public record SuspensaoCreateDto(
    DateOnly DataEmissao,
    string Matricula,
    string Nome,
    int Dias,
    DateOnly DataInicio,
    DateOnly DataRetorno,
    string Motivo,
    string? Complemento,
    List<EvidenciaInputDto>? Evidencias);

public record SuspensaoUpdateDto(
    DateOnly DataEmissao,
    string Matricula,
    string Nome,
    int Dias,
    DateOnly DataInicio,
    DateOnly DataRetorno,
    string Motivo,
    string? Complemento,
    List<EvidenciaInputDto>? EvidenciasParaAdicionar,
    List<int>? EvidenciasParaRemoverIds);

public record SuspensaoReadDto(
    int Id,
    DateOnly DataEmissao,
    string Matricula,
    string Nome,
    int Dias,
    DateOnly DataInicio,
    DateOnly DataRetorno,
    string Motivo,
    string? Complemento,
    bool Assinada);

public record SuspensaoDetailDto(
    int Id,
    DateOnly DataEmissao,
    string Matricula,
    string Nome,
    int Dias,
    DateOnly DataInicio,
    DateOnly DataRetorno,
    string Motivo,
    string? Complemento,
    bool Assinada,
    List<EvidenciaReadDto> Evidencias);

public record SuspensaoAssinaturaDto(bool Assinada);

public record SuspensaoCreatedDto(int Id);

public record SuspensaoErroDto(string Mensagem);

public enum SuspensaoStatus
{
    Sucesso,
    NaoEncontrada,
    Invalida,
    Conflito,
    NaoProcessavel
}

// Resultado interno do service; o controller traduz o Status em HTTP.
public record SuspensaoResultDto(SuspensaoStatus Status, int? Id = null, string? Mensagem = null);
