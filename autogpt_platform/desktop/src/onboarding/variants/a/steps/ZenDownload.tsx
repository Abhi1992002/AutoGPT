import { CloudDownloadIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { Button } from "../../../../design-system/components/button";
import { Spinner } from "../../../../design-system/components/spinner";
import type { Layer } from "../../../core/backend";
import { formatBytes, formatMB } from "../../../core/hooks";
import { springSlow } from "../../../core/motion";
import { Icon } from "../../../ui/Icon";
import type { ZenStepProps } from "../ZenOnboarding";
import { Reveal, ZenHeader } from "../parts";

export function ZenDownload({ flow }: ZenStepProps) {
  const { progress, phase, error } = flow.state.download;
  const ratio = progress.total ? progress.received / progress.total : 0;
  const done = phase === "done";

  return (
    <>
      <ZenHeader step="download" moved={flow.state.moved} icon={done ? Tick02Icon : CloudDownloadIcon} />
      <Reveal className="zen-dl">
        <div className="zen-dl__head">
          <span className="title ob-num">{done ? "Downloaded" : `${Math.round(ratio * 100)}%`}</span>
          <span className="ui text-muted ob-num">
            {formatMB(progress.received)} of {formatMB(progress.total)}
          </span>
        </div>
        <div
          className="zen-bar"
          role="progressbar"
          aria-label="Download progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(ratio * 100)}
        >
          <motion.span className="zen-bar__fill" animate={{ scaleX: ratio }} transition={springSlow} initial={false} />
        </div>
        <ul className="zen-dl__list">
          {progress.layers.map((layer) => (
            <LayerRow key={layer.id} layer={layer} />
          ))}
        </ul>
        {phase === "error" && (
          <div className="zen-error" role="alert">
            <p className="ui">Download stopped. {error} Check your connection, then try again.</p>
            <Button variant="secondary" size="sm" onClick={flow.retryDownload}>
              Try again
            </Button>
          </div>
        )}
      </Reveal>
    </>
  );
}

function LayerRow({ layer }: { layer: Layer }) {
  return (
    <li className="zen-dl__row" data-status={layer.status}>
      <span className="zen-dl__status">
        {layer.status === "done" ? <Icon icon={Tick02Icon} size={14} strokeWidth={2} /> : layer.status === "waiting" ? <span className="zen-dot" /> : <Spinner size="sm" label={`${layer.label} downloading`} />}
      </span>
      <span className="ui">{layer.label}</span>
      <span className="small text-subtle ob-num zen-dl__size">{layer.status === "waiting" ? "Queued" : formatBytes(layer.total)}</span>
    </li>
  );
}
