const { chromium } = require("/home/vercel-sandbox/autogpt/autogpt_platform/frontend/node_modules/@playwright/test");
const ids=["needs-attention","composer-notices","chat-notices","scheduled-chat-notices","pending-reviews","pending-review-card-standalone","briefing","trial-onboarding","trial-billing"];
(async()=>{const b=await chromium.launch();const p=await b.newPage();const seen=new Map();
for(const id of ids){await p.goto(`http://localhost:6007/iframe.html?id=organisms-attentioncard-consumers--${id}&viewMode=story`);
await p.waitForFunction(()=>document.body.classList.contains('sb-show-main'),undefined,{timeout:30000});await p.waitForTimeout(1500);
const r=await p.evaluate(()=>Array.from(document.querySelectorAll('[data-slot^="attention-card"]')).map(e=>[e.getAttribute('data-slot'),(e.getAttribute('class')||'').trim()]));
for(const [s,c] of r){const k=s+' | '+c;seen.set(k,(seen.get(k)||new Set()).add(id));}}
for(const [k,v] of seen) console.log(k,' <= ',[...v].join(','));await b.close();})();
