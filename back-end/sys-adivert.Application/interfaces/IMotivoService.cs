using sys_adivert.Application.Motivos.Dtos;

namespace sys_adivert.Application.Service;

public interface IMotivoService
{
    Task<IEnumerable<MotivoReadDto>> GetAllAsync();

    Task<bool> CreateAsync(MotivoCreateDto dto);

    Task<bool> DeleteAsync(int id);
}
