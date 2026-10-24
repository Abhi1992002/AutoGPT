const { chromium } = require(process.cwd()+"/node_modules/@playwright/test");
const port = process.argv[2];
(async()=>{const idx=await (await fetch(`http://localhost:${port}/index.json`)).json();
const P=['tokens-','atoms-button--','atoms-text--','organisms-attentioncard','organisms-trial','copilot-taskprogressbar','copilot-approvalqueue'];
const ids=Object.values(idx.entries).filter(e=>e.type==='story'&&P.some(p=>e.id.startsWith(p))).map(e=>e.id).sort();
const b=await chromium.launch();const p=await b.newPage();const bad=[];
for(const id of ids){await p.goto(`http://localhost:${port}/iframe.html?id=${id}&viewMode=story`);
 try{await p.waitForFunction(()=>document.body.classList.contains('sb-show-main')||document.body.classList.contains('sb-show-errordisplay'),undefined,{timeout:30000});}catch{bad.push(id+' (timeout)');continue}
 await p.waitForTimeout(300);
 if(await p.evaluate(()=>document.body.classList.contains('sb-show-errordisplay'))) bad.push(id);}
console.log(port, ids.length, 'stories; error display:', bad);await b.close();})();
