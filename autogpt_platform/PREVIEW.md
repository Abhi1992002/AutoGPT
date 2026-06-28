# PR Preview Environments (Bunnyshell)

Per-PR, full-stack, ephemeral preview environments: each PR gets its own backend +
database + infra behind a live URL, so reviewers can log in and actually run agents
instead of testing a branch frontend against the shared dev backend.

> Status: **scaffolding**. The artifacts here make the stack preview-deployable;
> the Bunnyshell account/cluster wiring and a 1–2 day spike are still required
> before previews go live (see _Before this is live_). Items marked **verify** are
> vendor-specific and must be confirmed against <https://docs.bunnyshell.com>.

## What's in this PR

| File | Purpose |
|------|---------|
| `docker-compose.preview.yml` | Overlay: 1-node Redis, drops non-essential services, gates CoPilot behind a profile, adds the `seed` one-shot. |
| `bunnyshell.yaml` | Bunnyshell environment definition (per-PR domain, frontend build args, auth URL injection, auto-stop/TTL). Committed source of truth. |
| `frontend/Dockerfile` | New build args so per-PR **absolute** `NEXT_PUBLIC_*` URLs are inlined at build time (overlaid only when set — normal builds unchanged). |
| `backend/scripts/seed_preview.py` | One-shot seed: confirmed demo login + demo credits + optional demo agent. |
| `backend/graph_templates/preview_demo.json` | The demo agent fixture (Input → Output). |
| `backend/pyproject.toml` | Registers the `seed-preview` entry point. |
| `.github/workflows/platform-preview-bunnyshell.yml` | Picks the `copilot` profile from the PR diff; hands it to Bunnyshell (skipped until `BUNNYSHELL_TOKEN` is set). |

## The preview profile

Local stack ≈ 20 containers. The preview profile runs **12**: `db`, `kong`, `auth`,
`redis-0` (single-node cluster), `rabbitmq`, `migrate`, `seed`, `rest_server`,
`executor`, `websocket_server`, `database_manager`, `frontend`.

Dropped / gated: `redis-1`, `redis-2`, `redis-init`, `clamav`, `notification_server`,
`scheduler_server`, `platform_linking_manager` (bot profile), and `falkordb` +
`copilot_executor` (opt-in `copilot` profile).

Why single-node **cluster** and not standalone Redis: the backend Redis client is
cluster-only (`backend/data/redis_client.py`), so the one node still runs with
`--cluster-enabled yes` and owns all 16384 slots.

## Try the profile locally

```bash
cd autogpt_platform
docker compose -f docker-compose.yml -f docker-compose.preview.yml up
# CoPilot path (adds FalkorDB + copilot_executor):
COMPOSE_PROFILES=copilot docker compose -f docker-compose.yml -f docker-compose.preview.yml up
```

Demo login (created by the `seed` service): `reviewer@preview.agpt.co` /
`preview-pass-change-me` (override via `PREVIEW_DEMO_*`).

## How a preview deploys (target flow)

1. PR opened → Bunnyshell GitHub App clones this env config, checks out the branch.
2. Backend image builds once (reused across the 8 backend commands); the **frontend
   builds per PR** with this environment's absolute URLs baked in.
3. `migrate` runs Prisma migrations; `seed` creates the demo account.
4. K8s ingress serves one origin and path-routes `/` → frontend, `/api` →
   `rest_server`, `/ws` → `websocket_server`, `/auth/v1` → `kong` (same-origin: no
   CORS, websocket works).
5. Bunnyshell comments the live URL on the PR. Idle → auto-sleep; merge/close →
   destroy. **(verify)**

## Why the frontend builds per PR (not relative URLs, not Vercel)

`NEXT_PUBLIC_*` are inlined at build time. Relative URLs break `@supabase/ssr`
(`new URL(...)` throws) and the agent websocket, so each PR needs absolute URLs
baked in — hence the `frontend/Dockerfile` build args. Vercel can't host the
long-lived agent websocket (serverless; 120s proxy timeout), so the frontend runs
as a container in-cluster.

## Before this is live

- [ ] Bunnyshell account + connect a GKE cluster (IP-allowlist its control plane). **(verify pricing/quote)**
- [ ] Wildcard DNS `*.preview.agpt.co` + cert-manager TLS.
- [ ] **Edge auth** (Cloudflare Access / basic-auth / IP allowlist) in front of every preview — previews use shared dev Supabase keys; do not expose publicly.
- [ ] Secrets in Bunnyshell Project Variables: spend-capped LLM keys, `JWT_SECRET`/`ANON_KEY`/`SERVICE_ROLE_KEY`, `VAULT_ENC_KEY`, `GRAPHITI_FALKORDB_PASSWORD`.
- [ ] Spike (exit gates): single-node Redis vs sharded pub/sub; per-PR GoTrue origin injection round-trips a login; `/ws` + `?token=` survive the ingress.
- [ ] Decide secrets posture (shared-behind-SSO vs per-env keys) and per-env LLM quotas.

A fuller design write-up (cost model, risks, alternatives such as Preevy) is kept
with the team planning notes.
