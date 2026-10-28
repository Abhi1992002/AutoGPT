import { Add01Icon } from "@hugeicons/core-free-icons";
import { AgentAvatar } from "../../../../components/AgentAvatar";
import { SUGGESTIONS } from "../../../core/data";
import { useAgentMood } from "../../../core/hooks";
import { Icon } from "../../../ui/Icon";
import type { ZenStepProps } from "../ZenOnboarding";
import { Reveal, ZenHeader } from "../parts";

const MOOD_TEXT = { idle: "Auto is listening", working: "Auto is taking notes", sleeping: "Auto dozed off – start typing to wake it" };

export function ZenBrain({ flow }: ZenStepProps) {
  const text = flow.state.brain;
  const mood = useAgentMood(text);
  const add = (line: string) => flow.setBrain(text.trim() ? `${text.trim()}\n${line}` : line);
  const unused = SUGGESTIONS.filter((s) => !text.includes(s.text));

  return (
    <>
      <ZenHeader step="brain" moved={flow.state.moved} visual={<AgentAvatar character="auto" size={88} state={mood} decorative />} />
      <Reveal className="zen-brain">
        <label htmlFor="zen-brain" className="ob-sr">
          About you and what your agents should do
        </label>
        <textarea
          id="zen-brain"
          className="zen-brain__input body"
          rows={4}
          value={text}
          placeholder="I run a four-person design studio. I’d love help keeping client email and invoices under control."
          onChange={(e) => flow.setBrain(e.target.value)}
        />
        <p className="small text-subtle" role="status">
          {MOOD_TEXT[mood]}
        </p>
        {unused.length > 0 && (
          <div className="zen-chips" role="group" aria-label="Suggestions">
            {unused.map((s) => (
              <button key={s.label} type="button" className="zen-chip small" onClick={() => add(s.text)}>
                <Icon icon={Add01Icon} size={14} />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </Reveal>
    </>
  );
}
