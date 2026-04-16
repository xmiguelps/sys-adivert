namespace sys_adivert.Application.Colabs.Dtos;

public record ColabCreateDto(string Nome, string Matricula);

public record ColabReadDto(int Id, string Nome, string Matricula);

public record ColabMatriculaDto(string Nome, string Matricula);
