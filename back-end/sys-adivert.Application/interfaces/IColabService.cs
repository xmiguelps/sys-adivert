using sys_adivert.Application.Colabs.Dtos;

namespace sys_adivert.Application.Service;

public interface IColabService
{
    Task<IEnumerable<ColabReadDto>> GetAllAsync();

    Task<string?> GetMatriculaByNomeAsync(string nome);

    Task<bool> CreateAsync(ColabCreateDto dto);

    Task<bool> DeleteAsync(int id);
}
