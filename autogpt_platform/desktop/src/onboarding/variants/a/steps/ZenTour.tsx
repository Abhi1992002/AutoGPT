import { useState } from "react";
import { SegmentedControl } from "../../../../design-system/components/segmented-control";
import { RunView } from "../../../blocks/RunView";
import { CAPABILITIES } from "../../../core/data";
import { Icon } from "../../../ui/Icon";
import type { ZenStepProps } from "../ZenOnboarding";
import { Reveal, ZenHeader } from "../parts";

export function ZenTour({ flow }: ZenStepProps) {
  const [active, setActive] = useState(CAPABILITIES[0].id);
  const capability = CAPABILITIES.find((c) => c.id === active)!;

  return (
    <>
      <ZenHeader step="tour" moved={flow.state.moved} />
      <Reveal className="zen-stack">
        <SegmentedControl
          aria-label="Capabilities"
          fullWidth
          value={active}
          onChange={setActive}
          options={CAPABILITIES.map((c) => ({ value: c.id, label: c.short, icon: <Icon icon={c.icon} size={14} /> }))}
        />
        <div className="ob-panel zen-run">
          <RunView capability={capability} freeze={flow.freeze} />
        </div>
      </Reveal>
    </>
  );
}
