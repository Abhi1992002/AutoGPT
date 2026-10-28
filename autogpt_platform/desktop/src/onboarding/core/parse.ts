import type { Layer, ServiceState, ServiceStatus } from "./backend";
import { SERVICE_IDS, type ServiceId } from "./data";

/* Parsers for run.sh output: docker pull progress and container status. */

const UNITS: Record<string, number> = { B: 1, kB: 1e3, KB: 1e3, MB: 1e6, GB: 1e9 };

const toBytes = (value: string, unit: string) => parseFloat(value) * (UNITS[unit] ?? 1);

const LAYER = /(?:^|\s)([0-9a-f]{12})\s*:?\s+(Pulling fs layer|Waiting|Downloading|Verifying Checksum|Download complete|Extracting|Pull complete|Already exists)/;
const BYTES = /([\d.]+)\s*(B|kB|KB|MB|GB)\s*\/\s*([\d.]+)\s*(B|kB|KB|MB|GB)/;

/** Updates `layers` in place from one line of `docker pull` / `docker compose pull` output. */
export function parseLayerLine(line: string, layers: Map<string, Layer>) {
  const match = LAYER.exec(line);
  if (!match) return;
  const [, id, verb] = match;
  const layer = layers.get(id) ?? { id, label: `Layer ${id.slice(0, 7)}`, received: 0, total: 0, status: "waiting" as const };
  const bytes = BYTES.exec(line);
  if (bytes) {
    const received = toBytes(bytes[1], bytes[2]);
    const total = toBytes(bytes[3], bytes[4]);
    layer.total = Math.max(layer.total, total);
    if (verb === "Downloading") layer.received = received;
  }
  if (verb === "Downloading") layer.status = "downloading";
  if (verb === "Download complete" || verb === "Verifying Checksum" || verb === "Extracting") {
    layer.received = layer.total;
    layer.status = "extracting";
  }
  if (verb === "Pull complete" || verb === "Already exists") {
    layer.received = layer.total;
    layer.status = "done";
  }
  layers.set(id, layer);
}

function serviceFor(name: string): ServiceId | null {
  const n = name.toLowerCase();
  if (n.includes("postgres") || /\bdb\b|[-_]db/.test(n)) return "db";
  if (n.includes("redis")) return "redis";
  if (n.includes("rabbit")) return "rabbitmq";
  if (n.includes("executor")) return "executor";
  if (n.includes("rest") || n.includes("api")) return "api";
  return null;
}

function stateFor(state: string, health = ""): ServiceState {
  const s = `${state} ${health}`.toLowerCase();
  if (/exited|dead|unhealthy|error/.test(s)) return "error";
  if (/starting|created|restarting/.test(s)) return "starting";
  if (/running|healthy|up/.test(s)) return "running";
  return "pending";
}

/** Reads `run.sh status`: JSON lines from `docker compose ps --format json`, or `name: state` lines. */
export function parseStatus(lines: string[], previous: ServiceStatus): ServiceStatus {
  const next = { ...previous };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    try {
      const parsed = JSON.parse(line) as unknown;
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      for (const row of rows as Record<string, string>[]) {
        const id = serviceFor(row.Service ?? row.Name ?? row.name ?? "");
        if (id) next[id] = stateFor(row.State ?? row.state ?? row.Status ?? "", row.Health ?? row.health);
      }
      continue;
    } catch {
      /* not JSON – try `name: state` */
    }
    const [name, ...rest] = line.split(/[:\s]+/);
    const id = serviceFor(name ?? "");
    if (id) next[id] = stateFor(rest.join(" "));
  }
  for (const id of SERVICE_IDS) next[id] ??= "pending";
  return next;
}
