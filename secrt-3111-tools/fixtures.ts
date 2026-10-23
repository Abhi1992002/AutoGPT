// Fixture tool parts for the DS5g tool-card harness. Deterministic: fixed ids,
// no dates, no randomness. Shapes follow each tool's helpers and its
// __tests__ / styleguide fixtures.

export interface FixturePart {
  type: string;
  toolCallId: string;
  state: "output-available" | "output-error";
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

export interface FixtureCase {
  label: string;
  part: FixturePart;
}

let counter = 0;

function ok(type: string, input: unknown, output: unknown): FixturePart {
  counter += 1;
  return {
    type: `tool-${type}`,
    toolCallId: `harness-call-${counter}`,
    state: "output-available",
    input,
    output,
  };
}

function failed(
  type: string,
  input: unknown,
  errorText: string,
  output?: unknown,
): FixturePart {
  counter += 1;
  return {
    type: `tool-${type}`,
    toolCallId: `harness-call-${counter}`,
    state: "output-error",
    input,
    errorText,
    ...(output !== undefined ? { output } : {}),
  };
}

function errorOutput(message: string, error: string) {
  return { type: "error", message, error };
}

/* ------------------------------------------------------------------ */

export const findCapabilities: FixtureCase[] = [
  {
    label: "output-available (badges: connected / grant needed / sign in; kinds)",
    part: ok(
      "find_capability",
      { query: "linear issue" },
      {
        type: "capability_list",
        query: "linear issue",
        count: 3,
        capabilities: [
          {
            id: "mcp:mcp.linear.app",
            name: "Linear",
            purpose: "Issues, projects and cycles",
            kind: "mcp_server",
            connected: true,
          },
          {
            id: "mcp:mcp.notion.com",
            name: "Notion",
            purpose: "Pages and databases",
            kind: "mcp_server",
            connected: "needs_expert_grant",
          },
          {
            id: "block:abc-123",
            name: "Send Web Request",
            purpose: "Call an HTTP endpoint",
            kind: "block",
            connected: false,
          },
        ],
        fallback: [
          {
            id: "block:def-456",
            name: "HTTP Request",
            purpose: "A lower-level request",
            kind: "block",
            class: "primitive",
          },
        ],
      },
    ),
  },
  {
    label: "output-error",
    part: failed("find_capability", { query: "linear issue" }, "Search failed"),
  },
];

export const findBlocks: FixtureCase[] = [
  {
    label: "output-available",
    part: ok(
      "find_block",
      { query: "weather" },
      {
        type: "block_list",
        count: 3,
        blocks: [
          {
            id: "block-1",
            name: "Get Weather",
            description: "Fetches current weather data for a given city.",
            categories: [],
          },
          {
            id: "block-2",
            name: "Weather Forecast",
            description: "Returns a 5-day forecast for any location.",
            categories: [],
          },
          {
            id: "block-3",
            name: "Historical Weather",
            description: "Retrieves weather data for the past 30 days.",
            categories: [],
          },
        ],
      },
    ),
  },
  {
    label: "output-error",
    part: failed("find_block", { query: "weather" }, "Block search failed"),
  },
];

export const findAgents: FixtureCase[] = [
  {
    label: "find_agent output-available",
    part: ok(
      "find_agent",
      { query: "youtube summarizer" },
      {
        type: "agents_found",
        count: 2,
        agents: [
          {
            id: "creator/youtube-summarizer",
            name: "YouTube Summarizer",
            description: "Summarizes YouTube videos into bullet points.",
            source: "marketplace",
          },
          {
            id: "creator/video-digest",
            name: "Video Digest Pro",
            description: "Creates detailed summaries with timestamps.",
            source: "marketplace",
          },
        ],
      },
    ),
  },
  {
    label: "find_library_agent output-available",
    part: ok(
      "find_library_agent",
      { query: "email" },
      {
        type: "agents_found",
        count: 1,
        agents: [
          {
            id: "lib-agent-1",
            name: "Email Summarizer",
            description: "Summarizes your unread email every morning.",
            source: "library",
          },
        ],
      },
    ),
  },
  {
    label: "find_agent output-available, error output",
    part: ok(
      "find_agent",
      { query: "quantum" },
      errorOutput("Marketplace search failed.", "timeout"),
    ),
  },
  {
    label: "find_agent output-error",
    part: failed("find_agent", { query: "quantum" }, "Search failed"),
  },
];

export const searchDocs: FixtureCase[] = [
  {
    label: "search_docs output-available",
    part: ok(
      "search_docs",
      { query: "webhooks" },
      {
        type: "doc_search_results",
        query: "webhooks",
        count: 2,
        results: [
          {
            title: "Webhook Configuration Guide",
            path: "platform/webhooks/configuration.md",
            section: "Setup",
            snippet: "Webhooks let you receive real-time notifications.",
            doc_url: "https://docs.agpt.co/platform/webhooks/configuration",
          },
          {
            title: "Webhook Events Reference",
            path: "platform/webhooks/events.md",
            section: "Event Types",
            snippet: "A reference of all webhook event types.",
            doc_url: "https://docs.agpt.co/platform/webhooks/events",
          },
        ],
      },
    ),
  },
  {
    label: "get_doc_page output-available",
    part: ok(
      "get_doc_page",
      { path: "platform/getting-started.md" },
      {
        type: "doc_page",
        title: "Getting Started",
        path: "platform/getting-started.md",
        content:
          "Welcome!\n\n## Quick Start\n1. Open the Builder\n2. Add blocks",
        doc_url: "https://docs.agpt.co/platform/getting-started",
      },
    ),
  },
  {
    label: "search_docs output-available, error output",
    part: ok(
      "search_docs",
      { query: "webhooks" },
      errorOutput("Docs search failed.", "index offline"),
    ),
  },
  {
    label: "search_docs output-error",
    part: failed("search_docs", { query: "webhooks" }, "Search failed"),
  },
  {
    label: "get_doc_page output-error",
    part: failed(
      "get_doc_page",
      { path: "platform/getting-started.md" },
      "Page not found",
    ),
  },
];

const BLOCK_ITEMS = [1, 2, 3, 4, 5, 6].map((i) => ({
  title: `Article ${i}`,
  score: 100 - i,
}));

export const blockOutputDryRun = {
  type: "block_output" as const,
  block_id: "scraper-303",
  block_name: "Web Scraper",
  message: "Scraped 6 articles from the feed.",
  is_dry_run: true,
  outputs: { articles: BLOCK_ITEMS },
};

export const blockErrorOutput = {
  type: "error" as const,
  message: "Something went wrong while running this step.",
  error: "Execution timed out after 30 seconds.",
  details: { block_id: "weather-block-123", timeout_ms: 30000 },
};

export const runBlock: FixtureCase[] = [
  {
    label: "output-available (dry run, 6 items > limit 3)",
    part: ok(
      "run_block",
      { block_id: "scraper-303", block_name: "Web Scraper", dry_run: true },
      blockOutputDryRun,
    ),
  },
  {
    label: "output-available, error output (ErrorCard)",
    part: ok(
      "run_block",
      { block_id: "weather-block-123", block_name: "Get Weather" },
      blockErrorOutput,
    ),
  },
  {
    label: "output-available, corrupted JSON",
    part: ok(
      "run_block",
      { block_id: "weather-block-123", block_name: "Get Weather" },
      '{"type":"block_output","block_na',
    ),
  },
  {
    label: "output-error",
    part: failed(
      "run_block",
      { block_id: "weather-block-123", block_name: "Get Weather" },
      "Block failed",
    ),
  },
];

export const executionStarted = {
  type: "execution_started" as const,
  execution_id: "exec-abc-123-def-456",
  graph_id: "graph-123",
  graph_name: "YouTube Summarizer",
  message: "Execution started. Track progress in your library.",
  status: "running",
  library_agent_link: "/library/agents/lib-123",
};

export const runErrorOutput = {
  type: "error" as const,
  message: "Could not start the run.",
  error: "graph not found",
};

export const agentDetails = {
  type: "agent_details" as const,
  message: "Here are the details.",
  agent: {
    id: "agent-123",
    name: "YouTube Summarizer",
    description: "Summarizes videos.",
  },
};

export const runAgent: FixtureCase[] = [
  {
    label: "run_agent output-available (execution started)",
    part: ok(
      "run_agent",
      { username_agent_slug: "creator/my-agent" },
      executionStarted,
    ),
  },
  {
    label: "run_agent output-available (agent details)",
    part: ok(
      "run_agent",
      { username_agent_slug: "creator/my-agent" },
      agentDetails,
    ),
  },
  {
    label: "schedule_agent output-available (scheduled)",
    part: ok(
      "schedule_agent",
      { username_agent_slug: "creator/my-agent" },
      { ...executionStarted, status: "scheduled", execution_id: "sched-1" },
    ),
  },
  {
    label: "run_agent output-available, error output (ErrorCard)",
    part: ok(
      "run_agent",
      { username_agent_slug: "creator/broken" },
      runErrorOutput,
    ),
  },
  {
    label: "run_agent output-available, corrupted JSON",
    part: ok(
      "run_agent",
      { username_agent_slug: "creator/broken" },
      '{"type":"setup_requirements","mess',
    ),
  },
  {
    label: "run_agent output-error",
    part: failed(
      "run_agent",
      { username_agent_slug: "creator/broken" },
      "Run failed",
    ),
  },
];

export const mcpToolOutput = {
  type: "mcp_tool_output" as const,
  message: "Tool ran.",
  server_url: "https://mcp.linear.app/mcp",
  tool_name: "search_issues",
  result: "INT-42 Add dark mode\nINT-87 Dark theme for output viewer",
  success: true,
};

function mcpSetup(connected: boolean, name: string, url: string) {
  return {
    type: "setup_requirements" as const,
    message: `Connect ${name} to continue.`,
    setup_info: {
      agent_id: url,
      agent_name: name,
      requirements: {},
      user_readiness: {
        has_all_credentials: connected,
        missing_credentials: {},
        ready_to_run: connected,
      },
    },
  };
}

export const mcpSetupConnected = mcpSetup(
  true,
  "Linear",
  "https://mcp.linear.app/mcp",
);
export const mcpSetupDisconnected = mcpSetup(
  false,
  "Sentry",
  "https://mcp.sentry.dev/mcp",
);

export const runMcpTool: FixtureCase[] = [
  {
    label: "output-available (MCPToolOutputCard)",
    part: ok(
      "run_mcp_tool",
      { server_url: "https://mcp.linear.app/mcp", tool_name: "search_issues" },
      mcpToolOutput,
    ),
  },
  {
    label: "output-available, error output (error card)",
    part: ok(
      "run_mcp_tool",
      { server_url: "https://mcp.linear.app/mcp", tool_name: "create_issue" },
      {
        type: "error",
        message: "The MCP server rejected the call.",
        error: "401 Unauthorized",
      },
    ),
  },
  {
    label: "output-available, setup requirements (MCPSetupCard connected)",
    part: ok(
      "run_mcp_tool",
      { server_url: "https://mcp.linear.app/mcp", tool_name: "search_issues" },
      mcpSetupConnected,
    ),
  },
  {
    label: "output-available, corrupted JSON",
    part: ok(
      "run_mcp_tool",
      { server_url: "https://mcp.notion.com/mcp", tool_name: "search" },
      '{"type":"setup_requirements","message":"Connect Noti',
    ),
  },
  {
    label: "output-error (with error output)",
    part: failed(
      "run_mcp_tool",
      { server_url: "https://mcp.linear.app/mcp", tool_name: "create_issue" },
      "MCP call failed",
      { type: "error", message: "The MCP call failed.", error: "boom" },
    ),
  },
];

export const createAgent: FixtureCase[] = [
  {
    label: "output-available (saved)",
    part: ok(
      "create_agent",
      { goal: "Summarize my email" },
      {
        type: "agent_builder_saved",
        agent_id: "agent-789",
        agent_name: "Email Summarizer",
        library_agent_id: "lib-agent-789",
        library_agent_link: "/library/agents/lib-agent-789",
        agent_page_link: "/build?agent=agent-789",
        message: "Saved.",
      },
    ),
  },
  {
    label: "output-available (suggested goal, vague)",
    part: ok(
      "create_agent",
      { goal: "Make me rich" },
      {
        type: "suggested_goal",
        message: "That goal is too vague to build.",
        suggested_goal: "Track 5 stock prices daily and email me a summary",
        reason: "The original goal has no measurable outcome.",
        original_goal: "Make me rich",
        goal_type: "vague",
      },
    ),
  },
  {
    label: "output-available (suggested goal, unachievable)",
    part: ok(
      "create_agent",
      { goal: "Predict the lottery" },
      {
        type: "suggested_goal",
        message: "That goal can't be accomplished.",
        suggested_goal: "Track lottery results and email them to me",
        reason: "Random draws cannot be predicted.",
        original_goal: "Predict the lottery",
        goal_type: "unachievable",
      },
    ),
  },
  {
    label: "output-available, error output",
    part: ok(
      "create_agent",
      { goal: "Broken" },
      errorOutput("Could not build that.", "validation failed"),
    ),
  },
  {
    label: "output-error",
    part: failed("create_agent", { goal: "Broken" }, "Generation failed"),
  },
];

export const editAgent: FixtureCase[] = [
  {
    label: "output-available (saved)",
    part: ok(
      "edit_agent",
      { agent_id: "agent-789", changes: "Add a Slack step" },
      {
        type: "agent_builder_saved",
        agent_id: "agent-789",
        agent_name: "Email Summarizer",
        library_agent_id: "lib-agent-789",
        library_agent_link: "/library/agents/lib-agent-789",
        agent_page_link: "/build?agent=agent-789",
        message: "Updated.",
      },
    ),
  },
  {
    label: "output-available, error output",
    part: ok(
      "edit_agent",
      { agent_id: "agent-000" },
      errorOutput("Could not edit that.", "not found"),
    ),
  },
  {
    label: "output-error",
    part: failed("edit_agent", { agent_id: "agent-000" }, "Edit failed"),
  },
];

export const decompositionSteps = [
  {
    step_id: "step_1",
    description: "Accept a topic from the user",
    action: "add_input",
    block_name: null,
    status: "completed",
  },
  {
    step_id: "step_2",
    description: "Summarize the topic with AI",
    action: "add_block",
    block_name: "AI Text Generator",
    status: "in_progress",
  },
  {
    step_id: "step_3",
    description: "Fetch matching headlines",
    action: "add_block",
    block_name: "RSS Reader",
    status: "failed",
  },
  {
    step_id: "step_4",
    description: "Hand the result back to the user",
    action: "connect_blocks",
    block_name: null,
    status: "pending",
  },
];

export const decomposeGoal: FixtureCase[] = [
  {
    label: "output-available (completed / in_progress / failed / pending)",
    part: ok(
      "decompose_goal",
      { goal: "Build a news summarizer" },
      {
        type: "task_decomposition",
        message: "Here's the plan (4 steps):",
        goal: "Build a news summarizer",
        step_count: 4,
        steps: decompositionSteps,
      },
    ),
  },
  {
    label: "output-available, error output",
    part: ok(
      "decompose_goal",
      { goal: "???" },
      { type: "error", error: "Could not break it down.", message: "Try again." },
    ),
  },
  {
    label: "output-error",
    part: failed("decompose_goal", { goal: "???" }, "Decomposition failed"),
  },
];

const FOLDER_PLAIN = {
  id: "folder-1",
  name: "Marketing",
  parent_id: null,
  icon: null,
  color: null,
  agent_count: 2,
  subfolder_count: 1,
  agents: [
    { id: "a1", name: "Email Summarizer" },
    { id: "a2", name: "Tweet Writer" },
  ],
};

const FOLDER_COLORED = {
  id: "folder-3",
  name: "Sales",
  parent_id: null,
  icon: null,
  color: "#3B82F6",
  agent_count: 1,
  subfolder_count: 0,
  agents: [{ id: "a3", name: "Lead Scorer" }],
};

export const folderTool: FixtureCase[] = [
  {
    label: "create_folder output-available (no colour, with agents)",
    part: ok("create_folder", { name: "Marketing" }, {
      type: "folder_created",
      message: "Created Marketing",
      folder: FOLDER_PLAIN,
    }),
  },
  {
    label: "update_folder output-available (with colour)",
    part: ok("update_folder", { folder_id: "folder-3" }, {
      type: "folder_updated",
      message: "Updated Sales",
      folder: FOLDER_COLORED,
    }),
  },
  {
    label: "list_folders output-available (cards)",
    part: ok("list_folders", {}, {
      type: "folder_list",
      message: "2 folders",
      count: 2,
      folders: [FOLDER_PLAIN, FOLDER_COLORED],
    }),
  },
  {
    label: "list_folders output-available (tree)",
    part: ok("list_folders", { tree: true }, {
      type: "folder_list",
      message: "2 folders",
      count: 2,
      tree: [
        {
          ...FOLDER_PLAIN,
          children: [
            {
              id: "folder-2",
              name: "Campaigns",
              parent_id: "folder-1",
              agent_count: 1,
              subfolder_count: 0,
              agents: [{ id: "a4", name: "Ad Copywriter" }],
              children: [],
            },
          ],
        },
      ],
    }),
  },
  {
    label: "delete_folder output-available, error output",
    part: ok("delete_folder", { folder_id: "folder-x" }, {
      type: "error",
      message: "Folder not found",
      error: "404",
    }),
  },
  {
    label: "delete_folder output-error",
    part: failed("delete_folder", { folder_id: "folder-x" }, "Delete failed"),
  },
];

export const searchFeatureRequests: FixtureCase[] = [
  {
    label: "output-available",
    part: ok(
      "search_feature_requests",
      { query: "dark mode" },
      {
        type: "feature_request_search",
        message: 'Found 2 feature request(s) matching "dark mode".',
        query: "dark mode",
        count: 2,
        results: [
          {
            id: "fr-001",
            identifier: "INT-42",
            title: "Add dark mode",
            description: "Reduce eye strain.",
          },
          {
            id: "fr-002",
            identifier: "INT-87",
            title: "Dark output viewer",
            description: "Dark theme for runs.",
          },
        ],
      },
    ),
  },
  {
    label: "output-available, error output",
    part: ok(
      "search_feature_requests",
      { query: "x" },
      errorOutput("Feature request search failed.", "linear down"),
    ),
  },
  {
    label: "output-error",
    part: failed("search_feature_requests", { query: "x" }, "Search failed"),
  },
];

export const createFeatureRequest: FixtureCase[] = [
  {
    label: "output-available (new issue)",
    part: ok(
      "create_feature_request",
      { title: "Add dark mode", description: "Please." },
      {
        type: "feature_request_created",
        message: "Created new feature request [INT-105] Add dark mode.",
        issue_id: "issue-new-123",
        issue_identifier: "INT-105",
        issue_title: "Add dark mode",
        issue_url: "https://linear.app/autogpt/issue/INT-105/add-dark-mode",
        is_new_issue: true,
        customer_name: "user-abc-123",
      },
    ),
  },
  {
    label: "output-available, error output",
    part: ok(
      "create_feature_request",
      { title: "x" },
      errorOutput("Could not create the request.", "linear down"),
    ),
  },
  {
    label: "output-error",
    part: failed("create_feature_request", { title: "x" }, "Create failed"),
  },
];

export const setupTrigger: FixtureCase[] = [
  {
    label: "output-available (trigger set up)",
    part: ok(
      "setup_agent_webhook_trigger",
      { agent_id: "lib-1" },
      {
        type: "trigger_setup",
        message: "Webhook trigger ready.",
        preset_id: "p1",
        library_agent_id: "lib-1",
        library_agent_link: "/library/agents/lib-1",
        name: "My Trigger",
        is_active: true,
        provider: "generic_webhook",
        manual_setup_required: true,
        webhook_url:
          "https://backend.example/api/integrations/generic_webhook/webhooks/wh-1/ingress",
      },
    ),
  },
  {
    label: "output-available, error output",
    part: ok(
      "setup_agent_webhook_trigger",
      { agent_id: "lib-2" },
      errorOutput("Could not set up the trigger.", "bad provider"),
    ),
  },
  {
    label: "output-error",
    part: failed(
      "setup_agent_webhook_trigger",
      { agent_id: "lib-2" },
      "Trigger setup failed",
    ),
  },
];

export const viewAgentOutput: FixtureCase[] = [
  {
    label: "output-available",
    part: ok(
      "view_agent_output",
      { agent_name: "YouTube Summarizer", execution_id: "exec-abc-123" },
      {
        type: "agent_output",
        agent_id: "agent-123",
        agent_name: "YouTube Summarizer",
        message: "Here are the results from the last execution.",
        library_agent_link: "/library/agents/lib-agent-123",
        execution: {
          execution_id: "exec-abc-123",
          status: "completed",
          inputs_summary: { topic: "news" },
          outputs: { summary: ["Key points: 1, 2, 3"], keywords: ["a", "b"] },
        },
      },
    ),
  },
  {
    label: "output-available, error output",
    part: ok(
      "view_agent_output",
      { agent_name: "Ghost" },
      errorOutput("Could not load the output.", "not found"),
    ),
  },
  {
    label: "output-error",
    part: failed("view_agent_output", { agent_name: "Ghost" }, "Load failed"),
  },
];

export const connectIntegration: FixtureCase[] = [
  {
    label: "output-error (message from output)",
    part: failed("connect_integration", { provider: "github" }, "OAuth denied", {
      message: "OAuth denied",
    }),
  },
  {
    label: "output-error (no output, generic message)",
    part: failed("connect_integration", { provider: "github" }, "Failed"),
  },
  {
    label: "output-available, corrupted JSON",
    part: ok(
      "connect_integration",
      { provider: "github" },
      '{"setup_info":{"agent_name":"GitHub"',
    ),
  },
];

export const askQuestion: FixtureCase[] = [
  {
    label: "output-available (clarification questions)",
    part: ok(
      "ask_question",
      { question: "Which inbox?" },
      {
        type: "agent_builder_clarification_needed",
        message: "I need a bit more detail.",
        questions: [
          {
            question: "Which inbox should I read?",
            keyword: "inbox",
            example: "work@acme.com",
          },
        ],
      },
    ),
  },
  {
    label: "output-available, error output",
    part: ok(
      "ask_question",
      { question: "?" },
      errorOutput("Could not ask the question.", "bad input"),
    ),
  },
  {
    label: "output-error",
    part: failed("ask_question", { question: "?" }, "Question failed"),
  },
];

export const genericTool: FixtureCase[] = [
  {
    label: "bash_exec output-available (stdout + stderr, exit 2)",
    part: ok(
      "bash_exec",
      { command: "ls /nope && echo done" },
      {
        type: "bash_exec",
        stdout: "done\n",
        stderr: "ls: cannot access '/nope': No such file or directory\n",
        exit_code: 2,
        message: "Command failed",
      },
    ),
  },
  {
    label: "web_search output-available (answer, citations, url, snippet, page_age)",
    part: ok(
      "web_search",
      { query: "AutoGPT platform" },
      {
        type: "web_search",
        query: "AutoGPT platform",
        answer: "AutoGPT is a platform for building AI workflows [1][2].",
        results: [
          {
            n: 1,
            title: "AutoGPT Platform",
            url: "https://agpt.co",
            snippet: "Build, deploy and run AI workflows.",
            page_age: "2 days ago",
          },
          {
            n: 2,
            title: "AutoGPT on GitHub",
            url: "https://github.com/Significant-Gravitas/AutoGPT",
            snippet: "The open source repository.",
            page_age: "1 week ago",
          },
        ],
      },
    ),
  },
  {
    label: "edit_file output-available (old / new strings)",
    part: ok(
      "edit_file",
      {
        file_path: "notes/todo.md",
        old_string: "- [ ] ship it",
        new_string: "- [x] ship it",
      },
      { type: "workspace_file_written", message: "Edited notes/todo.md" },
    ),
  },
  {
    label: "TodoWrite output-available (completed / in_progress / pending)",
    part: ok(
      "TodoWrite",
      {
        todos: [
          { content: "Research", status: "completed", activeForm: "Researching" },
          { content: "Draft", status: "in_progress", activeForm: "Drafting" },
          { content: "Review", status: "pending", activeForm: "Reviewing" },
        ],
      },
      { type: "todo_write", message: "Todos updated" },
    ),
  },
  {
    label: "bash_exec output-error (with output, accordion title in error colour)",
    part: failed("bash_exec", { command: "exit 1" }, "Command failed", {
      type: "bash_exec",
      stdout: "",
      stderr: "fatal: boom\n",
      exit_code: 1,
      message: "Command failed",
    }),
  },
  {
    label: "web_fetch output-error (no output)",
    part: failed("web_fetch", { url: "https://example.com" }, "Fetch failed"),
  },
];
