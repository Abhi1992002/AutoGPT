/**
 * Interactive-state and keyboard captures for SECRT-3113 (#16083, #16097).
 * Uncommitted. QUALITY 17(b), 20, 26, 27, 28.
 *
 *   npx tsx .ign-harness/states2.ts <outdir> [baseUrl] [storybookUrl]
 *
 * - Same browser setup as scripts/screenshot-pages.ts: deterministic Chromium
 *   flags, 1440x900 and 390x844 at scale 1, reduced motion, light scheme,
 *   en-US/UTC, Date frozen at 2026-01-15T12:00Z.
 * - Math.random is seeded (mulberry32, fixed seed) before any page script
 *   runs, so pages that draw from it (the /tour/chat DotDistortionShader)
 *   render the same on every load. Nothing on any page is hidden or cropped.
 * - Every capture names the changed call site(s) it covers and asserts the
 *   changed element is visible before the shot; a miss throws (rule 27).
 * - Every keyboard step records expected vs actual; any miss is reported and
 *   the run exits 1 after all captures are written (rule 26).
 * Writes <name>__<viewport>.png, manifest.json and keyboard.json.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import {
  chromium,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";

const [
  out,
  baseUrl = "http://localhost:3000",
  sbUrl = "http://localhost:6006",
] = process.argv.slice(2);
const ARGS = [
  "--disable-gpu",
  "--disable-gpu-rasterization",
  "--disable-partial-raster",
  "--num-raster-threads=1",
  "--disable-skia-runtime-opts",
  "--force-color-profile=srgb",
  "--font-render-hinting=none",
  "--disable-lcd-text",
];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;
const FIXED_TIME = new Date("2026-01-15T12:00:00.000Z");
const SESSION = "/home?sessionId=5eed7113-0000-4000-8000-000000000001";
const HARNESS = "/ds3b3-harness";
const ALLOWLIST = join(__dirname, "keyboard-preexisting.json");

interface ManifestEntry {
  file: string;
  callSites: string[];
  asserted: string;
}
interface KeyStep {
  viewport: string;
  step: string;
  expected: string;
  actual: string;
  pass: boolean;
}
const manifest: ManifestEntry[] = [];
const keys: KeyStep[] = [];
const log = (m: string) =>
  console.log(`[states2 ${new Date().toISOString().slice(11, 19)}] ${m}`);

async function still(page: Page) {
  const shot = () =>
    page.screenshot({ animations: "disabled", caret: "hide", scale: "css" });
  let prev = await shot();
  for (let i = 0, same = 1; i < 40 && same < 3; i++) {
    await page.waitForTimeout(400);
    const next = await shot();
    same = next.equals(prev) ? same + 1 : 1;
    prev = next;
  }
  return prev;
}

async function stillFull(page: Page) {
  const shot = () =>
    page.screenshot({
      fullPage: true,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    });
  let prev = await shot();
  for (let i = 0, same = 1; i < 80 && same < 3; i++) {
    await page.waitForTimeout(750);
    const next = await shot();
    same = next.equals(prev) ? same + 1 : 1;
    prev = next;
  }
  return prev;
}

/** Asserts the changed element is visible, then writes the shot. */
async function capture(
  page: Page,
  vp: string,
  name: string,
  callSites: string[],
  changed: Locator,
  asserted: string,
  full = false,
) {
  await changed.first().waitFor({ state: "visible", timeout: 20_000 });
  if (!(await changed.first().isVisible()))
    throw new Error(`${name}: changed element not visible (${asserted})`);
  if (!full) {
    await changed
      .first()
      .scrollIntoViewIfNeeded()
      .catch(async () => {
        // The match detached mid-scroll (a re-render): wait for the
        // current one and retry once.
        await changed.first().waitFor({ state: "visible" });
        await changed.first().scrollIntoViewIfNeeded();
      });
    const box = await changed.first().boundingBox();
    const view = page.viewportSize();
    const inView =
      !!box &&
      !!view &&
      box.y + box.height > 0 &&
      box.y < view.height &&
      box.x + box.width > 0 &&
      box.x < view.width;
    if (!inView)
      throw new Error(`${name}: changed element not in the shot (${asserted})`);
  }
  const file = `${name}__${vp}.png`;
  writeFileSync(
    join(out, file),
    full ? await stillFull(page) : await still(page),
  );
  manifest.push({ file, callSites, asserted });
  log(`${vp} ${name}`);
}

function describeActive(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return "body";
    const label = el.getAttribute("aria-label") ?? "";
    const sd = el.getAttribute("data-streamdown") ?? "";
    const text = (el.innerText ?? "").trim().replace(/\s+/g, " ").slice(0, 30);
    return `${el.tagName.toLowerCase()}${label ? `[aria-label=${label}]` : ""}${sd ? `[data-streamdown=${sd}]` : ""}${text ? ` "${text}"` : ""}`;
  });
}

function key(
  viewport: string,
  step: string,
  expected: string,
  actual: string,
  pass: boolean,
) {
  keys.push({ viewport, step, expected, actual, pass });
}

async function inside(page: Page, container: Locator) {
  return container.evaluate((c) => c.contains(document.activeElement));
}

async function focusVisible(page: Page) {
  return page.evaluate(() =>
    Boolean(document.activeElement?.matches(":focus-visible")),
  );
}

async function closeChangelog(page: Page) {
  const cl = page.getByRole("dialog", { name: /what.s new/i });
  if (
    await cl
      .waitFor({ state: "visible", timeout: 6_000 })
      .then(() => true)
      .catch(() => false)
  ) {
    await cl.getByRole("button").first().click();
    await cl.waitFor({ state: "hidden" }).catch(() => undefined);
  }
}

async function newContext(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  vp: (typeof VIEWPORTS)[number],
) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "UTC",
  });
  await context.addInitScript(() => {
    // Seeded PRNG (mulberry32): the same sequence on every load and side.
    let a = 3113;
    Math.random = () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    // TTSButton renders only when the browser lists speech voices; headless
    // Chromium lists none.
    const voice = {
      name: "Harness",
      lang: "en-US",
      default: true,
      localService: true,
      voiceURI: "harness",
    };
    if ("speechSynthesis" in window)
      window.speechSynthesis.getVoices = () => [
        voice as unknown as SpeechSynthesisVoice,
      ];
  });
  const r = await context.request.post(`${baseUrl}/api/auth/sign-in/email`, {
    data: {
      email: process.env.SCREENSHOT_EMAIL,
      password: process.env.SCREENSHOT_PASSWORD,
    },
    headers: { "Content-Type": "application/json" },
  });
  if (!r.ok()) throw new Error(`sign-in ${r.status()}`);
  return context;
}

async function openPage(context: BrowserContext, url: string) {
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(url, { waitUntil: "load", timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function session(context: BrowserContext, vp: string) {
  const page = await openPage(context, baseUrl + SESSION);
  const table = page.locator("table:visible").first();
  await table.waitFor({ state: "visible", timeout: 60_000 });
  await closeChangelog(page);
  const submit = page.getByRole("button", { name: "Submit" });
  await capture(
    page,
    vp,
    "session-rest-send-disabled",
    [
      "ChatMessagesContainer",
      "MessageRow",
      "MessageContent",
      "MessageResponse",
      "MessageTable",
      "PromptInputTextarea",
      "PromptInputSubmit (disabled)",
    ],
    submit,
    "Submit button visible (disabled, empty composer)",
  );
  if (!(await submit.isDisabled()))
    throw new Error(
      "session: Submit should be disabled with an empty composer",
    );

  // External link dialog (ExternalLinkModal) by keyboard.
  const link = page.locator('[data-streamdown="link"]', {
    hasText: "link to the docs",
  });
  await link.scrollIntoViewIfNeeded();
  await link.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Open external link" });
  await capture(
    page,
    vp,
    "link-dialog-open",
    ["MessageResponse ExternalLinkModal"],
    dialog,
    "dialog 'Open external link' visible",
  );
  key(
    vp,
    "Enter on the link opens the dialog",
    "dialog visible",
    (await dialog.isVisible()) ? "dialog visible" : "dialog hidden",
    await dialog.isVisible(),
  );
  const inOnOpen = await inside(page, dialog);
  key(
    vp,
    "focus moves into the dialog on open",
    "focus inside dialog",
    `${await describeActive(page)} (${inOnOpen ? "inside" : "outside"})`,
    inOnOpen,
  );
  for (let i = 1; i <= 4; i++) {
    await page.keyboard.press("Tab");
    const ok = await inside(page, dialog);
    key(
      vp,
      `Tab ${i} inside the open dialog`,
      "focus stays inside dialog",
      `${await describeActive(page)} (${ok ? "inside" : "outside"})`,
      ok,
    );
  }
  await page.keyboard.press("Escape");
  const closed = await dialog
    .waitFor({ state: "hidden", timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  key(
    vp,
    "Esc closes the dialog",
    "dialog hidden",
    closed ? "dialog hidden" : "dialog still open",
    closed,
  );
  const back = await link.evaluate((l) => l === document.activeElement);
  key(
    vp,
    "focus returns to the trigger after Esc",
    'button[data-streamdown=link] "link to the docs"',
    await describeActive(page),
    back,
  );
  if (!closed) await page.getByRole("button", { name: "Cancel" }).click();
  await capture(
    page,
    vp,
    "link-dialog-closed",
    ["MessageResponse ExternalLinkModal"],
    link,
    "trigger link visible, dialog closed",
  );

  // Table row hover (MessageResponse [&_tbody_tr:hover_td]).
  const row = page.locator("table:visible tbody tr").first();
  await row.scrollIntoViewIfNeeded();
  await row.hover();
  await capture(
    page,
    vp,
    "table-row-hover",
    ["MessageResponse table classes", "MessageTable"],
    row,
    "first body row hovered",
  );

  // Copy tooltip on the last assistant row (AssistantMessageActions).
  const copy = page.getByRole("button", { name: "Copy" }).last();
  await copy.scrollIntoViewIfNeeded();
  await copy.hover();
  await capture(
    page,
    vp,
    "copy-tooltip-open",
    [
      "AssistantRowActions (owned)",
      "AssistantMessageActions",
      "CopyButton",
      "MessageAction",
    ],
    page.getByRole("tooltip").filter({ hasText: "Copy" }),
    "tooltip 'Copy' visible",
  );
  await page.mouse.move(1, 1);

  // Composer: typed (enabled), hover, active, focus-visible via Tab.
  const box = page.getByRole("textbox", { name: "Chat message input" });
  await box.click();
  await page.keyboard.type("Hello there");
  await capture(
    page,
    vp,
    "composer-typed-send-enabled",
    ["PromptInputTextarea", "PromptInputSubmit (enabled)"],
    submit,
    "Submit visible and enabled",
  );
  if (await submit.isDisabled())
    throw new Error("Submit should be enabled after typing");
  await submit.hover();
  await capture(
    page,
    vp,
    "send-hover",
    ["PromptInputSubmit hover:bg-action-hover"],
    submit,
    "Submit hovered",
  );
  const sb = await submit.boundingBox();
  if (!sb) throw new Error("no submit box");
  await page.mouse.down();
  await capture(
    page,
    vp,
    "send-active",
    ["PromptInputSubmit :active"],
    submit,
    "Submit pressed (pointer down)",
  );
  await page.mouse.move(1, 1);
  await page.mouse.up();
  await box.focus();
  key(
    vp,
    "composer textarea focused",
    "textarea[aria-label=Chat message input]",
    await describeActive(page),
    (await describeActive(page)).startsWith(
      "textarea[aria-label=Chat message input]",
    ),
  );
  let reached = false;
  for (let i = 1; i <= 3 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = (await describeActive(page)).includes("aria-label=Submit");
  }
  key(
    vp,
    "Tab from the textarea reaches Submit within 3 presses",
    "button[aria-label=Submit] focused",
    await describeActive(page),
    reached,
  );
  const fv = await focusVisible(page);
  key(
    vp,
    "Submit shows focus-visible when reached by keyboard",
    ":focus-visible",
    fv ? ":focus-visible" : "no :focus-visible",
    fv,
  );
  await capture(
    page,
    vp,
    "send-focus-visible",
    ["PromptInputSubmit focus-visible ring"],
    submit,
    "Submit focused by keyboard",
  );
  await page.close();
}

async function tour(context: BrowserContext, vp: string) {
  const page = await openPage(context, baseUrl + "/tour/chat");
  await page.waitForTimeout(8000);
  await capture(
    page,
    vp,
    "tour-chat",
    [
      "TourMessageList: Conversation, ConversationContent, Message, MessageContent",
    ],
    page.locator('[role="log"]'),
    "conversation log visible (unmodified page, Math.random seeded)",
    true,
  );
  await page.close();
}

async function harness(context: BrowserContext, vp: string) {
  const page = await openPage(context, baseUrl + HARNESS);
  await page
    .locator('[data-harness="work-output"]')
    .waitFor({ state: "visible", timeout: 60_000 });
  await closeChangelog(page);
  const sec = (id: string) => page.locator(`[data-harness="${id}"]`);
  const sectionShot = async (
    id: string,
    callSites: string[],
    changed: Locator,
    asserted: string,
  ) => {
    await sec(id).scrollIntoViewIfNeeded();
    await page.mouse.move(1, 1);
    await changed.first().waitFor({ state: "visible" });
    const file = `harness-${id}__${vp}.png`;
    writeFileSync(
      join(out, file),
      await sec(id).screenshot({
        animations: "disabled",
        caret: "hide",
        scale: "css",
      }),
    );
    manifest.push({ file, callSites, asserted });
    log(`${vp} harness ${id}`);
  };
  const s = sec;
  await sectionShot(
    "cmc-owned",
    [
      "ChatMessagesContainer queued row (default)",
      "MessageRow",
      "AssistantRowActions (owned)",
      "UserRowActions",
      "MessageContent",
    ],
    s("cmc-owned").getByText("Queued", { exact: true }),
    "Queued badge row visible",
  );
  await sec("cmc-owned").locator(".is-assistant").first().hover();
  await capture(
    page,
    vp,
    "harness-cmc-owned-row-hover",
    ["AssistantRowActions (owned) hover reveal"],
    s("cmc-owned").getByRole("button", { name: "Copy" }).first(),
    "non-last assistant row actions revealed on hover",
  );
  await sectionShot(
    "cmc-owned-compact",
    ["ChatMessagesContainer queued row (compact)"],
    s("cmc-owned-compact").getByText("Queued", { exact: true }),
    "compact Queued row visible",
  );
  await sectionShot(
    "cmc-readonly",
    ["AssistantRowActions (readOnly): MessageActions + CopyButton"],
    s("cmc-readonly").getByRole("button", { name: "Copy" }).last(),
    "read-only Copy action on the last assistant row",
  );
  await s("cmc-readonly").locator(".is-assistant").first().hover();
  await capture(
    page,
    vp,
    "harness-cmc-readonly-row-hover",
    ["AssistantRowActions (readOnly) hover reveal"],
    s("cmc-readonly").getByRole("button", { name: "Copy" }).first(),
    "read-only actions revealed on hover",
  );
  await s("cmc-readonly").getByRole("button", { name: "Copy" }).last().hover();
  await capture(
    page,
    vp,
    "harness-cmc-readonly-copy-tooltip",
    ["AssistantRowActions (readOnly) CopyButton tooltip"],
    page.getByRole("tooltip").filter({ hasText: "Copy" }),
    "Copy tooltip visible",
  );
  await page.mouse.move(1, 1);
  await sectionShot(
    "cmc-submitted",
    [
      "ChatMessagesContainer thinking indicator row (MessageContent text-body-lg leading-relaxed)",
    ],
    s("cmc-submitted").getByText("Thinking…"),
    "thinking indicator visible",
  );
  await sectionShot(
    "cmc-submitted-compact",
    ["ChatMessagesContainer thinking indicator row, compact"],
    s("cmc-submitted-compact").getByText("Thinking…"),
    "thinking indicator visible",
  );
  await sectionShot(
    "cmc-pending",
    ["ChatMessagesContainer > PendingUploadMessage"],
    s("cmc-pending").getByText("report.pdf"),
    "pending upload row visible",
  );
  for (const [id, label] of [
    ["chatinput-default", "Submit"],
    ["chatinput-reset", "Send at reset"],
    ["chatinput-compact", "Submit"],
  ] as const) {
    const btn = s(id).getByRole("button", { name: label, exact: true });
    await sectionShot(
      id,
      [
        `ChatInput ${id.replace("chatinput-", "")}: PromptInputSubmit (disabled)`,
        "PromptInputTextarea",
      ],
      btn,
      `${label} visible`,
    );
    await s(id).getByRole("textbox").first().click();
    await page.keyboard.type("Hello");
    await capture(
      page,
      vp,
      `harness-${id}-typed`,
      [`ChatInput ${id}: PromptInputSubmit enabled`],
      btn,
      `${label} enabled`,
    );
    if (await btn.isDisabled())
      throw new Error(`${id}: ${label} should be enabled after typing`);
    await btn.hover();
    await capture(
      page,
      vp,
      `harness-${id}-hover`,
      [`ChatInput ${id}: PromptInputSubmit hover`],
      btn,
      `${label} hovered`,
    );
    await page.mouse.down();
    await capture(
      page,
      vp,
      `harness-${id}-active`,
      [`ChatInput ${id}: PromptInputSubmit :active`],
      btn,
      `${label} pressed`,
    );
    await page.mouse.move(1, 1);
    await page.mouse.up();
    await btn.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const onBtn = (await describeActive(page)).includes(label);
    key(
      vp,
      `${id}: Shift+Tab then Tab returns to ${label}`,
      `button "${label}" focused`,
      await describeActive(page),
      onBtn,
    );
    await capture(
      page,
      vp,
      `harness-${id}-focus-visible`,
      [`ChatInput ${id}: PromptInputSubmit focus-visible`],
      btn,
      `${label} focused`,
    );
  }
  const stop = s("chatinput-streaming").getByRole("button", { name: "Stop" });
  await sectionShot(
    "chatinput-streaming",
    ["ChatInput streaming: StopButton > PromptInputSubmit (streaming)"],
    stop,
    "Stop visible",
  );
  await page.waitForTimeout(1200); // StopButton arms after 1s
  await stop.hover();
  await capture(
    page,
    vp,
    "harness-chatinput-streaming-stop-hover",
    ["StopButton hover + tooltip"],
    page.getByRole("tooltip").filter({ hasText: "Stop" }),
    "Stop tooltip visible",
  );
  await page.mouse.move(1, 1);
  await sectionShot(
    "chatinput-turn-starting",
    ["ChatInput turn starting: PromptInputSubmit submitted (Spinner)"],
    s("chatinput-turn-starting").getByRole("button", { name: "Sending" }),
    "Sending button visible",
  );
  await sectionShot(
    "empty-state",
    ["ConversationEmptyState (Text h3/p)"],
    s("empty-state").getByRole("heading", { name: "No messages yet" }),
    "empty-state heading visible",
  );
  await sectionShot(
    "conversation-scroll",
    ["Conversation, ConversationContent, ConversationScrollButton"],
    s("conversation-scroll").locator('[role="log"]'),
    "conversation log visible",
  );
  const log2 = s("conversation-scroll").locator('[role="log"]');
  const lb = await log2.boundingBox();
  if (!lb) throw new Error("conversation log has no box");
  await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2);
  await page.mouse.wheel(0, -3000);
  await page.waitForTimeout(500);
  const scrollBtn = s("conversation-scroll").locator("button").last();
  await capture(
    page,
    vp,
    "harness-conversation-scrolled-up",
    ["ConversationScrollButton"],
    scrollBtn,
    "scroll-to-bottom button visible",
  );
  await scrollBtn.hover();
  await capture(
    page,
    vp,
    "harness-conversation-scroll-button-hover",
    ["ConversationScrollButton hover"],
    scrollBtn,
    "scroll button hovered",
  );
  await sectionShot(
    "branch-toolbar",
    [
      "MessageBranch*, MessageToolbar, MessageActions, CopyButton, TTSButton, UserRowActions",
    ],
    s("branch-toolbar").getByText("1 of 2"),
    "branch page '1 of 2' visible",
  );
  // Message action group (MessageBranchSelector: ButtonGroup + ButtonGroupText,
  // MessageActions): hover, keyboard Tab through it, focus-visible.
  {
    const grp = s("branch-toolbar");
    await grp.getByRole("button", { name: "Next branch" }).hover();
    await capture(
      page,
      vp,
      "harness-branch-next-hover",
      ["ButtonGroup (organisms/Message/components) hover"],
      grp.getByRole("button", { name: "Next branch" }),
      "Next branch hovered",
    );
    await page.mouse.move(1, 1);
    await grp.getByRole("button", { name: "Previous branch" }).focus();
    const order = [
      "Previous branch",
      "Next branch",
      "Retry",
      "Copy",
      "Read aloud",
    ];
    for (let i = 0; i < order.length; i++) {
      if (i > 0) await page.keyboard.press("Tab");
      const d = await describeActive(page);
      const ok =
        d.includes(`"${order[i]}"`) ||
        d.includes(`aria-label=${order[i]}`) ||
        (await page.evaluate(
          (name) =>
            (document.activeElement as HTMLElement | null)?.innerText?.includes(
              name,
            ) ?? false,
          order[i],
        ));
      const fvis = await focusVisible(page);
      key(
        vp,
        `action group: Tab ${i} lands on ${order[i]} with focus-visible`,
        `${order[i]} focused, :focus-visible`,
        `${d}${fvis ? " :focus-visible" : ""}`,
        ok && (i === 0 || fvis),
      );
      if (i <= 1)
        await capture(
          page,
          vp,
          `harness-branch-focus-${i === 0 ? "prev" : "next"}`,
          ["ButtonGroup focus-visible ([&>*]:focus-visible:z-10)"],
          grp.getByRole("button", { name: order[i] }),
          `${order[i]} focused`,
        );
    }
  }
  await s("branch-toolbar")
    .getByRole("button", { name: "Next branch" })
    .click();
  await capture(
    page,
    vp,
    "harness-branch-2",
    ["MessageBranchNext, MessageBranchPage"],
    s("branch-toolbar").getByText("2 of 2"),
    "'2 of 2' visible",
  );
  await s("branch-toolbar").getByRole("button", { name: "Retry" }).hover();
  await capture(
    page,
    vp,
    "harness-retry-tooltip",
    ["MessageAction tooltip"],
    page.getByRole("tooltip").filter({ hasText: "Retry" }),
    "Retry tooltip visible",
  );
  const tts = s("branch-toolbar").getByRole("button", { name: "Read aloud" });
  await tts.hover();
  await capture(
    page,
    vp,
    "harness-tts-tooltip",
    ["TTSButton > MessageAction"],
    page.getByRole("tooltip").filter({ hasText: "Read aloud" }),
    "Read aloud tooltip visible",
  );
  await page.mouse.move(1, 1);
  await sectionShot(
    "prompt-input",
    [
      "PromptInput, PromptInputTextarea, PromptInputButton, PromptInputSubmit (ready/disabled/submitted/streaming/compact/card), StopButton",
    ],
    s("prompt-input").getByTestId("submit-ready"),
    "submit buttons visible",
  );
  await s("prompt-input").locator("button", { hasText: "+" }).hover();
  await capture(
    page,
    vp,
    "harness-tool-tooltip",
    ["PromptInputButton tooltip"],
    page.getByRole("tooltip").filter({ hasText: "Attach" }),
    "Attach tooltip visible",
  );
  await page.mouse.move(1, 1);
  await sectionShot(
    "pending-upload",
    ["PendingUploadMessage (compact and default)"],
    s("pending-upload").getByText("report.pdf"),
    "pending upload visible",
  );
  await sectionShot(
    "mention-markdown",
    ["CredentialMentionMarkdown > MessageResponse"],
    s("mention-markdown").locator("table"),
    "markdown table visible",
  );
  await sectionShot(
    "work-output",
    ["WorkOutputSheet trigger"],
    s("work-output").getByTestId("open-sheet"),
    "open button visible",
  );
  const opener = page.getByTestId("open-sheet");
  await opener.focus();
  await page.keyboard.press("Enter");
  const sheet = page.getByRole("dialog", { name: "Weekly report" });
  await capture(
    page,
    vp,
    "harness-work-output-sheet-open",
    ["WorkOutputSheet > MessageResponse (doc)"],
    sheet.locator("table"),
    "sheet with MessageResponse table visible",
  );
  const inSheet = await inside(page, sheet);
  key(
    vp,
    "sheet: focus moves into the sheet on open",
    "focus inside sheet",
    `${await describeActive(page)} (${inSheet ? "inside" : "outside"})`,
    inSheet,
  );
  await page.keyboard.press("Escape");
  const sheetClosed = await sheet
    .waitFor({ state: "hidden", timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  key(
    vp,
    "sheet: Esc closes it",
    "sheet hidden",
    sheetClosed ? "sheet hidden" : "sheet still open",
    sheetClosed,
  );
  const sheetBack = await opener.evaluate((o) => o === document.activeElement);
  key(
    vp,
    "sheet: focus returns to the trigger",
    'button "Open work output"',
    await describeActive(page),
    sheetBack,
  );
  await capture(
    page,
    vp,
    "harness-work-output-sheet-closed",
    ["WorkOutputSheet closed"],
    opener,
    "trigger visible, sheet closed",
  );
  await page.close();

  // StopButton arms itself 1s after mounting (setTimeout): both of its
  // states, pinned with a controlled clock, in each section that mounts it.
  for (const [id, callSite] of [
    [
      "prompt-input",
      "PromptInput section StopButton (with PromptInputSubmit states)",
    ],
    [
      "chatinput-streaming",
      "ChatInput streaming: StopButton > PromptInputSubmit (streaming)",
    ],
  ] as const) {
    const cp = await context.newPage();
    cp.setDefaultTimeout(20_000);
    await cp.clock.install({ time: FIXED_TIME });
    // install() keeps time ticking; pause it so timers fire only on runFor.
    await cp.clock.pauseAt(new Date(FIXED_TIME.getTime() + 1_000));
    await cp.goto(`${baseUrl}${HARNESS}?only=${id}`, {
      waitUntil: "load",
      timeout: 60_000,
    });
    const stopBtn = cp
      .locator(`[data-harness="${id}"]`)
      .getByRole("button", { name: "Stop" })
      .last();
    for (
      let i = 0;
      i < 100 && !(await stopBtn.isVisible().catch(() => false));
      i++
    )
      await cp.clock.runFor(100);
    await cp.waitForTimeout(1_500); // hydration (MessageChannel), clock paused
    await cp.clock.runFor(300);
    const disarmed = await stopBtn.isDisabled();
    key(
      vp,
      `${id}: StopButton is disabled before it arms (t < 1s)`,
      "disabled",
      disarmed ? "disabled" : "enabled",
      disarmed,
    );
    await capture(
      cp,
      vp,
      `harness-${id}-stop-disarmed`,
      [callSite + " (disarmed)"],
      stopBtn,
      "Stop visible, disabled (not yet armed)",
    );
    await cp.clock.runFor(1_200);
    const armed = !(await stopBtn.isDisabled());
    key(
      vp,
      `${id}: StopButton is enabled after 1s`,
      "enabled",
      armed ? "enabled" : "disabled",
      armed,
    );
    await capture(
      cp,
      vp,
      `harness-${id}-stop-armed`,
      [callSite + " (armed)"],
      stopBtn,
      "Stop visible, enabled (armed)",
    );
    await cp.close();
  }

  // Restore row: both states under a controlled clock (fallback after 6s).
  const rp = await context.newPage();
  rp.setDefaultTimeout(20_000);
  await rp.clock.install({ time: FIXED_TIME });
  // install() keeps time ticking; pause it so timers fire only on runFor.
  await rp.clock.pauseAt(new Date(FIXED_TIME.getTime() + 1_000));
  await rp.goto(baseUrl + HARNESS + "?only=cmc-restoring", {
    waitUntil: "load",
    timeout: 60_000,
  });
  const retrieving = rp.getByText("Retrieving latest messages");
  for (
    let i = 0;
    i < 100 && !(await retrieving.isVisible().catch(() => false));
    i++
  )
    await rp.clock.runFor(200);
  await rp.waitForTimeout(1_500); // hydration, clock paused
  await rp.clock.runFor(500);
  await capture(
    rp,
    vp,
    "harness-cmc-restoring-retrieving",
    ["ChatMessagesContainer restore row (Retrieving latest messages)"],
    retrieving,
    "'Retrieving latest messages' visible",
  );
  await rp.clock.runFor(6_500);
  await capture(
    rp,
    vp,
    "harness-cmc-restoring-fallback",
    ["ChatMessagesContainer restore row (6s fallback)"],
    rp.getByText("Still syncing the latest progress."),
    "'Still syncing the latest progress.' visible",
  );
  await rp.close();
}

async function storybook(context: BrowserContext, vp: string) {
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  await page.goto(
    `${sbUrl}/iframe.html?id=ai-elements-message--with-table&viewMode=story`,
    { waitUntil: "load" },
  );
  await page.evaluate(() => document.fonts.ready);
  const row = page.locator("table:visible tbody tr").nth(2);
  await row.waitFor({ state: "visible" });
  // Pointer to a cell already in view: no scroll-into-view, so no race.
  const cell = row.locator("td").first();
  const box = await cell.boundingBox();
  if (!box) throw new Error("story row cell has no box");
  await page.mouse.move(box.x + 4, box.y + box.height / 2);
  await capture(
    page,
    vp,
    "story-with-table-row-hover",
    ["MessageResponse table hover (story)"],
    row,
    "third body row hovered",
  );
  await page.goto(
    `${sbUrl}/iframe.html?id=ai-elements-message--link-safety-modal&viewMode=story`,
    { waitUntil: "load" },
  );
  await page.evaluate(() => document.fonts.ready);
  const link = page.locator('[data-streamdown="link"]:visible').first();
  await link.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Open external link" });
  await capture(
    page,
    vp,
    "story-link-dialog-open",
    ["ExternalLinkModal (story)", "story caption <Text as=p>"],
    dialog,
    "dialog visible",
  );
  await page.keyboard.press("Escape");
  const closed = await dialog
    .waitFor({ state: "hidden", timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  key(
    vp,
    "story: Esc closes the dialog",
    "dialog hidden",
    closed ? "dialog hidden" : "dialog still open",
    closed,
  );
  const back = await link.evaluate((l) => l === document.activeElement);
  key(
    vp,
    "story: focus returns to the trigger",
    'button[data-streamdown=link] "Example Site"',
    await describeActive(page),
    back,
  );
  await page.close();
}

// The PNG codec that ships inside playwright-core (as DS1's script loads it).
function readPng(buffer: Buffer): {
  width: number;
  height: number;
  data: Buffer;
} {
  const fromTest = createRequire(
    createRequire(join(process.cwd(), "package.json")).resolve(
      "@playwright/test/package.json",
    ),
  );
  const fromPlaywright = createRequire(
    fromTest.resolve("playwright/package.json"),
  );
  const coreDir = dirname(
    fromPlaywright.resolve("playwright-core/package.json"),
  );
  return fromPlaywright(join(coreDir, "lib/utilsBundle.js")).PNG.sync.read(
    buffer,
  );
}

/** Conversation's scrollbar thumb (QUALITY 42b). Playwright launches Chromium
 *  with --hide-scrollbars, so no other capture paints it; this browser drops
 *  that flag. Asserts the scroller reserves a gutter, its computed
 *  scrollbar-color names the thumb, and the shot's gutter holds thumb-coloured
 *  pixels, then writes the shot. */
async function scrollbars(context: BrowserContext, vp: string) {
  const page = await openPage(
    context,
    `${baseUrl}${HARNESS}?only=conversation-scroll`,
  );
  await closeChangelog(page);
  const logEl = page.locator(
    '[data-harness="conversation-scroll"] [role="log"]',
  );
  await logEl.waitFor({ state: "visible", timeout: 60_000 });
  const found = await logEl.evaluate((root) => {
    const all = [root, ...Array.from(root.querySelectorAll("*"))];
    const el = all.find((n) => {
      const oy = getComputedStyle(n).overflowY;
      return (
        (oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight
      );
    }) as HTMLElement | undefined;
    if (!el) return null;
    el.setAttribute("data-harness-scroller", "");
    return true;
  });
  if (!found) throw new Error("conversation: no scrolling element");
  const scroller = page.locator("[data-harness-scroller]");
  const box = await scroller.boundingBox();
  if (!box) throw new Error("conversation scroller has no box");
  // The fixed clock keeps use-stick-to-bottom from animating, so the thread
  // sits at the top; put it at a fixed mid-point so the thumb is mid-track.
  await scroller.evaluate((el: HTMLElement) => {
    el.scrollTop = 200;
  });
  await page.waitForTimeout(500);
  await page.mouse.move(1, 1);
  const m = await scroller.evaluate((el: HTMLElement) => ({
    gutter:
      el.offsetWidth -
      el.clientLeft -
      el.clientWidth -
      parseFloat(getComputedStyle(el).borderRightWidth),
    color: getComputedStyle(el).scrollbarColor,
    width: getComputedStyle(el).scrollbarWidth,
    scrollTop: el.scrollTop,
    max: el.scrollHeight - el.clientHeight,
  }));
  const thumb = [197, 197, 201]; // zinc-300 #C5C5C9 (scrollbar-thumb-zinc-300)
  if (m.gutter <= 0)
    throw new Error(`${vp} scrollbar: no gutter (${JSON.stringify(m)})`);
  if (!m.color.startsWith(`rgb(${thumb.join(", ")})`))
    throw new Error(`${vp} scrollbar: scrollbar-color ${m.color}`);
  if (!(m.scrollTop > 0 && m.scrollTop < m.max))
    throw new Error(`${vp} scrollbar: not mid-scroll (${JSON.stringify(m)})`);
  await capture(
    page,
    vp,
    "harness-conversation-scrollbar-thumb",
    [
      "ConversationContent scrollClassName (the scrollbar thumb), unhidden scrollbars",
    ],
    scroller,
    "conversation scrolled mid-way, thumb painted",
  );
  const png = readPng(
    readFileSync(join(out, `harness-conversation-scrollbar-thumb__${vp}.png`)),
  );
  let hits = 0;
  const x0 = Math.floor(box.x + box.width - m.gutter);
  for (
    let y = Math.max(0, Math.floor(box.y));
    y < Math.min(png.height, box.y + box.height);
    y++
  )
    for (
      let x = Math.max(0, x0);
      x < Math.min(png.width, box.x + box.width);
      x++
    ) {
      const i = (y * png.width + x) * 4;
      if (
        Math.abs(png.data[i] - thumb[0]) <= 2 &&
        Math.abs(png.data[i + 1] - thumb[1]) <= 2 &&
        Math.abs(png.data[i + 2] - thumb[2]) <= 2
      )
        hits++;
    }
  if (hits < 20)
    throw new Error(`${vp} scrollbar: thumb not painted (${hits} px)`);
  const line = `${vp} scrollbar thumb: gutter ${m.gutter}px, scrollbar-color "${m.color}", scrollbar-width ${m.width}, scrollTop ${m.scrollTop}/${m.max}, ${hits} thumb-coloured px in the gutter`;
  scrollbarLog.push(line);
  log(line);
  await page.close();
}
const scrollbarLog: string[] = [];

/** file:line of every component a capture names (QUALITY 27), resolved in the
 *  source tree of the side being captured (HARNESS_SRC), so dev, #16083 and
 *  #16097 each list their own paths. */
function definitionIndex(src: string) {
  const index = new Map<string, string>();
  const local = new Map<string, string>();
  for (const f of readdirSync(src, { recursive: true }).map(String)) {
    if (!/\.tsx?$/.test(f) || /\.(test|stories)\.tsx?$/.test(f)) continue;
    if (f.includes("__tests__") || f.includes("__generated__")) continue;
    const lines = readFileSync(join(src, f), "utf8").split("\n");
    lines.forEach((l, i) => {
      const m = l.match(
        /^(export )?(?:default )?(?:async )?(?:function|const) ([A-Z]\w*)\b/,
      );
      if (!m) return;
      const into = m[1] ? index : local;
      if (!into.has(m[2])) into.set(m[2], `src/${f}:${i + 1}`);
    });
  }
  for (const [k, v] of local) if (!index.has(k)) index.set(k, v);
  return index;
}

function sitesOf(index: Map<string, string>, callSites: string[]) {
  const names = new Set(
    callSites.flatMap((c) => c.match(/\b[A-Z][A-Za-z0-9]+\b/g) ?? []),
  );
  return [...names]
    .filter((n) => index.has(n))
    .map((n) => `${index.get(n)} ${n}`);
}

async function main() {
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ARGS });
  for (const vp of process.env.STATES_ONLY ? [] : VIEWPORTS) {
    const context = await newContext(browser, vp);
    await session(context, vp.name);
    await tour(context, vp.name);
    await harness(context, vp.name);
    await storybook(context, vp.name);
    await context.close();
  }
  await browser.close();
  const unhidden = await chromium.launch({
    args: ARGS,
    ignoreDefaultArgs: ["--hide-scrollbars"],
  });
  for (const vp of VIEWPORTS) {
    const context = await newContext(unhidden, vp);
    await scrollbars(context, vp.name);
    await context.close();
  }
  await unhidden.close();
  writeFileSync(join(out, "scrollbar.txt"), scrollbarLog.join("\n") + "\n");
  const index = process.env.HARNESS_SRC
    ? definitionIndex(process.env.HARNESS_SRC)
    : new Map<string, string>();
  const unresolved = manifest.filter(
    (e) => sitesOf(index, e.callSites).length === 0,
  );
  if (process.env.HARNESS_SRC && unresolved.length)
    throw new Error(
      `call sites without file:line: ${unresolved.map((e) => e.file).join(", ")}`,
    );
  writeFileSync(
    join(out, "manifest.json"),
    JSON.stringify(
      manifest.map((e) => ({ ...e, sites: sitesOf(index, e.callSites) })),
      null,
      2,
    ),
  );
  writeFileSync(join(out, "keyboard.json"), JSON.stringify(keys, null, 2));
  const misses = keys.filter((k) => !k.pass);
  // Explicit pre-existing-on-base allowlist (QUALITY 26): each entry is a step
  // that fails on dev, with dev's exact actual result. A miss passes the gate
  // only if it is listed AND its actual result equals dev's.
  const allow: { viewport: string; step: string; baseActual: string }[] =
    existsSync(ALLOWLIST) ? JSON.parse(readFileSync(ALLOWLIST, "utf8")) : [];
  const gate = misses.map((m) => {
    const a = allow.find((x) => x.viewport === m.viewport && x.step === m.step);
    const verdict = !a
      ? "NEW MISS (not pre-existing)"
      : a.baseActual === m.actual
        ? "pre-existing, equal to base"
        : `DIFFERS FROM BASE (base: ${a.baseActual})`;
    return { ...m, verdict };
  });
  const blocking = gate.filter(
    (g) => g.verdict !== "pre-existing, equal to base",
  );
  writeFileSync(
    join(out, "keyboard-gate.json"),
    JSON.stringify(
      {
        allowlistEntries: allow.length,
        misses: gate.length,
        blocking: blocking.length,
        gate,
      },
      null,
      2,
    ),
  );
  log(
    `${manifest.length} captures, ${keys.length} keyboard steps, ${misses.length} misses`,
  );
  for (const m of misses)
    log(
      `MISS [${m.viewport}] ${m.step}: expected ${m.expected}, got ${m.actual}`,
    );
  for (const g of gate) log(`  [${g.viewport}] ${g.step}: ${g.verdict}`);
  log(
    `keyboard gate: ${misses.length} misses, ${misses.length - blocking.length} pre-existing and equal to base, ${blocking.length} blocking`,
  );
  process.exitCode = blocking.length ? 1 : 0;
}

setTimeout(() => {
  log("hard timeout after 15 min");
  process.exit(2);
}, 15 * 60_000).unref();

main().catch((e) => {
  console.error(e);
  process.exit(3);
});
