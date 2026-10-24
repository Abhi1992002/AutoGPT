// usage: npx tsx manifest.mts <base> <head>  -> markdown: changed file | render change | capture files
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
const req = createRequire(join(process.cwd(), "package.json"));
const ts = req("typescript");
const ROOT = "/home/vercel-sandbox/autogpt";
const [base, head] = process.argv.slice(2);
const P = "autogpt_platform/frontend/src/app/(platform)/build/";
const F = "app__build_flowID_fb6139fc-fa1c-4e42-a41a-28dbd2462089__{desktop,mobile}";
const MAP: Record<string, string> = {
  "components/BuilderActions/BuilderActions.tsx": `${F}, site__actions-simulate-hover`,
  "components/BuilderActions/components/AgentOutputs/AgentOutputs.tsx": "site__actions-agent-outputs (button + sheet: SheetTitle, SheetDescription, Labels)",
  "components/BuilderActions/components/CronSchedulerDialog/CronSchedulerDialog.tsx": "site__actions-schedule-dialog",
  "components/BuilderActions/components/RunGraph/RunGraph.tsx": `${F}, site__actions-simulate-hover`,
  "components/BuilderActions/components/RunInputDialog/RunInputDialog.tsx": "site__actions-run-dialog",
  "components/BuilderChatPanel/BuilderChatPanel.tsx": "site__chat-panel",
  "components/BuilderChatPanel/components/NoModelNotice.tsx": "site__chat-panel",
  "components/BuilderChatPanel/components/PanelHeader.tsx": "site__chat-panel",
  "components/DraftRecoveryDialog/DraftRecoveryPopup.tsx": "site__draft-recovery-popup",
  "components/FloatingSafeModeToogle.tsx": "site__safe-mode-toggles-stubbed, site__safe-mode-toggle-hover-stubbed",
  "components/FlowEditor/Flow/Flow.tsx": `app__build__{desktop,mobile}, ${F}`,
  "components/FlowEditor/Flow/components/CustomControl.tsx": `app__build__desktop, ${F}`,
  "components/FlowEditor/Flow/components/GraphLoadingBox.tsx": "site__graph-loading-stubbed",
  "components/FlowEditor/Flow/components/RunningBackground.tsx": "site__node-run-completed (comment-only)",
  "components/FlowEditor/edges/CustomEdge.tsx": `${F} (edges), extra__flow-node-selected__desktop, site__subagent-resolution-mode (broken edge)`,
  "components/FlowEditor/edges/components/JSBeads.tsx": "site__node-run-completed (comment-only)",
  "components/FlowEditor/handlers/NodeHandle.tsx": `${F} (handles), site__subagent-resolution-mode (broken handle)`,
  "components/FlowEditor/nodes/CustomNode/CustomNode.tsx": `${F}, extra__flow-node-selected__desktop`,
  "components/FlowEditor/nodes/CustomNode/components/NodeAdvancedToggle.tsx": "site__node-advanced-open",
  "components/FlowEditor/nodes/CustomNode/components/NodeBadges.tsx": F,
  "components/FlowEditor/nodes/CustomNode/components/NodeContainer.tsx": `${F}, extra__flow-node-selected__desktop, site__node-hover, site__node-run-completed (status ring)`,
  "components/FlowEditor/nodes/CustomNode/components/NodeContextMenu.tsx": "site__node-menu",
  "components/FlowEditor/nodes/CustomNode/components/NodeExecutionBadge.tsx": "site__node-run-completed",
  "components/FlowEditor/nodes/CustomNode/components/NodeHeader.tsx": `${F}, site__node-title-edit`,
  "components/FlowEditor/nodes/CustomNode/components/NodeOutput/NodeOutput.tsx": "site__node-run-completed",
  "components/FlowEditor/nodes/CustomNode/components/NodeOutput/components/ContentRenderer.tsx": "site__node-run-completed, site__node-run-view-more",
  "components/FlowEditor/nodes/CustomNode/components/NodeOutput/components/NodeDataViewer/NodeDataViewer.tsx": "site__node-run-view-more",
  "components/FlowEditor/nodes/CustomNode/components/NodeOutput/components/ViewMoreData.tsx": "site__node-run-completed, site__node-run-view-more",
  "components/FlowEditor/nodes/CustomNode/components/NodeRightClickMenu.tsx": "extra__flow-node-context-menu__desktop",
  "components/FlowEditor/nodes/CustomNode/components/StickyNoteBlock.tsx": F,
  "components/FlowEditor/nodes/CustomNode/components/SubAgentUpdate/SubAgentUpdateFeature.tsx": "site__subagent-update-bar",
  "components/FlowEditor/nodes/CustomNode/components/SubAgentUpdate/components/IncompatibleUpdateDialog.tsx": "site__subagent-incompatible-dialog",
  "components/FlowEditor/nodes/CustomNode/components/SubAgentUpdate/components/ResolutionModeBar.tsx": "site__subagent-resolution-mode",
  "components/FlowEditor/nodes/CustomNode/components/WebhookDisclaimer.tsx": "(comment-only)",
  "components/FlowEditor/nodes/CustomNode/helpers.ts": "site__node-run-completed (status ring, comment-only)",
  "components/FlowEditor/nodes/OutputHandler.tsx": `${F}`,
  "components/FlowEditor/nodes/helpers.ts": `${F} (type labels, untyped edge stroke)`,
  "components/MCPToolDialog.tsx": "site__mcp-dialog, site__mcp-tools-list-stubbed, site__mcp-tool-details-stubbed, site__mcp-tool-selected-stubbed",
  "components/MobileWarning/MobileWarning.tsx": "app__build__mobile",
  "components/NewControlPanel/ControlPanelButton.tsx": `${F}, extra__flow-block-menu__desktop (active)`,
  "components/NewControlPanel/NewControlPanel.tsx": F,
  "components/NewControlPanel/UndoRedoButtons.tsx": `${F} (comment-only)`,
  "components/NewControlPanel/NewSaveControl/NewSaveControl.tsx": "extra__flow-save-popover__desktop",
  "components/NewControlPanel/NewSearchGraph/GraphMenu/GraphMenu.tsx": "extra__flow-graph-search__desktop",
  "components/NewControlPanel/NewSearchGraph/GraphMenuContent/GraphContent.tsx": "extra__flow-graph-search__desktop",
  "components/NewControlPanel/NewSearchGraph/GraphMenuSearchBar/GraphMenuSearchBar.tsx": "extra__flow-graph-search__desktop",
  "components/ReadOnlyBanner/ReadOnlyBanner.tsx": "site__readonly-banner-stubbed",
  "stores/edgeStore.ts": `${F} (edge marker, comment-only)`,
};
const MENU: Record<string, string> = {
  AllBlocksContent: "site__menu-all-blocks", "Block.tsx": "site__menu-all-blocks, site__menu-all-blocks-hover, site__menu-input-blocks, site__menu-action-blocks, site__menu-output-blocks, site__menu-search-results",
  "BlockMenu.tsx": "extra__flow-block-menu__desktop", BlockMenuContent: "extra__flow-block-menu__desktop", BlockMenuDefault: "extra__flow-block-menu__desktop",
  BlockMenuSearchBar: "site__menu-search-results, site__menu-keyboard-focus", BlockMenuSidebar: "extra__flow-block-menu__desktop",
  "FilterChip.tsx": "site__menu-search-results, site__menu-filter-chip-hover", FilterSheet: "site__menu-filter-sheet",
  "HorizontalScroll.tsx": "site__menu-integration-chips-hover", "Integration.tsx": "site__menu-integrations",
  IntegrationBlocks: "site__menu-integration-apollo", "IntegrationChip.tsx": "extra__flow-block-menu__desktop, site__menu-integration-chips-hover",
  "IntergrationBlock.tsx": "site__menu-integration-apollo", "MarketplaceAgentBlock.tsx": "site__menu-marketplace-stubbed",
  "MenuItem.tsx": "extra__flow-block-menu__desktop, site__menu-keyboard-focus", "NoSearchResult.tsx": "site__menu-search-none-stubbed",
  "SearchHistoryChip.tsx": "site__menu-search-history", SuggestionContent: "extra__flow-block-menu__desktop", "UGCAgentBlock.tsx": "site__menu-my-workflows",
  "style.ts": "every site__menu-* capture (container), site__menu-block-drag-preview (drag image)",
};
const compile = (s: string, f: string) => ts.transpileModule(s, { fileName: f, compilerOptions: { jsx: ts.JsxEmit.React, removeComments: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replace(/\s+/g, "");
const files = execSync(`git diff --name-only ${base} ${head} -- '${P}'`, { cwd: ROOT }).toString().split("\n").filter((f) => f && !/__tests__|\.test\./.test(f));
console.log("| changed file | rendering changes? | capture(s) (`<name>.png` under each `*-run*` folder) |\n| --- | --- | --- |");
for (const f of files) {
  const rel = f.slice(P.length);
  let kind = "yes";
  if (/\.css$/.test(f)) kind = "CSS (computed-style table + captures)";
  else {
    let a = ""; try { a = compile(execSync(`git show "${base}:${f}"`, { cwd: ROOT }).toString(), f); } catch { kind = "new"; }
    const b = compile(execSync(`git show "${head}:${f}"`, { cwd: ROOT }).toString(), f);
    if (a && a === b) kind = "comment-only";
  }
  let cap = MAP[rel];
  if (!cap && rel.includes("NewBlockMenu/")) { const k = Object.keys(MENU).find((m) => rel.includes(m)); cap = k ? MENU[k] : undefined; }
  if (!cap && rel.includes("tutorial/")) cap = rel.endsWith("tutorial.css") || rel.endsWith("styles.ts") || rel.endsWith("icons.ts") ? "tutorial__* (all 20 steps x 2 viewports), extra__tutorial-welcome__desktop, extra__tutorial-step-2__desktop" : `tutorial__* steps from ${rel.split("/").pop()}`;
  if (!cap && rel.endsWith("flow.css")) cap = `${F} (dot grid)`;
  console.log(`| \`${rel}\` | ${kind} | ${cap ?? "**MISSING**"} |`);
}
