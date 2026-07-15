namespace sys_adivert.Application.Adiverts.Dtos;

public record EvidenciaInputDto(string ContentType, string Base64, string? NomeArquivo);

public record EvidenciaReadDto(int Id, string ContentType, string Base64, string? NomeArquivo, int Ordem);

public record AdivertUpdateDto(
    DateOnly Data,
    string? Matricula,
    string? Nome,
    string? Tipo,
    string? Motivo,
    string? Complemento,
    List<EvidenciaInputDto>? EvidenciasParaAdicionar,
    List<int>? EvidenciasParaRemoverIds);

public record AdivertCreateDto(
    DateOnly Data,
    string Matricula,
    string Nome,
    string Tipo,
    string Motivo,
    string? Complemento,
    List<EvidenciaInputDto>? Evidencias);

public record AdivertReadDto(
    DateOnly Data,
    string Matricula,
    string Nome,
    string Tipo,
    string Motivo,
    bool Assinada,
    int id,
    string? Complemento);

public record AdivertDetailDto(
    DateOnly Data,
    string Matricula,
    string Nome,
    string Tipo,
    string Motivo,
    bool Assinada,
    int id,
    string? Complemento,
    List<EvidenciaReadDto> Evidencias);

public record AdivertAssinaturaDto(bool Assinada);
