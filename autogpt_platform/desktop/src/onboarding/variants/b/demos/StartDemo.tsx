import { Tick02Icon } from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { Button } from "../../../../design-system/components/button";
import type { ServiceState } from "../../../core/backend";
import { SERVICE_IDS, SERVICES } from "../../../core/data";
import { springSlow } from "../../../core/motion";
import { Icon } from "../../../ui/Icon";
import type { StoryDemoProps } from "../StoryOnboarding";

const LABELS: Record<ServiceState, string> = { pending: "Waiting", starting: "Starting", running: "Running", error: "Failed" };

/** Services light up one after another along a chain, then a heartbeat confirms the API answers */
export function StartDemo({ flow }: StoryDemoProps) {
  const { services, phase, polls, error, health } = flow.state.start;
  const healthy = phase === "healthy";
  const lit = SERVICE_IDS.filter((id) => services[id] === "running").length;

  return (
    <div className="story-panel story-start">
      <ol className="story-chain">
        <motion.span className="story-chain__rail" aria-hidden="true" animate={{ scaleY: lit / SERVICE_IDS.length }} transition={springSlow} initial={false} />
        {SERVICE_IDS.map((id) => (
          <li key={id} className="story-node" data-state={services[id]}>
            <span className="story-node__dot" aria-hidden="true">
              {services[id] === "running" && <Icon icon={Tick02Icon} size={12} strokeWidth={2.5} />}
            </span>
            <span className="story-node__text">
              <span className="ui">{SERVICES[id].label}</span>
              <span className="small story__muted">{SERVICES[id].detail}</span>
            </span>
            <span className="small story-node__state">{LABELS[services[id]]}</span>
          </li>
        ))}
      </ol>
      <div className="story-pulse" data-state={healthy ? "ok" : phase === "checking" ? "checking" : "idle"} role="status">
        <svg viewBox="0 0 120 24" width="120" height="24" aria-hidden="true">
          <path
            d="M0 12 H40 L46 4 L54 20 L60 12 H120"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="small">
          {healthy ? "Healthy · the API answered" : phase === "checking" ? `Listening for the API · check ${polls + 1}` : "Health check starts when every service is up"}
        </span>
      </div>
      {phase === "error" && (
        <div className="story-error" role="alert">
          <p className="ui">The engine didn’t start. {error ?? health?.detail} Make sure Docker is running, then try again.</p>
          <Button variant="secondary" size="sm" onClick={flow.retryStart}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
