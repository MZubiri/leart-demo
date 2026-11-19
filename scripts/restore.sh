#!/usr/bin/env bash
set -euo pipefail
umask 077
backup_dir=${1:?Indica el directorio de copia}
backup_dir=$(cd "$backup_dir" && pwd)
: "${COMPOSE_PROJECT_NAME:?Define un nombre de proyecto NUEVO para restaurar}"
if [[ ! "$COMPOSE_PROJECT_NAME" =~ ^[a-z0-9][a-z0-9_-]*$ ]]; then echo 'Nombre de proyecto inválido.' >&2; exit 1; fi
existing=$(docker volume ls -q --filter "label=com.docker.compose.project=$COMPOSE_PROJECT_NAME")
if [[ -n "$existing" ]]; then echo 'El proyecto ya tiene volúmenes. Se rechaza sobrescribirlo.' >&2; exit 1; fi
(cd "$backup_dir" && sha256sum --check SHA256SUMS)
for archive in uploads private; do
  # El operador restaura una copia confiable; se rechazan rutas absolutas y ascendentes.
  if tar -tzf "$backup_dir/$archive.tar.gz" | awk '/^\// || /(^|\/)\.\.(\/|$)/ { bad=1 } END { exit !bad }'; then
    echo 'Archivo con rutas inseguras.' >&2; exit 1
  fi
done
docker compose up -d --wait mysql
docker compose exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql -u "$MYSQL_USER" "$MYSQL_DATABASE"' < "$backup_dir/database.sql"
docker compose run --rm -T --no-deps --user 0 --entrypoint sh backend -c 'tar xzf - -C /app/wwwroot/uploads && chown -R 1654:1654 /app/wwwroot/uploads' < "$backup_dir/uploads.tar.gz"
docker compose run --rm -T --no-deps --user 0 --entrypoint sh backend -c 'tar xzf - -C /app/storage && chown -R 1654:1654 /app/storage' < "$backup_dir/private.tar.gz"
echo 'Restauración completa en el proyecto nuevo. Inicia servicios y verifica los datos.'
