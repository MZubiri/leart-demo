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

# ==========================================
# Etapa 3: Runtime Fullstack (.NET 9 + Angular + MySQL)
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Instalar MariaDB / MySQL server, cliente y utilidades
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    mariadb-server \
    mariadb-client \
    dos2unix \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copiar aplicación ASP.NET Core compilada
COPY --from=backend-build /app/publish .

# Copiar el bundle de Angular y sus activos directamente a wwwroot
COPY --from=frontend-build /app/dist/leart-demo/browser/ /app/wwwroot/

# Crear directorios para subida de fotos y sockets de MariaDB
RUN mkdir -p /app/wwwroot/uploads/products /app/wwwroot/uploads/orders /var/lib/mysql /var/run/mysqld && \
    chown -R mysql:mysql /var/lib/mysql /var/run/mysqld

# Copiar y preparar script de inicio
COPY entrypoint.sh /app/entrypoint.sh
RUN dos2unix /app/entrypoint.sh && chmod +x /app/entrypoint.sh

ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 80

ENTRYPOINT ["/app/entrypoint.sh"]
