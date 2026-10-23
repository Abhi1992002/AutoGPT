// Lists every exact class string this PR changes: the codemod's rewrite of each
// class list in the dev version of the scope, plus the hand edits that follow.
import { execSync } from "node:child_process";
import { buildReplacementMap, buildSizeMap, rewriteSource } from "../../autogpt_platform/frontend/scripts/codemod-tokens";

const base = process.argv[2];
const head = process.argv[3];
const scope = "autogpt_platform/frontend/src/app/(platform)/copilot/tools";
const files = execSync(`git diff --name-only ${base} ${head} -- "${scope}"`, { encoding: "utf8" }).trim().split("\n");
const map = buildReplacementMap();
const sizeMap = buildSizeMap();
const CLASS_LIST = /[^"'`{}]+/g;
const pairs = new Map<string, { oldClass: string; newClass: string; where: string[] }>();
for (const file of files) {
  const oldSrc = execSync(`git show ${base}:"${file}"`, { encoding: "utf8" });
  const headSrc = execSync(`git show ${head}:"${file}"`, { encoding: "utf8" });
  oldSrc.replace(CLASS_LIST, (list: string, offset: number) => {
    const { output } = rewriteSource(list, map, sizeMap);
    let next = output;
    // Hand edit: dead dark: classes removed (BlockOutputCard).
    next = next.replace(/ dark:\S+/g, "");
    if (next !== list) {
      const oldClass = list.trim().replace(/\s+/g, " ");
      const newClass = next.trim().replace(/\s+/g, " ");
      if (!headSrc.replace(/\s+/g, " ").includes(newClass)) {
        throw new Error(`${file}: head does not contain "${newClass}"`);
      }
      const line = oldSrc.slice(0, offset).split("\n").length;
      const key = `${oldClass}=>${newClass}`;
      const entry = pairs.get(key) ?? { oldClass, newClass, where: [] };
      entry.where.push(`${file.replace(scope + "/", "")}:${line}`);
      pairs.set(key, entry);
    }
    return list;
  });
}
console.log(JSON.stringify([...pairs.values()], null, 2));
