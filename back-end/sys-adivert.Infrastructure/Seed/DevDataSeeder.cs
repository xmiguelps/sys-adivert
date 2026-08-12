using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using sys_adivert.adivert.Entity;
using sys_adivert.colab.Entity;
using sys_adivert.Infrastructure.AppDb;

namespace sys_adivert.Infrastructure.Seed;

/// <summary>
/// Popula o banco de desenvolvimento com dados ficticios.
/// Duas travas independentes: o Program.cs so chama em ambiente Development, e este
/// seeder se recusa a escrever se o host da connection string nao for local.
/// </summary>
public static class DevDataSeeder
{
    // Semente fixa: o conjunto tem sempre a mesma FORMA — os mesmos colaboradores, as mesmas
    // quantidades por pessoa, os mesmos tipos, os mesmos deslocamentos de data em dias. O que
    // NAO e estavel entre dias diferentes sao as datas absolutas: elas sao relativas a
    // DateTime.Today, de proposito, para o conjunto nao envelhecer ate virar "nenhuma
    // advertencia nos ultimos seis meses". Duas execucoes no mesmo dia sao identicas.
    private const int Semente = 20260812;

    private static readonly string[] NomesSeed =
    [
        "Adriana Nogueira Prado",
        "Alexandre Bittencourt Rosa",
        "Amanda Quirino Vasques",
        "Anderson Palmeira Toledo",
        "Beatriz Sampaio Andrade",
        "Bruno Vilela Meireles",
        "Camila Rezende Fontoura",
        "Carlos Eduardo Vasconcelos",
        "Cristiane Aparecida Bueno",
        "Daniel Otávio Ferraz",
        "Débora Cristina Salgado",
        "Diego Marchesi Coutinho",
        "Eduardo Tavares Pimenta",
        "Elaine Moraes Sobral",
        "Fabiana Lustosa Rangel",
        "Fábio Henrique Peçanha",
        "Felipe Andrade Zanetti",
        "Gabriela Munhoz Teixeira",
        "Gustavo Lemos Bragança",
        "Helena Vitória Caldas",
        "Igor Sarmento Vilhena",
        "Jaqueline Borges Amorim",
        "João Vitor Assunção",
        "Juliana Paes Kruger",
        "Leandro Cardim Estevão",
        "Letícia Marques Ferrão",
        "Lucas Aguiar Pontes",
        "Marcelo Trindade Bastos",
        "Mariana Duarte Nogueira",
        "Nathalia Cordeiro Simões",
        "Otávio Camargo Bicalho",
        "Patrícia Rangel Vidotti",
        "Rafael Siqueira Bandeira",
        "Renata Guimarães Portela",
        "Ricardo Veríssimo Almeida",
        "Rodrigo Frota Menezes",
        "Sabrina Correia Valadares",
        "Thiago Barcelos Pinheiro",
        "Vanessa Klein Andrade",
        "Wagner Furtado Sanches",
    ];

    private static readonly string[] ComplementosSeed =
    [
        "Terceira ocorrência no mesmo trimestre; colaborador ciente do procedimento.",
        "Orientado verbalmente em duas oportunidades anteriores, sem mudança de conduta.",
        "Ocorrência registrada pelo líder do turno, com testemunha presente.",
        "Colaborador reconheceu o ocorrido e assinou ciência no ato.",
        "Reincidência após treinamento de reciclagem concluído no mês anterior.",
        "A situação gerou parada de linha por aproximadamente 40 minutos.",
    ];

    public static async Task SeedAsync(AppDbContext db, ILogger logger)
    {
        if (!HostEhLocal(db.Database.GetConnectionString()))
        {
            logger.LogWarning(
                "DevDataSeeder ignorado: a connection string nao aponta para host local. " +
                "Dados ficticios so sao inseridos em banco local.");
            return;
        }

        if (await db.Colabs.AnyAsync())
        {
            logger.LogInformation("DevDataSeeder ignorado: o banco ja tem colaboradores.");
            return;
        }

        // Os motivos NAO sao criados aqui. A migration 20260528195547_CriandoTabelaDeMotivos
        // ja insere os motivos reais da operacao em todo banco novo, e as advertencias ficticias
        // referenciam esses. Se o seeder inventasse os seus, os motivos reais ficariam com zero
        // advertencias — e o historico por motivo e o Excel por motivo, que sao justamente o que
        // estes dados existem para exercitar, apareceriam vazios nos motivos que o usuario usa.
        var motivos = await db.Motivos
            .Select(m => m.Descricao)
            .ToListAsync();

        if (motivos.Count == 0)
        {
            logger.LogWarning(
                "DevDataSeeder ignorado: nao ha motivos no banco. Esperava-se que a migration " +
                "CriandoTabelaDeMotivos os tivesse inserido.");
            return;
        }

        var rnd = new Random(Semente);

        var colabs = new List<Colab>();
        for (var i = 0; i < NomesSeed.Length; i++)
        {
            colabs.Add(new Colab(NomesSeed[i], (10001 + i).ToString()));
        }
        db.Colabs.AddRange(colabs);

        await db.SaveChangesAsync();

        var hoje = DateOnly.FromDateTime(DateTime.Today);
        var adverts = new List<Adivert>();

        // Distribuicao desigual de proposito: alguns reincidentes e uma maioria com uma a
        // tres advertencias. Sem isso, o historico por colaborador e o Excel por motivo
        // saem todos iguais e nao servem para testar nada.
        for (var i = 0; i < colabs.Count; i++)
        {
            var colab = colabs[i];

            int quantidade;
            if (i < 5)
            {
                quantidade = rnd.Next(8, 13);
            }
            else if (i < 15)
            {
                quantidade = rnd.Next(4, 8);
            }
            else
            {
                quantidade = rnd.Next(1, 4);
            }

            for (var j = 0; j < quantidade; j++)
            {
                var data = hoje.AddDays(-rnd.Next(0, 730));
                var tipo = rnd.Next(0, 10) < 6 ? "Escrita" : "Verbal";
                var motivo = motivos[rnd.Next(0, motivos.Count)];

                string? complemento = null;
                if (rnd.Next(0, 10) < 3)
                {
                    complemento = ComplementosSeed[rnd.Next(0, ComplementosSeed.Length)];
                }

                var adivert = new Adivert(data, colab.Matricula, motivo, colab.Nome, tipo, complemento);
                adivert.MarcarAssinatura(rnd.Next(0, 10) < 7);
                adverts.Add(adivert);
            }
        }

        db.Adiverts.AddRange(adverts);

        // Tres advertencias com evidencia, para conferir o PDF com imagem sem precisar
        // subir arquivo na mao. ContentType tem de ser image/png: o default da entidade e
        // image/jpeg, e pdfAdvertencia.ts monta a data URL a partir desse campo, entao um
        // PNG rotulado como JPEG nao renderiza.
        var cores = new (byte R, byte G, byte B)[] { (168, 21, 21), (32, 74, 135), (78, 154, 6) };
        var comEvidencia = adverts.Where(a => a.Complemento is not null).Take(3).ToList();
        for (var i = 0; i < comEvidencia.Count; i++)
        {
            var cor = cores[i % cores.Length];
            var quantidade = i == 0 ? 2 : 1;
            for (var ordem = 0; ordem < quantidade; ordem++)
            {
                comEvidencia[i].Evidencias.Add(new AdivertEvidencia
                {
                    Conteudo = PngSimples.CorSolida(600, 400, cor.R, cor.G, cor.B),
                    ContentType = "image/png",
                    NomeArquivo = $"evidencia-{i + 1}-{ordem + 1}.png",
                    Ordem = ordem,
                });
            }
        }

        await db.SaveChangesAsync();

        logger.LogInformation(
            "DevDataSeeder: {Motivos} motivos, {Colabs} colaboradores, {Adverts} advertencias e {Evidencias} evidencias inseridos.",
            motivos.Count, colabs.Count, adverts.Count, comEvidencia.Sum(a => a.Evidencias.Count));
    }

    // Terceira camada de isolamento: nenhuma escrita ficticia fora de um banco local.
    private static bool HostEhLocal(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return false;
        }

        string host;
        try
        {
            host = new NpgsqlConnectionStringBuilder(connectionString).Host ?? string.Empty;
        }
        catch (Exception)
        {
            return false;
        }

        return host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            || host == "127.0.0.1"
            || host == "::1";
    }
}
