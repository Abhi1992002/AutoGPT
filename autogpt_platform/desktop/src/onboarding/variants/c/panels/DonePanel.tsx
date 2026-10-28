import { Tick02Icon } from "@hugeicons/core-free-icons";
import { AgentAvatar } from "../../../../components/AgentAvatar";
import { INTEGRATIONS, SERVICE_IDS } from "../../../core/data";
import { Icon } from "../../../ui/Icon";
import type { ConsolePanelProps } from "../ConsoleOnboarding";

export function DonePanel({ flow }: ConsolePanelProps) {
  const tools = INTEGRATIONS.filter((i) => flow.state.integrations[i.id] === "connected");
  const brief = flow.state.brain.trim();

  const rows = [
    { title: "Engine", value: `${SERVICE_IDS.length} services healthy`, done: true },
    { title: "Tools", value: tools.length ? tools.map((t) => t.name).join(", ") : "None yet – connect them in Settings", done: tools.length > 0 },
    { title: "Your brief", value: brief ? brief : "Not yet – tell Auto anytime", done: Boolean(brief) },
  ];

  return (
    <div className="con-card con-done">
      <div className="con-done__hero">
        <AgentAvatar character="auto" size={88} hat="party" interactive decorative />
      </div>
      <dl className="con-done__list">
        {rows.map((row) => (
          <div key={row.title} className="con-done__row" data-done={row.done || undefined}>
            <span className="con-done__mark" aria-hidden="true">
              {row.done && <Icon icon={Tick02Icon} size={12} strokeWidth={2.5} />}
            </span>
            <dt className="ui">{row.title}</dt>
            <dd className="ui text-muted con-done__value">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
