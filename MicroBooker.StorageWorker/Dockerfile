FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["MicroBooker.StorageWorker/MicroBooker.StorageWorker.csproj", "MicroBooker.StorageWorker/"]
COPY ["MicroBooker.Domain/MicroBooker.Domain.csproj", "MicroBooker.Domain/"]
COPY ["MicroBooker.Infrastructure/MicroBooker.Infrastructure.csproj", "MicroBooker.Infrastructure/"]
COPY ["MicroBooker.Application/MicroBooker.Application.csproj", "MicroBooker.Application/"]
RUN dotnet restore "MicroBooker.StorageWorker/MicroBooker.StorageWorker.csproj"
COPY . .
RUN dotnet publish "MicroBooker.StorageWorker/MicroBooker.StorageWorker.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MicroBooker.StorageWorker.dll"]