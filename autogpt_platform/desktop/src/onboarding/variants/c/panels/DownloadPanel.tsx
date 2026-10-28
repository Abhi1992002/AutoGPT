import { Button } from "../../../../design-system/components/button";
import type { Layer } from "../../../core/backend";
import { formatMB } from "../../../core/hooks";
import type { ConsolePanelProps } from "../ConsoleOnboarding";
import { Terminal } from "./Terminal";

const SEGMENTS = 32;

/** The CLI installer, made visual: a log on top, one segmented bar per image below */
export function DownloadPanel({ flow }: ConsolePanelProps) {
  const { progress, phase, log, error } = flow.state.download;

  return (
    <div className="con-stack">
      <Terminal
        command="./run.sh pull"
        meta={`${formatMB(progress.received)} / ${formatMB(progress.total)}`}
        lines={log}
        done={phase === "done" ? "All images pulled" : undefined}
      >
        <div className="con-layers">
          {progress.layers.map((layer) => (
            <LayerBar key={layer.id} layer={layer} />
          ))}
        </div>
      </Terminal>
      {phase === "error" && (
        <div className="con-error" role="alert">
          <p className="ui">Download stopped. {error} Check your connection, then try again.</p>
          <Button variant="secondary" size="sm" onClick={flow.retryDownload}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

function LayerBar({ layer }: { layer: Layer }) {
  const ratio = layer.total ? layer.received / layer.total : 0;
  const lit = Math.round(ratio * SEGMENTS);
  const pct = Math.round(ratio * 100);
  return (
    <div className="con-layer" data-status={layer.status}>
      <span className="mono con-layer__name">{layer.detail ?? layer.label}</span>
      <span className="con-layer__bar" role="progressbar" aria-label={layer.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span key={i} className="con-layer__seg" data-lit={i < lit || undefined} data-head={(layer.status === "downloading" && i === lit - 1) || undefined} />
        ))}
      </span>
      <span className="mono con-layer__pct ob-num">{layer.status === "done" ? "done" : layer.status === "waiting" ? "queued" : `${pct}%`}</span>
      <span className="mono con-layer__size ob-num">{formatMB(layer.total)}</span>
    </div>
  );
}
