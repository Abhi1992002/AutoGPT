import { Channel, invoke } from "@tauri-apps/api/core";
import { abortError, pendingServices, type Backend, type Layer } from "./backend";
import { finishLayers, markStarting, parseLayerLine, servicesFromHealth } from "./parse";

/*
 * Tauri implementation over backend-docker/run.sh (see src-tauri/src/backend.rs):
 *   run.sh pull   – makes sure the image is there: `docker pull` when AGPT_DESKTOP_IMAGE is set,
 *                   otherwise a local build; per-layer lines or BuildKit steps drive the bars
 *   run.sh start  – starts the container and returns once /health/status is ok
 * Readiness comes from GET 127.0.0.1:8006/health/status, fetched in Rust because the API's
 * CORS rules block the webview.
 */

type Action = "pull" | "start";
type RawHealth = { ok: boolean; status: number; body: string };

const POLL_MS = 1500;

async function run(action: Action, onLine: (line: string) => void, signal?: AbortSignal) {
  if (signal?.aborted) throw abortError();
  const channel = new Channel<string>();
  channel.onmessage = (line) => {
    if (!signal?.aborted) onLine(line);
  };
  const code = await invoke<number>("backend_run", { action, onLine: channel });
  if (signal?.aborted) throw abortError();
  if (code !== 0) throw new Error(`run.sh ${action} exited with code ${code}.`);
}

const readHealth = () => invoke<RawHealth>("backend_health").catch(() => null);

export function createTauriBackend(): Backend {
  return {
    kind: "tauri",

    async download(onProgress, signal) {
      const layers = new Map<string, Layer>();
      const report = (line?: string) => {
        const list = [...layers.values()];
        onProgress({ layers: list, received: list.reduce((s, l) => s + l.received, 0), total: list.reduce((s, l) => s + l.total, 0), line });
      };
      await run(
        "pull",
        (line) => {
          parseLayerLine(line, layers);
          report(line);
        },
        signal,
      );
      finishLayers(layers);
      report();
    },

    async start(onStatus, signal) {
      let services = pendingServices();
      let lastLine: string | undefined;
      const poll = async () => {
        const health = await readHealth();
        if (health?.status) services = servicesFromHealth(health.body, services);
        onStatus({ services, line: lastLine });
      };
      const timer = setInterval(poll, POLL_MS);
      try {
        await run(
          "start",
          (line) => {
            lastLine = line;
            services = markStarting(services);
            onStatus({ services, line });
          },
          signal,
        );
        await poll();
      } finally {
        clearInterval(timer);
      }
    },

    async health() {
      const health = await readHealth();
      if (!health?.status) return { ok: false, detail: "GET /health/status → connection refused" };
      return { ok: health.ok, detail: `GET /health/status → ${health.status}${health.ok ? " OK" : ""}` };
    },
  };
}
