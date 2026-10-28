import type { IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { Icon } from "../../ui/Icon";

/** The product, framed as an app window: a title bar and a body */
export function Window({ icon, title, meta, children, footer }: { icon: IconSvgElement; title: string; meta?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="story-window">
      <div className="story-window__bar">
        <Icon icon={icon} size={14} />
        <span className="ob-label">{title}</span>
        {meta && <span className="ob-meta ob-num story-window__meta">{meta}</span>}
      </div>
      <div className="story-window__body">{children}</div>
      {footer && <div className="story-window__foot">{footer}</div>}
    </div>
  );
}
