import { CpuIcon, DatabaseIcon, HardDriveIcon, Shield01Icon, Wifi01Icon, ComputerIcon } from "@hugeicons/core-free-icons";
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
  { icon: Shield01Icon, title: "Stays on this computer", detail: "Nothing leaves without a tool you connect", size: "Local" },
];

const NEEDS = [
  { icon: ComputerIcon, title: "Docker Desktop", detail: "Installed and running" },
  { icon: HardDriveIcon, title: "About 3 GB free", detail: "For images and your data" },
  { icon: Wifi01Icon, title: "Internet once", detail: `For the ${formatMB(TOTAL_BYTES)} download` },
];

export function WelcomePanel(_: ConsolePanelProps) {
  return (
    <div className="con-card con-welcome">
      <div className="con-welcome__top">
        <div className="con-welcome__guide">
          <AgentAvatar character="auto" size={112} interactive decorative />
          <p className="body con-bubble">Hi, I’m Auto. I’ll install the engine, start it and learn a little about you – about three minutes in all.</p>
        </div>
        <div className="con-welcome__list">
          <h2 className="eyebrow text-subtle">What gets installed</h2>
          <ul>
            {ITEMS.map((item) => (
              <li key={item.title} className="con-welcome__item">
                <span className="con-icon con-icon--lg">
                  <Icon icon={item.icon} size={20} />
                </span>
                <span className="con-welcome__text">
                  <span className="heading">{item.title}</span>
                  <span className="body text-muted">{item.detail}</span>
                </span>
                <span className="ui text-subtle ob-num">{item.size}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="con-welcome__needs">
        <h2 className="eyebrow text-subtle">You’ll need</h2>
        <ul>
          {NEEDS.map((need) => (
            <li key={need.title}>
              <Icon icon={need.icon} size={18} />
              <span className="con-welcome__text">
                <span className="ui">{need.title}</span>
                <span className="small text-muted ob-num">{need.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
