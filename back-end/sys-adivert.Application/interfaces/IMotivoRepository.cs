using sys_adivert.motivo.Entity;

namespace sys_adivert.Application.Repository;

public interface IMotivoRepository
{
    Task<IEnumerable<Motivo>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Motivo?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<bool> ExistsByDescricaoAsync(string descricao, CancellationToken cancellationToken = default);

    Task CreateAsync(Motivo motivo, CancellationToken cancellationToken = default);

    Task DeleteAsync(Motivo motivo, CancellationToken cancellationToken = default);
}
