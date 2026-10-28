import type { ReactNode } from "react";

/*
 * Card – the AffectUI "Classic" card: a white card with a hairline border and a tiny shadow, framed on
 * every side by a 6px grey tray (profile-menu, tips-panel, smart-recommendation). Anything in `footer`
 * lives on the tray below the card, like their actions and progress rows.
 */

export type CardProps = {
  title?: ReactNode;
  description?: ReactNode;
  /** Right side of the header, e.g. a button or badge */
  actions?: ReactNode;
  children?: ReactNode;
  /** Content on the tray, below the card */
  footer?: ReactNode;
  /** Without the tray: just the white card */
  tray?: boolean;
  /** Padding of the card body; "none" for lists and tables */
  padding?: "md" | "sm" | "none";
  width?: number | string;
  className?: string;
};

export function Card({ title, description, actions, children, footer, tray = true, padding = "md", width, className }: CardProps) {
  const hasHead = title != null || description != null || actions != null;
  return (
    <>
      <style href="ui-card" precedence="default">
        {css}
      </style>
      <section className={["ui-card", className].filter(Boolean).join(" ")} data-tray={tray || undefined} style={{ width: typeof width === "number" ? `${width}px` : width }}>
        <div className="ui-card__card" data-padding={padding}>
          {hasHead && (
            <header className="ui-card__head">
              <div className="ui-card__titles">
                {title != null && <h3 className="ui-card__title">{title}</h3>}
                {description != null && <p className="ui-card__desc">{description}</p>}
              </div>
              {actions != null && <div className="ui-card__actions">{actions}</div>}
            </header>
          )}
          {children != null && <div className="ui-card__body">{children}</div>}
        </div>
        {footer != null && <footer className="ui-card__footer">{footer}</footer>}
      </section>
    </>
  );
}

const css = /* css */ `
.ui-card { box-sizing: border-box; width: 100%; min-width: 0; font-family: var(--font-sans); color: var(--ds-ink); }
.ui-card[data-tray] { padding: 6px; border-radius: 22px; background: var(--ds-tray); }
.ui-card *, .ui-card *::before, .ui-card *::after { box-sizing: border-box; }
.ui-card__card {
  --ui-card-pad: 16px;
  border: 1px solid var(--ds-line);
  border-radius: 16px;
  background: var(--ds-surface);
  box-shadow: var(--ds-shadow-sm);
}
.ui-card:not([data-tray]) .ui-card__card { border-radius: 20px; }
.ui-card__card[data-padding="sm"] { --ui-card-pad: 12px; }
.ui-card__card[data-padding="none"] { --ui-card-pad: 0px; }
.ui-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: var(--ui-card-pad) var(--ui-card-pad) 0; }
.ui-card__card[data-padding="none"] .ui-card__head { padding: 16px 16px 0; }
.ui-card__titles { display: grid; gap: 2px; min-width: 0; }
.ui-card__title { margin: 0; font: 600 16px/24px var(--font-sans); letter-spacing: -0.01em; overflow-wrap: anywhere; }
.ui-card__desc { margin: 0; font: 400 13.5px/20px var(--font-sans); color: var(--ds-soft); overflow-wrap: anywhere; }
.ui-card__actions { display: flex; flex: none; align-items: center; gap: 8px; }
.ui-card__body { padding: var(--ui-card-pad); font: 400 14px/20px var(--font-sans); color: var(--ds-text); }
.ui-card__head + .ui-card__body { padding-top: 12px; }
.ui-card__card[data-padding="none"] .ui-card__head + .ui-card__body { padding-top: 12px; }
.ui-card__footer { display: flex; align-items: center; gap: 8px; padding: 10px 12px 6px; font: 500 13px/18px var(--font-sans); color: var(--ds-text); }
`;
