import { useEffect, useRef, useState, type RefObject } from "react";
import type { AgentState } from "../../components/AgentAvatar";

/** Moves focus to a step's heading on mount, once the person has moved between steps */
export function useStepFocus(ref: RefObject<HTMLElement | null>, moved: boolean) {
  useEffect(() => {
    if (moved) ref.current?.focus({ preventScroll: true });
    // Only on mount: each step mounts its own heading
  }, []);
}

/**
 * How the guide reacts on the brain-dump step: working while you type, idle when you pause,
 * asleep after a long silence with nothing written.
 */
export function useAgentMood(text: string, { typingMs = 900, sleepMs = 14000 } = {}): AgentState {
  const [mood, setMood] = useState<AgentState>("idle");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
    } else {
      setMood("working");
    }
    const settle = setTimeout(() => setMood("idle"), typingMs);
    const sleep = text.trim() ? undefined : setTimeout(() => setMood("sleeping"), sleepMs);
    return () => {
      clearTimeout(settle);
      clearTimeout(sleep);
    };
  }, [text, typingMs, sleepMs]);
  return mood;
}

/**
 * Plays a mock agent run: reveals `length` steps one by one, then reports done.
 * Restarts when `key` changes. With `freeze` it shows the finished run at once.
 */
export function useRunPlayback(key: string, length: number, { freeze = false, stepMs = 650, startMs = 500 } = {}) {
  // One phase per step, plus a last one in which the final step finishes
  const [phase, setPhase] = useState(freeze ? length + 1 : 0);
  useEffect(() => {
    if (freeze) {
      setPhase(length + 1);
      return;
    }
    setPhase(0);
    const timers = Array.from({ length: length + 1 }, (_, i) => setTimeout(() => setPhase(i + 1), startMs + i * stepMs));
    return () => timers.forEach(clearTimeout);
  }, [key, length, freeze, stepMs, startMs]);
  const done = phase > length;
  /** Steps on screen; every one but the newest is finished until `done` */
  const shown = Math.min(phase, length);
  return { shown, done, isFinished: (i: number) => done || i < shown - 1 };
}

const mb = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

/** 612000000 → "612.0 MB", 1.2e9 → "1.2 GB" */
export function formatBytes(bytes: number) {
  if (bytes >= 1e9) return `${mb.format(bytes / 1e9)} GB`;
  return `${mb.format(bytes / 1e6)} MB`;
}

export const formatMB = (bytes: number) => `${whole.format(bytes / 1e6)} MB`;
