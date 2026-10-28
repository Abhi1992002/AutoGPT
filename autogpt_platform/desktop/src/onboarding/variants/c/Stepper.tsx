import { Tick02Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import { isTauri } from "../../core/backend";
import { SERVICE_IDS } from "../../core/data";
import { formatMB } from "../../core/hooks";
import { connectedCount, runningCount, type OnboardingState } from "../../core/machine";
import { springSlow, useIconSwap } from "../../core/motion";
import { STEP_IDS, STEPS, stepIndex, type StepId } from "../../core/steps";
import type { Onboarding } from "../../core/useOnboarding";
import { Icon } from "../../ui/Icon";

/** A live detail under each step label */
function detail(id: StepId, state: OnboardingState): string {
  const { download, start, integrations } = state;
  switch (id) {
    case "welcome":
      return "About three minutes";
    case "download": {
      if (download.phase === "done") return `${formatMB(download.progress.total)} downloaded`;
      if (download.phase === "idle") return `${formatMB(download.progress.total)} to download`;
      const ratio = download.progress.total ? download.progress.received / download.progress.total : 0;
      return `${Math.round(ratio * 100)}% · ${formatMB(download.progress.received)}`;
    }
    case "start":
      return start.phase === "healthy" ? "Healthy" : `${runningCount(start.services)} of ${SERVICE_IDS.length} services up`;
    case "tour":
      return "Three things agents do";
    case "connect": {
      const n = connectedCount(integrations);
      return n === 0 ? "Optional" : n === 1 ? "1 connected" : `${n} connected`;
    }
    case "brain":
      return state.brain.trim() ? "Noted" : "A few words";
    case "done":
      return "Open your library";
  }
}

export function Stepper({ flow }: { flow: Onboarding }) {
  const { state } = flow;
  const current = stepIndex(state.step);
  const swap = useIconSwap();

  return (
    <aside className="con-side">
      <div className="con-side__brand">
        <span className="con-side__mark" aria-hidden="true" />
        <span className="title">AutoGPT</span>
      </div>
      <nav aria-label="Setup steps">
        <ol className="con-steps">
          {STEP_IDS.map((id, i) => {
            const status = i < current ? "done" : i === current ? "current" : "upcoming";
            const inner = (
              <>
                <span className="con-step__mark" aria-hidden="true">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {status === "done" ? (
                      <motion.span key="done" className="con-step__glyph" {...swap}>
                        <Icon icon={Tick02Icon} size={14} strokeWidth={2.5} />
                      </motion.span>
                    ) : (
                      <motion.span key="num" className="con-step__glyph small ob-num" {...swap}>
                        {i + 1}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className="con-step__text">
                  <span className="ui">{STEPS[id].label}</span>
                  <span className="small text-subtle ob-num">{detail(id, state)}</span>
                </span>
              </>
            );
            return (
              <li key={id} className="con-step" data-status={status} aria-current={status === "current" ? "step" : undefined}>
                {i < STEP_IDS.length - 1 && (
                  <motion.span className="con-step__line" aria-hidden="true" animate={{ scaleY: i < current ? 1 : 0 }} transition={springSlow} initial={false} />
                )}
                {status === "done" && id !== "download" && id !== "start" ? (
                  <button type="button" className="con-step__row" onClick={() => flow.go(id)} aria-label={`${STEPS[id].label}, done. Go back to this step`}>
                    {inner}
                  </button>
                ) : (
                  <div className="con-step__row">{inner}</div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {import.meta.env.DEV && (
        <p className="small text-subtle con-side__foot">
          <span className="con-side__dot" data-live={isTauri() || undefined} aria-hidden="true" />
          {isTauri() ? "Local engine via Docker" : "Preview · simulated engine"}
        </p>
      )}
    </aside>
  );
}
