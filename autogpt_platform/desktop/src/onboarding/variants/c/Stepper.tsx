import { isTauri } from "../../core/backend";
import { SERVICE_IDS } from "../../core/data";
import { formatMB } from "../../core/hooks";
import { connectedCount, runningCount, type OnboardingState } from "../../core/machine";
import { STEP_IDS, STEPS, stepIndex, type StepId } from "../../core/steps";
import type { Onboarding } from "../../core/useOnboarding";
import { Brand } from "../../ui/Brand";
import { StatusMark, type Mark } from "../../ui/StatusMark";

/** A live detail beside each step */
function detail(id: StepId, state: OnboardingState): string {
  const { download, start, integrations } = state;
  switch (id) {
    case "welcome":
      return "3 min";
    case "download": {
      if (download.phase === "done") return formatMB(download.progress.total);
      const ratio = download.progress.total ? download.progress.received / download.progress.total : 0;
      return download.phase === "idle" ? formatMB(download.progress.total) : `${Math.round(ratio * 100)}%`;
    }
    case "start":
      return start.phase === "healthy" ? "Healthy" : `${runningCount(start.services)}/${SERVICE_IDS.length}`;
    case "tour":
      return "3";
    case "connect": {
      const n = connectedCount(integrations);
      return n === 0 ? "Optional" : `${n}`;
    }
    case "brain":
      return state.brain.trim() ? "Noted" : "";
    case "done":
      return "";
  }
}

function markFor(i: number, current: number, id: StepId, state: OnboardingState): Mark {
  if (i < current) return "done";
  if (i > current) return "pending";
  const busy = (id === "download" && state.download.phase === "running") || (id === "start" && (state.start.phase === "running" || state.start.phase === "checking"));
  return busy ? "active" : "pending";
}

export function Stepper({ flow }: { flow: Onboarding }) {
  const { state } = flow;
  const current = stepIndex(state.step);
  const done = Math.min(current, STEP_IDS.length);

  return (
    <aside className="con-side">
      <div className="con-side__brand">
        <Brand detail="Setup" />
      </div>
      <nav aria-label="Setup steps" className="con-side__nav">
        <p className="ob-micro con-side__label">
          Getting started
          <span className="ob-num">
            {done}/{STEP_IDS.length}
          </span>
        </p>
        <ol className="con-steps">
          {STEP_IDS.map((id, i) => {
            const status = i < current ? "done" : i === current ? "current" : "upcoming";
            const inner = (
              <>
                <StatusMark mark={markFor(i, current, id, state)} />
                <span className="con-step__label ob-truncate">{STEPS[id].label}</span>
                <span className="ob-meta ob-num con-step__detail">{detail(id, state)}</span>
              </>
            );
            return (
              <li key={id} className="con-step" data-status={status} aria-current={status === "current" ? "step" : undefined}>
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
      <div className="con-side__foot">
        <div className="con-side__meter" aria-hidden="true">
          <span style={{ width: `${(current / (STEP_IDS.length - 1)) * 100}%` }} />
        </div>
        {(isTauri() || import.meta.env.DEV) && (
          <p className="ob-meta con-side__engine">
          <span className="con-side__dot" data-live={isTauri() || state.start.phase === "healthy" || undefined} aria-hidden="true" />
            {isTauri() ? "Local engine via Docker" : "Preview · simulated engine"}
          </p>
        )}
      </div>
    </aside>
  );
}
