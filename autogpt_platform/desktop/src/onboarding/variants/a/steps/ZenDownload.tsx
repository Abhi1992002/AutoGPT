import { CloudDownloadIcon } from "@hugeicons/core-free-icons";
import { Button } from "../../../../design-system/components/button";
import { Progress } from "../../../../design-system/components/progress";
import { formatBytes, formatMB } from "../../../core/hooks";
import { layerMark, StatusMark } from "../../../ui/StatusMark";
import type { ZenStepProps } from "../ZenOnboarding";
import { Reveal, ZenHeader } from "../parts";

export function ZenDownload({ flow }: ZenStepProps) {
  const { progress, phase, error } = flow.state.download;
  const ratio = progress.total ? progress.received / progress.total : 0;
  const done = phase === "done";

  return (
    <>
      <ZenHeader step="download" moved={flow.state.moved} icon={CloudDownloadIcon} />
      <Reveal className="zen-stack">
        <div className="ob-panel">
          <div className="zen-meter">
            <div className="zen-meter__head">
              <span className="ob-label ob-num">{done ? "Downloaded" : `${Math.round(ratio * 100)}%`}</span>
              <span className="ob-meta ob-num">
                {formatMB(progress.received)} of {formatMB(progress.total)}
              </span>
            </div>
            <Progress value={Math.round(ratio * 100)} size="sm" tone="accent" />
          </div>
          <ul className="ob-rows zen-list">
            {progress.layers.map((layer) => (
              <li key={layer.id} className="ob-row" data-status={layer.status}>
                <StatusMark mark={layerMark(layer.status)} />
                <span className="ob-label">{layer.label}</span>
                <span className="ob-mono ob-soft ob-truncate">{layer.detail}</span>
                <span className="ob-meta ob-num ob-row__end">{layer.status === "waiting" ? "Queued" : formatBytes(layer.total)}</span>
              </li>
            ))}
          </ul>
        </div>
        {phase === "error" && (
          <div className="ob-error" role="alert">
            <p className="ob-text">Download stopped. {error} Check your connection, then try again.</p>
            <Button variant="secondary" size="sm" onClick={flow.retryDownload}>
              Try again
            </Button>
          </div>
        )}
      </Reveal>
    </>
  );
}
