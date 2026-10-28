import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";
import { Spinner } from "../../design-system/components/spinner";
import { INTEGRATIONS } from "../core/data";
import { connectedCount, type IntegrationState } from "../core/machine";
import { useIconSwap } from "../core/motion";
import type { Onboarding } from "../core/useOnboarding";
import { Icon } from "../ui/Icon";
import { StatusMark } from "../ui/StatusMark";

const STATUS: Record<IntegrationState, string> = { idle: "Connect", connecting: "Connecting…", connected: "Connected" };

export const connectedNote = (n: number) =>
  n === 0 ? "None connected yet. You can skip this and add tools later." : n === 1 ? "1 tool connected" : `${n} tools connected`;

/** Every integration as a toggle card: click to connect, click again to disconnect */
export function ToolGrid({ flow, columns = 3 }: { flow: Onboarding; columns?: number }) {
  const { integrations } = flow.state;
  const swap = useIconSwap();
  return (
    <div className="ob-tools" style={{ "--cols": columns } as CSSProperties}>
      {INTEGRATIONS.map((integration) => {
        const state = integrations[integration.id];
        return (
          <button
            key={integration.id}
            type="button"
            className="ob-tool"
            data-state={state}
            aria-pressed={state === "connected"}
            aria-busy={state === "connecting" || undefined}
            onClick={() => flow.toggleIntegration(integration.id)}
          >
            <span className="ob-tile">
              <Icon icon={integration.icon} size={16} />
            </span>
            <span className="ob-tool__text">
              <span className="ob-label ob-truncate">{integration.name}</span>
              <span className="ob-meta ob-tool__state">{STATUS[state]}</span>
            </span>
            <span className="ob-tool__mark" aria-hidden="true">
              <AnimatePresence initial={false}>
                {state === "connecting" && (
                  <motion.span key="spin" className="ob-tool__glyph" {...swap}>
                    <Spinner size="sm" label="" />
                  </motion.span>
                )}
                {state === "connected" && (
                  <motion.span key="ok" className="ob-tool__glyph" {...swap}>
                    <StatusMark mark="done" />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ConnectedNote({ flow }: { flow: Onboarding }) {
  return (
    <p className="ob-meta ob-num" role="status">
      {connectedNote(connectedCount(flow.state.integrations))}
    </p>
  );
}
