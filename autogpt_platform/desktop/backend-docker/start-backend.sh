#!/bin/bash
# Supervisor's backend program: waits for the data services, prepares Valkey and the
# database, applies migrations, then runs every backend service (`app`).
set -euo pipefail

log() { echo "[start-backend] $*"; }

wait_for() {
  local name="$1"
  shift
  for _ in $(seq 1 180); do
    if "$@" > /dev/null 2>&1; then return 0; fi
    sleep 1
  done
  log "${name} did not become ready"
  exit 1
}

wait_for postgres pg_isready -q -h 127.0.0.1 -p 5432
wait_for valkey valkey-cli -h 127.0.0.1 ping
wait_for rabbitmq bash -c 'exec 3<>/dev/tcp/127.0.0.1/5672'

# The backend only speaks Redis Cluster; a single node owning every slot is a valid cluster.
if valkey-cli -h 127.0.0.1 cluster info | grep -q '^cluster_slots_assigned:0'; then
  log "assigning all cluster slots to the local Valkey node"
  valkey-cli -h 127.0.0.1 cluster addslotsrange 0 16383 > /dev/null
fi
wait_for "valkey cluster" bash -c 'valkey-cli -h 127.0.0.1 cluster info | grep -q "^cluster_state:ok"'

PGPASSWORD="${POSTGRES_PASSWORD}" psql -h 127.0.0.1 -U postgres -d postgres -q \
  -v ON_ERROR_STOP=1 -f /opt/autogpt-desktop/init.sql

log "applying database migrations"
prisma migrate deploy

log "starting backend services"
exec app
