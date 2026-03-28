FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia os projetos e restaura as dependências
COPY ["sys-adivert.Api/sys-adivert.Api.csproj", "sys-adivert.Api/"]
COPY ["sys-adivert.Infrastructure/sys-adivert.Infrastructure.csproj", "sys-adivert.Infrastructure/"]
COPY ["sys-adivert.Domain/sys-adivert.Domain.csproj", "sys-adivert.Domain/"]
COPY ["sys-adivert.Application/sys-adivert.Application.csproj", "sys-adivert.Application/"]

RUN dotnet restore "sys-adivert.Api/sys-adivert.Api.csproj"

# Copia tudo e compila
COPY . .
RUN dotnet publish "sys-adivert.Api/sys-adivert.Api.csproj" -c Release -o /app/publish

# Imagem final de execução
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "sys-adivert.Api.dll"]