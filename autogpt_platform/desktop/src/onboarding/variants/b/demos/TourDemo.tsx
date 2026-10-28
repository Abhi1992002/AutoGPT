import { AiMagicIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { SegmentedControl } from "../../../../design-system/components/segmented-control";
import { RunView } from "../../../blocks/RunView";
import { CAPABILITIES } from "../../../core/data";
import { Icon } from "../../../ui/Icon";
import type { StoryDemoProps } from "../StoryOnboarding";
import { Window } from "../Window";

/** Show, don't tell: each capability plays as a short agent run */
export function TourDemo({ flow }: StoryDemoProps) {
  const [active, setActive] = useState(CAPABILITIES[0].id);
  const capability = CAPABILITIES.find((c) => c.id === active)!;

  return (
    <Window icon={AiMagicIcon} title="Agent run" meta={capability.title}>
      <div className="story-tour">
        <SegmentedControl
          aria-label="Capabilities"
          fullWidth
          value={active}
          onChange={setActive}
          options={CAPABILITIES.map((c) => ({ value: c.id, label: c.short, icon: <Icon icon={c.icon} size={14} /> }))}
        />
        <RunView capability={capability} freeze={flow.freeze} stepMs={750} />
      </div>
    </Window>
  );
}
