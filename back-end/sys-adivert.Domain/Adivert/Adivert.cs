namespace sys_adivert.adivert.Entity;

public class Adivert
{
    public DateOnly Data {get; set;}

    public string Matricula {get; set;}

    public string Nome {get; set;}

    public string Tipo {get; set;}

    public string Motivo {get; set;}

    public bool Assinada {get; set;}

    public int Id {get; set;}

    public Adivert(DateOnly data, string matricula, string motivo, string nome, string tipo)
    {
        Data = data;
        Matricula = matricula;
        Motivo = motivo;
        Nome = nome;
        Tipo = tipo;
        Assinada = false;
    }

    public void MarcarAssinatura(bool assinada)
    {
        Assinada = assinada;
    }

    public void Update(DateOnly data, string? matricula, string? nome, string? tipo, string? motivo)
    {
        Data = data;
        if (!string.IsNullOrWhiteSpace(matricula)) Matricula = matricula;

        if (!string.IsNullOrWhiteSpace(nome)) Nome = nome;

        if (!string.IsNullOrWhiteSpace(tipo)) Tipo = tipo;

        if (!string.IsNullOrWhiteSpace(motivo)) Motivo = motivo;
    }
}