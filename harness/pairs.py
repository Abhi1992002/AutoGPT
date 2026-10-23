"""Pairs every class-string literal the PR changed in src/components/molecules
(base vs head), by aligning the string literals of each file."""
import difflib, json, re, subprocess, sys
base, head = sys.argv[1], sys.argv[2]
root = "autogpt_platform/frontend/"
files = subprocess.run(["git","diff","--name-only",base,head,"--",root+"src/components/molecules"],capture_output=True,text=True).stdout.split()
LIT = re.compile(r'"([^"\n]*)"|`([^`]*)`|\'([^\'\n]*)\'')
TOK = re.compile(r'^[!\w\[\]&>~:=.#%/(),*-]+$')
def lits(src):
    out=[]
    for m in LIT.finditer(src):
        s=next(g for g in m.groups() if g is not None)
        s=re.sub(r'\$\{[^}]*\}',' ',s)
        if '-' in s and all(TOK.match(t) for t in s.split()) and s.strip():
            out.append(" ".join(s.split()))
    return out
def show(ref,path):
    r=subprocess.run(["git","show",f"{ref}:{path}"],capture_output=True,text=True)
    return r.stdout if r.returncode==0 else ""
pairs=[]
for f in files:
    if f.endswith(".css"): continue
    a,b=lits(show(base,f)),lits(show(head,f))
    sm=difflib.SequenceMatcher(None,a,b,autojunk=False)
    for op,i1,i2,j1,j2 in sm.get_opcodes():
        if op=="equal": continue
        if op=="replace" and i2-i1==j2-j1:
            for x,y in zip(a[i1:i2],b[j1:j2]): pairs.append({"file":f.replace(root+"src/components/molecules/",""),"old":x,"new":y})
        else:
            for x in a[i1:i2]: pairs.append({"file":f.replace(root+"src/components/molecules/",""),"old":x,"new":None})
            for y in b[j1:j2]: pairs.append({"file":f.replace(root+"src/components/molecules/",""),"old":None,"new":y})
json.dump(pairs,sys.stdout,indent=1)
