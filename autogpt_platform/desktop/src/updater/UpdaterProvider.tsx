import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/*
 * In-app updates. Checks the GitHub release feed on launch and every 30 minutes; the prompt and the
 * Settings screen share this state, so a download started in one shows its progress in the other.
 */

const CHECK_EVERY_MS = 30 * 60 * 1000;

export type UpdaterStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "up-to-date" }
  | { kind: "available" }
  | { kind: "downloading"; downloaded: number; total?: number }
  | { kind: "ready" }
  | { kind: "installing" }
  | { kind: "error"; message: string };

type UpdaterContextValue = {
  /** False in a plain browser (vite dev), where there is no updater */
  supported: boolean;
  currentVersion: string | null;
  update: Update | null;
  status: UpdaterStatus;
  lastChecked: Date | null;
  /** The update the background check wants to announce, until the user picks an answer */
  prompt: Update | null;
  checkNow: () => Promise<void>;
  download: () => Promise<boolean>;
  restart: () => Promise<void>;
  updateAndRestart: () => Promise<void>;
  dismissPrompt: () => void;
};

const UpdaterContext = createContext<UpdaterContextValue | null>(null);

export function useUpdater() {
  const value = useContext(UpdaterContext);
  if (!value) throw new Error("useUpdater needs an <UpdaterProvider> above it");
  return value;
}

const busyKinds = new Set<UpdaterStatus["kind"]>(["downloading", "ready", "installing"]);

function errorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  return typeof e === "string" ? e : "Something went wrong";
}

export function UpdaterProvider({ children }: { children: ReactNode }) {
  const supported = isTauri();
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatusState] = useState<UpdaterStatus>({ kind: "idle" });
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [prompt, setPrompt] = useState<Update | null>(null);

  // Mirrors for the interval callback, which outlives any single render
  const statusRef = useRef(status);
  const updateRef = useRef(update);
  const checking = useRef(false);
  const dismissed = useRef(new Set<string>());

  const setStatus = useCallback((next: UpdaterStatus) => {
    statusRef.current = next;
    setStatusState(next);
  }, []);

  const runCheck = useCallback(
    async (silent: boolean) => {
      if (!supported || checking.current || busyKinds.has(statusRef.current.kind)) return;
      checking.current = true;
      if (!silent) setStatus({ kind: "checking" });
      try {
        const found = await check();
        setLastChecked(new Date());
        // A download may have started while the request was in flight
        if (busyKinds.has(statusRef.current.kind)) {
          await found?.close();
          return;
        }
        const previous = updateRef.current;
        updateRef.current = found;
        setUpdate(found);
        if (previous && previous !== found) await previous.close().catch(() => {});
        if (!found) {
          setStatus({ kind: "up-to-date" });
          return;
        }
        setStatus({ kind: "available" });
        if (silent && !dismissed.current.has(found.version)) setPrompt(found);
      } catch (e) {
        if (silent) console.warn("Update check failed", e);
        else setStatus({ kind: "error", message: errorMessage(e) });
      } finally {
        checking.current = false;
      }
    },
    [supported, setStatus],
  );

  const download = useCallback(async () => {
    const target = updateRef.current;
    if (!target) return false;
    if (statusRef.current.kind === "ready") return true;
    if (busyKinds.has(statusRef.current.kind)) return false;
    let downloaded = 0;
    let total: number | undefined;
    setStatus({ kind: "downloading", downloaded });
    try {
      await target.download((event) => {
        if (event.event === "Started") total = event.data.contentLength;
        else if (event.event === "Progress") downloaded += event.data.chunkLength;
        setStatus({ kind: "downloading", downloaded, total });
      });
      setStatus({ kind: "ready" });
      return true;
    } catch (e) {
      setStatus({ kind: "error", message: errorMessage(e) });
      return false;
    }
  }, [setStatus]);

  const restart = useCallback(async () => {
    const target = updateRef.current;
    if (!target || statusRef.current.kind !== "ready") return;
    setStatus({ kind: "installing" });
    try {
      await target.install();
      await relaunch();
    } catch (e) {
      setStatus({ kind: "error", message: errorMessage(e) });
    }
  }, [setStatus]);

  const updateAndRestart = useCallback(async () => {
    if (await download()) await restart();
  }, [download, restart]);

  const dismissPrompt = useCallback(() => {
    setPrompt((current) => {
      if (current) dismissed.current.add(current.version);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!supported) return;
    getVersion().then(setCurrentVersion, () => {});
    void runCheck(true);
    const timer = window.setInterval(() => void runCheck(true), CHECK_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [supported, runCheck]);

  const value: UpdaterContextValue = {
    supported,
    currentVersion,
    update,
    status,
    lastChecked,
    prompt,
    checkNow: () => runCheck(false),
    download,
    restart,
    updateAndRestart,
    dismissPrompt,
  };

  return <UpdaterContext.Provider value={value}>{children}</UpdaterContext.Provider>;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
