namespace sys_adivert.Application.Motivos.Dtos;

public record MotivoCreateDto(string Descricao);

public record MotivoReadDto(int Id, string Descricao);
