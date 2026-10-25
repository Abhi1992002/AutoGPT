"""Drops the aligned pairs extract_pairs mis-aligns where copy moved into a
<Text>: a string literal of one element paired with another element's string or
with a variant name. Each dropped pair is written out with the check that
measures the real element instead.
  python3 drop_misaligned.py <all-pairs.json> <out excluded.json>"""
import json, sys
DROP = {
  ("AgentOutputs.tsx", "text-xl", "lead-semibold"): "SheetTitle's className paired with the variant of the <Text> it now wraps; markup case 'AgentOutputs: sheet title and description'",
  ("AgentOutputs.tsx", "mt-1 text-sm text-muted-foreground", "mt-1 text-muted-foreground"): "SheetDescription's className without the atom's own text-body leading-5; measured merged (pr1-agentoutputs-merged.md, 0 failing) and as a class set (pr1-merged-sets.md, same set)",
  ("MCPToolDialog.tsx", "w-full text-xs", "w-full"): "the table's type moved to the <Text variant=\"small-tight\" as=\"div\"> around it; markup case 'MCP: parameter table'",
  ("FilterSheet.tsx", "font-sans text-sm leading-[1.375rem] text-zinc-600", "m-0 p-0 text-foreground-emphasis hover:text-foreground-secondary"): "a creator label's dev string paired with the More/Less link Button; the label is a Text row, the link is markup case 'FilterSheet: More/Less'",
  ("FilterSheet.tsx", "m-0 p-0 font-sans text-sm font-medium leading-[1.375rem] text-zinc-800 underline hover:text-zinc-600", "body-medium"): "the More/Less link's dev string paired with the variant of the <Text> it now wraps; markup case 'FilterSheet: More/Less'",
  ("NodeCost.tsx", "mr-3 flex items-center gap-1 text-base font-light", "mr-3 flex items-center gap-1"): "the cost row's flex container lost type that styled no text of its own (its copy is all <Text>); markup cases 'NodeCost: free row' and 'NodeCost: amount and suffix row'",
  ("helpers.tsx", "bg-transparent font-bold", "bg-transparent"): "the search match keeps its <mark>; its weight moved into the <Text variant=\"body-bold\"|\"small-bold-loose\"> inside it; markup case 'Block menu: search match in a title and a description'",
  ("NoModelNotice.tsx", "font-medium underline underline-offset-2", "underline underline-offset-2"): "the link keeps its underline; its weight moved into the <Text variant=\"body-medium-tight\"> inside it; markup case 'NoModelNotice: setup guide link'",
  ("MCPToolDialog.tsx", "text-sm font-medium", "body-medium-tight"): "MCPAuthSchemeField's dev labelClassName paired with the labelVariant that replaced it; markup case 'MCP: auth scheme label (MCPAuthSchemeField)'",
  ("MCPToolDialog.tsx", "text-sm", "body-medium-tight"): "the token Label's dev className paired with the variant of the <Text> it now wraps; markup case 'MCP: token label (legacy Label kept)'",
  ("MCPToolDialog.tsx", "flex justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200", "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"): "the credential link's button against dev's #16092 version, which centres an inline <Text className=\"underline\">; here the copy is a block <Text variant=\"small-tight-underline\">; markup case 'MCP: enter a credential manually'",
  ("MCPToolDialog.tsx", "font-sans text-caption font-normal leading-4 text-inherit underline", "font-sans text-caption font-normal leading-4 underline text-inherit block"): "the same credential link's <Text>: dev's inline span in a flex button against this block span; markup case 'MCP: enter a credential manually'",
  ("MCPToolDialog.tsx", "text-body font-medium leading-5", "body-medium-tight"): "dev's labelClassName paired with the labelVariant that replaced it; markup case 'MCP: auth scheme label (MCPAuthSchemeField)'",
}
d = json.load(open(sys.argv[1])); keep, out = [], []
for p in d["pairs"]:
    k = (p["file"].split("/")[-1], p["old"], p["new"])
    if k in DROP: out.append({**p, "why": DROP[k]})
    else: keep.append(p)
d["pairs"] = keep; json.dump(d, open(sys.argv[1], "w"))
json.dump({"excluded": out}, open(sys.argv[2], "w"), indent=1)
print(len(out), "mis-aligned pairs excluded;", len(keep), "kept")
