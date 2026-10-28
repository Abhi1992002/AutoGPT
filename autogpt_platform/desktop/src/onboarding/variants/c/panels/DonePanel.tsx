import { LibraryIcon, Link01Icon, PlayIcon } from "@hugeicons/core-free-icons";
import { useMemo } from "react";
import { INTEGRATIONS, SERVICE_IDS } from "../../../core/data";
import { understand } from "../../../core/understand";
import { ExpertStack } from "../../../ui/ExpertStack";
import { Icon } from "../../../ui/Icon";
import { StatusMark } from "../../../ui/StatusMark";
import type { ConsolePanelProps } from "../ConsoleOnboarding";

const list = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);

export function DonePanel({ flow }: ConsolePanelProps) {
  const tools = INTEGRATIONS.filter((i) => flow.state.integrations[i.id] === "connected");
  const brief = flow.state.brain.trim();
  const { tasks, tools: mentioned } = useMemo(() => understand(brief), [brief]);
  const missing = mentioned.filter((t) => flow.state.integrations[t.id] !== "connected");
  const first = tasks[0];

  const next = [
    first
      ? { icon: first.icon, title: "Review your first agent", detail: `${first.title}${first.when ? ` · ${first.when}` : ""}`, where: "Library" }
      : { icon: LibraryIcon, title: "Pick a starter agent", detail: "Templates for research, triage and reports", where: "Library" },
    missing.length
      ? { icon: Link01Icon, title: `Connect ${list(missing.map((t) => t.name))}`, detail: "You mentioned them. Agents need access to act there.", where: "Settings" }
      : { icon: Link01Icon, title: "Connect more tools", detail: "Agents can only act in apps you connect", where: "Settings" },
    { icon: PlayIcon, title: "Run it once by hand", detail: "Watch a run before it goes on a schedule", where: "Agent page" },
  ];

  return (
    <div className="con-stack con-done">
      <dl className="ob-panel ob-rows con-props">
        <div className="ob-row">
          <dt className="ob-meta">Engine</dt>
          <dd className="con-props__value">
            <StatusMark mark="done" />
            <span className="ob-label">{SERVICE_IDS.length} services healthy</span>
            <span className="ob-meta">on this computer</span>
          </dd>
        </div>
        <div className="ob-row">
          <dt className="ob-meta">Tools</dt>
          <dd className="con-props__value">
            <StatusMark mark={tools.length ? "done" : "pending"} />
            {tools.length ? (
              tools.map((t) => (
                <span key={t.id} className="ob-tag">
                  <Icon icon={t.icon} size={12} />
                  {t.name}
                </span>
              ))
            ) : (
              <span className="ob-meta">None yet. Connect them in Settings.</span>
            )}
          </dd>
        </div>
        <div className="ob-row">
          <dt className="ob-meta">Agents</dt>
          <dd className="con-props__value">
            <StatusMark mark={tasks.length ? "active" : "pending"} />
            {tasks.length ? (
              <>
                <ExpertStack ids={tasks.map((t) => t.character)} size={20} />
                <span className="ob-label">{tasks.length === 1 ? "1 agent" : `${tasks.length} agents`} drafting</span>
                <span className="ob-meta ob-truncate">{list(tasks.map((t) => t.title.toLowerCase()))}</span>
              </>
            ) : (
              <span className="ob-meta">Tell Otto what to hand off, anytime</span>
            )}
          </dd>
        </div>
      </dl>
      <section className="con-section" aria-labelledby="con-next-title">
        <h2 id="con-next-title" className="ob-micro">
          Next up
        </h2>
        <ol className="con-next">
          {next.map((item) => (
            <li key={item.title} className="ob-panel con-next__item">
              <span className="ob-tile">
                <Icon icon={item.icon} size={14} />
              </span>
              <span className="ob-label">{item.title}</span>
              <span className="ob-meta con-next__detail">{item.detail}</span>
              <span className="ob-meta con-next__where">In {item.where}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
