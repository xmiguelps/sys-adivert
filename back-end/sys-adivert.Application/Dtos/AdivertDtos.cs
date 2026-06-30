namespace sys_adivert.Application.Adiverts.Dtos;

public record AdivertUpdateDto(DateOnly Data, string? Matricula, string? Nome, string? Tipo, string? Motivo);

public record AdivertCreateDto(DateOnly Data, string Matricula, string Nome, string Tipo, string Motivo);

public record AdivertReadDto(DateOnly Data, string Matricula, string Nome, string Tipo, string Motivo, bool Assinada, int id);

public record AdivertAssinaturaDto(bool Assinada);