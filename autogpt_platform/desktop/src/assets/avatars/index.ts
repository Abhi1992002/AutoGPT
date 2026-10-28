import type { BotAvatarFace, BotAvatarGlasses, BotAvatarHat, BotAvatarShading, BotAvatarType } from "bot-avatars";

/*
 * Our named characters, mapped onto bot-avatars bodies (MIT, see LICENSE-bot-avatars.md).
 * AgentAvatar is the only consumer, so swapping the set for the Pro version touches this file alone.
 */

export type CharacterId = "auto" | "scout" | "relay" | "tempo";

export type Character = {
  name: string;
  role: string;
  type: BotAvatarType;
  /** Body colour – AutoGPT purples */
  color: string;
  ink?: string;
  brightness?: number;
  hat?: BotAvatarHat;
  glasses?: BotAvatarGlasses;
  headphones?: boolean;
};

/** One look for the whole set: glossy bodies keep their shape at small sizes, and a mouth reads as a face */
export const look: { shading: BotAvatarShading; face: BotAvatarFace } = { shading: "plastic", face: "mouth" };

export const characters: Record<CharacterId, Character> = {
  auto: { name: "Auto", role: "Your guide", type: "droid", color: "#7c55cc" },
  scout: { name: "Scout", role: "Research", type: "drop", color: "#9b7fe0", glasses: "round" },
  relay: { name: "Relay", role: "Tools", type: "square", color: "#5c379f", headphones: true, brightness: 1.15 },
  tempo: { name: "Tempo", role: "Schedules", type: "clover", color: "#b9a6f2", hat: "beanie" },
};
