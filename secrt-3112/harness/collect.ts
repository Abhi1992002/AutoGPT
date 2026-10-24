/**
 * Server-renders every atom case from the checkout in the current directory
 * and writes { id: html } to the file given as argv[2].
 *
 *   cd <frontend dir> && npx tsx collect.ts <out.json> <base|head>
 *
 * Run once from the base (dev) worktree and once from the head worktree;
 * compare.ts then renders both sets in Chromium and compares them.
 */
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const req = createRequire(join(process.cwd(), "package.json"));
const Module = req("node:module");
for (const ext of [".css", ".svg", ".png"]) {
  Module._extensions[ext] = (m: { exports: unknown }) => {
    m.exports = { src: `stub${ext}`, default: { src: `stub${ext}` } };
  };
}
const React = req("react");
(globalThis as Record<string, unknown>).React = React;
const { renderToStaticMarkup } = req("react-dom/server");
const h = React.createElement;

const side = process.argv[3] as "base" | "head";

async function load(path: string) {
  return import(join(process.cwd(), "src/components/atoms", path));
}

// Restyles callers put on <Text> today, and the tone that replaces each one.
const TONE_RESTYLES: Record<string, string> = {
  primary: "text-zinc-900",
  emphasis: "text-zinc-800",
  body: "text-zinc-700",
  secondary: "text-zinc-600",
  muted: "text-zinc-500",
  subtle: "text-zinc-400",
  danger: "text-red-600",
  error: "text-red-500",
  warning: "text-amber-700",
  success: "text-green-600",
};
const BASE_TONES = ["primary", "secondary", "muted", "danger"];

async function main() {
  const out: Record<string, string> = {};
  function add(id: string, el: unknown) {
    out[id] = renderToStaticMarkup(el);
  }

  const { Button } = await load("Button/Button.tsx");
  const { TooltipProvider, tooltipContentClassName } = await load(
    "Tooltip/BaseTooltip.tsx",
  );
  const variants = [
    "primary",
    "secondary",
    "destructive",
    "outline",
    "ghost",
    "icon",
    "toggle",
    "floating",
    "link",
  ];
  const sizes = ["small", "large", "icon", "xs", "icon-xs", "icon-sm"];
  // What feature code passes on top of a Button today.
  const buttonOverrides = [
    "",
    "text-xs",
    "leading-6",
    "text-[13px]",
    "h-7 w-7 min-w-0 border-zinc-300 p-0 text-gray-500",
    "w-full",
  ];
  for (const variant of variants) {
    for (const size of sizes) {
      for (const className of buttonOverrides) {
        for (const state of ["rest", "disabled", "loading", "pressed"]) {
          const props: Record<string, unknown> = { variant, size, className };
          if (state === "disabled") props.disabled = true;
          if (state === "loading") props.loading = true;
          if (state === "pressed") props["aria-pressed"] = true;
          add(
            `Button ${variant}/${size}/${state}/${className || "-"}`,
            h(TooltipProvider, null, h(Button, props, "Label")),
          );
        }
      }
      add(
        `Button NextLink ${variant}/${size}`,
        h(Button, { as: "NextLink", href: "/x", variant, size }, "Link"),
      );
    }
  }
  add("Tooltip content class", h("div", { className: tooltipContentClassName }, "Tip"));
  add(
    "Tooltip content class + text-sm",
    h("div", { className: (await import(join(process.cwd(), "src/lib/utils.ts"))).cn(tooltipContentClassName, "text-sm") }, "Tip"),
  );

  const { Text } = await load("Text/Text.tsx");
  const { variants: textVariants } = await load("Text/helpers.ts");
  for (const variant of Object.keys(textVariants)) {
    add(`Text ${variant}`, h(Text, { variant }, "Ag"));
    for (const tone of Object.keys(TONE_RESTYLES)) {
      // Base has no such tone yet: render today's restyle instead.
      const props =
        side === "base" && !BASE_TONES.includes(tone)
          ? { variant, className: TONE_RESTYLES[tone] }
          : { variant, tone };
      add(`Text ${variant} tone=${tone}`, h(Text, props, "Ag"));
      add(
        `Text ${variant} restyle=${tone}`,
        h(Text, { variant, className: TONE_RESTYLES[tone] }, "Ag"),
      );
    }
    for (const className of ["text-sm", "leading-6", "text-[13px]", "font-normal"]) {
      add(`Text ${variant} + ${className}`, h(Text, { variant, className }, "Ag"));
    }
  }

  const { Link } = await load("Link/Link.tsx");
  for (const variant of ["primary", "secondary"]) {
    for (const className of ["", "text-xs", "leading-6", "text-[13px]"]) {
      add(`Link ${variant} ${className}`, h(Link, { href: "/x", variant, className }, "Go"));
      add(`Link external ${variant} ${className}`, h(Link, { href: "https://x", isExternal: true, variant, className }, "Go"));
    }
  }

  const { Input } = await load("Input/Input.tsx");
  for (const type of ["text", "password", "textarea", "amount", "email"]) {
    for (const size of ["small", "medium"]) {
      for (const error of [undefined, "Required"]) {
        for (const hideLabel of [false, true]) {
          add(
            `Input ${type}/${size}/${error ? "error" : "ok"}/${hideLabel ? "nolabel" : "label"}`,
            h(Input, {
              id: "i",
              label: "Name",
              type,
              size,
              error,
              hideLabel,
              hint: "Optional",
              labelTooltip: undefined,
              value: "",
              onChange() {},
            }),
          );
        }
      }
    }
  }
  add("Input labelVariant eyebrow", h(Input, { id: "i", label: "Name", labelVariant: "eyebrow", value: "", onChange() {} }));
  add("Input className", h(Input, { id: "i", label: "Name", className: "leading-6 text-xs", value: "", onChange() {} }));

  const { Select } = await load("Select/Select.tsx");
  for (const size of ["small", "medium"]) {
    for (const error of [undefined, "Required"]) {
      for (const hideLabel of [false, true]) {
        for (const value of [undefined, "a"]) {
          add(
            `Select ${size}/${error ? "error" : "ok"}/${hideLabel ? "nolabel" : "label"}/${value ?? "empty"}`,
            h(Select, {
              id: "s",
              label: "Pick",
              size,
              error,
              hideLabel,
              value,
              options: [{ value: "a", label: "A" }],
            }),
          );
        }
      }
    }
  }

  const { DateInput } = await load("DateInput/DateInput.tsx");
  const { DateTimeInput } = await load("DateTimeInput/DateTimeInput.tsx");
  const { TimeInput } = await load("TimeInput/TimeInput.tsx");
  for (const size of ["default", "small"]) {
    for (const error of [undefined, "Bad"]) {
      for (const value of [undefined, "2026-01-15"]) {
        add(`DateInput ${size}/${error ? "error" : "ok"}/${value ?? "empty"}`, h(DateInput, { id: "d", label: "When", size, error, value }));
        add(`DateTimeInput ${size}/${error ? "error" : "ok"}/${value ?? "empty"}`, h(DateTimeInput, { id: "d", label: "When", hint: "UTC", size, error, value: value && `${value}T10:30` }));
        add(`DateTimeInput nolabel ${size}/${error ? "error" : "ok"}/${value ?? "empty"}`, h(DateTimeInput, { id: "d", hideLabel: true, size, error, value: value && `${value}T10:30` }));
      }
    }
  }
  for (const size of ["small", "medium"]) {
    for (const error of [undefined, "Bad"]) {
      add(`TimeInput ${size}/${error ? "error" : "ok"}`, h(TimeInput, { id: "t", label: "At", hint: "24h", size, error, value: "10:30" }));
      add(`TimeInput nolabel ${size}/${error ? "error" : "ok"}`, h(TimeInput, { id: "t", hideLabel: true, size, error }));
    }
  }

  const { Badge } = await load("Badge/Badge.tsx");
  for (const variant of ["success", "error", "warning", "info"]) {
    for (const size of ["small", "medium"]) {
      for (const className of ["", "text-xs", "leading-none", "text-[10px]"]) {
        add(`Badge ${variant}/${size}/${className}`, h(Badge, { variant, size, className }, "Done"));
      }
    }
  }

  const { Card } = await load("Card/Card.tsx");
  add("Card", h(Card, null, "Body"));
  const { Skeleton } = await load("Skeleton/Skeleton.tsx");
  add("Skeleton", h(Skeleton, { className: "h-4 w-20" }));
  const { Switch } = await load("Switch/Switch.tsx");
  for (const checked of [true, false]) {
    for (const disabled of [false, true]) {
      add(`Switch ${checked}/${disabled}`, h(Switch, { checked, disabled }));
    }
  }
  const { Progress } = await load("Progress/Progress.tsx");
  for (const value of [0, 37.5, 100]) add(`Progress ${value}`, h(Progress, { value }));
  const { LoadingSpinner } = await load("LoadingSpinner/LoadingSpinner.tsx");
  for (const size of ["small", "medium", "large"]) add(`LoadingSpinner ${size}`, h(LoadingSpinner, { size }));
  const { ToggleChip } = await load("ToggleChip/ToggleChip.tsx");
  for (const locked of [false, true]) {
    add(
      `ToggleChip ${locked}`,
      h(TooltipProvider, null, h(ToggleChip, { icon: "i", label: "Auto", tooltip: "t", ariaLabel: "a", pressed: true, onToggle() {}, locked })),
    );
  }
  const { Avatar, AvatarFallback, AvatarImage } = await load("Avatar/Avatar.tsx");
  add("Avatar fallback", h(Avatar, { className: "h-10 w-10" }, h(AvatarFallback, null, "Ada")));
  add("Avatar custom fallback", h(Avatar, { className: "h-10 w-10" }, h(AvatarFallback, null, h("span", null, "AB"))));
  add("Avatar image", h(Avatar, { className: "h-10 w-10" }, h(AvatarImage, { src: "/x.png" }), h(AvatarFallback, null, "Ada")));
  const { OverflowText } = await load("OverflowText/OverflowText.tsx");
  add("OverflowText", h(OverflowText, { value: "Long text", variant: "body" }));
  const { LLMItem } = await load("LLMItem/LLMItem.tsx");
  for (const type of ["claude", "gpt", "perplexity"]) add(`LLMItem ${type}`, h(LLMItem, { type }));
  const { Emoji } = await load("Emoji/Emoji.tsx");
  for (const size of [16, 24, 40]) add(`Emoji ${size}`, h(Emoji, { text: "🎉", size }));
  const { GlassPixelBackdrop } = await load("GlassPixelBackdrop/GlassPixelBackdrop.tsx");
  add("GlassPixelBackdrop", h("div", { className: "relative h-[200px] w-[400px] bg-violet-500" }, h(GlassPixelBackdrop)));
  const { FileInput } = await load("FileInput/FileInput.tsx");
  for (const variant of ["default", "compact"]) {
    for (const value of [undefined, "data:image/png;base64,AAA", "workspace://abc#application/pdf"]) {
      for (const mode of ["upload", "base64"]) {
        add(
          `FileInput ${variant}/${value ? value.slice(0, 12) : "empty"}/${mode}`,
          h(TooltipProvider, null, h(FileInput, { variant, value, mode, onChange() {}, onUploadFile: async () => ({}) })),
        );
      }
    }
  }
  const { AutoGPTLogo } = await load("AutoGPTLogo/AutoGPTLogo.tsx");
  const { AutoGPTLogoWhite } = await load("AutoGPTLogo/AutoGPTLogoWhite.tsx");
  add("AutoGPTLogo", h(AutoGPTLogo));
  add("AutoGPTLogoWhite", h("div", { className: "bg-black" }, h(AutoGPTLogoWhite)));

  // useId() differs between processes only by counter; normalise it.
  for (const id of Object.keys(out)) {
    out[id] = out[id].replace(/«[^»]*»|:r[0-9a-z]+:|clip-[a-zA-Z0-9_-]+|paint(\d)-[a-zA-Z0-9_-]+/g, (m, n) =>
      n !== undefined ? `paint${n}-ID` : m.startsWith("clip") ? "clip-ID" : "ID",
    );
  }
  writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
  console.log(`${Object.keys(out).length} cases written to ${process.argv[2]}`);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
