import type { Layer, ServiceState, ServiceStatus } from "./backend";
import type { ServiceId } from "./data";

/* Parsers for run.sh output and the backend's /health/status. */

const UNITS: Record<string, number> = { B: 1, kB: 1e3, KB: 1e3, MB: 1e6, GB: 1e9 };
const toBytes = (value: string, unit: string) => parseFloat(value) * (UNITS[unit] ?? 1);

/**
 * Without a TTY, `docker pull` prints each layer's state but not its bytes. Until a byte count
 * shows up, a layer counts as this many bytes, so the bars still move in proportion.
 */
const NOMINAL_LAYER = 40e6;

const LAYER = /(?:^|\s)([0-9a-f]{12})\s*:?\s+(Pulling fs layer|Waiting|Downloading|Verifying Checksum|Download complete|Extracting|Pull complete|Already exists)/;
const BYTES = /([\d.]+)\s*(B|kB|KB|MB|GB)\s*\/\s*([\d.]+)\s*(B|kB|KB|MB|GB)/;
/** BuildKit plain progress, e.g. `#12 [server 5/9] RUN poetry install` */
const BUILD_STEP = /^#\d+ \[(?:[\w.-]+ )?(\d+)\/(\d+)\]/;

const SHARE: Record<Layer["status"], number> = { waiting: 0, downloading: 0.4, extracting: 0.9, done: 1 };

/** Updates `layers` in place from one line of `run.sh pull` (docker pull, or a BuildKit build). */
export function parseLayerLine(line: string, layers: Map<string, Layer>) {
  const build = BUILD_STEP.exec(line);
  if (build) {
    const step = Number(build[1]);
    const steps = Number(build[2]);
    const layer = layers.get("build") ?? { id: "build", label: "Building the engine image", received: 0, total: steps * NOMINAL_LAYER, status: "downloading" as const };
    layer.total = Math.max(layer.total, steps * NOMINAL_LAYER);
    layer.received = Math.max(layer.received, (step - 1) * NOMINAL_LAYER);
    layers.set("build", layer);
    return;
  }

  const match = LAYER.exec(line);
  if (!match) return;
  const [, id, verb] = match;
  const layer: Layer & { sized?: boolean } = layers.get(id) ?? { id, label: `Layer ${id.slice(0, 7)}`, received: 0, total: NOMINAL_LAYER, status: "waiting" };
  const bytes = BYTES.exec(line);
  if (bytes) {
    layer.sized = true;
    layer.total = toBytes(bytes[3], bytes[4]);
    layer.received = toBytes(bytes[1], bytes[2]);
  }
  if (verb === "Downloading") layer.status = "downloading";
  if (verb === "Verifying Checksum" || verb === "Download complete" || verb === "Extracting") layer.status = "extracting";
  if (verb === "Pull complete" || verb === "Already exists") layer.status = "done";
  if (!layer.sized || layer.status !== "downloading") layer.received = Math.max(layer.received, layer.total * SHARE[layer.status]);
  layers.set(id, layer);
}

/** Every layer done – called when `run.sh pull` exits cleanly, e.g. when the image was already there */
export function finishLayers(layers: Map<string, Layer>) {
  if (layers.size === 0) layers.set("image", { id: "image", label: "Engine image", received: NOMINAL_LAYER, total: NOMINAL_LAYER, status: "done" });
  for (const layer of layers.values()) Object.assign(layer, { received: layer.total, status: "done" });
}

/** /health/status service names → the five rows onboarding shows */
const HEALTH_SERVICES: Record<string, ServiceId> = { database: "db", redis: "redis", rabbitmq: "rabbitmq", executor: "executor" };

/**
 * Reads the /health/status body. Any answer means the REST API is up; each listed service is
 * running when "ok" and still starting when "down".
 */
export function servicesFromHealth(body: string, previous: ServiceStatus): ServiceStatus {
  const next: ServiceStatus = { ...previous, api: "running" };
  try {
    const { services } = JSON.parse(body) as { services?: Record<string, string> };
    for (const [name, state] of Object.entries(services ?? {})) {
      const id = HEALTH_SERVICES[name];
      if (id) next[id] = state === "ok" ? "running" : "starting";
    }
  } catch {
    /* an answer without JSON still proves the API is up */
  }
  return next;
}

/** Once run.sh starts the container, everything not yet running is starting */
export const markStarting = (services: ServiceStatus): ServiceStatus =>
  Object.fromEntries(Object.entries(services).map(([id, s]) => [id, s === "pending" ? ("starting" satisfies ServiceState) : s])) as ServiceStatus;
