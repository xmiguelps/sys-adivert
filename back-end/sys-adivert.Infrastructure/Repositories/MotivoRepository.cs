using Microsoft.EntityFrameworkCore;
using sys_adivert.motivo.Entity;
using sys_adivert.Application.Repository;
using sys_adivert.Infrastructure.AppDb;

namespace sys_adivert.Infrastructure.Motivos.Repository;

public class MotivoRepository : IMotivoRepository
{
    private readonly AppDbContext _db;

    public MotivoRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Motivo>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Motivos
            .AsNoTracking()
            .OrderBy(m => m.Descricao)
            .ToListAsync(cancellationToken);
    }

    public async Task<Motivo?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _db.Motivos.FindAsync([id], cancellationToken);
    }

    public async Task<bool> ExistsByDescricaoAsync(string descricao, CancellationToken cancellationToken = default)
    {
        var alvo = descricao.Trim().ToLower();
        return await _db.Motivos
            .AsNoTracking()
            .AnyAsync(m => m.Descricao.ToLower() == alvo, cancellationToken);
    }

    public async Task CreateAsync(Motivo motivo, CancellationToken cancellationToken = default)
    {
        await _db.Motivos.AddAsync(motivo, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Motivo motivo, CancellationToken cancellationToken = default)
    {
        _db.Remove(motivo);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
