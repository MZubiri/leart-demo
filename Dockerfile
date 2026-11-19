# ==========================================
# Etapa 1: Compilación de Frontend (Angular 21)
# ==========================================
FROM node:22-alpine AS frontend-build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# Etapa 2: Compilación de Backend (.NET 9)
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-build
WORKDIR /src

COPY ["backend/Leart.Api/Leart.Api.csproj", "backend/Leart.Api/"]
RUN dotnet restore "backend/Leart.Api/Leart.Api.csproj"

COPY backend/Leart.Api/ backend/Leart.Api/
WORKDIR /src/backend/Leart.Api
RUN dotnet publish "Leart.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime fullstack con MySQL externo y almacenamiento persistente.
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=backend-build /app/publish .
COPY --from=frontend-build /app/dist/leart-demo/browser/ /app/wwwroot/
RUN mkdir -p /app/wwwroot/uploads/products /app/storage/orders && chown -R app:app /app/wwwroot/uploads /app/storage
USER app
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
VOLUME ["/app/wwwroot/uploads", "/app/storage"]
EXPOSE 8080
ENTRYPOINT ["dotnet", "Leart.Api.dll"]
