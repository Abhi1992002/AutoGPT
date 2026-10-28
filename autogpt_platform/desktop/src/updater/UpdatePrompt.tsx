import { Alert } from "../design-system/components/alert";
import { Button } from "../design-system/components/button";
import { Dialog } from "../design-system/components/dialog";
import { Progress } from "../design-system/components/progress";
import { useToast } from "../design-system/components/toast";
import { formatBytes, useUpdater, type UpdaterStatus } from "./UpdaterProvider";
import "./updater.css";

export function ReleaseNotes({ notes }: { notes?: string }) {
  const text = notes?.trim();
  if (!text) return <p className="update-notes update-notes--empty body text-muted">No release notes for this version.</p>;
  return <div className="update-notes body">{text}</div>;
}

export function DownloadProgress({ status, version }: { status: Extract<UpdaterStatus, { kind: "downloading" }>; version: string }) {
  const { downloaded, total } = status;
  return (
    <div className="update-progress">
      <Progress
        value={total ? downloaded : undefined}
        max={total || 1}
        label={`Downloading v${version}`}
        showValue={total ? "percent" : undefined}
        tone="accent"
      />
      <p className="small text-muted">{total ? `${formatBytes(downloaded)} of ${formatBytes(total)}` : formatBytes(downloaded)}</p>
    </div>
  );
}

/** Shown when the background check finds a new version */
export function UpdatePrompt() {
  const { prompt, currentVersion, status, updateAndRestart, dismissPrompt } = useUpdater();
  const toast = useToast();
  if (!prompt) return null;

  const working = status.kind === "downloading" || status.kind === "ready" || status.kind === "installing";
  const later = () => {
    dismissPrompt();
    if (!working) toast({ title: "Update postponed", text: `You can install v${prompt.version} any time from Settings.` });
  };

  return (
    <Dialog
      open
      onClose={later}
      title="Update available"
      description={`v${currentVersion ?? prompt.currentVersion} → v${prompt.version}`}
      footer={
        <>
          <Button variant="secondary" onClick={later} disabled={working}>
            Later
          </Button>
          <Button onClick={() => void updateAndRestart()} loading={working}>
            {status.kind === "error" ? "Try again" : "Update & restart"}
          </Button>
        </>
      }
    >
      <div className="update-prompt">
        <ReleaseNotes notes={prompt.body} />
        {status.kind === "downloading" && <DownloadProgress status={status} version={prompt.version} />}
        {status.kind === "installing" && <Progress label="Installing…" tone="accent" />}
        {status.kind === "error" && (
          <Alert tone="danger" title="The update didn't install">
            {status.message}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}
