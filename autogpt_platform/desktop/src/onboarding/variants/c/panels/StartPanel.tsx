import { Button } from "../../../../design-system/components/button";
import type { ServiceState } from "../../../core/backend";
import { SERVICE_IDS, SERVICES } from "../../../core/data";
import type { ConsolePanelProps } from "../ConsoleOnboarding";
import { Terminal } from "./Terminal";

const LABELS: Record<ServiceState, string> = { pending: "Waiting", starting: "Starting", running: "Running", error: "Failed" };

export function StartPanel({ flow }: ConsolePanelProps) {
  const { services, phase, log, polls, error, health } = flow.state.start;
  const healthy = phase === "healthy";

  return (
    <div className="con-stack">
      <div className="con-card con-table-wrap">
        <table className="con-table">
          <thead>
            <tr className="small text-subtle">
              <th scope="col">Service</th>
              <th scope="col">Runs</th>
              <th scope="col">Port</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {SERVICE_IDS.map((id) => (
              <tr key={id} className="ui" data-state={services[id]}>
                <td>{SERVICES[id].label}</td>
                <td className="text-muted">{SERVICES[id].detail}</td>
                <td className="mono text-muted ob-num">{SERVICES[id].port ?? "–"}</td>
                <td>
                  <span className="con-status small">
                    <span className="con-status__dot" aria-hidden="true" />
                    {LABELS[services[id]]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small con-health" data-state={healthy ? "ok" : phase} role="status">
          <span className="mono">GET localhost:8006/health/status</span>
          <span>{healthy ? "200 OK" : phase === "checking" ? `waiting · check ${polls + 1}` : "after services start"}</span>
        </p>
      </div>
      <Terminal command="./run.sh start" rows={4} lines={log} done={healthy ? "Engine is healthy" : undefined} />
      {phase === "error" && (
        <div className="con-error" role="alert">
          <p className="ui">The engine didn’t start. {error ?? health?.detail} Make sure Docker is running, then try again.</p>
          <Button variant="secondary" size="sm" onClick={flow.retryStart}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
