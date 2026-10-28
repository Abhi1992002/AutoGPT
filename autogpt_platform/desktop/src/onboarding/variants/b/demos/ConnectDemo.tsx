import { Tick02Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "../../../../design-system/components/spinner";
import { INTEGRATIONS } from "../../../core/data";
import { connectedCount, type IntegrationState } from "../../../core/machine";
import { springSlow, useIconSwap } from "../../../core/motion";
import { Icon } from "../../../ui/Icon";
import type { StoryDemoProps } from "../StoryOnboarding";

const STATUS: Record<IntegrationState, string> = { idle: "Connect", connecting: "Connecting…", connected: "Connected" };

export function ConnectDemo({ flow }: StoryDemoProps) {
  const { integrations } = flow.state;
  const swap = useIconSwap();
  const count = connectedCount(integrations);

  return (
    <div className="story-connect">
      <div className="story-tools">
        {INTEGRATIONS.map((integration, i) => {
          const state = integrations[integration.id];
          return (
            <motion.button
              key={integration.id}
              type="button"
              className="story-tool"
              data-state={state}
              aria-pressed={state === "connected"}
              aria-busy={state === "connecting" || undefined}
              onClick={() => flow.toggleIntegration(integration.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springSlow, delay: 0.05 * i }}
            >
              <span className="story-tool__icon">
                <Icon icon={integration.icon} size={22} />
              </span>
              <span className="ui">{integration.name}</span>
              <span className="small story-tool__state">
                <AnimatePresence mode="popLayout" initial={false}>
                  {state === "connecting" && (
                    <motion.span key="spin" className="story-tool__glyph" aria-hidden="true" {...swap}>
                      <Spinner size="sm" label="" />
                    </motion.span>
                  )}
                  {state === "connected" && (
                    <motion.span key="ok" className="story-tool__glyph" aria-hidden="true" {...swap}>
                      <Icon icon={Tick02Icon} size={14} strokeWidth={2} />
                    </motion.span>
                  )}
                </AnimatePresence>
                {STATUS[state]}
              </span>
            </motion.button>
          );
        })}
      </div>
      <p className="small story__muted story-connect__note ob-num" role="status">
        {count === 0 ? "Nothing connected yet – that’s fine, you can skip this" : count === 1 ? "1 tool connected" : `${count} tools connected`}
      </p>
    </div>
  );
}
