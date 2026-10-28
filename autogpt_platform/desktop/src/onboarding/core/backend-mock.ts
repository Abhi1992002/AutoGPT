import { abortError, pendingServices, type Backend, type Layer, type LayerStatus, type ServiceStatus } from "./backend";
import { IMAGES, type ServiceId } from "./data";

/*
 * Deterministic mock: the same timings and log lines on every run, so screens can be compared.
 * Download ≈ 5s, start ≈ 5s, health passes on the second poll.
 */

const TICK = 80;
/** Ticks the whole mock download spans; layersAt() takes a fraction of it */
const SPAN = 64;

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(t), reject(abortError())), { once: true });
  });

/** Share of each image per tick – slower for the big runtime image, so the bars finish out of order */
const RATES = [0.016, 0.05, 0.06, 0.2];
/** Ticks before each image starts, like a pull that queues its layers */
const DELAYS = [0, 3, 6, 9];

const VERBS: Record<LayerStatus, string> = {
  waiting: "Waiting",
  downloading: "Downloading",
  extracting: "Extracting",
  done: "Pull complete",
};

/** The layers at a fraction of the mock download, also used for frozen previews */
export function layersAt(fraction: number): Layer[] {
  const ticks = Math.round(fraction * SPAN);
  return IMAGES.map((image, i) => {
    const progress = Math.min(1, Math.max(0, (ticks - DELAYS[i]) * RATES[i]));
    const status: LayerStatus = progress >= 1 ? "done" : progress >= 0.94 ? "extracting" : progress > 0 ? "downloading" : "waiting";
    return { id: image.id, label: image.label, detail: image.detail, received: Math.round(image.bytes * progress), total: image.bytes, status };
  });
}

/** The log lines a mock download has printed by a given fraction */
export function downloadLogAt(fraction: number): string[] {
  const lines: string[] = [];
  const seen = new Map<string, LayerStatus>();
  for (let tick = 0; tick <= Math.round(fraction * SPAN); tick++) {
    for (const layer of layersAt(tick / SPAN)) {
      if (layer.status !== "waiting" && seen.get(layer.id) !== layer.status) lines.push(`${layer.detail}  ${VERBS[layer.status]}`);
      seen.set(layer.id, layer.status);
    }
  }
  return lines;
}

type StartStep = { at: number; id: ServiceId; state: "starting" | "running"; line: string };

const START_ORDER: StartStep[] = [
  { at: 300, id: "db", state: "starting", line: "Container autogpt-db  Starting" },
  { at: 1200, id: "db", state: "running", line: "Container autogpt-db  Healthy" },
  { at: 1300, id: "redis", state: "starting", line: "Container autogpt-redis  Starting" },
  { at: 1800, id: "redis", state: "running", line: "Container autogpt-redis  Started" },
  { at: 1900, id: "rabbitmq", state: "starting", line: "Container autogpt-rabbitmq  Starting" },
  { at: 2900, id: "rabbitmq", state: "running", line: "Container autogpt-rabbitmq  Healthy" },
  { at: 3000, id: "api", state: "starting", line: "Container autogpt-rest  Starting" },
  { at: 3100, id: "executor", state: "starting", line: "Container autogpt-executor  Starting" },
  { at: 4200, id: "api", state: "running", line: "Container autogpt-rest  Started" },
  { at: 4700, id: "executor", state: "running", line: "Container autogpt-executor  Started" },
];

const FIRST_LINE = "Network autogpt_default  Created";

/** The services at a moment of the mock start, for frozen previews */
export function servicesAt(ms: number): ServiceStatus {
  const services = pendingServices();
  for (const step of START_ORDER) if (step.at <= ms) services[step.id] = step.state;
  return services;
}

export const startLogAt = (ms: number) => [FIRST_LINE, ...START_ORDER.filter((s) => s.at <= ms).map((s) => s.line)];

export function createMockBackend(): Backend {
  let healthPolls = 0;
  return {
    kind: "mock",

    async download(onProgress, signal) {
      let printed = 0;
      for (let tick = 0; ; tick++) {
        const fraction = tick / SPAN;
        const layers = layersAt(fraction);
        const log = downloadLogAt(fraction);
        const fresh = log.slice(printed);
        printed = log.length;
        const progress = {
          layers,
          received: layers.reduce((sum, l) => sum + l.received, 0),
          total: layers.reduce((sum, l) => sum + l.total, 0),
        };
        if (fresh.length === 0) onProgress(progress);
        for (const line of fresh) onProgress({ ...progress, line });
        if (layers.every((l) => l.status === "done")) return;
        await wait(TICK, signal);
      }
    },

    async start(onStatus, signal) {
      healthPolls = 0;
      let elapsed = 0;
      onStatus({ services: pendingServices(), line: FIRST_LINE });
      for (const step of START_ORDER) {
        await wait(step.at - elapsed, signal);
        elapsed = step.at;
        onStatus({ services: servicesAt(elapsed), line: step.line });
      }
    },

    async health() {
      await wait(450);
      healthPolls += 1;
      return healthPolls >= 2 ? { ok: true, detail: "GET /health → 200 OK" } : { ok: false, detail: "GET /health → connection refused" };
    },
  };
}
