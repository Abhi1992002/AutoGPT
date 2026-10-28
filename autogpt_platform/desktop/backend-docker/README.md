# AutoGPT Desktop backend (Docker)

The whole AutoGPT backend in one local container, for the desktop app to talk to: REST and
WebSocket APIs, executor, scheduler, notifications, plus PostgreSQL (pgvector), Valkey and
RabbitMQ. Everything it stores lives in the Docker volume `autogpt-desktop-data`.

It is our own copy of upstream's single-container image
([`autogpt_platform/single-container`](https://github.com/Significant-Gravitas/AutoGPT/tree/master/autogpt_platform/single-container)),
cut down for the desktop: no web frontend, nginx or FalkorDB, and built from **this** repo's
backend (`autogpt_platform/backend/Dockerfile`, target `server`), so our backend changes ship.

## Run it

Needs Docker (Docker Desktop on macOS/Windows). From this repo:

```bash
./autogpt_platform/desktop/backend-docker/run.sh start
```

Or download just the script; it fetches the backend source (sparse git clone into
`~/.cache/autogpt-desktop/src`) to build the image:

```bash
curl -fsSLO https://raw.githubusercontent.com/Abhi1992002/autogpt-desktop-v2/desktop/scaffold/autogpt_platform/desktop/backend-docker/run.sh
bash run.sh start
```

| Command | What it does |
| --- | --- |
| `run.sh start` | Builds (or pulls) the image if missing, creates/starts the container, waits until healthy, prints the URLs. Safe to repeat; recreates the container if the image or settings changed. |
| `run.sh stop` | Stops the container. Data is kept. |
| `run.sh status` | Container state and `/health/status`. Exit code 0 = healthy, 1 = not (yet) healthy, 3 = not installed. |
| `run.sh logs` | Follows the logs of every service. |
| `run.sh reset` | Deletes the container **and all data**. Asks first; `--yes` skips the question. |
| `run.sh build` | Rebuilds the image from source (after pulling new code). |

The first build takes 10–20 minutes, later builds after code changes well under a minute. A
start takes about a minute (the first one also applies the database migrations).

## Ports and health

Bound to `127.0.0.1` only:

- REST API: `http://localhost:8006` (`AGPT_DESKTOP_API_PORT`)
- WebSocket API: `ws://localhost:8001/ws` (`AGPT_DESKTOP_WS_PORT`)

Health, no auth needed:

- `GET /health/status` – readiness of the whole backend, for the app's "start backend" step to
  poll. `200` with `"status": "ok"` once every service is up, otherwise `503` with
  `"status": "degraded"`; the body always lists each service:

  ```json
  {"status": "ok", "version": "0.2.0",
   "services": {"database": "ok", "redis": "ok", "rabbitmq": "ok", "websocket": "ok",
                "executor": "ok", "scheduler": "ok", "database_manager": "ok", "notification": "ok"}}
  ```

  Connection refused means the API process isn't up yet. `version` is the image's `VERSION`.
- `GET /health` – the existing liveness check: `{"status": "healthy"}` when the REST server is
  connected to the database. It does not wait for the other services.

CORS allows the desktop webview (`tauri://localhost`, `http://tauri.localhost`) and the Vite
dev server (`http://localhost:1420`).

## Configuration

- `AGPT_DESKTOP_ENV_FILE=/path/to/backend.env` passes extra backend settings, e.g.
  `OPENAI_API_KEY=…`, `OPEN_ROUTER_API_KEY=…`, `ANTHROPIC_API_KEY=…`.
- `AGPT_DESKTOP_IMAGE=<registry>/autogpt-desktop-backend:<version>` runs a prebuilt image
  instead of building one (nothing is published yet).
- `AGPT_DESKTOP_VERSION` tags local builds (default `dev`): `autogpt-desktop-backend:<version>`.

Secrets (database password, JWT key, encryption key) are generated on first start into
`/data/secrets.env` in the volume. The REST API needs a JWT signed (HS256) with `JWT_VERIFY_KEY`:

```bash
docker exec autogpt-desktop-backend grep JWT_VERIFY_KEY /data/secrets.env
```

## Resources

- Memory: about 4–4.5 GB with the backend idle (eleven backend processes; Postgres, Valkey and
  RabbitMQ are small). Give Docker Desktop at least 6 GB, 8 GB to run agents comfortably.
- Disk: the image is about 2.9 GB; building it locally needs roughly 3 GB more for build cache.
  A fresh data volume is under 50 MB.

## Building by hand

```bash
docker build -f autogpt_platform/backend/Dockerfile --target server \
  -t autogpt-desktop-backend-base:0.2.0 .
docker build -f autogpt_platform/desktop/backend-docker/Dockerfile \
  --build-arg BASE_IMAGE=autogpt-desktop-backend-base:0.2.0 --build-arg VERSION=0.2.0 \
  -t autogpt-desktop-backend:0.2.0 .
```

Run both from the repo root. The second build only sends this directory to Docker (see
`Dockerfile.dockerignore`) and needs BuildKit, the default since Docker 23.
