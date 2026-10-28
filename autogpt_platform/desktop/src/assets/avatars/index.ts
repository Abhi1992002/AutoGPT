import type { BotAvatarGlasses, BotAvatarHat, BotAvatarType } from "bot-avatars";

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

export const characters: Record<CharacterId, Character> = {
  auto: { name: "Auto", role: "Your guide", type: "circle", color: "#7c55cc", brightness: 1.05 },
  scout: { name: "Scout", role: "Research", type: "drop", color: "#9b7fe0", glasses: "round" },
  relay: { name: "Relay", role: "Tools", type: "square", color: "#5c379f", headphones: true, brightness: 1.15 },
  tempo: { name: "Tempo", role: "Schedules", type: "clover", color: "#b9a6f2", hat: "beanie" },
};
