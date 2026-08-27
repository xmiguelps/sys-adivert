using sys_adivert.adivert.Entity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using sys_adivert.Application.Exceptions;
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
            .OrderByDescending(adv => adv.Data)
            .ToListAsync(cancellationToken);
    }

    public async Task<Adivert?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _db.Adiverts.FindAsync([id], cancellationToken);
    }

    public async Task<Adivert?> GetByIdWithEvidenciasAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _db.Adiverts
            .Include(a => a.Evidencias)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Adivert>> GetByColabAsync(string nome, CancellationToken cancellationToken = default)
    {
        return await _db.Adiverts
            .AsNoTracking()
            .Where(a => a.Nome == nome)
            .ToListAsync(cancellationToken);
    }

    public async Task CreateAsync(Adivert adivert ,CancellationToken cancellationToken = default)
    {
        await _db.Adiverts.AddAsync(adivert, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task CreateRangeAsync(IEnumerable<Adivert> adiverts, CancellationToken cancellationToken = default)
    {
        var lote = adiverts as IList<Adivert> ?? adiverts.ToList();
        if (lote.Count == 0) return;

        // Uma conexao, uma transacao, um SaveChanges: o EF agrupa os inserts
        // em batch em vez de abrir uma conexao por advertencia.
        await using var transacao = await _db.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            await _db.Adiverts.AddRangeAsync(lote, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            await transacao.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            // O dispose da transacao faz o rollback: ou grava tudo, ou nada.
            throw TraduzirErroDeGravacao(ex);
        }
    }

    public async Task DeleteAsync(Adivert adivert ,CancellationToken cancellationToken = default)
    {
        _db.Remove(adivert);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Adivert adivert, CancellationToken cancellationToken = default)
    {
        // 'adivert' ja vem rastreado (GetByIdAsync/GetByIdWithEvidenciasAsync).
        // Salvar direto preserva delecoes/adicoes da colecao de evidencias e
        // evita reescrever os bytes das imagens que nao mudaram.
        await _db.SaveChangesAsync(cancellationToken);
    }

    // Converte o erro do Postgres em um tipo que a Application enxerga, para
    // o controller devolver 409/422 em vez de deixar vazar 500.
    private static PersistenceException TraduzirErroDeGravacao(DbUpdateException ex)
    {
        if (ex.InnerException is PostgresException pg)
        {
            return pg.SqlState switch
            {
                PostgresErrorCodes.UniqueViolation => new PersistenceException(
                    PersistenceErrorKind.Conflito,
                    "Ja existe uma advertencia gravada com esses dados.", ex),

                PostgresErrorCodes.ForeignKeyViolation => new PersistenceException(
                    PersistenceErrorKind.Invalido,
                    "Uma das advertencias referencia um registro inexistente.", ex),

                PostgresErrorCodes.NotNullViolation => new PersistenceException(
                    PersistenceErrorKind.Invalido,
                    $"Campo obrigatorio nao preenchido: {pg.ColumnName ?? "desconhecido"}.", ex),

                PostgresErrorCodes.StringDataRightTruncation => new PersistenceException(
                    PersistenceErrorKind.Invalido,
                    "Uma das advertencias tem um campo maior que o permitido.", ex),

                PostgresErrorCodes.CheckViolation => new PersistenceException(
                    PersistenceErrorKind.Invalido,
                    "Uma das advertencias viola uma regra de integridade do banco.", ex),

                _ => new PersistenceException(
                    PersistenceErrorKind.Invalido,
                    $"Nao foi possivel gravar o lote de advertencias (SQLSTATE {pg.SqlState}).", ex)
            };
        }

        return new PersistenceException(
            PersistenceErrorKind.Invalido,
            "Nao foi possivel gravar o lote de advertencias.", ex);
    }
}