FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["Leart.Api.csproj", "./"]
RUN dotnet restore "Leart.Api.csproj"

COPY . .
RUN dotnet publish "Leart.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

RUN mkdir -p /app/wwwroot/uploads/products /app/storage/orders && chown -R app:app /app/wwwroot/uploads /app/storage
USER app
VOLUME ["/app/wwwroot/uploads", "/app/storage"]
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "Leart.Api.dll"]
