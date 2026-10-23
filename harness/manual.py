import json, re, subprocess
B="447fd55be"
def show(p): return subprocess.run(["git","show",f"{B}:autogpt_platform/frontend/{p}"],capture_output=True,text=True,check=True).stdout
sonner=open("autogpt_platform/frontend/node_modules/sonner/dist/styles.css").read()
toast_css=show("src/components/molecules/Toast/styles.module.css")
orb_css=show("src/components/molecules/GlassOrb/GlassOrb.module.css")
# head classes, read from the head files
toaster=open("autogpt_platform/frontend/src/components/molecules/Toast/toaster.tsx").read()
def key(k):
    m=re.search(k+r':\s*\n?\s*"([^"]+)"',toaster); return m.group(1)
T={k:key(k) for k in ["toast","title","description","error","success","warning"]}
orb=open("autogpt_platform/frontend/src/components/molecules/GlassOrb/GlassOrb.tsx").read()
spins=re.findall(r'<div className="(absolute inset-0 animate-\[glass-orb-spin[^"]+)">',orb)
blobs=re.findall(r'<div className="(absolute left-[^"]+)" />',orb)
assert len(spins)==5 and len(blobs)==5
M=[]
F="Toast/toaster.tsx"
for t,extra in [("default",None),("info","toastInfo"),("success","toastSuccess"),("warning","toastWarning"),("error","toastError"),("loading",None)]:
    oc="toastDefault"+(" "+extra if extra else "")
    nc=T["toast"]+((" "+T[t]) if t in T else "")
    M.append(dict(file=F,label=f"toast `{t}`: `{oc}` from styles.module.css",oldCss=sonner+toast_css,newCss=sonner,
      oldHtml=f'<li data-sonner-toast data-styled="true" data-rich-colors="true" data-type="{t}" class="{oc}"><span>a</span><span>b</span></li>',
      newHtml=f'<li data-sonner-toast data-styled="true" data-rich-colors="true" data-type="{t}" class="{nc}"><span>a</span><span>b</span></li>'))
for part,oc in [("title","toastTitle"),("description","toastDescription")]:
    M.append(dict(file=F,label=f"toast {part}: `{oc}` from styles.module.css",oldCss=sonner+toast_css,newCss=sonner,
      oldHtml=f'<div data-title class="{oc}">a</div>',newHtml=f'<div data-title class="{T[part]}">a</div>'))
F="GlassOrb/GlassOrb.tsx"
for i in range(5):
    M.append(dict(file=F,label=f"`spinner spinner{i+1}` from GlassOrb.module.css",oldCss=orb_css,reducedMotion=True,pause=True,
      oldHtml=f'<div class="spinner spinner{i+1}"></div>',newHtml=f'<div class="{spins[i]}"></div>'))
    M.append(dict(file=F,label=f"`blob blob{i+1}` from GlassOrb.module.css",oldCss=orb_css,reducedMotion=True,pause=True,
      oldHtml=f'<div class="blob blob{i+1}"></div>',newHtml=f'<div class="{blobs[i]}"></div>'))
M.append(dict(file=F,label='`absolute inset-0` + `style="filter: url(#glass-orb-refraction)"`',
  oldHtml='<div class="absolute inset-0" style="filter: url(#glass-orb-refraction)"></div>',
  newHtml='<div class="absolute inset-0 [filter:url(#glass-orb-refraction)]"></div>'))
M.append(dict(file="ErrorCard/components/CardWrapper.tsx",label='`absolute inset-0 rounded-xl p-[1px]` + `style="background: linear-gradient(135deg, colors.zinc[100], colors.zinc[200], colors.zinc[100])"`',
  oldHtml='<div class="absolute inset-0 rounded-xl p-[1px]" style="background: linear-gradient(135deg, #EFEFF0, #DADADC, #EFEFF0)"><div class="h-full w-full rounded-xl bg-white"></div></div>',
  newHtml='<div class="absolute inset-0 rounded-xl bg-[linear-gradient(135deg,rgb(var(--color-surface-hover)),rgb(var(--color-surface-active)),rgb(var(--color-surface-hover)))] p-px"><div class="h-full w-full rounded-xl bg-surface"></div></div>'))
mask="linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)"
M.append(dict(file="IntegrationsMarquee/IntegrationsMarquee.tsx",label='`relative flex ... overflow-hidden` + `style="mask-image / -webkit-mask-image"`',
  oldHtml=f'<div class="relative flex h-[200px] w-[340px] flex-col justify-center gap-3 overflow-hidden" style="mask-image: {mask}; -webkit-mask-image: {mask}"></div>',
  newHtml='<div class="relative flex h-[200px] w-[340px] flex-col justify-center gap-3 overflow-hidden [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)] [mask-image:linear-gradient(to_right,transparent_0%,black_18%,black_82%,transparent_100%)]"></div>'))
M.append(dict(file="Confetti/Confetti.tsx",label='canvas `... h-full w-full` + `style="width: 100%; height: 100%"`',
  oldHtml='<canvas class="pointer-events-none fixed inset-0 z-50 h-full w-full" style="width:100%;height:100%"></canvas>',
  newHtml='<canvas class="pointer-events-none fixed inset-0 z-50 h-full w-full"></canvas>'))
g=lambda mix: f"linear-gradient(90deg, color-mix(in srgb, #3b82f6 60%, {mix}), color-mix(in srgb, #3b82f6 85%, {mix}))"
M.append(dict(file="ExpertIdentityDetails/ExpertIdentityDetails.tsx",label="inline `backgroundImage` mixing the category colour (sample #3b82f6) with `#18181b`",
  oldHtml=f'<span class="bg-clip-text font-medium text-transparent" style="background-image: {g("#18181b")}">a</span>',
  newHtml=f'<span class="bg-clip-text font-medium text-transparent" style="background-image: {g("rgb(var(--color-primary))")}">a</span>'))
json.dump(M,open(".context/equiv/manual.json","w"),indent=1)
print(len(M))
