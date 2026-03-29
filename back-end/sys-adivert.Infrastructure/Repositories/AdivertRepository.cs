using sys_adivert.adivert.Entity;
using Microsoft.EntityFrameworkCore;
using sys_adivert.Application.Repository;
using sys_adivert.Infrastructure.AppDb;

namespace sys_adivert.Infrastructure.Adiverts.Repository;

public class AdivertRepository : IAdivertRepository
{
    private readonly AppDbContext _db;

    public AdivertRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Adivert>> GetAllAsync(CancellationToken cancellationToken  = default)
    {
        return await _db.Adiverts
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Adivert?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _db.Adiverts.FindAsync([id], cancellationToken);
    }

    public async Task<IEnumerable<Adivert>> GetByColabAsync(string nome, CancellationToken cancellationToken = default)
    {
        return await _db.Adiverts
            .AsNoTracking()
            .Where(a => a.Nome == nome)
            .ToListAsync();
    }

    public async Task CreateAsync(Adivert adivert ,CancellationToken cancellationToken = default)
    {
        await _db.Adiverts.AddAsync(adivert, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Adivert adivert ,CancellationToken cancellationToken = default)
    {
        _db.Remove(adivert);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Adivert adivert, CancellationToken cancellationToken = default)
    {
        _db.Update(adivert);
        await _db.SaveChangesAsync(cancellationToken);
    }
}