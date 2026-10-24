/**
 * Server-renders every case DS3a part 3 touches, from the checkout in the
 * current directory, and writes { id: html } to argv[2].
 *
 *   cd <frontend dir> && npx tsx collect-ds3a3.ts <out.json> [input|button|all]
 *
 * Base side (the legacy files exist): __legacy__/ui/input Input and
 * __legacy__/ui/button Button / buttonVariants with today's variant names.
 * Head side: atoms/Input/BaseInput and atoms/Button with the legacy-* names.
 * The same id is written on both sides, so compare.ts (DS2a's harness)
 * compares like for like on every computed property.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

const which = process.argv[3] ?? "all";
const src = (p: string) => join(process.cwd(), "src", p);
const legacyInput = existsSync(src("components/__legacy__/ui/input.tsx"));
const legacyButton = existsSync(src("components/__legacy__/ui/button.tsx"));

const BUTTON_CASES: {
  file: string;
  variant: string;
  size: string | null;
  className: string;
}[] = JSON.parse(
  readFileSync("/home/vercel-sandbox/autogpt/.context/harness/button-cases.json", "utf8"),
);

async function main() {
  const out: Record<string, string> = {};
  function add(id: string, el: unknown) {
    out[id] = renderToStaticMarkup(el);
  }
  const { cn } = await import(src("lib/utils.ts"));

  if (which !== "button") {
    const BaseInput = legacyInput
      ? (await import(src("components/__legacy__/ui/input.tsx"))).Input
      : (await import(src("components/atoms/Input/BaseInput.tsx"))).BaseInput;
    // className strings the importers pass, plus typical caller overrides.
    const inputClasses = [
      "",
      "rounded-l-none",
      "w-20",
      "m-0 border-none p-0 font-sans text-base font-normal text-zinc-800 shadow-none outline-none ring-0 ring-transparent focus:outline-none focus:ring-0 focus:ring-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-transparent",
      "text-xs",
      "leading-6",
      "text-[13px]",
      "text-body",
      "text-body placeholder:text-body",
    ];
    const types = [
      undefined,
      "text",
      "number",
      "url",
      "password",
      "time",
      "datetime-local",
      "file",
    ];
    for (const type of types) {
      for (const className of inputClasses) {
        for (const state of ["empty", "value", "disabled"]) {
          add(
            `BaseInput ${type ?? "-"}/${className || "-"}/${state}`,
            h(BaseInput, {
              type,
              className,
              placeholder: "Search",
              value: state === "value" && type !== "file" ? "Hello" : undefined,
              disabled: state === "disabled",
              readOnly: true,
            }),
          );
        }
      }
    }
    // The Input atom renders through BaseInput on the head.
    const { Input } = await import(src("components/atoms/Input/Input.tsx"));
    for (const type of ["text", "password", "number", "email", "url", "tel", "date"]) {
      for (const size of ["small", "medium"]) {
        for (const error of [undefined, "Required"]) {
          for (const hideLabel of [false, true]) {
            for (const className of ["", "leading-6 text-xs", "w-20"]) {
              add(
                `Input ${type}/${size}/${error ? "error" : "ok"}/${hideLabel ? "nolabel" : "label"}/${className || "-"}`,
                h(Input, {
                  id: "i",
                  label: "Name",
                  type,
                  size,
                  error,
                  hideLabel,
                  className,
                  hint: "Optional",
                  value: "",
                  onChange() {},
                }),
              );
            }
          }
        }
      }
    }
  }

  if (which !== "input") {
    const legacyName = (v: string | null) =>
      v && legacyButton ? v.replace(/^legacy-/, "") : v;
    let Button: unknown;
    let variantsFn: (args: Record<string, unknown>) => string;
    if (legacyButton) {
      const mod = await import(src("components/__legacy__/ui/button.tsx"));
      Button = mod.Button;
      variantsFn = mod.buttonVariants;
    } else {
      Button = (await import(src("components/atoms/Button/Button.tsx"))).Button;
      variantsFn = (await import(src("components/atoms/Button/helpers.ts")))
        .legacyButtonVariants;
    }
    const { TooltipProvider } = await import(
      src("components/atoms/Tooltip/BaseTooltip.tsx")
    );
    const children: Record<string, unknown> = {
      text: "Label",
      spans: [h("span", { key: 1 }, "One"), h("span", { key: 2 }, "Two")],
      icon: [
        h("svg", { key: 1, className: "h-4 w-4", viewBox: "0 0 24 24" }, h("path", { d: "M4 4h16v16H4z" })),
        "Label",
      ],
    };
    function button(id: string, props: Record<string, unknown>, child: unknown) {
      const p = { ...props };
      if (p.size == null) delete p.size;
      p.variant = legacyName(p.variant as string);
      p.size = legacyName(p.size as string | null) ?? undefined;
      if (p.size === undefined) delete p.size;
      add(id, h(TooltipProvider, null, h(Button, p, child)));
    }

    // Every call site's variant, size and className.
    for (const c of BUTTON_CASES) {
      if (c.className === "<dynamic>") continue;
      for (const state of ["rest", "disabled"]) {
        for (const [kind, child] of Object.entries(children)) {
          button(
            `Button site ${c.file} ${c.variant}/${c.size ?? "-"}/${c.className || "-"}/${state}/${kind}`,
            {
              variant: c.variant,
              size: c.size,
              className: c.className || undefined,
              disabled: state === "disabled",
              "aria-label": c.file === "DrawerWrap.tsx" ? "Close" : undefined,
            },
            child,
          );
        }
      }
    }
    // The full matrix with typical caller overrides.
    const variants = ["legacy-default", "legacy-destructive", "legacy-outline", "legacy-ghost", "legacy-link"];
    const sizes = [null, "legacy-default", "legacy-sm", "legacy-icon"];
    const overrides = ["", "text-xs", "leading-6", "text-[13px]", "text-base", "w-full", "text-sm leading-[1.375rem]"];
    for (const variant of variants) {
      for (const size of sizes) {
        for (const className of overrides) {
          for (const state of ["rest", "disabled"]) {
            button(
              `Button matrix ${variant}/${size ?? "-"}/${className || "-"}/${state}`,
              { variant, size, className: className || undefined, disabled: state === "disabled" },
              "Label",
            );
          }
        }
      }
    }
    // carousel.tsx: CarouselPrevious/CarouselNext defaults.
    for (const pos of ["right-20 top-0", "right-4 top-0", "-top-12 left-1/2 -translate-x-1/2 rotate-90"]) {
      button(
        `Button carousel ${pos}`,
        {
          variant: "legacy-outline",
          size: "legacy-icon",
          className: cn("absolute h-[52px] w-[52px] rounded-full", pos),
        },
        children.icon,
      );
    }
    // calendar.tsx: the day cell class string.
    add(
      "calendar day",
      h(
        "button",
        {
          className: cn(
            variantsFn({ variant: legacyName("legacy-ghost") }),
            "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
          ),
        },
        "15",
      ),
    );
    // DateInput (atom) renders the legacy ghost Button as its trigger.
    const { DateInput } = await import(src("components/atoms/DateInput/DateInput.tsx"));
    for (const size of ["default", "small"]) {
      for (const error of [undefined, "Bad"]) {
        for (const value of [undefined, "2026-01-15"]) {
          for (const disabled of [false, true]) {
            add(
              `DateInput ${size}/${error ? "error" : "ok"}/${value ?? "empty"}/${disabled}`,
              h(DateInput, { id: "d", label: "When", size, error, value, disabled }),
            );
          }
        }
      }
    }
  }

  for (const id of Object.keys(out)) {
    out[id] = out[id].replace(/«[^»]*»|:r[0-9a-z]+:|_R_[0-9a-zA-Z_]+_/g, "ID");
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
