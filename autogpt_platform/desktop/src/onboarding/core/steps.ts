/*
 * The seven onboarding steps and the copy every variant shares.
 * Variants may frame a step differently, but they read titles and descriptions from here.
 */

export const STEP_IDS = ["welcome", "download", "start", "tour", "connect", "brain", "done"] as const;
export type StepId = (typeof STEP_IDS)[number];

export type StepCopy = {
  /** Short name for steppers and progress */
  label: string;
  title: string;
  description: string;
  /** Primary button label */
  action: string;
};

export const STEPS: Record<StepId, StepCopy> = {
  welcome: {
    label: "Welcome",
    title: "Agents that work while you don’t",
    description: "AutoGPT runs on this computer. Set it up once, and your agents take care of research, triage and reports on their own schedule.",
    action: "Get started",
  },
  download: {
    label: "Download",
    title: "Download the AutoGPT engine",
    description: "Agents run in containers on this computer, so your data stays here. This is a one-time download.",
    action: "Continue",
  },
  start: {
    label: "Start",
    title: "Start the engine",
    description: "Bringing up the database, the queue and the agent runtime. The first start takes about a minute.",
    action: "Continue",
  },
  tour: {
    label: "Capabilities",
    title: "What your agents can do",
    description: "Describe a task in plain words. An agent plans it, uses your tools and reports back.",
    action: "Continue",
  },
  connect: {
    label: "Tools",
    title: "Connect your tools",
    description: "Agents act in the apps you already use. You can add or remove tools later in Settings.",
    action: "Continue",
  },
  brain: {
    label: "About you",
    title: "Tell your agent about you",
    description: "What do you do, and what would you hand off first? A few sentences is plenty.",
    action: "Continue",
  },
  done: {
    label: "Done",
    title: "You’re all set",
    description: "Auto is drafting your first agent from what you told it. You’ll find it in your library.",
    action: "Open AutoGPT",
  },
};

export const stepIndex = (id: StepId) => STEP_IDS.indexOf(id);
export const stepAt = (index: number): StepId => STEP_IDS[Math.min(Math.max(index, 0), STEP_IDS.length - 1)];
