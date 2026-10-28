import { Button } from "../../../../design-system/components/button";
import type { ServiceState } from "../../../core/backend";
import { SERVICE_IDS, SERVICES } from "../../../core/data";
import { serviceMark, StatusMark } from "../../../ui/StatusMark";
import type { ConsolePanelProps } from "../ConsoleOnboarding";
import { Terminal } from "./Terminal";

const LABELS: Record<ServiceState, string> = { pending: "Waiting", starting: "Starting", running: "Running", error: "Failed" };

export function StartPanel({ flow }: ConsolePanelProps) {
  const { services, phase, log, polls, error, health } = flow.state.start;
  const healthy = phase === "healthy";

  return (
    <div className="con-stack">
      <div className="ob-panel con-table-wrap">
        <table className="con-table">
          <thead>
            <tr>
              <th scope="col">Service</th>
              <th scope="col">Runs</th>
              <th scope="col">Port</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {SERVICE_IDS.map((id) => (
              <tr key={id} data-state={services[id]}>
                <td className="ob-label">{SERVICES[id].label}</td>
                <td className="ob-soft">{SERVICES[id].detail}</td>
                <td className="ob-mono ob-soft ob-num">{SERVICES[id].port ?? "–"}</td>
                <td>
                  <span className="con-status">
                    <StatusMark mark={serviceMark(services[id])} />
                    {LABELS[services[id]]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="con-health" data-state={healthy ? "ok" : phase} role="status">
          <span className="ob-mono">GET localhost:8006/health/status</span>
          <span className="ob-meta ob-num">{healthy ? "200 OK" : phase === "checking" ? `Waiting · check ${polls + 1}` : "After every service is up"}</span>
        </p>
      </div>
      <Terminal command="./run.sh start" rows={4} lines={log} done={healthy ? "Engine is healthy" : undefined} />
      {phase === "error" && (
        <div className="ob-error" role="alert">
          <p className="ob-text">The engine didn’t start. {error ?? health?.detail} Make sure Docker is running, then try again.</p>
          <Button variant="secondary" size="sm" onClick={flow.retryStart}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
