using sys_adivert.adivert.Entity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using sys_adivert.Application.Adiverts.Dtos;
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

    public async Task<IEnumerable<Adivert>> GetAllAsync(RegistroFiltro filtro, CancellationToken cancellationToken = default)
    {
        var query = _db.Adiverts.AsNoTracking();

        if (filtro.Matricula is not null) query = query.Where(a => a.Matricula == filtro.Matricula);
        if (filtro.Nome is not null) query = query.Where(a => a.Nome == filtro.Nome);
        if (filtro.Motivos is not null)
        {
            var motivos = filtro.Motivos;
            query = query.Where(a => motivos.Contains(a.Motivo));
        }
        if (filtro.De is not null) query = query.Where(a => a.Data >= filtro.De.Value);
        if (filtro.Ate is not null) query = query.Where(a => a.Data <= filtro.Ate.Value);

        return await query
            .OrderByDescending(a => a.Data)
            .ThenByDescending(a => a.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyDictionary<(string Matricula, string Motivo), int>> ContarDesdeUltimaSuspensaoAsync(
        IReadOnlyCollection<(string Matricula, string Motivo)> pares,
        CancellationToken cancellationToken = default)
    {
        if (pares.Count == 0) return new Dictionary<(string Matricula, string Motivo), int>();

        // O EF nao traduz Contains sobre uma lista local de tuplas: filtra por
        // matriculas E motivos (dois Contains escalares) e deixa o par exato
        // para o dicionario, que o service consulta so pelos pares do lote.
        var matriculas = pares.Select(p => p.Matricula).Distinct().ToList();
        var motivos = pares.Select(p => p.Motivo).Distinct().ToList();

        // Data > DataEmissao da ultima suspensao  <=>  nao existe suspensao
        // da mesma matricula E do mesmo motivo com DataEmissao >= Data da advertencia.
        var linhas = await _db.Adiverts
            .AsNoTracking()
            .Where(a => matriculas.Contains(a.Matricula) && motivos.Contains(a.Motivo))
            .Where(a => !_db.Suspensoes.Any(s =>
                s.Matricula == a.Matricula && s.Motivo == a.Motivo && s.DataEmissao >= a.Data))
            .GroupBy(a => new { a.Matricula, a.Motivo })
            .Select(g => new { g.Key.Matricula, g.Key.Motivo, Total = g.Count() })
            .ToListAsync(cancellationToken);

        return linhas.ToDictionary(x => (x.Matricula, x.Motivo), x => x.Total);
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