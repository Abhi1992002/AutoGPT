import { ComputerIcon, CpuIcon, DatabaseIcon, HardDriveIcon, Shield01Icon, Wifi01Icon } from "@hugeicons/core-free-icons";
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
  { icon: Wifi01Icon, title: "Internet, once", detail: `For the ${formatMB(TOTAL_BYTES)} download` },
];

export function WelcomePanel(_: ConsolePanelProps) {
  return (
    <div className="con-stack">
      <div className="con-comment">
        <AgentAvatar character="otto" size={28} decorative />
        <div className="con-comment__body">
          <p className="con-comment__head">
            <span className="ob-label">Otto</span>
            <span className="ob-meta">Your guide</span>
          </p>
          <p className="ob-text">Hi, I’m Otto. I’ll install the engine, start it and learn a little about what you do. It takes about three minutes.</p>
        </div>
      </div>
      <section className="con-section" aria-labelledby="con-installs">
        <h2 id="con-installs" className="ob-micro">
          What gets installed
        </h2>
        <ul className="ob-panel ob-rows">
          {ITEMS.map((item) => (
            <li key={item.title} className="ob-row con-row">
              <span className="ob-tile">
                <Icon icon={item.icon} size={14} />
              </span>
              <span className="ob-label">{item.title}</span>
              <span className="ob-meta ob-truncate">{item.detail}</span>
              <span className="ob-meta ob-num ob-row__end">{item.size}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="con-section" aria-labelledby="con-needs">
        <h2 id="con-needs" className="ob-micro">
          You’ll need
        </h2>
        <ul className="con-needs">
          {NEEDS.map((need) => (
            <li key={need.title} className="ob-panel con-need">
              <Icon icon={need.icon} size={16} className="con-need__icon" />
              <span className="ob-label">{need.title}</span>
              <span className="ob-meta ob-num">{need.detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
