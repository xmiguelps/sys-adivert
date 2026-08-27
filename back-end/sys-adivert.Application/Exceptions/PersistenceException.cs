namespace sys_adivert.Application.Exceptions;

public enum PersistenceErrorKind
{
    // Violacao de unicidade: o registro conflita com algo que ja existe.
    Conflito,

    // Demais violacoes de integridade (fk, not null, check, tamanho).
    Invalido
}

// Erro de gravacao traduzido pela Infrastructure para um tipo que a
// Application enxerga sem depender de EF Core / Npgsql.
public class PersistenceException : Exception
{
    public PersistenceErrorKind Kind { get; }

    public PersistenceException(PersistenceErrorKind kind, string message, Exception? innerException = null)
        : base(message, innerException)
    {
        Kind = kind;
    }
}
