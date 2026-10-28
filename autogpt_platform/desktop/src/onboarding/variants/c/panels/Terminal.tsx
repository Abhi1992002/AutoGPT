import type { CSSProperties, ReactNode } from "react";

/** A terminal pane: title bar, the tail of a log, then whatever the step adds below */
type TerminalProps = { command: string; meta?: string; lines: string[]; done?: string; rows?: number; children?: ReactNode };

export function Terminal({ command, meta, lines, done, rows = 6, children }: TerminalProps) {
  const tail = lines.slice(-rows);
  return (
    <div className="con-term">
      <div className="con-term__bar">
        <span className="ob-mono con-term__title">{command}</span>
        {meta && <span className="ob-mono con-term__meta ob-num">{meta}</span>}
      </div>
      <div className="con-term__log ob-mono" aria-hidden="true" style={{ "--rows": rows } as CSSProperties}>
        <p>
          <span className="con-term__prompt">$</span> {command}
        </p>
        {tail.map((line, i) => (
          <p key={`${lines.length - tail.length + i}`} data-fresh={i === tail.length - 1 || undefined} data-ok={/complete|healthy|started|200/i.test(line) || undefined}>
            {line}
          </p>
        ))}
        {done && <p data-ok>✓ {done}</p>}
        {!done && <span className="con-term__caret" />}
      </div>
      {children}
    </div>
  );
}
