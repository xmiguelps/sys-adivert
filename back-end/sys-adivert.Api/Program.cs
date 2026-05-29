using Microsoft.EntityFrameworkCore;
using sys_adivert.Application.Repository;
using sys_adivert.Application.Service;
using sys_adivert.Infrastructure.Adiverts.Repository;
using sys_adivert.Infrastructure.Colabs.Repository;
using sys_adivert.Infrastructure.Motivos.Repository;
using sys_adivert.Infrastructure.AppDb;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddAuthorization();

builder.Services.AddControllers();

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// Adivert
builder.Services.AddScoped<IAdivertRepository, AdivertRepository>();
builder.Services.AddScoped<IAdivertService, AdivertService>();

// Colab
builder.Services.AddScoped<IColabRepository, ColabRepository>();
builder.Services.AddScoped<IColabService, ColabService>();

// Motivo
builder.Services.AddScoped<IMotivoRepository, MotivoRepository>();
builder.Services.AddScoped<IMotivoService, MotivoService>();

builder.Services.AddCors(options => {
    options.AddPolicy("PublicPolicy", policy => {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("PublicPolicy");
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok("healthy"));

app.Run();
