import { CpuIcon, DatabaseIcon, Shield01Icon } from "@hugeicons/core-free-icons";
import { AgentAvatar } from "../../../../components/AgentAvatar";
import { IMAGES, TOTAL_BYTES } from "../../../core/data";
import { formatMB } from "../../../core/hooks";
import { Icon } from "../../../ui/Icon";
import type { ConsolePanelProps } from "../ConsoleOnboarding";

const runtime = IMAGES.find((i) => i.id === "backend")!;
const support = IMAGES.filter((i) => i.id !== "backend").reduce((sum, i) => sum + i.bytes, 0);

const ITEMS = [
  { icon: CpuIcon, title: "Agent runtime", detail: "Plans, runs and schedules your agents", size: formatMB(runtime.bytes) },
  { icon: DatabaseIcon, title: "Database, queue and cache", detail: "Postgres, RabbitMQ and Redis", size: formatMB(support) },
  { icon: Shield01Icon, title: "Stays on this computer", detail: "Runs in Docker; nothing leaves without a tool you connect", size: "" },
];

export function WelcomePanel(_: ConsolePanelProps) {
  return (
    <div className="con-card con-welcome">
      <div className="con-welcome__guide">
        <AgentAvatar character="auto" size={72} interactive decorative />
        <p className="body con-bubble">Hi, I’m Auto. I’ll install the engine, start it and learn a little about you.</p>
      </div>
      <div className="con-welcome__list">
        <p className="eyebrow text-subtle">What gets installed</p>
        <ul>
          {ITEMS.map((item) => (
            <li key={item.title} className="con-welcome__item">
              <span className="con-icon">
                <Icon icon={item.icon} size={18} />
              </span>
              <span className="con-welcome__text">
                <span className="ui">{item.title}</span>
                <span className="small text-muted">{item.detail}</span>
              </span>
              <span className="small text-subtle ob-num">{item.size}</span>
            </li>
          ))}
        </ul>
        <p className="small text-subtle ob-num">Total download {formatMB(TOTAL_BYTES)}</p>
      </div>
    </div>
  );
}
