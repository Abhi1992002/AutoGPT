import { Tick02Icon } from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { Button } from "../../../../design-system/components/button";
import { formatMB } from "../../../core/hooks";
import { springSlow } from "../../../core/motion";
import { Icon } from "../../../ui/Icon";
import type { StoryDemoProps } from "../StoryOnboarding";

/** The engine assembling itself: one slab per image, filling as its bytes arrive */
export function DownloadDemo({ flow }: StoryDemoProps) {
  const { progress, phase, log, error } = flow.state.download;
  const ratio = progress.total ? progress.received / progress.total : 0;

  return (
    <div className="story-panel story-dl">
      <div className="story-dl__count">
        <span className="story-dl__big ob-num">{formatMB(progress.received)}</span>
        <span className="ui story__muted ob-num">of {formatMB(progress.total)}</span>
      </div>
      <div className="story-dl__stack" role="progressbar" aria-label="Download progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)}>
        {progress.layers.map((layer, i) => {
          const r = layer.total ? layer.received / layer.total : 0;
          return (
            <motion.div
              key={layer.id}
              className="story-slab"
              data-status={layer.status}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springSlow, delay: 0.1 + i * 0.08 }}
            >
              <motion.span className="story-slab__fill" animate={{ scaleX: r }} transition={springSlow} initial={false} />
              <span className="small story-slab__label">{layer.label}</span>
              <span className="small story-slab__meta ob-num">
                {layer.status === "done" ? <Icon icon={Tick02Icon} size={14} strokeWidth={2} label="Done" /> : layer.status === "waiting" ? "Queued" : `${Math.round(r * 100)}%`}
              </span>
            </motion.div>
          );
        })}
      </div>
      <p className="mono story-dl__log" aria-hidden="true">
        {phase === "done" ? "Engine downloaded" : (log[log.length - 1] ?? "Connecting to the registry…")}
      </p>
      {phase === "error" && (
        <div className="story-error" role="alert">
          <p className="ui">Download stopped. {error} Check your connection, then try again.</p>
          <Button variant="secondary" size="sm" onClick={flow.retryDownload}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
