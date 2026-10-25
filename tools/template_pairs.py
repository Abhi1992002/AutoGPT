"""The class strings #16103's tutorial builds in template literals, which
extract_pairs can't pair: banner() for each BannerVariant, and the connection
status div in both states. Resolved from each SHA's source and appended to the
PR's pair list (as written: Shepherd injects them as innerHTML, nothing merges
them).
  python3 template_pairs.py <base sha> <head sha> <all-pairs.json>"""
import json, re, subprocess, sys
base, head, out = sys.argv[1:4]
T = "autogpt_platform/frontend/src/app/(platform)/build/components/FlowEditor/tutorial/"
show = lambda sha, f: subprocess.run(["git", "show", f"{sha}:{T}{f}"], capture_output=True, text=True, check=True, cwd="/home/vercel-sandbox/autogpt").stdout
def banners(sha):
    s = show(sha, "styles.ts")
    styles = {v: dict(re.findall(r'(bg|ring|text):\s*"([^"]+)"', body)) for v, body in re.findall(r"\n  (\w+): \{(.*?)\n  \}", s.split("bannerStyles")[1], re.S)}
    tmpl = re.search(r'<div class="(\$\{styles\.bg\}.*?)">', s).group(1)
    return {v: re.sub(r"\s+", " ", tmpl.replace("${styles.bg}", st["bg"]).replace("${styles.ring}", st["ring"]).replace("${styles.text}", st["text"]).replace('${className || ""}', "")).strip() for v, st in styles.items()}
def status(sha):
    s = show(sha, "steps/connections.ts")
    m = re.search(r'<div id="\$\{id\}" class="(.*?)">', s)
    t = m.group(1)
    def resolve(connected):
        return re.sub(r"\s+", " ", re.sub(r'\$\{isConnected \? "([^"]*)" : "([^"]*)"\}', lambda mm: mm.group(1) if connected else mm.group(2), t)).strip()
    return {"connected": resolve(True), "waiting": resolve(False)}
b0, b1 = banners(base), banners(head); s0, s1 = status(base), status(head)
pairs = [{"file": "src/app/(platform)/build/components/FlowEditor/tutorial/styles.ts", "old": b0[v], "new": b1[v], "tag": "div", "template": f"banner({v})"} for v in b0]
pairs += [{"file": "src/app/(platform)/build/components/FlowEditor/tutorial/steps/connections.ts", "old": s0[k], "new": s1[k], "tag": "div", "template": f"connection status ({k})"} for k in s0]
d = json.load(open(out)); d["pairs"] = [p for p in d["pairs"] if not p.get("template")] + pairs
json.dump(d, open(out, "w"))
for p in pairs: print(p["template"], "|", p["old"], "=>", p["new"])
