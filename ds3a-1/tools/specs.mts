// DS3a-1 call-site captures: one spec per changed call site and state set (evidence only).
import type { Locator, Page } from "@playwright/test";
import { readFileSync } from "node:fs";

export type H = {
  page: Page;
  viewport: "desktop" | "mobile";
  loc(sel: string): Locator;
  visible(sel: string | Locator, what: string): Promise<void>;
  hidden(sel: string | Locator, what: string): Promise<void>;
  expect(step: string, fn: () => Promise<boolean | { ok: boolean; detail: string }>): Promise<void>;
  tabTo(target: string | Locator, what: string, max?: number): Promise<number>;
  press(key: string, step: string, expectFn?: () => Promise<boolean | { ok: boolean; detail: string }>): Promise<void>;
  focused(): Promise<string>;
  observe(name: string, value: string): void;
  shot(state: string): Promise<void>;
  settle(): Promise<void>;
};
export type Spec = {
  id: string;
  pr: number;
  callSite: string;
  target: { app: string } | { story: string; sb: "main" | "ev" };
  signedIn?: boolean;
  viewports?: ("desktop" | "mobile")[];
  allowToast?: RegExp;
  // reduced motion for this capture (the page's own endless animation honours it); default no-preference
  motion?: "reduce";
  run(h: H): Promise<void>;
};

const isFocused = (l: Locator) => l.evaluate((el) => el === document.activeElement || el.contains(document.activeElement));
const attr = (l: Locator, name: string) => l.getAttribute(name).then((v) => v ?? "");
const said = (ok: boolean, detail: string) => ({ ok, detail });
// scroll a page element to the bottom edge of its scroll container, after the page has settled (same position every run)
const bringIntoView = async (h: H, l: Locator) => { await h.settle(); await l.evaluate((el) => el.scrollIntoView({ block: "end", inline: "nearest" })); await h.settle(); };

// ---------- PR 1: collapsible, carousel, pagination-controls ----------
function collapsible(story: string, startsOpen: boolean): Spec {
  return {
    id: `pr1-collapsible-${story}`, pr: 1,
    callSite: "molecules/Collapsible/Collapsible.tsx (Radix Root/Trigger/Content, was __legacy__/ui/collapsible)",
    target: { story: `molecules-collapsible--${story}`, sb: "main" },
    async run(h) {
      const trigger = h.loc("[data-slot=collapsible-trigger]");
      const open = startsOpen ? "true" : "false";
      await h.visible(trigger, "the collapsible trigger");
      await h.expect(`starts aria-expanded=${open}`, async () => said((await attr(trigger, "aria-expanded")) === open, await attr(trigger, "aria-expanded")));
      await h.shot("rest");
      await trigger.hover(); await h.settle(); await h.shot("hover");
      await h.page.mouse.move(0, 0);
      await h.tabTo(trigger, "the trigger");
      await h.shot("focus-visible");
      await h.press("Enter", "toggles the panel", async () => said((await attr(trigger, "aria-expanded")) === (startsOpen ? "false" : "true"), await attr(trigger, "aria-expanded")));
      await h.expect("focus stays on the trigger", () => isFocused(trigger));
      await h.shot("keyboard-toggled");
      await h.press("Space", "toggles it back", async () => said((await attr(trigger, "aria-expanded")) === open, await attr(trigger, "aria-expanded")));
      await trigger.click(); await h.settle();
      if (startsOpen) {
        await h.expect("a click closes it", async () => (await attr(trigger, "aria-expanded")) === "false");
        await h.shot("clicked-closed");
      } else {
        await h.visible("[data-slot=collapsible-panel]", "the open panel");
        await h.shot("clicked-open");
      }
    },
  };
}

function carousel(route: string, name: string, viewports?: ("desktop" | "mobile")[]): Spec {
  return {
    id: `pr1-carousel-${name}`, pr: 1, signedIn: true, viewports,
    callSite: "marketplace/components/AgentsSection/AgentsSection.tsx (molecules/Carousel, was __legacy__/ui/carousel)",
    target: { app: route },
    async run(h) {
      const region = h.loc("[aria-roledescription=carousel]");
      if (h.viewport === "desktop") {
        await h.expect("the carousel is md:hidden at 1440 (the desktop grid shows these cards)", async () => said((await region.count()) > 0 && !(await region.isVisible()), "present, display:none"));
        await h.shot("desktop-hidden");
        return;
      }
      const slideX = () => region.locator("[aria-roledescription=slide]").first().evaluate((el) => Math.round(el.getBoundingClientRect().x));
      await region.scrollIntoViewIfNeeded();
      await h.visible(region, "the workflow carousel");
      await h.visible(region.locator("[aria-roledescription=slide]").first(), "its first slide");
      await h.shot("rest");
      const first = region.locator("[aria-roledescription=slide] a, [aria-roledescription=slide] button, [aria-roledescription=slide] [tabindex='0']").first();
      // hover first: once the slides have moved, hovering would scroll the overflow-hidden track
      await first.hover(); await h.settle(); await h.shot("hover");
      await h.page.mouse.move(0, 0);
      await h.tabTo(first, "the first card inside the carousel");
      await h.shot("focus-visible");
      const before = await slideX();
      await h.press("ArrowRight", "moves the slides one card to the left", async () => {
        await h.page.waitForTimeout(1200);
        const after = await slideX();
        return said(after < before, `first slide x ${before} -> ${after}`);
      });
      await h.shot("arrow-right");
      await h.press("ArrowLeft", "moves them back", async () => {
        await h.page.waitForTimeout(1200);
        const back = await slideX();
        return said(back === before, `first slide x ${back}`);
      });
    },
  };
}

function pagination(route: string, name: string, callSite: string): Spec {
  return {
    id: `pr1-pagination-${name}`, pr: 1, signedIn: true,
    callSite,
    target: { app: route },
    async run(h) {
      const label = h.page.getByText(/^Page \d+ of \d+$/).first();
      const next = h.page.getByRole("button", { name: "Next", exact: true }).last();
      const prev = h.page.getByRole("button", { name: "Previous", exact: true }).last();
      await label.waitFor({ timeout: 90_000 });
      await bringIntoView(h, label);
      await h.visible(label, "the page label");
      const total = Number(((await label.innerText()).match(/of (\d+)/) ?? [])[1]);
      await h.expect("first page: Previous disabled, Next enabled", async () => said((await prev.isDisabled()) && (await next.isEnabled()), await label.innerText()));
      await h.shot("first-page");
      await next.hover(); await h.settle(); await h.shot("next-hover");
      await h.page.mouse.move(0, 0);
      await h.tabTo(next, "Next");
      await h.shot("next-focus-visible");
      await h.press("Enter", "goes to page 2", async () => {
        await h.page.getByText(`Page 2 of ${total}`, { exact: true }).first().waitFor({ timeout: 90_000 }); await h.settle();
        return said(/[?&]page=2/.test(h.page.url()) && (await label.innerText()) === `Page 2 of ${total}`, `${await label.innerText()} at ${new URL(h.page.url()).search}`);
      });
      await h.expect("both buttons enabled on a middle page", async () => (await prev.isEnabled()) && (await next.isEnabled()));
      await bringIntoView(h, label); await h.shot("page-2");
      // Back by keyboard: Shift+Tab from Next lands on Previous (the label between them is not focusable), and
      // Enter must ask the router for page 1. Whether Next's router then renders it is the page's (on base too it
      // sometimes keeps page 2 after a 200 response): see the PR's pre-existing findings.
      await next.focus();
      await h.press("Shift+Tab", "moves focus from Next to Previous", () => isFocused(prev));
      const asked = h.page.waitForRequest((r) => /[?&]page=1(&|$)/.test(r.url()) && !!r.headers()["rsc"], { timeout: 15_000 }).then((r) => r.url().replace(/^https?:\/\/[^/]+/, "").slice(0, 60), () => "");
      await h.page.keyboard.press("Enter");
      await h.expect("Enter on Previous requests page 1", async () => { const u = await asked; return said(!!u, u || "no request for ?page=1"); });
      await h.settle();
      await h.page.goto(`${new URL(h.page.url()).origin}${route}${route.includes("?") ? "&" : "?"}page=${total}`, { waitUntil: "load" }); await h.settle();
      await bringIntoView(h, label);
      await h.expect("last page: Next disabled, Previous enabled", async () => said((await next.isDisabled()) && (await prev.isEnabled()), await label.innerText()));
      await h.shot("last-page");
    },
  };
}


// ---------- PR 2: calendar (atoms/Calendar), loading (circle LoadingSpinner), scroll-area ----------
function datePicker(story: string, name: string, slot: string, callSite: string): Spec {
  return {
    id: `pr2-${name}`, pr: 2, callSite,
    target: { story, sb: "main" },
    async run(h) {
      const trigger = h.loc(`[data-slot=${slot}-trigger]`);
      const popup = h.page.locator("[role=dialog]").first();
      await h.visible(trigger, "the picker trigger");
      await h.shot("rest");
      await trigger.hover(); await h.settle(); await h.shot("hover");
      await h.page.mouse.move(0, 0);
      await h.tabTo(trigger, "the picker trigger");
      await h.shot("focus-visible");
      await h.press("Enter", "opens the calendar", async () => said(await popup.isVisible() && await h.page.locator("[role=grid]").first().isVisible(), await h.focused()));
      await h.visible(h.page.locator("[role=grid]").first(), "the Calendar month grid");
      await h.shot("open");
      await h.press("Tab", "to the year dropdown");
      await h.press("Tab", "to today's day button", async () => said(/Today, Thursday, January 15th, 2026/.test(await h.focused()), await h.focused()));
      await h.shot("day-focused");
      await h.press("ArrowRight", "moves to the next day", async () => said(/January 16th, 2026/.test(await h.focused()), await h.focused()));
      await h.shot("day-arrow-right");
      await h.press("Escape", "closes the calendar", async () => said(!(await popup.isVisible()), `popup visible=${await popup.isVisible()}`));
      await h.expect("focus returns to the trigger", () => isFocused(trigger));
      await h.press("Enter", "reopens it", async () => popup.isVisible());
      await h.press("Tab", "to the year dropdown");
      await h.press("Tab", "to today's day button");
      await h.press("ArrowRight", "to the 16th");
      await h.press("Enter", "picks the 16th", async () => said(/16/.test(await trigger.innerText()), await trigger.innerText()));
      await h.shot("picked");
      await trigger.click(); await h.settle();
      await h.visible(h.page.locator("[role=grid] [aria-selected=true]").first(), "the selected day");
      await h.shot("open-with-selection");
      // the month dropdown inside the calendar (the Calendar's Select parts)
      await h.page.locator("[role=dialog] [role=combobox]").first().click(); await h.settle();
      await h.visible(h.page.locator("[role=listbox]").first(), "the month list");
      await h.shot("month-dropdown");
    },
  };
}

function dateState(story: string, name: string, callSite: string, focusable: boolean): Spec {
  return {
    id: `pr2-${name}`, pr: 2, callSite,
    target: { story: `evidence-datefields--${story}`, sb: "ev" },
    async run(h) {
      const trigger = h.loc("[data-slot$=-trigger]");
      await h.visible(trigger, "the picker trigger");
      await h.shot("rest");
      // a disabled or read-only trigger is pointer-events-none: the pointer is moved over it all the same
      await trigger.hover({ force: !focusable }); await h.settle(); await h.shot("hover");
      await h.page.mouse.move(0, 0);
      if (focusable) {
        await h.tabTo(trigger, "the picker trigger"); await h.shot("focus-visible");
      } else {
        await h.expect("the trigger is disabled", async () => said(await trigger.isDisabled(), await trigger.getAttribute("disabled") ?? "enabled"));
        await trigger.click({ force: true }); await h.settle();
        await h.expect("a click does not open the calendar", async () => (await h.page.locator("[role=dialog]").count()) === 0);
        await h.shot("after-click");
      }
    },
  };
}

const MCP = "build/components/MCPToolDialog.tsx (circle LoadingSpinner and molecules/ScrollArea, Label from part 6)";
function mcp(state: "url-step" | "connecting" | "tools" | "error-state" | "manual-credential"): Spec {
  return {
    id: `pr2-mcp-${state}`, pr: 2, callSite: MCP,
    target: { story: `evidence-mcptooldialog--${state === "url-step" ? "url-step" : state}`, sb: "ev" },
    async run(h) {
      const dialog = h.page.locator("[role=dialog]").first();
      await h.visible(dialog, "the MCP dialog");
      if (state === "url-step") {
        const url = h.page.getByLabel("Server URL");
        await h.visible(url, "the Server URL field and its label");
        await h.shot("rest");
        await h.expect("the URL field has focus (autoFocus)", () => isFocused(url));
        await url.pressSequentially("https://mcp.example.com/mcp"); await h.settle();
        await h.shot("typed");
        const discover = h.page.getByRole("button", { name: "Discover Tools" });
        await discover.hover(); await h.settle(); await h.shot("discover-hover");
        await h.press("Escape", "closes the dialog", async () => said(!(await dialog.isVisible()), `visible=${await dialog.isVisible()}`));
        return;
      }
      // the story's play has typed the URL and pressed Discover
      if (state === "connecting") await h.visible(h.page.getByRole("button", { name: /Connecting/ }).locator("svg"), "the circle spinner in Connecting...");
      if (state === "error-state") await h.visible(h.page.getByRole("alert"), "the connection error");
      if (state === "manual-credential") await h.visible(h.page.getByLabel(/token|key|credential/i).first(), "the credential field and its label");
      if (state === "tools") {
        const viewport = h.page.locator("[role=dialog] [data-radix-scroll-area-viewport]").first();
        await h.visible(viewport, "the ScrollArea of tools");
        await h.shot("top");
        await h.page.getByText("tool_02", { exact: true }).hover(); await h.settle(); await h.shot("tool-hover");
        await h.page.mouse.move(0, 0);
        await viewport.evaluate((el) => { el.scrollTop = el.scrollHeight; }); await h.settle();
        await h.expect("the ScrollArea scrolls to the last tool", async () => said((await viewport.evaluate((el) => el.scrollTop)) > 0 && await h.page.getByText("tool_14", { exact: true }).isVisible(), `scrollTop=${await viewport.evaluate((el) => el.scrollTop)}`));
        await h.visible(h.page.locator("[role=dialog] [data-orientation=vertical]").first(), "the vertical scrollbar thumb track");
        await h.shot("scrolled");
        return;
      }
      await h.shot("state");
    },
  };
}

function nodeBadge(state: "running" | "queued"): Spec {
  return {
    id: `pr2-node-badge-${state}`, pr: 2,
    callSite: "build/.../CustomNode/components/NodeExecutionBadge.tsx (circle LoadingSpinner)",
    target: { story: `evidence-noderun--badge-${state}`, sb: "ev" },
    async run(h) {
      await h.visible(h.page.getByText(state.toUpperCase(), { exact: true }), `the ${state.toUpperCase()} badge`);
      if (state === "running") await h.visible(h.page.getByText("RUNNING", { exact: true }).locator("xpath=..").locator("svg"), "the circle spinner in the badge");
      await h.shot("rest");
    },
  };
}

function nodeDialog(kind: "view-more" | "outputs-sheet"): Spec {
  const viewMore = kind === "view-more";
  return {
    id: `pr2-${kind}`, pr: 2,
    callSite: viewMore ? "build/.../NodeOutput/components/ViewMoreData.tsx (molecules/ScrollArea)"
      : "build/components/BuilderActions/components/AgentOutputs/AgentOutputs.tsx (molecules/ScrollArea, Label from part 6)",
    target: { story: `evidence-noderun--${viewMore ? "view-more-closed" : "outputs-sheet-closed"}`, sb: "ev" },
    async run(h) {
      const trigger = viewMore ? h.page.getByRole("button", { name: "View More" }) : h.loc('[data-id="agent-outputs-button"]');
      const dialog = h.page.locator("[role=dialog]").first();
      await h.visible(trigger, "the trigger");
      await h.shot("closed");
      await h.tabTo(trigger, "the trigger");
      await h.shot("trigger-focus-visible");
      await h.press("Enter", "opens it", async () => dialog.isVisible());
      const viewport = dialog.locator("[data-radix-scroll-area-viewport]").first();
      await h.visible(viewport, "the ScrollArea");
      await h.shot("open");
      // scroll whichever element actually scrolls: the ScrollArea's viewport, or the dialog around it
      const scrolled = await viewport.evaluate((el) => {
        let n: HTMLElement | null = el;
        while (n && !(n.scrollHeight > n.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(n).overflowY + getComputedStyle(n).overflow))) n = n.parentElement;
        if (!n) return "nothing overflows";
        n.scrollTop = n.scrollHeight;
        return `${n === el ? "ScrollArea viewport" : (n.getAttribute("role") || n.tagName.toLowerCase()) + " around it"} scrollTop=${Math.round(n.scrollTop)}`;
      });
      await h.settle();
      h.observe("scrolls", scrolled);
      await h.shot("scrolled");
      await h.press("Escape", "closes it", async () => said(!(await dialog.isVisible()), `visible=${await dialog.isVisible()}`));
      h.observe("focus after Escape", await h.focused());
    },
  };
}

const RESET = "reset-password/page.tsx (Suspense fallback: circle LoadingSpinner, was __legacy__/ui/loading)";
const resetSpecs: Spec[] = [
  { id: "pr2-reset-password-suspended", pr: 2, callSite: RESET, target: { story: "evidence-resetpasswordpage--suspended", sb: "ev" },
    async run(h) { await h.visible(h.page.locator("#storybook-root svg").first(), "the fallback spinner"); await h.expect("the page content has not rendered", async () => (await h.page.getByRole("textbox").count()) === 0); await h.shot("fallback"); } },
  { id: "pr2-reset-password-app", pr: 2, callSite: RESET, target: { app: "/reset-password" },
    async run(h) { await h.visible(h.page.getByRole("button", { name: /Send reset email/ }), "the page content"); await h.shot("rest"); } },
];

// ---------- PR 3: multiselect, command ----------
function multiselect(id: string, target: Spec["target"], callSite: string, startCount: number): Spec {
  return {
    id: `pr3-${id}`, pr: 3, callSite, target,
    async run(h) {
      const input = h.page.locator("[cmdk-input]").first();
      const chips = () => h.page.getByRole("button", { name: /^Remove .* option$/ }).count();
      await h.visible(input, "the multiselect input");
      await h.expect(`starts with ${startCount} chip(s)`, async () => said((await chips()) === startCount, String(await chips())));
      await h.shot("rest");
      if (startCount > 0) { await h.page.getByRole("button", { name: /^Remove .* option$/ }).first().hover(); await h.settle(); await h.shot("remove-hover"); await h.page.mouse.move(0, 0); }
      await h.tabTo(input, "the input");
      await h.visible(h.page.getByRole("listbox").first(), "the open option list");
      await h.shot("open");
      await h.press("ArrowDown", "highlights an option", async () => said((await h.page.locator("[cmdk-item][data-selected=true]").count()) === 1, await h.page.locator("[cmdk-item][data-selected=true]").first().innerText().catch(() => "none")));
      await h.shot("option-highlighted");
      const before = await chips();
      await h.press("Enter", "toggles the highlighted option", async () => said((await chips()) !== before, `${before} -> ${await chips()}`));
      await h.shot("after-enter");
      await input.pressSequentially("zzz"); await h.settle();
      await h.visible(h.page.getByText("No results found"), "the empty result");
      await h.shot("empty");
      for (let i = 0; i < 3; i++) await h.page.keyboard.press("Backspace");
      await h.settle();
      const n = await chips();
      if (n > 0) await h.press("Backspace", "removes the last chip", async () => said((await chips()) === n - 1, `${n} -> ${await chips()}`));
      await h.press("Escape", "closes the list", async () => said((await h.page.getByRole("listbox").count()) === 0 || !(await h.page.getByRole("listbox").first().isVisible()), "listbox hidden"));
      await h.shot("closed");
    },
  };
}

// ---------- PR 4: popover ----------
function builderPopover(which: "blockmenu" | "savecontrol", target: Spec["target"], viewports?: ("desktop" | "mobile")[]): Spec {
  const trig = which === "blockmenu" ? "blocks-control-popover-trigger" : "save-control-popover-trigger";
  const cont = which === "blockmenu" ? "blocks-control-popover-content" : "save-control-popover-content";
  return {
    id: `pr4-${which}-${"app" in target ? "app" : "story"}`, pr: 4, signedIn: "app" in target, viewports,
    callSite: which === "blockmenu" ? "build/.../NewBlockMenu/BlockMenu/BlockMenu.tsx (molecules/Popover)" : "build/.../NewSaveControl/NewSaveControl.tsx (molecules/Popover)",
    target,
    async run(h) {
      const trigger = h.loc(`[data-id="${trig}"]`); const content = h.loc(`[data-id="${cont}"]`);
      await h.visible(trigger, "the trigger");
      await h.shot("closed");
      await trigger.hover(); await h.settle(); await h.shot("trigger-hover");
      await h.page.mouse.move(0, 0);
      // The control-panel trigger is a <div role="button"> with tabIndex -1 on dev too: not in the Tab order
      // (pre-existing). Recorded, and must match on both sides; the popover is opened by pointer.
      h.observe("trigger in the Tab order", await trigger.evaluate((el) => `${el.tagName.toLowerCase()} role=${el.getAttribute("role")} tabIndex=${(el as HTMLElement).tabIndex}`));
      await trigger.click(); await h.settle();
      await h.visible(content, "the PopoverContent");
      await h.shot("open");
      await content.hover(); await h.settle(); await h.shot("open-hover");
      await h.press("Escape", "closes it", async () => said(!(await content.isVisible()), `visible=${await content.isVisible()}`));
      h.observe("focus after Escape", await h.focused());
      await trigger.click(); await h.settle();
      await h.visible(content, "the PopoverContent reopened");
      await h.page.mouse.click(5, 5); await h.settle();
      await h.expect("an outside click closes it", async () => said(!(await content.isVisible()), `visible=${await content.isVisible()}`));
    },
  };
}

// ---------- the whole capture set, every commit: DS1's 22 routes and the 50 stories, under the same determinism ----------
const SWEEP = JSON.parse(readFileSync(new URL("./sweep.json", import.meta.url), "utf8")) as { routes: string[]; stories: string[]; signedOut: string[]; newStories: string[] };
const slug = (x: string) => x.replace(/^\//, "").replace(/[^a-zA-Z0-9-]+/g, "_") || "root";
const sweepSpecs: Spec[] = [
  ...SWEEP.routes.map((route): Spec => ({
    // the auth pages are captured signed out: signed in they redirect to /home, and a redirect is not a page
    id: `sweep-route-${slug(route)}`, pr: 0, signedIn: !SWEEP.signedOut.includes(route), callSite: "page sweep (every call site this stack changes that renders on it)",
    // the integrations marquee (these two pages' empty states) scrolls forever unless motion is reduced, and
    // it runs on framer's own clock, so a fake one cannot stop it; these pages show no stuck sidebar blur
    motion: ["/settings/api-keys", "/settings/integrations"].includes(route) ? "reduce" : undefined,
    target: { app: route },
    async run(h) {
      await h.expect(`no redirect: the page is ${route}`, async () => { const u = new URL(h.page.url()); return said(u.pathname + u.search === route, u.pathname + u.search); });
      await h.visible(h.page.locator("body"), "the page"); await h.shot("page");
    },
  })),
  // stories this stack adds: captured where the commit has them (twice per head, so head-vs-head is gated),
  // recorded as absent where it does not (base, and heads below the PR that adds them)
  ...SWEEP.newStories.map((id): Spec => ({
    id: `sweep-newstory-${id}`, pr: 0, callSite: "a story this stack adds", target: { story: "atoms-text--playground", sb: "main" },
    async run(h) {
      const sb = new URL(h.page.url()).origin;
      const has = await h.page.evaluate(async (u) => { const r = await fetch(u); const j = await r.json(); return Object.keys(j.entries); }, `${sb}/index.json`).then((ids) => ids.includes(id));
      h.observe("story in this commit", has ? "yes" : "absent");
      if (!has) return;
      await h.page.goto(`${sb}/iframe.html?id=${id}&viewMode=story`, { waitUntil: "load" });
      await h.page.locator("#storybook-root > *").first().waitFor({ state: "attached", timeout: 30_000 });
      await h.settle();
      await h.visible(h.page.locator("#storybook-root > *").first(), "the story"); await h.shot("story");
    },
  })),
  ...SWEEP.stories.map((id): Spec => ({
    id: `sweep-story-${id}`, pr: 0, callSite: "story sweep", target: { story: id, sb: "main" },
    async run(h) { await h.visible(h.page.locator("#storybook-root > *").first(), "the story"); await h.shot("story"); },
  })),
];

export const SPECS: Spec[] = [
  collapsible("default", false),
  collapsible("default-open", true),
  collapsible("multiple-collapsibles", false),
    carousel("/marketplace/creator/autogpt", "creator"),
  carousel("/marketplace/agent/autogpt/personalized-morning-coffee-newsletter", "agent"),
  pagination("/admin/marketplace", "admin-marketplace", "admin/marketplace/components/AdminAgentsDataTable.tsx (molecules/PaginationControls, was __legacy__/ui/pagination-controls)"),
  pagination("/admin/spending", "admin-spending", "admin/spending/components/AdminUserGrantHistory.tsx (molecules/PaginationControls, was __legacy__/ui/pagination-controls)"),
  datePicker("renderers-formrenderer-primitive-fields--date-field", "date-field", "date-input", "atoms/DateInput/DateInput.tsx (atoms/Calendar; molecules/Popover from part 4)"),
  datePicker("renderers-formrenderer-primitive-fields--date-time-field", "date-time-field", "date-time-input", "atoms/DateTimeInput/DateTimeInput.tsx (atoms/Calendar; molecules/Popover from part 4)"),
  dateState("date-filled", "date-filled", "atoms/DateInput/DateInput.tsx", true),
  dateState("date-disabled", "date-disabled", "atoms/DateInput/DateInput.tsx", false),
  dateState("date-read-only", "date-read-only", "atoms/DateInput/DateInput.tsx", false),
  dateState("date-error", "date-error", "atoms/DateInput/DateInput.tsx", true),
  dateState("date-time-filled", "date-time-filled", "atoms/DateTimeInput/DateTimeInput.tsx", true),
  dateState("date-time-disabled", "date-time-disabled", "atoms/DateTimeInput/DateTimeInput.tsx", false),
  dateState("date-time-read-only", "date-time-read-only", "atoms/DateTimeInput/DateTimeInput.tsx", false),
  dateState("date-time-error", "date-time-error", "atoms/DateTimeInput/DateTimeInput.tsx", true),
  mcp("url-step"), mcp("connecting"), mcp("tools"), mcp("error-state"), mcp("manual-credential"),
  nodeBadge("running"), nodeBadge("queued"),
  nodeDialog("view-more"), nodeDialog("outputs-sheet"),
  ...resetSpecs,
  multiselect("multiselect-field", { story: "renderers-formrenderer-complex-schemas--multi-select-field", sb: "main" }, "renderers/.../custom/MultiSelectField/MultiSelectField.tsx (molecules/MultiSelect)", 0),
  multiselect("selectwidget-multi", { story: "evidence-formmultiselect--select-widget-multi", sb: "ev" }, "renderers/.../widgets/SelectInput/SelectWidget.tsx, multi-select branch (molecules/MultiSelect)", 2),
  multiselect("selectwidget-multi-empty", { story: "evidence-formmultiselect--select-widget-multi-empty", sb: "ev" }, "renderers/.../widgets/SelectInput/SelectWidget.tsx, multi-select branch (molecules/MultiSelect)", 0),
  { id: "pr3-multiselect-disabled-option", pr: 3, callSite: "molecules/MultiSelect/MultiSelect.tsx (MultiSelectorItem disabled, internal Command parts)",
    target: { story: "evidence-formmultiselect--molecule-disabled-option", sb: "ev" },
    async run(h) {
      // cmdk's input names itself with aria-labelledby, which wins over the story's aria-label
      const input = h.loc("[cmdk-input]"); await h.visible(input, "the input");
      await h.tabTo(input, "the input");
      const option = h.page.getByRole("option", { name: "Cherries" });
      await h.visible(option, "the disabled option");
      await h.expect("the option is aria-disabled", async () => (await option.getAttribute("aria-disabled")) === "true");
      await h.shot("open");
      // the disabled option is pointer-events-none: the pointer is moved over it, the way a user would
      await option.hover({ force: true }); await h.settle(); await h.shot("disabled-option-hover");
    } },
  builderPopover("blockmenu", { app: "/build" }, ["desktop"]),
  builderPopover("savecontrol", { app: "/build" }, ["desktop"]),
  builderPopover("blockmenu", { story: "evidence-builderpopovers--block-menu-closed", sb: "ev" }),
  builderPopover("savecontrol", { story: "evidence-builderpopovers--save-control-closed", sb: "ev" }),
  ...sweepSpecs,
];
