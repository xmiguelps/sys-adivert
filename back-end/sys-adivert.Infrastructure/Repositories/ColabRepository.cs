using Microsoft.EntityFrameworkCore;
using sys_adivert.colab.Entity;
using sys_adivert.Application.Repository;
using sys_adivert.Infrastructure.AppDb;

namespace sys_adivert.Infrastructure.Colabs.Repository;

public class ColabRepository : IColabRepository
{
    private readonly AppDbContext _db;

    public ColabRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Colab>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Colabs
            .AsNoTracking()
            .OrderBy(c => c.Nome)
            .ToListAsync(cancellationToken);
    }

    public async Task<Colab?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _db.Colabs.FindAsync([id], cancellationToken);
    }

    public async Task<string?> GetMatriculaByNomeAsync(string nome, CancellationToken cancellationToken = default)
    {
        var colab = await _db.Colabs
            .AsNoTracking()
            .Where(c => c.Nome == nome)
            .FirstOrDefaultAsync(cancellationToken);

        return colab?.Matricula;
    }

    public async Task CreateAsync(Colab colab, CancellationToken cancellationToken = default)
    {
        await _db.Colabs.AddAsync(colab, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Colab colab, CancellationToken cancellationToken = default)
    {
        _db.Remove(colab);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
