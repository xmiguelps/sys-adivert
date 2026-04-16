namespace sys_adivert.colab.Entity;

public class Colab
{
    public int Id { get; set; }

    public string Nome { get; set; }

    public string Matricula { get; set; }

    public Colab(int id, string nome, string matricula)
    {
        Id = id;
        Nome = nome;
        Matricula = matricula;
    }

    // Construtor para criação (sem Id — gerado pelo banco)
    public Colab(string nome, string matricula)
    {
        Nome = nome;
        Matricula = matricula;
    }
}
