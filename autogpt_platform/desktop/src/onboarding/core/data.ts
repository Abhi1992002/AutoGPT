import {
  Clock01Icon,
  DiscordIcon,
  GithubIcon,
  GoogleIcon,
  NewTwitterIcon,
  NotionIcon,
  RedditIcon,
  Search01Icon,
  SlackIcon,
  TaskDone01Icon,
  TelegramIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { CharacterId } from "../../assets/avatars";

/* ---------- Download: the container images the engine pulls ---------- */

export type ImageSpec = { id: string; label: string; detail: string; bytes: number };

const MB = 1e6;

export const IMAGES: ImageSpec[] = [
  { id: "backend", label: "Agent runtime", detail: "autogpt/platform-backend", bytes: 612 * MB },
  { id: "db", label: "Database", detail: "supabase/postgres", bytes: 148 * MB },
  { id: "rabbitmq", label: "Message queue", detail: "rabbitmq:management", bytes: 92 * MB },
  { id: "redis", label: "Cache", detail: "redis:7-alpine", bytes: 17 * MB },
];

export const TOTAL_BYTES = IMAGES.reduce((sum, image) => sum + image.bytes, 0);

/* ---------- Start: the services run.sh brings up, in start order ---------- */

export const SERVICE_IDS = ["db", "redis", "rabbitmq", "api", "executor"] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export const SERVICES: Record<ServiceId, { label: string; detail: string; port?: number }> = {
  db: { label: "Database", detail: "Postgres", port: 5432 },
  redis: { label: "Cache", detail: "Redis", port: 6379 },
  rabbitmq: { label: "Queue", detail: "RabbitMQ", port: 5672 },
  api: { label: "API", detail: "REST server", port: 8006 },
  executor: { label: "Executor", detail: "Runs agents" },
};

/* ---------- Tour: capabilities, each shown as a short mock agent run ---------- */

export type Capability = {
  id: string;
  /** One-word label for tabs */
  short: string;
  title: string;
  description: string;
  icon: IconSvgElement;
  character: CharacterId;
  prompt: string;
  run: string[];
  result: string;
};

export const CAPABILITIES: Capability[] = [
  {
    id: "research",
    short: "Research",
    title: "Research and summarize",
    description: "Reads sources, cross-checks them and writes the brief.",
    icon: Search01Icon,
    character: "nadia",
    prompt: "Find what changed in the EU AI Act this week",
    run: ["Searching 14 sources", "Reading 6 articles", "Cross-checking dates", "Writing the brief"],
    result: "Brief ready · 3 changes, 1 deadline",
  },
  {
    id: "act",
    short: "Act",
    title: "Act in your tools",
    description: "Files issues, drafts replies and opens pull requests.",
    icon: Wrench01Icon,
    character: "casey",
    prompt: "Turn yesterday’s bug reports into Linear issues",
    run: ["Reading #support in Slack", "Grouping 9 reports", "Checking for duplicates", "Filing issues"],
    result: "4 issues filed · 5 duplicates linked",
  },
  {
    id: "schedule",
    short: "Schedule",
    title: "Run on a schedule",
    description: "Works every morning, every Friday or on any trigger.",
    icon: Clock01Icon,
    character: "frankie",
    prompt: "Every weekday at 9, summarize my GitHub notifications",
    run: ["Waking at 9:00", "Fetching 23 notifications", "Ranking by urgency", "Posting to Slack"],
    result: "Next run tomorrow at 9:00",
  },
];

/* ---------- Connect: integrations ---------- */

export type Integration = { id: string; name: string; description: string; icon: IconSvgElement };

export const INTEGRATIONS: Integration[] = [
  { id: "github", name: "GitHub", description: "Issues, pull requests, repos", icon: GithubIcon },
  { id: "google", name: "Google", description: "Gmail, Calendar, Drive", icon: GoogleIcon },
  { id: "notion", name: "Notion", description: "Pages and databases", icon: NotionIcon },
  { id: "slack", name: "Slack", description: "Channels and messages", icon: SlackIcon },
  { id: "linear", name: "Linear", description: "Issues and projects", icon: TaskDone01Icon },
  { id: "discord", name: "Discord", description: "Servers and messages", icon: DiscordIcon },
  { id: "x", name: "X", description: "Posts and mentions", icon: NewTwitterIcon },
  { id: "reddit", name: "Reddit", description: "Subreddits and threads", icon: RedditIcon },
  { id: "telegram", name: "Telegram", description: "Chats and bots", icon: TelegramIcon },
];

/* ---------- Brain dump: suggestion chips ---------- */

export const SUGGESTIONS: { label: string; text: string }[] = [
  { label: "Founder, too much email", text: "I run a small startup and my inbox is out of control. Sort it every morning and draft replies I can approve." },
  { label: "Daily GitHub digest", text: "Summarize my GitHub notifications every weekday at 9 and post the urgent ones to Slack." },
  { label: "Weekly team update", text: "Every Friday, write our team update from what moved in Linear this week." },
  { label: "Watch competitors", text: "Watch three competitors’ blogs and changelogs, and send me a short digest on Mondays." },
  { label: "Research papers", text: "I’m a researcher. Track new papers in my field and summarize the ones worth reading." },
];

/** What a frozen preview of the brain dump shows as typed */
export const SAMPLE_BRIEF =
  "I run a 6-person design studio. Every Friday I write the team update from Linear. My inbox is out of control, so sort it every morning and draft replies in Gmail.";
