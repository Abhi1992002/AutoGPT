/*
 * The AutoGPT characters the app shows, from the platform's managed library
 * (Significant-Gravitas/AutoGPT, autogpt_platform/frontend/public/autogpt-characters).
 * Cut out of their studio background and cropped (see public/autogpt-characters/README.md).
 * AgentAvatar is the only consumer, so a new set touches this file alone.
 */

export type CharacterId = "otto" | "nadia" | "casey" | "frankie" | "kai" | "james" | "alex" | "quinn" | "mina";

export type Character = {
  name: string;
  role: string;
  /** Folder under public/, holding 128.webp and 256.webp */
  path: string;
};

const tile = (library: "v1.1" | "v2.1", id: string) => `/autogpt-characters/${library}/${id}/neutral`;

export const characters: Record<CharacterId, Character> = {
  otto: { name: "Otto", role: "Your guide", path: tile("v1.1", "otto") },
  nadia: { name: "Nadia", role: "Research", path: tile("v2.1", "expert-nadia") },
  casey: { name: "Casey", role: "Triage", path: tile("v2.1", "expert-casey") },
  frankie: { name: "Frankie", role: "Schedules", path: tile("v2.1", "expert-frankie") },
  kai: { name: "Kai", role: "Inbox", path: tile("v2.1", "expert-kai") },
  james: { name: "James", role: "Team updates", path: tile("v2.1", "expert-james") },
  alex: { name: "Alex", role: "Product", path: tile("v2.1", "expert-alex") },
  quinn: { name: "Quinn", role: "Analysis", path: tile("v2.1", "expert-quinn") },
  mina: { name: "Mina", role: "Bookkeeping", path: tile("v1.1", "expert-mina") },
};

/** The tile that stays sharp on a 2x screen: 128 px up to 64 px wide, 256 px above */
export const tileFor = (id: CharacterId, size: number) => `${characters[id].path}/${size > 64 ? 256 : 128}.webp`;
