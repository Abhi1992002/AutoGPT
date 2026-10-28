import {
  Calendar03Icon,
  Clock01Icon,
  GithubIcon,
  Invoice01Icon,
  Mail01Icon,
  News01Icon,
  Note01Icon,
  Search01Icon,
  TaskDone01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { INTEGRATIONS, type Integration } from "./data";

/*
 * Mock understanding of the brain dump: keyword rules that turn free text into who you are,
 * the tools you mentioned and the agents worth drafting. The real version asks the model.
 */

export type Task = { id: string; title: string; icon: IconSvgElement; when?: string };
export type Understanding = { about: string[]; tools: Integration[]; tasks: Task[] };

const ABOUT: { label: (m: RegExpMatchArray) => string; match: RegExp }[] = [
  { match: /\b(\d+)[- ]person\b|\bteam of (\d+)/i, label: (m) => `Team of ${m[1] ?? m[2]}` },
  { match: /\bdesign studio\b/i, label: () => "Design studio" },
  { match: /\b(founder|startup)\b/i, label: () => "Runs a startup" },
  { match: /\bproduct manager\b|\bPM\b/, label: () => "Product manager" },
  { match: /\b(engineer|developer)\b/i, label: () => "Engineer" },
  { match: /\bresearcher\b|\bphd\b/i, label: () => "Researcher" },
  { match: /\b(agency|freelanc\w*)\b/i, label: () => "Client work" },
  { match: /\binbox\b.*\b(out of control|overflowing|too much)|too much email/i, label: () => "Busy inbox" },
];

const TOOL_ALIASES: Record<string, RegExp> = {
  github: /\b(github|pull requests?|repos?)\b/i,
  google: /\b(google|gmail|calendar|drive|docs)\b/i,
  notion: /\bnotion\b/i,
  slack: /\bslack\b/i,
  linear: /\blinear\b/i,
  discord: /\bdiscord\b/i,
  x: /\b(twitter|x\.com|tweets?)\b/i,
  reddit: /\b(reddit|subreddits?)\b/i,
  telegram: /\btelegram\b/i,
};

const TASKS: (Omit<Task, "when"> & { match: RegExp })[] = [
  { id: "inbox", title: "Sort the inbox and draft replies", icon: Mail01Icon, match: /\b(inbox|e-?mails?)\b/i },
  { id: "update", title: "Write the team update", icon: Note01Icon, match: /\b(team update|weekly update|status report|standup)\b/i },
  { id: "github", title: "Digest GitHub notifications", icon: GithubIcon, match: /\bgithub (notifications|digest)\b/i },
  { id: "issues", title: "Triage bug reports into issues", icon: TaskDone01Icon, match: /\b(bug reports?|file issues|triage)\b/i },
  { id: "competitors", title: "Watch competitors", icon: News01Icon, match: /\bcompetitors?\b/i },
  { id: "papers", title: "Track new papers", icon: Search01Icon, match: /\bpapers?\b/i },
  { id: "invoices", title: "Chase unpaid invoices", icon: Invoice01Icon, match: /\b(invoices?|billing)\b/i },
  { id: "meetings", title: "Prepare meeting notes", icon: Calendar03Icon, match: /\b(meetings?|calls?)\b/i },
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** A schedule phrase in one sentence, e.g. "every Friday" → "Fridays" */
function scheduleIn(sentence: string): string | undefined {
  const at = /\bat (\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i.exec(sentence);
  const time = at ? ` at ${at[1]}${at[2] ? `:${at[2]}` : ""}${at[3] ? ` ${at[3].toLowerCase()}` : ""}` : "";
  const day = DAYS.find((d) => new RegExp(`\\b(every ${d}|on ${d}s|${d}s)\\b`, "i").test(sentence));
  if (day) return `${day[0].toUpperCase()}${day.slice(1)}s${time}`;
  if (/\bevery weekday\b|\bweekdays\b/i.test(sentence)) return `Weekdays${time}`;
  if (/\bevery (morning|day)\b|\bdaily\b/i.test(sentence)) return `Every morning${time}`;
  if (/\bweekly\b|\bevery week\b/i.test(sentence)) return `Weekly${time}`;
  return time ? `Daily${time}` : undefined;
}

export function understand(text: string): Understanding {
  const about = ABOUT.flatMap(({ match, label }) => {
    const m = text.match(match);
    return m ? [label(m)] : [];
  });
  const tools = INTEGRATIONS.filter((i) => TOOL_ALIASES[i.id]?.test(text));
  const sentences = text.split(/(?<=[.!?])\s+|\n+/);
  const tasks: Task[] = [];
  for (const { match, ...task } of TASKS) {
    const sentence = sentences.find((s) => match.test(s));
    if (sentence) tasks.push({ ...task, when: scheduleIn(sentence) });
  }
  return { about, tools, tasks };
}

export const ScheduleIcon = Clock01Icon;
