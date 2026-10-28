import { createMockBackend } from "./backend-mock";
import type { ServiceId } from "./data";

/*
 * The seam between onboarding and the local backend.
 * Tauri: Rust commands that run backend-docker/run.sh. Browser and dev: a deterministic mock.
 */

export type LayerStatus = "waiting" | "downloading" | "extracting" | "done";

export type Layer = {
  id: string;
  label: string;
  detail?: string;
  received: number;
  total: number;
  status: LayerStatus;
};

export type DownloadProgress = {
  layers: Layer[];
  received: number;
  total: number;
  /** The newest log line, for the variants that show a log */
  line?: string;
};

export type ServiceState = "pending" | "starting" | "running" | "error";
export type ServiceStatus = Record<ServiceId, ServiceState>;

export const pendingServices = (): ServiceStatus => ({ db: "pending", redis: "pending", rabbitmq: "pending", api: "pending", executor: "pending" });

export type StartProgress = { services: ServiceStatus; line?: string };

export type Health = { ok: boolean; detail: string };

export interface Backend {
  readonly kind: "tauri" | "mock";
  download(onProgress: (progress: DownloadProgress) => void, signal?: AbortSignal): Promise<void>;
  start(onStatus: (progress: StartProgress) => void, signal?: AbortSignal): Promise<void>;
  health(): Promise<Health>;
}

export const isTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

let instance: Promise<Backend> | null = null;

/** The Tauri implementation inside the app, the mock everywhere else. */
export function getBackend(): Promise<Backend> {
  instance ??= isTauri() ? import("./backend-tauri").then((m) => m.createTauriBackend()) : Promise.resolve(createMockBackend());
  return instance;
}

export const abortError = () => new DOMException("Aborted", "AbortError");
export const isAbort = (error: unknown) => error instanceof DOMException && error.name === "AbortError";
