using sys_adivert.Application.Helpers;

namespace sys_adivert.Application.Adiverts.Dtos;

// Filtros de listagem (Adiverts e Suspensoes). Todos opcionais; sem nenhum
// preenchido a listagem devolve tudo. Matricula/Nome ja chegam normalizados
// (trim + maiusculas) e sao comparados por igualdade.
public record RegistroFiltro(
    string? Matricula,
    string? Nome,
    IReadOnlyList<string>? Motivos,
    DateOnly? De,
    DateOnly? Ate)
{
    public static RegistroFiltro Criar(
        string? matricula,
        string? nome,
        IEnumerable<string>? motivos,
        DateOnly? de,
        DateOnly? ate)
    {
        var listaMotivos = motivos?
            .Where(m => !string.IsNullOrWhiteSpace(m))
            .Select(m => m.Trim())
            .Distinct()
            .ToList();

        return new RegistroFiltro(
            TextoHelper.NormalizarOuNulo(matricula),
            TextoHelper.NormalizarOuNulo(nome),
            listaMotivos is { Count: > 0 } ? listaMotivos : null,
            de,
            ate);
    }
}
