# AutoGPT characters

Otto and the expert characters from the AutoGPT platform's managed library
([Significant-Gravitas/AutoGPT](https://github.com/Significant-Gravitas/AutoGPT/tree/dev/autogpt_platform/frontend/public/autogpt-characters),
branch `dev`, see its `manifest.json`), in the upstream folder layout.

Upstream ships opaque tiles on a warm studio background. So the avatars can sit on any surface, each tile here
is the upstream 512 px PNG run through `scripts/cutout-character.py`: background and floor removed, cropped
around the character, saved as 256 and 128 px WebP. The artwork's colours are untouched.
`src/assets/avatars/index.ts` maps them to names; `src/components/AgentAvatar.tsx` renders them.
