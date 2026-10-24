// Preloaded with NODE_OPTIONS=--require for every capture (DS1 script and
// interact.ts alike, base and head alike): every browser context gets an init
// script that replaces Math.random with a fixed-seed PRNG, so randomised
// canvases (the tour's DotDistortionShader) paint the same frame on every run.
const { createRequire } = require("node:module");
const { join, dirname } = require("node:path");
const root = createRequire(join("/home/vercel-sandbox/autogpt/autogpt_platform/frontend", "package.json"));
const fromTest = createRequire(root.resolve("@playwright/test/package.json"));
const fromPw = createRequire(fromTest.resolve("playwright/package.json"));
const coreDir = dirname(fromPw.resolve("playwright-core/package.json"));
const { Browser } = require(join(coreDir, "lib/client/browser.js"));
const SEED = `(() => { let s = 0x2F6E2B1; window.__reseed = () => { s = 0x2F6E2B1; }; Math.random = function () { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const orig = Browser.prototype.newContext;
Browser.prototype.newContext = async function (...args) {
  const ctx = await orig.apply(this, args);
  await ctx.addInitScript(SEED);
  return ctx;
};
