#!/usr/bin/env bash
set -euo pipefail
umask 077
backup_dir=${1:?Indica un directorio nuevo para la copia}
if [[ -e "$backup_dir" ]]; then echo 'El destino debe ser nuevo.' >&2; exit 1; fi
mkdir -p "$backup_dir"
backup_dir=$(cd "$backup_dir" && pwd)
was_running=$(docker compose ps --status running -q backend)
resume_backend() { if [[ -n "$was_running" ]]; then docker compose start backend >/dev/null; fi; }
trap resume_backend EXIT
if [[ -n "$was_running" ]]; then docker compose stop backend >/dev/null; fi
docker compose exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump --single-transaction --no-tablespaces --set-gtid-purged=OFF -u "$MYSQL_USER" "$MYSQL_DATABASE"' > "$backup_dir/database.sql"
docker compose run --rm -T --no-deps --user 0 --entrypoint tar backend -C /app/wwwroot/uploads -czf - . > "$backup_dir/uploads.tar.gz"
docker compose run --rm -T --no-deps --user 0 --entrypoint tar backend -C /app/storage -czf - . > "$backup_dir/private.tar.gz"
(cd "$backup_dir" && sha256sum database.sql uploads.tar.gz private.tar.gz > SHA256SUMS)
echo 'Copia completa: base, uploads y fotos privadas. Comprueba su restauración.'
