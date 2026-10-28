import { PlayIcon } from "@hugeicons/core-free-icons";
import { Button } from "../../../../design-system/components/button";
import type { ServiceState } from "../../../core/backend";
import { SERVICE_IDS, SERVICES } from "../../../core/data";
import { serviceMark, StatusMark } from "../../../ui/StatusMark";
import type { ZenStepProps } from "../ZenOnboarding";
import { Reveal, ZenHeader } from "../parts";

const LABELS: Record<ServiceState, string> = { pending: "Waiting", starting: "Starting", running: "Running", error: "Failed" };

export function ZenStart({ flow }: ZenStepProps) {
  const { services, phase, health, polls, error } = flow.state.start;
  const healthy = phase === "healthy";

  return (
    <>
      <ZenHeader step="start" moved={flow.state.moved} icon={PlayIcon} />
      <Reveal className="zen-stack">
        <div className="ob-panel">
          <ul className="ob-rows zen-list">
            {SERVICE_IDS.map((id) => (
              <li key={id} className="ob-row" data-state={services[id]}>
                <StatusMark mark={serviceMark(services[id])} />
                <span className="ob-label">{SERVICES[id].label}</span>
                <span className="ob-meta">{SERVICES[id].detail}</span>
                <span className="ob-meta ob-row__end zen-state" data-state={services[id]}>
                  {LABELS[services[id]]}
                </span>
              </li>
            ))}
          </ul>
          <p className="zen-health" data-ok={healthy || undefined} role="status">
            <span className="ob-mono">GET /health/status</span>
            <span className="ob-meta ob-num">
              {healthy ? "200 OK" : phase === "checking" ? `Waiting · check ${polls + 1}` : phase === "error" ? "No answer" : "After every service is up"}
            </span>
          </p>
        </div>
        {phase === "error" && (
          <div className="ob-error" role="alert">
            <p className="ob-text">The engine didn’t start. {error ?? health?.detail} Make sure Docker is running, then try again.</p>
            <Button variant="secondary" size="sm" onClick={flow.retryStart}>
              Try again
            </Button>
          </div>
        )}
      </Reveal>
    </>
  );
}
