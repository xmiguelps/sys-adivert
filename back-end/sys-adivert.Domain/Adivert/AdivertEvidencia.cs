namespace sys_adivert.adivert.Entity;

public class AdivertEvidencia
{
    public int Id {get; set;}

    public int AdivertId {get; set;}

    public byte[] Conteudo {get; set;} = Array.Empty<byte>();

    public string ContentType {get; set;} = "image/jpeg";

    public string? NomeArquivo {get; set;}

    public int Ordem {get; set;}

    public Adivert? Adivert {get; set;}
}
