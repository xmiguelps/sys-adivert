namespace sys_adivert.suspensao.Entity;

public class SuspensaoEvidencia
{
    public int Id {get; set;}

    public int SuspensaoId {get; set;}

    public byte[] Conteudo {get; set;} = Array.Empty<byte>();

    public string ContentType {get; set;} = "image/jpeg";

    public string? NomeArquivo {get; set;}

    public int Ordem {get; set;}

    public Suspensao? Suspensao {get; set;}
}
