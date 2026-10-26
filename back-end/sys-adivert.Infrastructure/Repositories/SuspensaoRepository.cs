using Microsoft.EntityFrameworkCore;
using Npgsql;
using sys_adivert.Application.Adiverts.Dtos;
using sys_adivert.Application.Exceptions;
using sys_adivert.Application.Repository;
using sys_adivert.Infrastructure.AppDb;
using sys_adivert.suspensao.Entity;

namespace sys_adivert.Infrastructure.Suspensoes.Repository;

public class SuspensaoRepository : ISuspensaoRepository
{
    private readonly AppDbContext _db;

    public SuspensaoRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Suspensao>> GetAllAsync(RegistroFiltro filtro, CancellationToken cancellationToken = default)
    {
        var query = _db.Suspensoes.AsNoTracking();

        if (filtro.Matricula is not null) query = query.Where(s => s.Matricula == filtro.Matricula);
        if (filtro.Nome is not null) query = query.Where(s => s.Nome == filtro.Nome);
        if (filtro.Motivos is not null)
        {
            var motivos = filtro.Motivos;
            query = query.Where(s => motivos.Contains(s.Motivo));
        }
        // Periodo usa a data de EMISSAO.
        if (filtro.De is not null) query = query.Where(s => s.DataEmissao >= filtro.De.Value);
        if (filtro.Ate is not null) query = query.Where(s => s.DataEmissao <= filtro.Ate.Value);

        return await query
            .OrderByDescending(s => s.DataEmissao)
            .ThenByDescending(s => s.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<Suspensao?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _db.Suspensoes.FindAsync([id], cancellationToken);
    }

    public async Task<Suspensao?> GetByIdWithEvidenciasAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _db.Suspensoes
            .Include(s => s.Evidencias)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task CreateAsync(Suspensao suspensao, CancellationToken cancellationToken = default)
    {
        await _db.Suspensoes.AddAsync(suspensao, cancellationToken);
        await SalvarAsync(cancellationToken);
    }

    public async Task UpdateAsync(Suspensao suspensao, CancellationToken cancellationToken = default)
    {
        // Entidade ja rastreada: salvar direto preserva adicoes/remocoes de evidencias.
        await SalvarAsync(cancellationToken);
    }

    public async Task DeleteAsync(Suspensao suspensao, CancellationToken cancellationToken = default)
    {
        _db.Remove(suspensao);
        await SalvarAsync(cancellationToken);
    }

    private async Task SalvarAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            throw Traduzir(ex);
        }
    }

    // Converte o erro do Postgres em PersistenceException para o controller
    // devolver 409/422 em vez de 500.
    private static PersistenceException Traduzir(DbUpdateException ex)
    {
        if (ex.InnerException is PostgresException pg)
        {
            return pg.SqlState switch
            {
                PostgresErrorCodes.UniqueViolation => new PersistenceException(
                    PersistenceErrorKind.Conflito,
                    "Ja existe uma suspensao gravada com esses dados.", ex),

                PostgresErrorCodes.ForeignKeyViolation => new PersistenceException(
                    PersistenceErrorKind.Invalido,
                    "A suspensao referencia um registro inexistente.", ex),

                PostgresErrorCodes.NotNullViolation => new PersistenceException(
                    PersistenceErrorKind.Invalido,
                    $"Campo obrigatorio nao preenchido: {pg.ColumnName ?? "desconhecido"}.", ex),

                PostgresErrorCodes.StringDataRightTruncation => new PersistenceException(
                    PersistenceErrorKind.Invalido,
                    "A suspensao tem um campo maior que o permitido.", ex),

                PostgresErrorCodes.CheckViolation => new PersistenceException(
                    PersistenceErrorKind.Invalido,
                    "A suspensao viola uma regra de integridade do banco.", ex),

                _ => new PersistenceException(
                    PersistenceErrorKind.Invalido,
                    $"Nao foi possivel gravar a suspensao (SQLSTATE {pg.SqlState}).", ex)
            };
        }

        return new PersistenceException(
            PersistenceErrorKind.Invalido,
            "Nao foi possivel gravar a suspensao.", ex);
    }
}
