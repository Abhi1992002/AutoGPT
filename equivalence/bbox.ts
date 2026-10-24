import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const fromTest = createRequire(createRequire(join(process.cwd(), "package.json")).resolve("@playwright/test/package.json"));
const fromPw = createRequire(fromTest.resolve("playwright/package.json"));
const coreDir = dirname(fromPw.resolve("playwright-core/package.json"));
const { PNG } = fromPw(join(coreDir, "lib/utilsBundle.js"));
const [a, b] = process.argv.slice(2).map((f) => PNG.sync.read(readFileSync(f)));
let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
  const i = (y * a.width + x) * 4;
  if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
}
console.log(x1 < 0 ? "identical" : `changed box x ${x0}-${x1}, y ${y0}-${y1}`);
