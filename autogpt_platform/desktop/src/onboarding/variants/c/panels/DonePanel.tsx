import { LibraryIcon, Link01Icon, PlayIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useMemo } from "react";
import { AgentAvatar } from "../../../../components/AgentAvatar";
import { INTEGRATIONS, SERVICE_IDS } from "../../../core/data";
import { understand } from "../../../core/understand";
import { Icon } from "../../../ui/Icon";
import type { ConsolePanelProps } from "../ConsoleOnboarding";

const list = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);

export function DonePanel({ flow }: ConsolePanelProps) {
  const tools = INTEGRATIONS.filter((i) => flow.state.integrations[i.id] === "connected");
  const brief = flow.state.brain.trim();
  const { tasks, tools: mentioned } = useMemo(() => understand(brief), [brief]);
  const missing = mentioned.filter((t) => flow.state.integrations[t.id] !== "connected");
  const first = tasks[0];

  const rows = [
    { title: "Engine", value: `${SERVICE_IDS.length} services healthy on this computer`, done: true },
    { title: "Tools", value: tools.length ? `${list(tools.map((t) => t.name))} connected` : "None yet – connect them in Settings", done: tools.length > 0 },
    { title: "Your brief", value: brief ? `${tasks.length === 1 ? "1 agent" : `${tasks.length} agents`} to draft from what you wrote` : "Not yet – tell Auto anytime", done: Boolean(brief) },
  ];

  const next = [
    first
      ? { icon: first.icon, title: "Review your first agent", detail: `${first.title}${first.when ? ` · ${first.when}` : ""}`, where: "Library" }
      : { icon: LibraryIcon, title: "Pick a starter agent", detail: "Templates for research, triage and reports", where: "Library" },
    missing.length
      ? { icon: Link01Icon, title: `Connect ${list(missing.map((t) => t.name))}`, detail: "You mentioned them – agents need access to act", where: "Settings" }
      : { icon: Link01Icon, title: "Connect more tools", detail: "Agents can only act in apps you connect", where: "Settings" },
    { icon: PlayIcon, title: "Run it once by hand", detail: "Watch a run before it goes on schedule", where: "Agent page" },
  ];

  return (
    <div className="con-stack con-done-wrap">
      <div className="con-card con-done">
        <AgentAvatar character="auto" size={104} hat="party" interactive decorative />
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
      <section className="con-next" aria-labelledby="con-next-title">
        <h2 id="con-next-title" className="eyebrow text-subtle">
          Next up
        </h2>
        <ol className="con-next__grid">
          {next.map((item) => (
            <li key={item.title} className="con-next__item">
              <span className="con-icon con-icon--accent">
                <Icon icon={item.icon} size={18} />
              </span>
              <span className="heading">{item.title}</span>
              <span className="small text-muted con-next__detail">{item.detail}</span>
              <span className="small text-subtle con-next__where">In {item.where}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
