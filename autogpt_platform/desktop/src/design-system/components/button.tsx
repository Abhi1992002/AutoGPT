import {
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type SyntheticEvent,
  type ReactNode,
} from "react";

/*
 * Button – a single self-contained file.
 * The styles are injected below, so no extra files are needed.
 */

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  /** primary: the accent fill, one per view · secondary: a surface with a hairline border · ghost: text only · destructive: red, for deleting */
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  /** Shows a shimmer over the label and blocks clicks */
  loading?: boolean;
  /** Icon before the label, e.g. an inline SVG */
  icon?: ReactNode;
  /** Icon after the label */
  iconRight?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  children,
  className,
  disabled,
  onClick,
  onPointerEnter,
  type = "button",
  ref,
  ...rest
}: ButtonProps) {
  // The shimmer copies the label, so it only works on plain text
  const text = typeof children === "string" ? children : undefined;
  // An empty string or false is no label – the icon stays centered
  const hasLabel = children != null && children !== false && children !== "";
  const iconOnly = !hasLabel && Boolean(icon || iconRight);
  // Unknown values fall back to the defaults instead of an unstyled button
  const tone = VARIANTS.includes(variant) ? variant : "primary";
  const scale = SIZES.includes(size) ? size : "md";

  // Morph: when label or icon change, the width glides to its new size and the new content blurs in.
  // Nothing animates on the first render.
  const inner = useRef<HTMLButtonElement | null>(null);
  const lastWidth = useRef(0);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const labelKey = text ?? "label";
  const iconKey = loading && icon ? "spinner" : contentKey(icon);
  const iconRightKey = contentKey(iconRight);

  const content = `${labelKey}|${iconKey}|${iconRightKey}`;
  const lastContent = useRef(content);

  // Runs after every render, so the remembered width is always current
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const width = el.getBoundingClientRect().width;
    const from = lastWidth.current;
    const changed = lastContent.current !== content;
    lastWidth.current = width;
    lastContent.current = content;
    if (!changed || !from || Math.abs(from - width) < 0.5) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate([{ width: `${from}px` }, { width: `${width}px` }], {
      duration: 220,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
    });
  });

  return (
    <>
      {/* React 19 hoists this into <head> once, no matter how many buttons render */}
      <style href="ui-button" precedence="default">
        {css}
      </style>
      <button
        type={type}
        className={["ui-button", className].filter(Boolean).join(" ")}
        data-variant={tone}
        data-size={scale}
        data-loading={loading || undefined}
        data-icon-only={iconOnly || undefined}
        data-ready={ready || undefined}
        ref={(el) => {
          inner.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        disabled={disabled}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        onClick={(event) => {
          if (loading) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        onPointerEnter={(event) => {
          // A label cut short shows its full text on hover
          const label = event.currentTarget.querySelector<HTMLElement>(".ui-button__label");
          if (label && text && !rest.title) label.title = label.scrollWidth > label.clientWidth + 1 ? text : "";
          onPointerEnter?.(event);
        }}
        {...rest}
      >
        {/* New keys remount the parts that changed, which replays their enter animation */}
        {icon && (
          <span className="ui-button__icon" aria-hidden="true" key={`icon-${iconKey}`} onErrorCapture={hideBroken}>
            {loading ? <Spinner /> : icon}
          </span>
        )}
        {hasLabel && (
          <span className="ui-button__label" data-text={text} dir="auto" key={`label-${labelKey}`}>
            {children}
          </span>
        )}
        {iconRight && (
          <span className="ui-button__icon" aria-hidden="true" key={`icon-right-${iconRightKey}`} onErrorCapture={hideBroken}>
            {iconRight}
          </span>
        )}
      </button>
    </>
  );
}

const VARIANTS = ["primary", "secondary", "ghost", "destructive"];
const SIZES = ["sm", "md", "lg"];

/** An icon image that fails to load leaves an empty slot instead of a broken-image glyph */
const hideBroken = (event: SyntheticEvent<HTMLElement>) => {
  if (event.target instanceof HTMLImageElement) event.target.style.visibility = "hidden";
};

/** Shown in place of the left icon while loading */
const Spinner = () => (
  <svg
    className="ui-button__spinner"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="8.5" opacity={0.2} />
    <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" />
  </svg>
);

/** A stable id per icon component, so swapping e.g. <CopyIcon /> for <CheckIcon /> counts as a change */
const ids = new WeakMap<object, number>();
let nextId = 1;
function contentKey(node: ReactNode) {
  if (!isValidElement(node) || typeof node.type === "string") return 0;
  const type = node.type as object;
  if (!ids.has(type)) ids.set(type, nextId++);
  return ids.get(type)!;
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Colors and motion as variables – override them on .ui-button */
.ui-button {
  --ui-btn-bg: var(--ds-accent);
  --ui-btn-bg-hover: var(--ds-accent-hover);
  --ui-btn-fg: var(--ds-on-accent);
  --ui-btn-edge: rgba(0, 0, 0, 0.1);
  --ui-btn-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  --ui-btn-highlight: rgba(255, 255, 255, 0.14);
  --ui-btn-ink: var(--ds-ink);
  --ui-btn-surface: var(--ds-surface);
  --ui-btn-surface-hover: var(--ds-surface-hover);
  --ui-btn-line: var(--ds-line);
  --ui-btn-line-hover: var(--ds-line-strong);
  --ui-btn-muted: var(--ds-soft);
  --ui-btn-hover: var(--ds-ink);
  --ui-btn-fill: var(--ds-fill);
  --ui-btn-shine: rgba(255, 255, 255, 0.82);
  --ui-btn-shine-on-ink: rgba(255, 255, 255, 0.9);
  --ui-btn-danger: var(--ds-danger);
  --ui-btn-danger-bg: color-mix(in srgb, var(--ds-danger) 10%, transparent);
  --ui-btn-focus: var(--ds-focus);
  --ui-btn-disabled-bg: var(--ds-fill);
  --ui-btn-disabled-fg: var(--ds-muted);
  --ui-btn-ease: var(--ds-ease);
  --ui-btn-load: 650ms;

  --h: 32px;
  --px: 12px;
  --gap: 6px;
  --fs: 13px;
  --icon: 16px;
  --radius: var(--ds-radius-sm);

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--gap);
  height: var(--h);
  padding: 0 var(--px);
  margin: 0;
  border: 1px solid transparent;
  border-radius: var(--radius);
  font-family: var(--ds-font);
  font-size: var(--fs);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.006em;
  max-width: 100%;
  min-width: 0;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition-property: background-color, border-color, color, box-shadow, scale, opacity;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}

.ui-button[data-size="sm"] {
  --h: 28px;
  --px: 10px;
  --gap: 6px;
  --fs: 13px;
  --icon: 14px;
}
.ui-button[data-size="lg"] {
  --h: 40px;
  --px: 16px;
  --gap: 8px;
  --fs: 14px;
  --icon: 16px;
  --radius: var(--ds-radius-md);
}
.ui-button[data-icon-only] {
  width: var(--h);
  padding: 0;
}
/* Less padding on the icon side, so the label sits optically centred */
.ui-button:has(> .ui-button__icon:first-child):not([data-icon-only]) { padding-inline-start: calc(var(--px) - 2px); }
.ui-button:has(> .ui-button__icon:last-child):not([data-icon-only]) { padding-inline-end: calc(var(--px) - 2px); }

/* primary: the one filled, accent-coloured action in a view */
.ui-button[data-variant="primary"] {
  background: var(--ui-btn-bg);
  color: var(--ui-btn-fg);
  box-shadow: inset 0 1px 0 var(--ui-btn-highlight), 0 0 0 1px var(--ui-btn-edge), var(--ui-btn-shadow);
}
@media (hover: hover) {
  .ui-button[data-variant="primary"]:hover:not(:disabled) { background: var(--ui-btn-bg-hover); }
}

/* secondary: a surface with a hairline border */
.ui-button[data-variant="secondary"] {
  background: var(--ui-btn-surface);
  border-color: var(--ui-btn-line);
  color: var(--ui-btn-ink);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
@media (hover: hover) {
  .ui-button[data-variant="secondary"]:hover:not(:disabled) { background: var(--ui-btn-surface-hover); border-color: var(--ui-btn-line-hover); }
}

/* ghost: a muted label, a fill appears on hover */
.ui-button[data-variant="ghost"] {
  background: transparent;
  color: var(--ui-btn-muted);
}
@media (hover: hover) {
  .ui-button[data-variant="ghost"]:hover:not(:disabled) { background: var(--ui-btn-fill); color: var(--ui-btn-hover); }
}

/* destructive: red label on a light red fill */
.ui-button[data-variant="destructive"] {
  background: var(--ui-btn-danger-bg);
  color: var(--ui-btn-danger);
}
@media (hover: hover) {
  .ui-button[data-variant="destructive"]:hover:not(:disabled) { background: color-mix(in srgb, var(--ui-btn-danger) 16%, transparent); }
}

.ui-button:active:not(:disabled):not([data-loading]) {
  scale: 0.96;
}
.ui-button:focus-visible {
  outline: 2px solid var(--ui-btn-focus);
  outline-offset: 2px;
}
.ui-button:disabled {
  opacity: 0.5;
  cursor: default;
}
/* Disabled primary goes neutral – a grey surface with muted text – rather than a faded accent */
.ui-button[data-variant="primary"]:disabled {
  background: var(--ui-btn-disabled-bg);
  color: var(--ui-btn-disabled-fg);
  box-shadow: inset 0 0 0 1px var(--ui-btn-line);
  opacity: 1;
}
.ui-button[data-loading] {
  cursor: default;
}

.ui-button__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--icon);
  height: var(--icon);
  overflow: hidden;
}
.ui-button__icon > svg,
.ui-button__icon > img {
  display: block;
  width: 100%;
  height: 100%;
}
.ui-button__icon > img {
  object-fit: contain;
}

/* Morph: the button clips while its width glides; changed parts fade in */
.ui-button {
  overflow: clip;
}
.ui-button[data-ready] .ui-button__label {
  animation: ui-button-label-in 220ms var(--ui-btn-ease) both;
}
.ui-button[data-ready] .ui-button__icon {
  animation: ui-button-icon-in 220ms var(--ui-btn-ease) both;
}

/* A label too long for its parent ends in "…" – the full text shows on hover */
.ui-button__label {
  position: relative;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: normal;
}
/* Loading: a band sweeps across a copy of the label */
.ui-button__label::after {
  content: attr(data-text);
  content: attr(data-text) / "";
  position: absolute;
  inset: 0;
  white-space: nowrap;
  color: transparent;
  background: linear-gradient(90deg, transparent 38%, var(--ui-btn-shine) 50%, transparent 62%) 100% 0 / 300% 100%
    no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  opacity: 0;
  pointer-events: none;
}
.ui-button[data-variant="primary"] .ui-button__label::after {
  --ui-btn-shine: var(--ui-btn-shine-on-ink);
}
.ui-button[data-loading] .ui-button__label {
  color: color-mix(in srgb, currentColor 55%, transparent);
}
.ui-button[data-loading] .ui-button__label::after {
  opacity: 1;
  animation: ui-button-sweep calc(var(--ui-btn-load) * 1.6) linear infinite;
}
.ui-button__spinner {
  animation: ui-button-spin 900ms linear infinite;
}

@keyframes ui-button-label-in {
  from {
    opacity: 0;
    transform: translateY(3px);
  }
}
@keyframes ui-button-icon-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
}
@keyframes ui-button-spin {
  to {
    transform: rotate(1turn);
  }
}
@keyframes ui-button-sweep {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: 0% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-button[data-ready] .ui-button__label,
  .ui-button[data-ready] .ui-button__icon {
    animation-name: ui-button-fade;
  }
  .ui-button:active:not(:disabled):not([data-loading]) {
    scale: 1;
  }
  .ui-button[data-loading] .ui-button__label::after {
    animation: none;
    opacity: 0;
  }
}
@keyframes ui-button-fade {
  from {
    opacity: 0;
  }
}

/* Dark mode: follows a .dark class or data-theme="dark" on any ancestor, e.g. <html> */
:where(.dark, [data-theme="dark"]) .ui-button {
  --ui-btn-edge: rgba(255, 255, 255, 0.08);
  --ui-btn-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  --ui-btn-highlight: rgba(255, 255, 255, 0.16);
  --ui-btn-shine: rgba(237, 237, 237, 0.95);
}
`;
