import { Tick02Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "../../../../design-system/components/spinner";
import { INTEGRATIONS } from "../../../core/data";
import { connectedCount, type IntegrationState } from "../../../core/machine";
import { useIconSwap } from "../../../core/motion";
import { Icon } from "../../../ui/Icon";
import type { ZenStepProps } from "../ZenOnboarding";
import { Reveal, ZenHeader } from "../parts";

const STATUS: Record<IntegrationState, string> = { idle: "Connect", connecting: "Connecting…", connected: "Connected" };

export function ZenConnect({ flow }: ZenStepProps) {
  const { integrations } = flow.state;
  const count = connectedCount(integrations);
  const swap = useIconSwap();

  return (
    <>
      <ZenHeader step="connect" moved={flow.state.moved} />
      <Reveal>
        <div className="zen-grid">
          {INTEGRATIONS.map((integration) => {
            const state = integrations[integration.id];
            return (
              <button
                key={integration.id}
                type="button"
                className="zen-tool"
                data-state={state}
                aria-pressed={state === "connected"}
                aria-busy={state === "connecting" || undefined}
                onClick={() => flow.toggleIntegration(integration.id)}
              >
                <span className="zen-tool__icon">
                  <Icon icon={integration.icon} size={20} />
                </span>
                <span className="ui zen-tool__name">{integration.name}</span>
                <span className="small zen-tool__state">{STATUS[state]}</span>
                <span className="zen-tool__badge" aria-hidden="true">
                  <AnimatePresence initial={false}>
                    {state === "connecting" && (
                      <motion.span key="spin" {...swap}>
                        <Spinner size="sm" label="" />
                      </motion.span>
                    )}
                    {state === "connected" && (
                      <motion.span key="ok" className="zen-tool__ok" {...swap}>
                        <Icon icon={Tick02Icon} size={12} strokeWidth={2.5} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </button>
            );
          })}
        </div>
        <p className="small text-subtle zen-grid__note ob-num" role="status">
          {count === 0 ? "Pick as many as you like, or skip this for now" : count === 1 ? "1 tool connected" : `${count} tools connected`}
        </p>
      </Reveal>
    </>
  );
}
