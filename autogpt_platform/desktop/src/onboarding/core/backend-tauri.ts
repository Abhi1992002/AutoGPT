import { Channel, invoke } from "@tauri-apps/api/core";
import { abortError, pendingServices, type Backend, type Layer } from "./backend";
import { parseLayerLine, parseStatus } from "./parse";

/*
 * Tauri implementation. Rust runs backend-docker/run.sh and streams each output line over a channel
 * (see src-tauri/src/backend.rs). The contract with run.sh:
 *   run.sh pull    – pulls the images; docker's per-layer progress lines are parsed below
 *   run.sh start   – starts the stack, returns when the containers are up
 *   run.sh status  – `docker compose ps --format json` (one object per line) or `name: state` lines
 * Health is checked in Rust (GET 127.0.0.1:8006/health), since the API's CORS rules block the webview.
 */

type Action = "pull" | "start" | "status";

async function run(action: Action, onLine: (line: string) => void, signal?: AbortSignal) {
  if (signal?.aborted) throw abortError();
  const channel = new Channel<string>();
  channel.onmessage = (line) => {
    if (!signal?.aborted) onLine(line);
  };
  const code = await invoke<number>("backend_run", { action, onLine: channel });
  if (signal?.aborted) throw abortError();
  if (code !== 0) throw new Error(`run.sh ${action} exited with code ${code}`);
}

export function createTauriBackend(): Backend {
  return {
    kind: "tauri",

    async download(onProgress, signal) {
      const layers = new Map<string, Layer>();
      await run(
        "pull",
        (line) => {
          parseLayerLine(line, layers);
          const list = [...layers.values()];
          onProgress({
            layers: list,
            received: list.reduce((sum, l) => sum + l.received, 0),
            total: list.reduce((sum, l) => sum + l.total, 0),
            line,
          });
        },
        signal,
      );
    },

    async start(onStatus, signal) {
      let services = pendingServices();
      let lastLine: string | undefined;
      const poll = async () => {
        const lines: string[] = [];
        await run("status", (line) => lines.push(line)).catch(() => undefined);
        services = parseStatus(lines, services);
        onStatus({ services, line: lastLine });
      };
      const timer = setInterval(poll, 1500);
      try {
        await run(
          "start",
          (line) => {
            lastLine = line;
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
      try {
        const { ok, status } = await invoke<{ ok: boolean; status: number }>("backend_health");
        return { ok, detail: `GET /health → ${status}${ok ? " OK" : ""}` };
      } catch {
        return { ok: false, detail: "GET /health → connection refused" };
      }
    },
  };
}
