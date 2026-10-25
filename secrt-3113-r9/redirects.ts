import { chromium } from "@playwright/test";
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const r = await ctx.request.post(
    "http://localhost:3000/api/auth/sign-in/email",
    {
      data: {
        email: process.env.SCREENSHOT_EMAIL,
        password: process.env.SCREENSHOT_PASSWORD,
      },
      headers: { "Content-Type": "application/json" },
    },
  );
  console.log("sign-in", r.status());
  const p = await ctx.newPage();
  const S = "/copilot?sessionId=5eed7113-0000-4000-8000-00000000000";
  for (const route of [
    "/marketplace",
    "/library",
    "/home",
    "/copilot",
    "/team",
    "/team/autopilot",
    "/build",
    "/settings/profile",
    "/settings/account",
    "/settings/api-keys",
    "/settings/integrations",
    "/copilot/styleguide",
    "/tour/chat",
    "/ds3b3-harness",
    `${S}1`,
    `${S}2`,
  ]) {
    const resp = await p.goto("http://localhost:3000" + route, {
      waitUntil: "load",
      timeout: 60000,
    });
    await p.waitForTimeout(4000);
    const final = new URL(p.url());
    const want = new URL("http://localhost:3000" + route);
    const same =
      final.pathname === want.pathname && final.search === want.search;
    console.log(
      `${same ? "same " : "REDIRECT"} ${route} -> ${final.pathname}${final.search} (HTTP ${resp?.status()})`,
    );
  }
  const pub = await b.newContext();
  const pp = await pub.newPage();
  for (const route of ["/login", "/signup", "/reset-password"]) {
    await pp.goto("http://localhost:3000" + route, { waitUntil: "load" });
    await pp.waitForTimeout(3000);
    console.log(
      `public ${new URL(pp.url()).pathname === route ? "same " : "REDIRECT"} ${route} -> ${new URL(pp.url()).pathname}`,
    );
  }
  await b.close();
})();
