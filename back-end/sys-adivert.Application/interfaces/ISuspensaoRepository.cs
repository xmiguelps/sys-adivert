using sys_adivert.Application.Adiverts.Dtos;
using sys_adivert.suspensao.Entity;

namespace sys_adivert.Application.Repository;

public interface ISuspensaoRepository
{
    Task<IEnumerable<Suspensao>> GetAllAsync(RegistroFiltro filtro, CancellationToken cancellationToken = default);

    Task<Suspensao?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<Suspensao?> GetByIdWithEvidenciasAsync(int id, CancellationToken cancellationToken = default);

    Task CreateAsync(Suspensao suspensao, CancellationToken cancellationToken = default);

    Task UpdateAsync(Suspensao suspensao, CancellationToken cancellationToken = default);

    Task DeleteAsync(Suspensao suspensao, CancellationToken cancellationToken = default);
}
