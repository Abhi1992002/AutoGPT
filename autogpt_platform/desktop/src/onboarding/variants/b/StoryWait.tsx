import { Alert02Icon } from "@hugeicons/core-free-icons";
import { Spinner } from "../../../design-system/components/spinner";
import { SERVICE_IDS } from "../../core/data";
import { runningCount } from "../../core/machine";
import type { Onboarding } from "../../core/useOnboarding";
import { Icon } from "../../ui/Icon";

/** Stands in for Continue while a backend step runs; the step moves on by itself when it's done */
export function StoryWait({ flow }: { flow: Onboarding }) {
  const { step, download, start } = flow.state;
  const failed = (step === "download" && download.phase === "error") || (step === "start" && start.phase === "error");

  let text: string;
  if (failed) text = step === "download" ? "Download stopped. Retry it on the right." : "Start stopped. Retry it on the right.";
  else if (step === "download") {
    const { received, total } = download.progress;
    text = `Downloading · ${total ? Math.round((received / total) * 100) : 0}%`;
  } else if (start.phase === "checking") text = "Checking the engine’s health";
  else text = `Starting services · ${runningCount(start.services)} of ${SERVICE_IDS.length}`;

  return (
    <p className="story-wait ob-label ob-num" data-failed={failed || undefined}>
      <span className="story-wait__glyph" aria-hidden="true">
        {failed ? <Icon icon={Alert02Icon} size={14} /> : <Spinner size="sm" label="" />}
      </span>
      {text}
      {!failed && <span className="story-wait__hint ob-meta">Continues on its own</span>}
    </p>
  );
}
