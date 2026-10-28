import { CloudDownloadIcon, PlayIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { AgentAvatar } from "../../../../components/AgentAvatar";
import { TOTAL_BYTES } from "../../../core/data";
import { formatMB } from "../../../core/hooks";
import { ExpertStack } from "../../../ui/ExpertStack";
import { Icon } from "../../../ui/Icon";
import type { ZenStepProps } from "../ZenOnboarding";
import { Reveal, ZenHeader } from "../parts";

const PLAN = [
  { icon: CloudDownloadIcon, title: "Download the engine", meta: `${formatMB(TOTAL_BYTES)}, once` },
  { icon: PlayIcon, title: "Start it on this computer", meta: "About a minute" },
  { icon: SparklesIcon, title: "Tell Otto what to take off your plate", meta: "A few sentences" },
];

export function ZenWelcome({ flow }: ZenStepProps) {
  return (
    <>
      <ZenHeader
        step="welcome"
        moved={flow.state.moved}
        visual={
          <span className="ob-cast zen-team">
            <AgentAvatar character="otto" size={40} decorative />
            <ExpertStack ids={["nadia", "casey", "frankie"]} size={28} label="Otto and three expert agents" />
          </span>
        }
      />
      <Reveal>
        <ol className="ob-panel ob-rows zen-plan" aria-label="What setup does">
          {PLAN.map((item, i) => (
            <li key={item.title} className="ob-row">
              <span className="zen-plan__n ob-num" aria-hidden="true">
                {i + 1}
              </span>
              <Icon icon={item.icon} size={16} className="zen-plan__icon" />
              <span className="ob-label">{item.title}</span>
              <span className="ob-meta ob-num ob-row__end">{item.meta}</span>
            </li>
          ))}
        </ol>
      </Reveal>
    </>
  );
}
