import { useCallback, useEffect, useReducer, useRef } from "react";
import { getBackend, isAbort } from "./backend";
import { canContinue, initialState, reduce, type OnboardingState } from "./machine";
import { writeParams } from "./params";
import type { StepId } from "./steps";

/*
 * Runs the machine and its side effects: the backend download and start, health polling,
 * auto-advance after each backend step and the mock connect flow. `freeze` turns all of it off.
 */

const HEALTH_INTERVAL = 1000;
const HEALTH_ATTEMPTS = 60;
const ADVANCE_DELAY = { download: 900, start: 1200 };
const CONNECT_DELAY = 1100;

export type Onboarding = ReturnType<typeof useOnboarding>;

export function useOnboarding({ step, freeze, onFinish }: { step: StepId; freeze: boolean; onFinish?: () => void }) {
  const [state, send] = useReducer(reduce, undefined, () => initialState(step, freeze));
  const latest = useRef<OnboardingState>(state);
  latest.current = state;

  useEffect(() => writeParams({ step: state.step }), [state.step]);

  // Download: runs when the step opens, and again on Retry
  const downloadAttempt = state.download.attempt;
  useEffect(() => {
    if (freeze || state.step !== "download" || latest.current.download.phase === "done") return;
    const controller = new AbortController();
    send({ type: "download/run" });
    getBackend()
      .then((backend) => backend.download((progress) => send({ type: "download/progress", progress }), controller.signal))
      .then(() => send({ type: "download/done" }))
      .catch((error) => isAbort(error) || send({ type: "download/error", error: messageOf(error) }));
    return () => controller.abort();
  }, [freeze, state.step, downloadAttempt]);

  // Start, then poll health until the API answers
  const startAttempt = state.start.attempt;
  useEffect(() => {
    if (freeze || state.step !== "start" || latest.current.start.phase === "healthy") return;
    const controller = new AbortController();
    const { signal } = controller;
    send({ type: "start/run" });
    (async () => {
      const backend = await getBackend();
      await backend.start((progress) => send({ type: "start/progress", progress }), signal);
      send({ type: "start/checking" });
      for (let attempt = 0; attempt < HEALTH_ATTEMPTS && !signal.aborted; attempt++) {
        const health = await backend.health();
        if (signal.aborted) return;
        send({ type: "start/health", health });
        if (health.ok) return;
        await new Promise((r) => setTimeout(r, HEALTH_INTERVAL));
      }
      if (!signal.aborted) send({ type: "start/error", error: "The API didn’t respond within a minute." });
    })().catch((error) => isAbort(error) || send({ type: "start/error", error: messageOf(error) }));
    return () => controller.abort();
  }, [freeze, state.step, startAttempt]);

  // Auto-advance once a backend step finishes
  const ready = canContinue(state);
  useEffect(() => {
    if (freeze || !ready || (state.step !== "download" && state.step !== "start")) return;
    const t = setTimeout(() => send({ type: "next" }), ADVANCE_DELAY[state.step]);
    return () => clearTimeout(t);
  }, [freeze, ready, state.step]);

  // Mock OAuth: connecting resolves after a beat. Real provider auth plugs in here.
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const toggleIntegration = useCallback((id: string) => {
    const current = latest.current.integrations[id];
    clearTimeout(timers.current.get(id));
    if (current !== "idle") return send({ type: "integration", id, state: "idle" });
    send({ type: "integration", id, state: "connecting" });
    timers.current.set(
      id,
      setTimeout(() => send({ type: "integration", id, state: "connected" }), CONNECT_DELAY),
    );
  }, []);

  const next = useCallback(() => {
    if (latest.current.step === "done") onFinish?.();
    else send({ type: "next" });
  }, [onFinish]);

  return {
    state,
    send,
    canContinue: ready,
    next,
    back: useCallback(() => send({ type: "back" }), []),
    go: useCallback((to: StepId) => send({ type: "go", step: to }), []),
    retryDownload: useCallback(() => send({ type: "download/retry" }), []),
    retryStart: useCallback(() => send({ type: "start/retry" }), []),
    toggleIntegration,
    setBrain: useCallback((text: string) => send({ type: "brain", text }), []),
    freeze,
  };
}

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));
