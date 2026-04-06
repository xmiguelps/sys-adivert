using Microsoft.EntityFrameworkCore;
using sys_adivert.Application.Repository;
using sys_adivert.Application.Service;
using sys_adivert.Infrastructure.Adiverts.Repository;
using sys_adivert.Infrastructure.AppDb;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi

builder.Services.AddOpenApi();

builder.Services.AddAuthorization();

builder.Services.AddControllers();

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

builder.Services.AddDbContext<AppDbContext>(options => 
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IAdivertRepository, AdivertRepository>();
builder.Services.AddScoped<IAdivertService, AdivertService>();

// builder.Services.AddCors(options =>
// {
//     options.AddPolicy("AllowFrontend",
//         policy =>
//         {
//             policy.WithOrigins("http://localhost:5010")
//                   .AllowAnyHeader()
//                   .AllowAnyMethod();
//         });
// });
builder.Services.AddCors(options => {
    options.AddPolicy("PublicPolicy", policy => {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseCors("AllowFrontend");
app.UseCors("PublicPolicy");

app.UseAuthorization();

app.UseHttpsRedirection();

app.MapControllers();

app.Run();