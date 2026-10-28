import { useState } from "react";

/*
 * Avatar – a picture or initials in a circle.
 * Sizes: 26px (email-draft recipient menu), 34px, 42px (profile-menu). The initials tile is the
 * email-draft one: a light chip with a hairline inset and semibold initials.
 */

export type AvatarProps = {
  src?: string;
  alt?: string;
  /** Used for the initials when there is no picture */
  name?: string;
  size?: "sm" | "md" | "lg";
  /** A presence dot in the corner */
  status?: "online" | "away" | "offline";
  className?: string;
};

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

export function Avatar({ src, alt, name = "", size = "md", status, className }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(src) && !broken;
  return (
    <>
      <style href="ui-avatar" precedence="default">
        {css}
      </style>
      <span className={["ui-avatar", className].filter(Boolean).join(" ")} data-size={size} role="img" aria-label={alt ?? name}>
        {showImage ? (
          <img className="ui-avatar__img" src={src} alt="" onError={() => setBroken(true)} />
        ) : (
          <span className="ui-avatar__initials" aria-hidden="true">
            {initialsOf(name)}
          </span>
        )}
        {status && <span className="ui-avatar__status" data-status={status} aria-hidden="true" />}
      </span>
    </>
  );
}

const css = /* css */ `
.ui-avatar {
  --ui-av-size: 34px;
  --ui-av-font: 12px;
  --ui-av-chip: #f5f5f5;
  --ui-av-chip-line: #ebebeb;
  position: relative;
  display: inline-grid;
  place-items: center;
  flex: none;
  width: var(--ui-av-size);
  height: var(--ui-av-size);
  border-radius: 50%;
  background: var(--ui-av-chip);
  box-shadow: inset 0 0 0 1px var(--ui-av-chip-line);
  font: 600 var(--ui-av-font)/1 var(--font-sans);
  color: var(--ds-text);
  vertical-align: middle;
  user-select: none;
}
.ui-avatar[data-size="sm"] { --ui-av-size: 26px; --ui-av-font: 10.5px; }
.ui-avatar[data-size="lg"] { --ui-av-size: 42px; --ui-av-font: 14px; }
.ui-avatar__img { display: block; width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
.ui-avatar__status {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 26%;
  height: 26%;
  border-radius: 50%;
  background: #2f9e5b;
  box-shadow: 0 0 0 2px var(--ds-surface);
}
.ui-avatar__status[data-status="away"] { background: #c2570c; }
.ui-avatar__status[data-status="offline"] { background: #c4c4c8; }

:where(.dark, [data-theme="dark"]) .ui-avatar { --ui-av-chip: #2a2a2d; --ui-av-chip-line: rgba(255, 255, 255, 0.08); }
:where(.dark, [data-theme="dark"]) .ui-avatar__status { background: #4cc38a; }
:where(.dark, [data-theme="dark"]) .ui-avatar__status[data-status="away"] { background: #fb9a4b; }
:where(.dark, [data-theme="dark"]) .ui-avatar__status[data-status="offline"] { background: #4a4a50; }
`;
