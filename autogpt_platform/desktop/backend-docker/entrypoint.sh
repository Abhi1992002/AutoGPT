#!/bin/bash
# Prepares /data (first boot: secrets + PostgreSQL cluster), exports the backend's
# environment, then hands over to supervisord.
set -euo pipefail

log() { echo "[entrypoint] $*"; }

mkdir -p /data/postgres /data/valkey /data/rabbitmq /data/workspace /run/postgresql
chown postgres:postgres /data/postgres /run/postgresql
chmod 0700 /data/postgres
chown valkey:valkey /data/valkey
chown rabbitmq:rabbitmq /data/rabbitmq

secrets=/data/secrets.env
if [[ ! -s "${secrets}" ]]; then
  log "first boot: generating secrets in ${secrets}"
  (
    umask 077
    python3 - > "${secrets}.tmp" <<'EOF'
import base64, os, secrets
print(f"POSTGRES_PASSWORD={secrets.token_hex(24)}")
print(f"JWT_VERIFY_KEY={secrets.token_hex(32)}")
print(f"ENCRYPTION_KEY={base64.urlsafe_b64encode(os.urandom(32)).decode()}")
print(f"UNSUBSCRIBE_SECRET_KEY={secrets.token_urlsafe(32)}")
EOF
    mv "${secrets}.tmp" "${secrets}"
  )
fi
set -a
# shellcheck source=/dev/null
. "${secrets}"
set +a

if [[ ! -s /data/postgres/PG_VERSION ]]; then
  log "first boot: initialising PostgreSQL in /data/postgres"
  pwfile="$(mktemp)"
  printf '%s\n' "${POSTGRES_PASSWORD}" > "${pwfile}"
  chown postgres "${pwfile}"
  runuser -u postgres -- initdb -D /data/postgres -U postgres --pwfile="${pwfile}" \
    --auth-host=scram-sha-256 --auth-local=peer --encoding=UTF8 --locale=C.UTF-8 > /dev/null
  rm -f "${pwfile}"
fi

db_url="postgresql://postgres:${POSTGRES_PASSWORD}@127.0.0.1:5432/postgres?schema=platform&connect_timeout=60"
export DATABASE_URL="${db_url}" DIRECT_URL="${db_url}"
# The desktop webview (tauri://localhost, http://tauri.localhost) and its dev server
default_cors='["regex:^(tauri://localhost|https?://tauri\\.localhost|http://localhost:1420)$"]'
export BACKEND_CORS_ALLOW_ORIGINS="${BACKEND_CORS_ALLOW_ORIGINS:-${default_cors}}"

exec "$@"
