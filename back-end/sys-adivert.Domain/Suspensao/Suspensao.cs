namespace sys_adivert.suspensao.Entity;

public class Suspensao
{
    public int Id {get; set;}

    public DateOnly DataEmissao {get; set;}

    public string Matricula {get; set;}

    public string Nome {get; set;}

    public int Dias {get; set;}

    public DateOnly DataInicio {get; set;}

    public DateOnly DataRetorno {get; set;}

    public string Motivo {get; set;}

    public string? Complemento {get; set;}

    public bool Assinada {get; set;}

    public ICollection<SuspensaoEvidencia> Evidencias {get; set;} = new List<SuspensaoEvidencia>();

    public Suspensao(DateOnly dataEmissao, string matricula, string nome, int dias, DateOnly dataInicio, DateOnly dataRetorno, string motivo, string? complemento = null)
    {
        DataEmissao = dataEmissao;
        Matricula = matricula;
        Nome = nome;
        Dias = dias;
        DataInicio = dataInicio;
        DataRetorno = dataRetorno;
        Motivo = motivo;
        Complemento = complemento;
        Assinada = false;
    }

    public void MarcarAssinatura(bool assinada)
    {
        Assinada = assinada;
    }

    public void Update(DateOnly dataEmissao, string matricula, string nome, int dias, DateOnly dataInicio, DateOnly dataRetorno, string motivo, string? complemento)
    {
        DataEmissao = dataEmissao;
        Matricula = matricula;
        Nome = nome;
        Dias = dias;
        DataInicio = dataInicio;
        DataRetorno = dataRetorno;
        Motivo = motivo;
        Complemento = string.IsNullOrWhiteSpace(complemento) ? null : complemento;
    }
}
