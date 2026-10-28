import { characters, type CharacterId } from "../../assets/avatars";
import { AgentAvatar } from "../../components/AgentAvatar";

/** Overlapping avatars, each cut out of the surface behind it. Names go to assistive tech as one list. */
export function ExpertStack({ ids, size = 24, label }: { ids: CharacterId[]; size?: number; label?: string }) {
  const unique = [...new Set(ids)];
  return (
    <span className="ob-stack" style={{ marginInlineEnd: size * 0.25 }} role="img" aria-label={label ?? unique.map((id) => characters[id].name).join(", ")}>
      {unique.map((id) => (
        <span key={id} className="ob-stack__item" style={{ marginInlineEnd: -size * 0.25 }}>
          <AgentAvatar character={id} size={size} decorative />
        </span>
      ))}
    </span>
  );
}
