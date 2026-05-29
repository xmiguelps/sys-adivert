namespace sys_adivert.motivo.Entity;

public class Motivo
{
    public int Id { get; set; }

    public string Descricao { get; set; }

    public Motivo(int id, string descricao)
    {
        Id = id;
        Descricao = descricao;
    }

    // Construtor para criação (sem Id — gerado pelo banco)
    public Motivo(string descricao)
    {
        Descricao = descricao;
    }
}
