import { readdirSync } from "node:fs";
import { reactCompilerSources } from "../next.config.mjs";
const files = readdirSync("src", { recursive: true }).map((f) => `/src/${String(f)}`)
  .filter((f) => reactCompilerSources.some((s: string) => f.includes(s)) && /\.(ts|tsx)$/.test(f) && !/\.(test|spec|stories)\.tsx?$/.test(f) && !f.includes("__tests__"));
console.log(files.length, "compiled source files;", files.filter((f) => !f.includes("/copilot/")).join(", "));
