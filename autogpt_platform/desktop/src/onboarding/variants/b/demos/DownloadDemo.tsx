import { CloudDownloadIcon } from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { Button } from "../../../../design-system/components/button";
import { formatMB } from "../../../core/hooks";
import { springSlow } from "../../../core/motion";
import { layerMark, StatusMark } from "../../../ui/StatusMark";
import type { StoryDemoProps } from "../StoryOnboarding";
import { Window } from "../Window";

/** The engine arriving: a running total, then one thin bar per image */
export function DownloadDemo({ flow }: StoryDemoProps) {
  const { progress, phase, log, error } = flow.state.download;
  const ratio = progress.total ? progress.received / progress.total : 0;

  return (
    <Window
      icon={CloudDownloadIcon}
      title="Engine"
      meta={phase === "done" ? "Downloaded" : `${Math.round(ratio * 100)}%`}
      footer={<span className="ob-mono ob-truncate">{phase === "done" ? "All images pulled" : (log[log.length - 1] ?? "Connecting to the registry…")}</span>}
    >
      <div className="story-total">
        <span className="story-total__big ob-num">{formatMB(progress.received)}</span>
        <span className="ob-meta ob-num">of {formatMB(progress.total)}</span>
      </div>
      <ul className="story-layers" role="progressbar" aria-label="Download progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)}>
        {progress.layers.map((layer) => {
          const r = layer.total ? layer.received / layer.total : 0;
          return (
            <li key={layer.id} className="story-layer" data-status={layer.status}>
              <StatusMark mark={layerMark(layer.status)} />
              <span className="ob-label">{layer.label}</span>
              <span className="ob-meta ob-num story-layer__pct">{layer.status === "done" ? formatMB(layer.total) : layer.status === "waiting" ? "Queued" : `${Math.round(r * 100)}%`}</span>
              <span className="story-layer__bar">
                <motion.span className="story-layer__fill" animate={{ scaleX: r }} transition={springSlow} initial={false} />
              </span>
            </li>
          );
        })}
      </ul>
      {phase === "error" && (
        <div className="ob-error" role="alert">
          <p className="ob-text">Download stopped. {error} Check your connection, then try again.</p>
          <Button variant="secondary" size="sm" onClick={flow.retryDownload}>
            Try again
          </Button>
        </div>
      )}
    </Window>
  );
}
