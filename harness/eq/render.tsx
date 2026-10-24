// Renders the real InputGroup parts (and the real ai-elements callers) with
// react-dom/server and prints every element's class string, keyed by case.
// Run with cwd = a frontend checkout, so @/ resolves to that checkout.
const { renderToStaticMarkup } = require(process.cwd() + "/node_modules/react-dom/server");
const React = require(process.cwd() + "/node_modules/react");

const IG = require(process.cwd() + process.env.IG_PATH);
const PI = require(process.cwd() + "/src/components/ai-elements/prompt-input");
const H = require(process.cwd() + "/src/app/(platform)/copilot/components/ChatInput/helpers");
const { TooltipProvider } = require(process.cwd() + "/src/components/ui/tooltip");

const CHAT_GROUP = [
  "relative z-10 flex-col overflow-hidden !rounded-[2rem] border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.08)] has-[[data-slot=input-group-control]:focus-visible]:border-zinc-300 has-[[data-slot=input-group-control]:focus-visible]:ring-0 max-md:!rounded-3xl",
  "gap-3 !rounded-3xl border-zinc-200 px-3.5 pb-3.5 pt-3 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.02)] has-[[data-slot=input-group-control]:focus-visible]:border-zinc-300",
  "!rounded-xl border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] has-[[data-slot=input-group-control]:focus-visible]:border-zinc-400",
  "border-red-400 ring-1 ring-red-400 has-[[data-slot=input-group-control]:focus-visible]:border-red-400 has-[[data-slot=input-group-control]:focus-visible]:ring-red-400",
];
const groupClasses = [
  undefined,
  "overflow-hidden",
  CHAT_GROUP[0],
  CHAT_GROUP[0] + " " + CHAT_GROUP[1],
  CHAT_GROUP[0] + " " + CHAT_GROUP[2],
  CHAT_GROUP[0] + " " + CHAT_GROUP[3],
  "flex-col gap-3 !rounded-3xl border-zinc-200 px-3.5 pb-3.5 pt-3 shadow-sm has-[[data-slot=input-group-control]:focus-visible]:ring-0",
];
const addonClasses = [
  undefined,
  "relative order-none gap-1 py-1 pl-1.5",
  "relative order-none gap-1 py-1 pl-1.5 gap-1.5 p-0",
  "relative order-none gap-1 py-1 pl-1.5 gap-0.5 py-1 pl-1",
  "order-none ml-auto gap-1 py-1 pr-1.5",
  "order-none ml-auto gap-1 py-1 pr-1.5 gap-1.5 p-0",
  "w-full justify-end p-0",
];
const aligns = ["inline-start", "inline-end", "block-start", "block-end"];
const sizes = ["xs", "sm", "icon-xs", "icon-sm"];
const buttonClasses = [
  undefined,
  H.CARD_ICON_BUTTON_CLASS,
  H.COMPACT_ICON_BUTTON_CLASS,
  H.CARD_SEND_BUTTON_CLASS,
  H.COMPACT_SEND_BUTTON_CLASS,
  H.MOBILE_SEND_BUTTON_CLASS,
  H.MOBILE_SEND_BUTTON_CLASS + " !w-auto px-4 font-medium",
];

const cases: Record<string, React.ReactElement> = {};
groupClasses.forEach((c, i) => {
  cases[`InputGroup className#${i}`] = <IG.InputGroup className={c}><IG.InputGroupTextarea /></IG.InputGroup>;
});
aligns.forEach((a) =>
  addonClasses.forEach((c, i) => {
    cases[`InputGroupAddon ${a} className#${i}`] = <IG.InputGroupAddon align={a} className={c}>x</IG.InputGroupAddon>;
  }),
);
sizes.forEach((s) =>
  buttonClasses.forEach((c, i) => {
    cases[`InputGroupButton ${s} className#${i}`] = <IG.InputGroupButton size={s} className={c}>x</IG.InputGroupButton>;
    cases[`PromptInputButton ${s} className#${i}`] = <TooltipProvider><PI.PromptInputButton size={s} className={c}>x</PI.PromptInputButton></TooltipProvider>;
    cases[`PromptInputSubmit ${s} className#${i}`] = <PI.PromptInputSubmit size={s} className={c} />;
  }),
);
buttonClasses.forEach((c, i) => {
  cases[`PromptInputButton default-size className#${i}`] = <TooltipProvider><PI.PromptInputButton className={c}>x</PI.PromptInputButton></TooltipProvider>;
  cases[`PromptInputSubmit default-size className#${i}`] = <PI.PromptInputSubmit className={c} />;
});

const out: Record<string, string[]> = {};
for (const [k, el] of Object.entries(cases)) {
  const html = renderToStaticMarkup(el);
  out[k] = [...html.matchAll(/<(\w+)[^>]*?class="([^"]*)"/g)].map((m) => `${m[1]}|${m[2]}`);
}
process.stdout.write(JSON.stringify(out));
