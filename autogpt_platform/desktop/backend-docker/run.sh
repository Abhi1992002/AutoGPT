#!/usr/bin/env bash
# AutoGPT Desktop backend: runs the whole AutoGPT backend in one local Docker container.
#
#   ./run.sh start    build (or pull) the image if needed, start the container, wait until healthy
#   ./run.sh stop     stop the container; data is kept
#   ./run.sh status   container state and service health; exits 0 only when healthy
#   ./run.sh logs     follow the container logs (extra args go to `docker logs`)
#   ./run.sh reset    delete the container and ALL its data (asks first; --yes skips)
#   ./run.sh build    rebuild the image from source
#
# Environment:
#   AGPT_DESKTOP_IMAGE     image to pull and run instead of building locally
#   AGPT_DESKTOP_VERSION   tag for local builds (default: dev)
#   AGPT_DESKTOP_API_PORT  host port for the REST API (default: 8006)
#   AGPT_DESKTOP_WS_PORT   host port for the WebSocket API (default: 8001)
#   AGPT_DESKTOP_ENV_FILE  env file passed to the container, e.g. OPENAI_API_KEY=...
#   AGPT_DESKTOP_SRC       repo checkout to build from (default: the one holding this script,
#                          otherwise a sparse clone in ~/.cache/autogpt-desktop/src)
set -euo pipefail

VERSION="${AGPT_DESKTOP_VERSION:-dev}"
IMAGE="${AGPT_DESKTOP_IMAGE:-autogpt-desktop-backend:${VERSION}}"
CONTAINER=autogpt-desktop-backend
VOLUME=autogpt-desktop-data
API_PORT="${AGPT_DESKTOP_API_PORT:-8006}"
WS_PORT="${AGPT_DESKTOP_WS_PORT:-8001}"
ENV_FILE="${AGPT_DESKTOP_ENV_FILE:-}"
REPO_URL="${AGPT_DESKTOP_REPO:-https://github.com/Abhi1992002/autogpt-desktop-v2.git}"
REPO_REF="${AGPT_DESKTOP_REF:-desktop/scaffold}"
START_TIMEOUT="${AGPT_DESKTOP_START_TIMEOUT:-900}"
HEALTH_URL="http://127.0.0.1:8006/health/status"

log() { printf '==> %s\n' "$*" >&2; }
die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_docker() {
  command -v docker > /dev/null 2>&1 ||
    die "Docker is not installed. Get Docker Desktop: https://docs.docker.com/get-docker/"
  docker info > /dev/null 2>&1 ||
    die "Docker is not running (or this user can't reach it). Start Docker Desktop and try again."
}

container_exists() { docker container inspect "${CONTAINER}" > /dev/null 2>&1; }
container_running() { [[ "$(docker container inspect -f '{{.State.Running}}' "${CONTAINER}" 2> /dev/null)" == true ]]; }
image_exists() { docker image inspect "${IMAGE}" > /dev/null 2>&1; }

# Prints the backend's /health/status body (also when degraded); empty while the API is down
health_json() { docker exec "${CONTAINER}" curl -s --max-time 5 "${HEALTH_URL}" 2> /dev/null || true; }
is_healthy() { [[ "$1" == *'"status":"ok"'* ]]; }

source_dir() {
  if [[ -n "${AGPT_DESKTOP_SRC:-}" ]]; then
    echo "${AGPT_DESKTOP_SRC}"
    return
  fi
  local here
  here="$(dirname "${BASH_SOURCE[0]:-$0}")"
  if [[ -f "${here}/../../backend/Dockerfile" ]]; then
    (cd "${here}/../../.." && pwd)
    return
  fi
  local cache="${XDG_CACHE_HOME:-${HOME}/.cache}/autogpt-desktop/src"
  command -v git > /dev/null 2>&1 ||
    die "git is needed to fetch the backend source (or set AGPT_DESKTOP_IMAGE to a prebuilt image)"
  if [[ -d "${cache}/.git" ]]; then
    log "Updating source (${REPO_REF}) in ${cache}"
    git -C "${cache}" fetch --quiet --depth 1 origin "${REPO_REF}"
    git -C "${cache}" reset --quiet --hard FETCH_HEAD
  else
    log "Fetching source (${REPO_REF}) into ${cache}"
    git clone --quiet --depth 1 --filter=blob:none --sparse --branch "${REPO_REF}" "${REPO_URL}" "${cache}"
    git -C "${cache}" sparse-checkout set autogpt_platform/backend autogpt_platform/autogpt_libs \
      autogpt_platform/desktop/backend-docker docs
  fi
  echo "${cache}"
}

build_image() {
  [[ -z "${AGPT_DESKTOP_IMAGE:-}" ]] || die "AGPT_DESKTOP_IMAGE is set, so there is nothing to build"
  local src base="autogpt-desktop-backend-base:${VERSION}"
  src="$(source_dir)"
  log "Building ${base} from ${src} (the first build takes 10-20 minutes)"
  DOCKER_BUILDKIT=1 docker build -f "${src}/autogpt_platform/backend/Dockerfile" --target server \
    -t "${base}" "${src}"
  log "Building ${IMAGE}"
  DOCKER_BUILDKIT=1 docker build -f "${src}/autogpt_platform/desktop/backend-docker/Dockerfile" \
    --build-arg BASE_IMAGE="${base}" --build-arg VERSION="${VERSION}" -t "${IMAGE}" "${src}"
}

ensure_image() {
  image_exists && return 0
  if [[ -n "${AGPT_DESKTOP_IMAGE:-}" ]]; then
    log "Pulling ${IMAGE}"
    docker pull "${IMAGE}"
  else
    build_image
  fi
}

# Identifies the settings a container was created with, so `start` recreates it when they change
config_id() {
  local env_sum=""
  if [[ -n "${ENV_FILE}" ]]; then
    [[ -r "${ENV_FILE}" ]] || die "AGPT_DESKTOP_ENV_FILE is not readable: ${ENV_FILE}"
    env_sum="$(cksum < "${ENV_FILE}")"
  fi
  echo "$(docker image inspect -f '{{.Id}}' "${IMAGE}") ${API_PORT} ${WS_PORT} ${env_sum}"
}

wait_healthy() {
  log "Waiting for the backend (the first start applies database migrations and takes a few minutes)"
  local deadline=$((SECONDS + START_TIMEOUT)) body=""
  while ((SECONDS < deadline)); do
    if ! container_running; then
      docker logs --tail 40 "${CONTAINER}" >&2 || true
      die "the container stopped (last log lines above)"
    fi
    body="$(health_json)"
    is_healthy "${body}" && return 0
    sleep 3
  done
  [[ -n "${body}" ]] && printf '%s\n' "${body}" >&2
  die "the backend isn't healthy after ${START_TIMEOUT}s; check: $0 logs"
}

print_urls() {
  cat << EOF
AutoGPT backend is running.
  API:        http://localhost:${API_PORT}
  WebSocket:  ws://localhost:${WS_PORT}/ws
  Health:     http://localhost:${API_PORT}/health/status
EOF
}

cmd_start() {
  require_docker
  ensure_image
  local want
  want="$(config_id)"
  if container_exists && [[ "$(docker container inspect -f '{{index .Config.Labels "agpt.desktop.config"}}' "${CONTAINER}")" != "${want}" ]]; then
    log "Image or settings changed; recreating the container (data is kept)"
    docker rm -f "${CONTAINER}" > /dev/null
  fi
  if ! container_exists; then
    docker volume create "${VOLUME}" > /dev/null
    local args=(
      --name "${CONTAINER}" --restart unless-stopped --shm-size 1g
      --label "agpt.desktop.config=${want}"
      -p "127.0.0.1:${API_PORT}:8006" -p "127.0.0.1:${WS_PORT}:8001"
      -v "${VOLUME}:/data"
      --log-driver json-file --log-opt max-size=50m --log-opt max-file=3
    )
    [[ -n "${ENV_FILE}" ]] && args+=(--env-file "${ENV_FILE}")
    log "Starting ${CONTAINER} (${IMAGE})"
    docker run -d "${args[@]}" "${IMAGE}" > /dev/null
  elif ! container_running; then
    log "Starting ${CONTAINER}"
    docker start "${CONTAINER}" > /dev/null
  fi
  wait_healthy
  print_urls
}

cmd_stop() {
  require_docker
  if container_running; then
    log "Stopping ${CONTAINER}"
    docker stop -t 45 "${CONTAINER}" > /dev/null
  fi
  echo "AutoGPT backend is stopped."
}

cmd_status() {
  require_docker
  if ! container_exists; then
    echo "AutoGPT backend is not installed (run: $0 start)."
    exit 3
  fi
  local state health body
  state="$(docker container inspect -f '{{.State.Status}}' "${CONTAINER}")"
  health="$(docker container inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "${CONTAINER}")"
  echo "container: ${state}${health:+ (${health})}"
  container_running || exit 1
  body="$(health_json)"
  echo "health:    ${body:-not responding yet}"
  is_healthy "${body}" || exit 1
  print_urls
}

cmd_logs() {
  require_docker
  container_exists || die "the container doesn't exist (run: $0 start)"
  docker logs --tail 200 -f "$@" "${CONTAINER}"
}

cmd_reset() {
  require_docker
  if [[ "${1:-}" != "--yes" && "${1:-}" != "-y" ]]; then
    [[ -t 0 ]] || die "reset deletes all backend data; run '$0 reset --yes' to confirm"
    local answer
    read -r -p "Delete the backend container and ALL its data (volume ${VOLUME})? Type 'reset': " answer
    [[ "${answer}" == reset ]] || die "aborted"
  fi
  docker rm -f "${CONTAINER}" > /dev/null 2>&1 || true
  docker volume rm "${VOLUME}" > /dev/null 2>&1 || true
  echo "AutoGPT backend container and data removed."
}

usage() {
  sed -n '2,9p' "${BASH_SOURCE[0]:-$0}" 2> /dev/null | sed 's/^# \{0,1\}//' ||
    echo "usage: run.sh start|stop|status|logs|reset|build"
}

command="${1:-}"
[[ $# -gt 0 ]] && shift
case "${command}" in
  start) cmd_start ;;
  stop) cmd_stop ;;
  status) cmd_status ;;
  logs) cmd_logs "$@" ;;
  reset) cmd_reset "$@" ;;
  build) require_docker && build_image ;;
  *)
    usage
    [[ -z "${command}" || "${command}" == -h || "${command}" == --help ]] || exit 2
    ;;
esac
