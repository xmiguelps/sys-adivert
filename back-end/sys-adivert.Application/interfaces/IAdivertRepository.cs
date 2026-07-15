using System.Reflection.Metadata;
using sys_adivert.adivert.Entity;

namespace sys_adivert.Application.Repository;

public interface IAdivertRepository
{
    Task<IEnumerable<Adivert>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<IEnumerable<Adivert>> GetByColabAsync(string nome, 
    CancellationToken cancellationToken = default);

    Task<Adivert?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<Adivert?> GetByIdWithEvidenciasAsync(int id, CancellationToken cancellationToken = default);

    Task CreateAsync(Adivert adivert ,CancellationToken cancellationToken = default);

    Task DeleteAsync(Adivert adivert ,CancellationToken cancellationToken = default);

    Task UpdateAsync(Adivert adivert, CancellationToken cancellationToken = default);
}