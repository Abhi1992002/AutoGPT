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
// The copilot greeting orb's entrance races the greeting request on dev itself
// (two states per load); no PR in this stack touches it, so every capture hides
// it (layout kept), base and head alike.
const ORB_CSS = `(() => { const css = '[data-testid="onboarding-intro-card"] > div:first-child > span:first-child, [data-testid="greeting-loader"] > span[class*="size-16"] { visibility: hidden !important; }'; const add = () => { const st = document.createElement("style"); st.setAttribute("data-evidence-mask", "orb"); st.textContent = css; (document.head || document.documentElement).appendChild(st); }; if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add); else add(); })();`;
const orig = Browser.prototype.newContext;
Browser.prototype.newContext = async function (...args) {
  const ctx = await orig.apply(this, args);
  await ctx.addInitScript(SEED);
  await ctx.addInitScript(ORB_CSS);
  return ctx;
};
