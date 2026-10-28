import { Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "../../../../design-system/components/button";
import { connectedNote } from "../../../blocks/ToolGrid";
import { INTEGRATIONS } from "../../../core/data";
import { connectedCount, type IntegrationState } from "../../../core/machine";
import { Icon } from "../../../ui/Icon";
import type { ConsolePanelProps } from "../ConsoleOnboarding";

const ACTION: Record<IntegrationState, string> = { idle: "Connect", connecting: "Connecting", connected: "Connected" };

/** Integrations as a settings list: one row each, the action on the trailing edge */
export function ConnectPanel({ flow }: ConsolePanelProps) {
  const { integrations } = flow.state;

  return (
    <div className="con-stack">
      <ul className="ob-panel ob-rows con-int">
        {INTEGRATIONS.map((integration) => {
          const state = integrations[integration.id];
          return (
            <li key={integration.id} className="ob-row con-int__row" data-state={state}>
              <span className="ob-tile">
                <Icon icon={integration.icon} size={14} />
              </span>
              <span className="ob-label con-int__name">{integration.name}</span>
              <span className="ob-meta ob-truncate">{integration.description}</span>
              <Button
                className="ob-row__end con-int__action"
                variant={state === "connected" ? "ghost" : "secondary"}
                size="sm"
                loading={state === "connecting"}
                icon={state === "connected" ? <Icon icon={Tick02Icon} strokeWidth={2} /> : undefined}
                aria-pressed={state === "connected"}
                aria-label={`${ACTION[state]} ${integration.name}`}
                onClick={() => flow.toggleIntegration(integration.id)}
              >
                {ACTION[state]}
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="ob-meta ob-num" role="status">
        {connectedNote(connectedCount(integrations))}
      </p>
    </div>
  );
}
