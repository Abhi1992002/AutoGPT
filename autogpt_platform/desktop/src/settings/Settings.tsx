import { ArrowLeft, RefreshCw } from "lucide-react";
import { Alert } from "../design-system/components/alert";
import { Badge } from "../design-system/components/badge";
import { Button } from "../design-system/components/button";
import { Card } from "../design-system/components/card";
import { Icon } from "../design-system/components/icon";
import { Progress } from "../design-system/components/progress";
import { DownloadProgress, ReleaseNotes } from "../updater/UpdatePrompt";
import { useUpdater } from "../updater/UpdaterProvider";
import "./settings.css";

export function Settings({ onBack }: { onBack: () => void }) {
  return (
    <main className="settings">
      <header className="settings__header">
        <Button variant="ghost" size="sm" icon={<Icon icon={ArrowLeft} />} onClick={onBack}>
          Gallery
        </Button>
        <h1 className="settings__title title">Settings</h1>
      </header>
      <UpdatesCard />
    </main>
  );
}

function UpdatesCard() {
  const { supported, currentVersion, update, status, lastChecked, checkNow, download, restart } = useUpdater();
  const busy = status.kind === "downloading" || status.kind === "ready" || status.kind === "installing";

  return (
    <Card
      title="Updates"
      description="AutoGPT Desktop checks for a new version when it starts and every 30 minutes."
      actions={
        supported && (
          <Button variant="secondary" size="sm" icon={<Icon icon={RefreshCw} />} loading={status.kind === "checking"} disabled={busy} onClick={() => void checkNow()}>
            Check for updates
          </Button>
        )
      }
    >
      <dl className="settings__facts">
        <dt className="text-muted">Current version</dt>
        <dd>{supported ? (currentVersion ? `v${currentVersion}` : "…") : "Browser preview"}</dd>
        <dt className="text-muted">Last checked</dt>
        <dd>{lastChecked ? lastChecked.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Not yet"}</dd>
      </dl>

      {!supported && (
        <Alert tone="info" title="Updates run in the desktop app">
          This page is open in a browser, so there is nothing to update. Launch the installed app to check for new versions.
        </Alert>
      )}

      {status.kind === "up-to-date" && (
        <div className="settings__status">
          <Badge tone="success" dot>
            Up to date
          </Badge>
        </div>
      )}

      {update && status.kind !== "up-to-date" && status.kind !== "checking" && (
        <div className="settings__update">
          <div className="settings__update-head">
            <p className="heading">Version {update.version}</p>
            <Badge tone={status.kind === "ready" ? "success" : "accent"} dot>
              {status.kind === "ready" ? "Ready to install" : "Available"}
            </Badge>
          </div>
          <ReleaseNotes notes={update.body} />
          {status.kind === "downloading" && <DownloadProgress status={status} version={update.version} />}
          {status.kind === "installing" && <Progress label="Installing…" tone="accent" />}
          <div className="settings__actions">
            {(status.kind === "available" || status.kind === "error" || status.kind === "idle") && <Button onClick={() => void download()}>Download update</Button>}
            {(status.kind === "ready" || status.kind === "installing") && (
              <Button onClick={() => void restart()} loading={status.kind === "installing"}>
                Restart to update
              </Button>
            )}
          </div>
        </div>
      )}

      {status.kind === "error" && (
        <Alert tone="danger" title={update ? "The update didn't download" : "Couldn't check for updates"}>
          {status.message}
        </Alert>
      )}
    </Card>
  );
}
