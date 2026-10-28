import { Tick02Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "../../../../design-system/components/spinner";
import { INTEGRATIONS } from "../../../core/data";
import { connectedCount, type IntegrationState } from "../../../core/machine";
import { useIconSwap } from "../../../core/motion";
import { Icon } from "../../../ui/Icon";
import type { ConsolePanelProps } from "../ConsoleOnboarding";

const ACTION: Record<IntegrationState, string> = { idle: "Connect", connecting: "Connecting", connected: "Connected" };

export function ConnectPanel({ flow }: ConsolePanelProps) {
  const { integrations } = flow.state;
  const swap = useIconSwap();
  const count = connectedCount(integrations);

  return (
    <div className="con-stack">
      <div className="con-tools">
        {INTEGRATIONS.map((integration) => {
          const state = integrations[integration.id];
          return (
            <button
              key={integration.id}
              type="button"
              className="con-tool"
              data-state={state}
              aria-pressed={state === "connected"}
              aria-busy={state === "connecting" || undefined}
              onClick={() => flow.toggleIntegration(integration.id)}
            >
              <span className="con-icon">
                <Icon icon={integration.icon} size={18} />
              </span>
              <span className="con-tool__text">
                <span className="ui">{integration.name}</span>
                <span className="small text-muted">{integration.description}</span>
              </span>
              <span className="small con-tool__action">
                <AnimatePresence mode="popLayout" initial={false}>
                  {state === "connecting" && (
                    <motion.span key="spin" className="con-tool__glyph" aria-hidden="true" {...swap}>
                      <Spinner size="sm" label="" />
                    </motion.span>
                  )}
                  {state === "connected" && (
                    <motion.span key="ok" className="con-tool__glyph" aria-hidden="true" {...swap}>
                      <Icon icon={Tick02Icon} size={14} strokeWidth={2} />
                    </motion.span>
                  )}
                </AnimatePresence>
                {ACTION[state]}
              </span>
            </button>
          );
        })}
      </div>
      <p className="small text-subtle ob-num" role="status">
        {count === 0 ? "Nothing connected yet. You can skip this and connect tools later." : count === 1 ? "1 tool connected" : `${count} tools connected`}
      </p>
    </div>
  );
}
