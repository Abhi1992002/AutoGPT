import { Add01Icon } from "@hugeicons/core-free-icons";
import { AgentAvatar } from "../../components/AgentAvatar";
import { SUGGESTIONS } from "../core/data";
import { useAgentMood } from "../core/hooks";
import type { Onboarding } from "../core/useOnboarding";
import { Icon } from "../ui/Icon";

const MOOD = { idle: "Otto is listening", working: "Otto is taking notes", sleeping: "Otto is waiting for you" };

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** The brain-dump box: a textarea with Otto's state and the shortcut below, suggestions underneath */
export function Composer({ flow, id, rows = 4, chips = 5, placeholder }: { flow: Onboarding; id: string; rows?: number; chips?: number; placeholder: string }) {
  const text = flow.state.brain;
  const mood = useAgentMood(text);
  const add = (line: string) => flow.setBrain(text.trim() ? `${text.trim()}\n${line}` : line);
  const unused = SUGGESTIONS.filter((s) => !text.includes(s.text)).slice(0, chips);

  return (
    <div className="ob-brain">
      <div className="ob-composer">
        <label htmlFor={id} className="ob-sr">
          About you and what your agents should do
        </label>
        <textarea id={id} rows={rows} value={text} placeholder={placeholder} aria-describedby={`${id}-hint`} onChange={(e) => flow.setBrain(e.target.value)} />
        <div className="ob-composer__foot">
          <span className="ob-meta ob-composer__mood" role="status">
            <AgentAvatar character="otto" size={16} decorative />
            {MOOD[mood]}
          </span>
          <span id={`${id}-hint`} className="ob-kbd">
            <kbd>{isMac ? "⌘" : "Ctrl"}</kbd>
            <kbd>↵</kbd>
            <span>to continue</span>
          </span>
        </div>
      </div>
      {unused.length > 0 && (
        <div className="ob-chips" role="group" aria-label="Suggestions">
          {unused.map((s) => (
            <button key={s.label} type="button" className="ob-chip" onClick={() => add(s.text)}>
              <Icon icon={Add01Icon} size={12} strokeWidth={2} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
