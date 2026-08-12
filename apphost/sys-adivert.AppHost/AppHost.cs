// Descreve o ambiente de desenvolvimento completo. Rodar este projeto (F5 no VS Code
// ou `aspire run`) sobe banco, API e front-end juntos.
var builder = DistributedApplication.CreateBuilder(args);

// Usuario, senha e porta fixos de proposito: assim a connection string escrita em
// appsettings.Development.json bate com este container, e da para abrir o banco num
// cliente (DBeaver/pgAdmin) com credenciais conhecidas.
var pgUser = builder.AddParameter("pg-user", "postgres");
var pgPassword = builder.AddParameter("pg-password", "postgres");

// Sem WithDataVolume(): o container e efemero, entao cada execucao comeca com banco novo.
var postgres = builder.AddPostgres("postgres", userName: pgUser, password: pgPassword, port: 5432);

var db = postgres.AddDatabase("sysadivert");

// launchProfileName "http" evita o UseHttpsRedirection() do Program.cs e o certificado
// de desenvolvimento. O nome ConnectionStrings__DefaultConnection e explicito porque o
// padrao do Aspire seria ConnectionStrings__sysadivert, que o Program.cs da API nao le.
var api = builder.AddProject<Projects.sys_adivert_Api>("api", launchProfileName: "http")
    .WithEnvironment("ConnectionStrings__DefaultConnection", db)
    .WaitFor(db);

builder.Build().Run();
