import { pendingServices, type DownloadProgress, type Health, type ServiceStatus, type StartProgress } from "./backend";
import { downloadLogAt, layersAt, servicesAt, startLogAt } from "./backend-mock";
import { INTEGRATIONS, SERVICE_IDS } from "./data";
import { stepAt, stepIndex, STEP_IDS, type StepId } from "./steps";

/*
 * The onboarding state machine, shared by every variant. Pure: side effects live in useOnboarding.
 */

export type IntegrationState = "idle" | "connecting" | "connected";

export type DownloadState = {
  phase: "idle" | "running" | "done" | "error";
  /** Bumped by Retry, which reruns the download */
  attempt: number;
  progress: DownloadProgress;
  log: string[];
  error?: string;
};

export type StartState = {
  phase: "idle" | "running" | "checking" | "healthy" | "error";
  /** Bumped by Retry, which reruns the start */
  attempt: number;
  services: ServiceStatus;
  log: string[];
  /** Health polls so far */
  polls: number;
  health?: Health;
  error?: string;
};

export type OnboardingState = {
  step: StepId;
  /** 1 forward, -1 back – for directional transitions */
  direction: 1 | -1;
  /** Whether the person has moved between steps yet; focus follows the heading only after that */
  moved: boolean;
  download: DownloadState;
  start: StartState;
  integrations: Record<string, IntegrationState>;
  brain: string;
};

export type OnboardingEvent =
  | { type: "go"; step: StepId }
  | { type: "next" }
  | { type: "back" }
  | { type: "download/run" }
  | { type: "download/retry" }
  | { type: "download/progress"; progress: DownloadProgress }
  | { type: "download/done" }
  | { type: "download/error"; error: string }
  | { type: "start/run" }
  | { type: "start/retry" }
  | { type: "start/progress"; progress: StartProgress }
  | { type: "start/checking" }
  | { type: "start/health"; health: Health }
  | { type: "start/error"; error: string }
  | { type: "integration"; id: string; state: IntegrationState }
  | { type: "brain"; text: string };

const LOG_LIMIT = 60;

const appendLog = (log: string[], line?: string) => (line && line !== log[log.length - 1] ? [...log, line].slice(-LOG_LIMIT) : log);

const sum = (layers: DownloadProgress["layers"]) => ({
  received: layers.reduce((s, l) => s + l.received, 0),
  total: layers.reduce((s, l) => s + l.total, 0),
});

const downloadAt = (fraction: number): DownloadProgress => {
  const layers = layersAt(fraction);
  return { layers, ...sum(layers) };
};

/** Whether the primary action is available on the current step */
export function canContinue(state: OnboardingState) {
  if (state.step === "download") return state.download.phase === "done";
  if (state.step === "start") return state.start.phase === "healthy";
  return true;
}

/**
 * The state a deep link lands in. Steps after a backend step see it finished;
 * with `freeze`, the current step holds a representative moment instead of running.
 */
export function initialState(step: StepId, freeze: boolean): OnboardingState {
  const at = stepIndex(step);
  const downloaded = at > stepIndex("download");
  const started = at > stepIndex("start");
  const integrations = Object.fromEntries(INTEGRATIONS.map((i) => [i.id, "idle" as IntegrationState]));

  const state: OnboardingState = {
    step,
    direction: 1,
    moved: false,
    download: downloaded
      ? { phase: "done", attempt: 0, progress: downloadAt(1), log: downloadLogAt(1) }
      : { phase: "idle", attempt: 0, progress: downloadAt(0), log: [] },
    start: started
      ? { phase: "healthy", attempt: 0, services: servicesAt(Infinity), log: startLogAt(Infinity), polls: 2, health: { ok: true, detail: "GET /health/status → 200 OK" } }
      : { phase: "idle", attempt: 0, services: pendingServices(), log: [], polls: 0 },
    integrations,
    brain: "",
  };

  if (!freeze) return state;
  if (step === "download") state.download = { phase: "running", attempt: 0, progress: downloadAt(0.42), log: downloadLogAt(0.42) };
  if (step === "start") state.start = { phase: "running", attempt: 0, services: servicesAt(3400), log: startLogAt(3400), polls: 0 };
  if (step === "connect") state.integrations = { ...integrations, github: "connected", slack: "connected", notion: "connecting" };
  if (stepIndex(step) > stepIndex("connect")) state.integrations = { ...integrations, github: "connected", slack: "connected", notion: "connected" };
  return state;
}

export function reduce(state: OnboardingState, event: OnboardingEvent): OnboardingState {
  switch (event.type) {
    case "go":
      return { ...state, step: event.step, moved: true, direction: stepIndex(event.step) >= stepIndex(state.step) ? 1 : -1 };
    case "next":
      if (!canContinue(state) || state.step === STEP_IDS[STEP_IDS.length - 1]) return state;
      return { ...state, step: stepAt(stepIndex(state.step) + 1), moved: true, direction: 1 };
    case "back":
      return { ...state, step: stepAt(stepIndex(state.step) - 1), moved: true, direction: -1 };

    case "download/run":
      return { ...state, download: { ...state.download, phase: "running", progress: downloadAt(0), log: [], error: undefined } };
    case "download/retry":
      return { ...state, download: { ...state.download, phase: "idle", attempt: state.download.attempt + 1 } };
    case "download/progress":
      return { ...state, download: { ...state.download, progress: event.progress, log: appendLog(state.download.log, event.progress.line) } };
    case "download/done":
      return { ...state, download: { ...state.download, phase: "done" } };
    case "download/error":
      return { ...state, download: { ...state.download, phase: "error", error: event.error } };

    case "start/run":
      return { ...state, start: { ...state.start, phase: "running", services: pendingServices(), log: [], polls: 0, health: undefined, error: undefined } };
    case "start/retry":
      return { ...state, start: { ...state.start, phase: "idle", attempt: state.start.attempt + 1 } };
    case "start/progress":
      return { ...state, start: { ...state.start, services: event.progress.services, log: appendLog(state.start.log, event.progress.line) } };
    case "start/checking":
      return { ...state, start: { ...state.start, phase: "checking" } };
    case "start/health": {
      const polls = state.start.polls + 1;
      const log = appendLog(state.start.log, `${event.health.detail} (poll ${polls})`);
      return { ...state, start: { ...state.start, polls, health: event.health, log, phase: event.health.ok ? "healthy" : "checking" } };
    }
    case "start/error":
      return { ...state, start: { ...state.start, phase: "error", error: event.error } };

    case "integration":
      return { ...state, integrations: { ...state.integrations, [event.id]: event.state } };
    case "brain":
      return { ...state, brain: event.text };
  }
}

export const runningCount = (services: ServiceStatus) => SERVICE_IDS.filter((id) => services[id] === "running").length;
export const connectedCount = (integrations: Record<string, IntegrationState>) =>
  Object.values(integrations).filter((s) => s === "connected").length;
