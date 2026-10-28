import { MotionConfig } from "framer-motion";
import { useState, type ComponentType } from "react";
import { readParams, writeParams, type VariantId, type ViewParams } from "./core/params";
import { useOnboarding, type Onboarding as OnboardingFlow } from "./core/useOnboarding";
import { DevSwitcher } from "./DevSwitcher";
import { ZenOnboarding } from "./variants/a/ZenOnboarding";
import { StoryOnboarding } from "./variants/b/StoryOnboarding";
import { ConsoleOnboarding } from "./variants/c/ConsoleOnboarding";
import "./onboarding.css";

export type VariantProps = { flow: OnboardingFlow };

const VARIANT_VIEWS: Record<VariantId, ComponentType<VariantProps>> = {
  a: ZenOnboarding,
  b: StoryOnboarding,
  c: ConsoleOnboarding,
};

export function Onboarding({ onFinish }: { onFinish?: () => void }) {
  const [view, setView] = useState<ViewParams>(readParams);
  // Each dev switch starts the machine fresh at the chosen step
  const [run, setRun] = useState(0);

  const change = (patch: Partial<ViewParams>) => {
    const nextView = { ...view, step: readParams().step, ...patch };
    writeParams(nextView);
    setView(nextView);
    setRun((n) => n + 1);
  };

  return (
    <MotionConfig reducedMotion="user">
      <FlowView key={`${view.variant}-${run}`} view={view} onFinish={onFinish} />
      {view.devtools && <DevSwitcher view={view} onChange={change} />}
    </MotionConfig>
  );
}

function FlowView({ view, onFinish }: { view: ViewParams; onFinish?: () => void }) {
  const flow = useOnboarding({ step: view.step, freeze: view.freeze, onFinish });
  const View = VARIANT_VIEWS[view.variant];
  return <View flow={flow} />;
}
