using System.Reflection.Metadata;
using sys_adivert.adivert.Entity;
using sys_adivert.Application.Adiverts.Dtos;

namespace sys_adivert.Application.Repository;

public interface IAdivertRepository
{
    Task<IEnumerable<Adivert>> GetAllAsync(RegistroFiltro filtro, CancellationToken cancellationToken = default);

    // Total de advertencias por matricula (normalizada) posteriores a
    // DataEmissao da ultima suspensao da matricula (todas, sem suspensao).
    Task<IReadOnlyDictionary<string, int>> ContarDesdeUltimaSuspensaoAsync(
        IReadOnlyCollection<string> matriculas,
        CancellationToken cancellationToken = default);

    Task<Adivert?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<Adivert?> GetByIdWithEvidenciasAsync(int id, CancellationToken cancellationToken = default);

    Task CreateAsync(Adivert adivert ,CancellationToken cancellationToken = default);

    Task CreateRangeAsync(IEnumerable<Adivert> adiverts, CancellationToken cancellationToken = default);

    Task DeleteAsync(Adivert adivert ,CancellationToken cancellationToken = default);

    Task UpdateAsync(Adivert adivert, CancellationToken cancellationToken = default);
}
