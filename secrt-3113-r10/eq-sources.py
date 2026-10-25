"""Adds a source column (file:line at #16083's head) to every case in equivalence.md."""
import re, sys
H = "/home/vercel-sandbox/harness"
AE = "ai-elements/"
CP = "app/(platform)/copilot/components/"
SD = f"`{AE}message.tsx:441-467` (Streamdown className), `{AE}message.tsx:395` (MessageTable)"
SCROLL = f"`{AE}conversation.tsx:39`; callers `{CP}ChatMessagesContainer/ChatMessagesContainer.tsx:531`, `app/(platform)/copilot/styleguide/page.tsx:1748,1867,1967,2047`, `app/(public)/tour/chat/components/TourMessageList/TourMessageList.tsx:41`"
SUBMIT = f"`{AE}prompt-input.tsx:387`"
MC = f"`{AE}message.tsx:56`"
TA = f"`{AE}prompt-input.tsx:263`; caller `{CP}CredentialMention/CredentialMentionEditor.tsx:154`"
RULES = [
    (r"^NEGATIVE CONTROL 1", f"control on {SD}"),
    (r"^NEGATIVE CONTROL 2", f"control on {SD}"),
    (r"^NEGATIVE CONTROL 3", f"control on `{AE}conversation.tsx:72,77`"),
    (r"^MessageResponse \+ MessageTable", SD),
    (r"^ConversationContent scroll", SCROLL),
    (r"MOBILE_SEND_BUTTON_CLASS|atReset", f"{SUBMIT}; callers `{CP}ChatInput/ChatInput.tsx:627,635,638,643`, `{CP}ChatInput/helpers.ts:157`"),
    (r"COMPACT_SEND_BUTTON_CLASS", f"{SUBMIT}; callers `{CP}ChatInput/ChatInput.tsx:427,627`, `{CP}ChatInput/helpers.ts:58`"),
    (r"CARD_SEND_BUTTON_CLASS", f"{SUBMIT}; callers `{CP}ChatInput/ChatInput.tsx:427,627`, `{CP}ChatInput/helpers.ts:61`"),
    (r"^PromptInputSubmit .*no caller class", f"{SUBMIT}; caller `{CP}ChatInput/components/StopButton.tsx:29`"),
    (r"MessageContent .*no caller class", f"{MC}; caller `{AE}message.stories.tsx:23,33`"),
    (r"MessageRow \(tool rows\)", f"{MC}; caller `{CP}ChatMessagesContainer/components/MessageRow/MessageRow.tsx:112,130`"),
    (r"getMessageContentClassName", f"{MC}; caller `{CP}ChatMessagesContainer/components/MessageRow/MessageRow.tsx:150`, `.../MessageRow/helpers.ts:90`"),
    (r"status row 2", f"{MC}; caller `{CP}ChatMessagesContainer/ChatMessagesContainer.tsx:590`"),
    (r"status row", f"{MC}; caller `{CP}ChatMessagesContainer/ChatMessagesContainer.tsx:583`"),
    (r"queued", f"{MC}; caller `{CP}ChatMessagesContainer/ChatMessagesContainer.tsx:644`"),
    (r"PendingUploadMessage, compact", f"{MC}; caller `{CP}ChatMessagesContainer/components/PendingUploadMessage.tsx:111`"),
    (r"PendingUploadMessage", f"{MC}; caller `{CP}ChatMessagesContainer/components/PendingUploadMessage.tsx:151`"),
    (r"TourMessageList", f"{MC}; caller `app/(public)/tour/chat/components/TourMessageList/TourMessageList.tsx:48`"),
    (r"styleguide user", f"{MC}; caller `app/(platform)/copilot/styleguide/page.tsx:217`"),
    (r"styleguide assistant", f"{MC}; caller `app/(platform)/copilot/styleguide/page.tsx:228,240`"),
    (r"styleguide plain", f"{MC}; caller `app/(platform)/copilot/styleguide/page.tsx:250`"),
    (r"^ConversationEmptyState", f"`{AE}conversation.tsx:72,77`"),
    (r"^ExternalLinkModal", f"`{AE}message.tsx:355`"),
    (r"LinkSafetyModal caption", f"`{AE}message.stories.tsx:83`"),
    (r"CredentialMentionEditor \(ChatInput", f"{TA}, `{CP}ChatInput/ChatInput.tsx:546`"),
    (r"CredentialMentionEditor \(story", f"{TA}, `{CP}ChatInput/components/MentionDropdown.stories.tsx:71,83`"),
    (r"^PromptInputTextarea .*no caller class", f"`{AE}prompt-input.tsx:263`"),
]
def src(label):
    for pat, s in RULES:
        if re.search(pat, label):
            return s
    raise SystemExit(f"no source for: {label}")
lines = open(f"{H}/equivalence.md").read().split("\n")
out, rows = [], []
for l in lines:
    if l.startswith("| case | old class string"):
        out.append(l.replace("| case |", "| case | source (file:line, `src/components/` unless it starts with `app/`, at 3cbe095dc) |", 1)); continue
    if l.startswith("| --- | --- |") and out and "source (file:line" in out[-1]:
        out.append("| --- " + l); continue
    m = re.match(r"^\| ([^|]+?) \| ", l)
    if m and out and any("source (file:line" in o for o in out[-3:] + out[:3]) or (m and rows):
        label = m.group(1).strip(); s = src(label); rows.append((label, s))
        out.append(f"| {label} | {s} | " + l[m.end():]); continue
    out.append(l)
open(f"{H}/equivalence.md", "w").write("\n".join(out))
open(f"{H}/equivalence-sources.md", "w").write("\n".join(["| case | source (file:line at 3cbe095dc; paths under `src/components/` unless they start with `app/`) |", "| --- | --- |"] + [f"| {a} | {b} |" for a, b in rows]))
print(len(rows), "cases with a source")
