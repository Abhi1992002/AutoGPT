import { PulseRectangle01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../../../../design-system/components/button";
import type { ServiceState } from "../../../core/backend";
import { SERVICE_IDS, SERVICES } from "../../../core/data";
import { useIconSwap } from "../../../core/motion";
import { Icon } from "../../../ui/Icon";
import type { ZenStepProps } from "../ZenOnboarding";
import { Reveal, ZenHeader } from "../parts";

const LABELS: Record<ServiceState, string> = { pending: "Waiting", starting: "Starting", running: "Running", error: "Failed" };

export function ZenStart({ flow }: ZenStepProps) {
  const { services, phase, health, polls, error } = flow.state.start;
  const healthy = phase === "healthy";

  return (
    <>
      <ZenHeader step="start" moved={flow.state.moved} icon={healthy ? Tick02Icon : PulseRectangle01Icon} />
      <Reveal>
        <ul className="zen-svc">
          {SERVICE_IDS.map((id) => (
            <li key={id} className="zen-svc__row" data-state={services[id]}>
              <StatusMark state={services[id]} />
              <span className="ui">{SERVICES[id].label}</span>
              <span className="small text-subtle">{SERVICES[id].detail}</span>
              <span className="small zen-svc__state">{LABELS[services[id]]}</span>
            </li>
          ))}
        </ul>
        <p className="small zen-health" data-ok={healthy || undefined} role="status">
          {healthy
            ? "Engine is healthy and ready for agents"
            : phase === "checking"
              ? `Waiting for the API to answer · check ${polls + 1}`
              : phase === "error"
                ? ""
                : "Health check runs once every service is up"}
        </p>
        {phase === "error" && (
          <div className="zen-error" role="alert">
            <p className="ui">The engine didn’t start. {error ?? health?.detail} Make sure Docker is running, then try again.</p>
            <Button variant="secondary" size="sm" onClick={flow.retryStart}>
              Try again
            </Button>
          </div>
        )}
      </Reveal>
    </>
  );
}

function StatusMark({ state }: { state: ServiceState }) {
  const swap = useIconSwap();
  return (
    <span className="zen-svc__mark" aria-hidden="true">
      <AnimatePresence mode="popLayout" initial={false}>
        {state === "running" ? (
          <motion.span key="ok" className="zen-svc__ok" {...swap}>
            <Icon icon={Tick02Icon} size={12} strokeWidth={2.5} />
          </motion.span>
        ) : (
          <motion.span key="dot" className="zen-svc__dot" {...swap} />
        )}
      </AnimatePresence>
    </span>
  );
}
