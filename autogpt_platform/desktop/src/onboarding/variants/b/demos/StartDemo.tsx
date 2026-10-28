import { PlayIcon } from "@hugeicons/core-free-icons";
import { Button } from "../../../../design-system/components/button";
import type { ServiceState } from "../../../core/backend";
import { SERVICE_IDS, SERVICES } from "../../../core/data";
import { runningCount } from "../../../core/machine";
import { serviceMark, StatusMark } from "../../../ui/StatusMark";
import type { StoryDemoProps } from "../StoryOnboarding";
import { Window } from "../Window";

const LABELS: Record<ServiceState, string> = { pending: "Waiting", starting: "Starting", running: "Running", error: "Failed" };

/** Services come up one after another along a line, then the health check answers */
export function StartDemo({ flow }: StoryDemoProps) {
  const { services, phase, polls, error, health } = flow.state.start;
  const healthy = phase === "healthy";

  return (
    <Window
      icon={PlayIcon}
      title="Services"
      meta={`${runningCount(services)} of ${SERVICE_IDS.length} running`}
      footer={
        <span className="story-health" data-ok={healthy || undefined} role="status">
          <span className="ob-mono">GET /health/status</span>
          <span className="ob-meta ob-num">{healthy ? "200 OK" : phase === "checking" ? `Waiting · check ${polls + 1}` : "After every service is up"}</span>
        </span>
      }
    >
      <ol className="story-chain">
        {SERVICE_IDS.map((id) => (
          <li key={id} className="story-chain__item" data-state={services[id]}>
            <StatusMark mark={serviceMark(services[id])} />
            <span className="story-chain__text">
              <span className="ob-label">{SERVICES[id].label}</span>
              <span className="ob-meta">{SERVICES[id].detail}</span>
            </span>
            <span className="ob-mono ob-soft ob-num">{SERVICES[id].port ? `:${SERVICES[id].port}` : ""}</span>
            <span className="ob-meta story-chain__state">{LABELS[services[id]]}</span>
          </li>
        ))}
      </ol>
      {phase === "error" && (
        <div className="ob-error" role="alert">
          <p className="ob-text">The engine didn’t start. {error ?? health?.detail} Make sure Docker is running, then try again.</p>
          <Button variant="secondary" size="sm" onClick={flow.retryStart}>
            Try again
          </Button>
        </div>
      )}
    </Window>
  );
}
