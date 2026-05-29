using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace sys_adivert.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CriandoTabelaDeMotivos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Motivos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Descricao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Motivos", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Motivos_Descricao",
                table: "Motivos",
                column: "Descricao",
                unique: true);

            // Seed dos motivos que antes estavam fixos no front-end (context.tsx).
            // Coluna única -> o Id é gerado pela identity do Postgres (sequence avança normalmente).
            migrationBuilder.InsertData(
                table: "Motivos",
                column: "Descricao",
                values: new object[]
                {
                    "Ato de desídia: registro de ponto sem a devida presença no local de trabalho ou atendimento designado.",
                    "Ato de Indisciplina – Por ausência de batidas e falta de comprometimento nas solicitações de ponto.",
                    "Ato de Indisciplina – Por falta de atenção recorrente ao não realizar marcações de ponto e solicitações constantes de ajuste de ponto.",
                    "Descumprimento do horário de intervalo, realizando pausas superiores ao limite estabelecido pela empresa.",
                    "Descumprimento do horário de intervalo, realizando pausas superiores ao limite estabelecido pela empresa. Foi identificado que o colaborador registrou o retorno do intervalo no relógio de ponto, contudo não retomou as atividades laborais, em desacordo com as normas internas da empresa.",
                    "Manter a janela aberta por período superior a 15 minutos após o intervalo de almoço, não iniciando o contrato subsequente dentro do prazo estabelecido.",
                    "Falta sem justificativa no dia.",
                    "Faltas consecutivas sem justificativa nos dias.",
                    "Ausência parcial do expediente sem justificativa legal, apresentando apenas atestado de horas, que não abrangeu todo o período da falta.",
                    "Por chegar atrasado, sem apresentar justificativa.",
                    "Ausentou-se para o intervalo de almoço e não retornou ao posto de trabalho, caracterizando abandono de função no período e descumprimento da jornada estabelecida.",
                    "Por não comparecer à reunião convocada pela supervisão.",
                    "Conduta inadequada que compromete a comunicação e o desempenho das atividades profissionais.",
                    "Conduta inadequada - Por ter adotado postura inadequada durante reunião interna, elevando o tom de voz e discutindo de forma incompatível com o ambiente profissional, diante dos demais colaboradores.",
                    "Desrespeito: comportamento inadequado ou falta de respeito com outro colaborador, alterando o tom ou gerando discussão.",
                    "Insubordinação.",
                    "Insubordinação: recusa em cumprir atividade ou orientação determinada pela liderança.",
                    "Utilização de aparelho celular durante o horário de trabalho sem justificativa ou relação com as atividades.",
                    "Ato desídia, por assinar um documento digital se passando pelo cliente.",
                    "Ato desídia, por manipular o sistema de batida de ponto.",
                    "Desídia - Prestou informação falsa para não realizar a troca de equipamento do cliente.",
                    "Má conduta – desvio de material.",
                    "Registro de informações inverídicas no formulário de validação de serviço, em desacordo com os procedimentos internos, comprometendo a confiabilidade dos controles internos e a integridade dos processos da empresa.",
                    "Descumprimento imotivado do serviço.",
                    "Abandono de rota, sem comunicação prévia à liderança e sem justificativa.",
                    "Não cumprir com os procedimentos da empresa, orientando o cliente a reagendar o serviço por meio do aplicativo Minha Claro, em desacordo com os procedimentos estabelecidos pela empresa.",
                    "Conduta inadequada ao cancelar revisita de forma indevida, com o objetivo de não impactar os indicadores de desempenho. Tal prática caracteriza descumprimento aos procedimentos da empresa.",
                    "Não cumprir com os procedimentos da empresa, não realizando a unificação das redes de Wi-Fi, deixando o serviço com percentual de conclusão abaixo do exigido.",
                    "Não cumprir com os procedimentos da empresa, instalação fora do padrão. Durante autoinspeção do Controle de Qualidade da Claro, foi constatado que o colaborador não realizou a instalação da capinha do mini isolador.",
                    "Não cumprir com os procedimentos da empresa, instalação fora do padrão. Foi constatada a execução de adesão utilizando cabeamento (fibra) pertencente a outra operadora, prática que não está em conformidade com os procedimentos técnicos e normas internas da empresa.",
                    "Não cumprir com os procedimentos da empresa, instalação fora do padrão. Durante autoinspeção do Controle de Qualidade da Claro, foi constatado que o colaborador deixou de colher a assinatura do cliente na ordem de serviço.",
                    "Não cumprir com os procedimentos da empresa, instalação fora do padrão, deixando o cabo DROP com emenda, prática não permitida, ocasionando retorno de serviço.",
                    "Não cumprir com os procedimentos da empresa, foto de evidência fora do padrão.",
                    "Não cumprir com os procedimentos da empresa, foto de evidência fora do padrão. Durante inspeção do controle de qualidade da Claro, foi constatado que a foto registrada pelo colaborador estava fora do padrão exigido, não apresentando de forma adequada o conector e a ONT, conforme orientações.",
                    "Não cumprir com os procedimentos da empresa, realizando lançamento indevido de material.",
                    "Não cumprir com os procedimentos da empresa, realizando baixa indevida, sem validação com seu superior.",
                    "Não cumprir com os procedimentos da empresa, realizando baixa sem validação com seu superior.",
                    "Não cumprir com os procedimentos do setor do almoxarifado, entregando material restrito, sem autorização do seu superior.",
                    "Não cumprir com os procedimentos da empresa, não realizando o lançamento de material.",
                    "Não cumprir com os procedimentos da empresa, não realizando processo do NR35.",
                    "Por não utilizar o Equipamento de Proteção Individual (E.P.I.) durante o desempenho de suas atividades, contrariando as normas de segurança do trabalho da empresa.",
                    "Utilização de veículo fora do horário de trabalho.",
                    "Por não realizar o lançamento do atestado médico no aplicativo da empresa, conforme procedimento interno.",
                    "Não cumprir com os procedimentos da empresa, não realizando validação do quality da manutenção com seu superior ou COP.",
                    "Não cumprir com os procedimentos da empresa, não inserindo as evidências no Connect.",
                    "Não cumprir os procedimentos da empresa, inserindo evidências de forma incorreta no Connect.",
                    "Não cumprir com os procedimentos da empresa, uma vez que o colaborador não efetuou o envio das informações obrigatórias no sistema CONECT, incluindo foto com geolocalização, fotos dos ativos e registro da baixa.",
                    "Não cumprir com os procedimentos da empresa, afetando indicador. Colaborador realizou a baixa da O.S. fora da grade, ocasionando impacto negativo no indicador TEC1.",
                    "Não cumprir com os procedimentos da empresa, não realizando o monitoramento da rota, afetando indicador TEC1.",
                    "Por iniciar o primeiro atendimento após as 08h30, afetando indicador."
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Motivos");
        }
    }
}
