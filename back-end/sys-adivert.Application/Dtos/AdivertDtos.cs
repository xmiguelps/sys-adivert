namespace sys_adivert.Application.Adiverts.Dtos;

public record AdivertUpdateDto(DateTime Data, string? Matricula, string? Nome, string? Tipo, string? Motivo);

public record AdivertCreateDto(DateTime Data, string Matricula, string Nome, string Tipo, string Motivo);

public record AdivertReadDto(DateTime Data, string Matricula, string Nome, string Tipo, string Motivo, int id);