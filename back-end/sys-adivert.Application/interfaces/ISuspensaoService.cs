using sys_adivert.Application.Adiverts.Dtos;
using sys_adivert.Application.Suspensoes.Dtos;

namespace sys_adivert.Application.Service;

public interface ISuspensaoService
{
    Task<IEnumerable<SuspensaoReadDto>> GetAllAsync(RegistroFiltro filtro, CancellationToken cancellationToken = default);

    Task<SuspensaoDetailDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<SuspensaoResultDto> CreateAsync(SuspensaoCreateDto dto, CancellationToken cancellationToken = default);

    Task<SuspensaoResultDto> UpdateAsync(int id, SuspensaoUpdateDto dto, CancellationToken cancellationToken = default);

    Task<SuspensaoResultDto> SetAssinaturaAsync(int id, bool assinada, CancellationToken cancellationToken = default);

    Task<SuspensaoResultDto> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
