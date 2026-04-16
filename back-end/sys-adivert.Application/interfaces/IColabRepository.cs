using sys_adivert.colab.Entity;

namespace sys_adivert.Application.Repository;

public interface IColabRepository
{
    Task<IEnumerable<Colab>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Colab?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<string?> GetMatriculaByNomeAsync(string nome, CancellationToken cancellationToken = default);

    Task CreateAsync(Colab colab, CancellationToken cancellationToken = default);

    Task DeleteAsync(Colab colab, CancellationToken cancellationToken = default);
}
