#!/usr/bin/env python3
"""Seed copilot chat sessions whose tool calls cover the cards in
autogpt_platform/frontend/src/app/(platform)/copilot/tools/**.

Usage:
    python3 seed_tool_sessions.py <user_id>            # (re)create sessions
    python3 seed_tool_sessions.py <user_id> --delete   # remove them only
    python3 seed_tool_sessions.py <user_id> --dry-run  # print the SQL

Idempotent: every session/message id is fixed, so a rerun deletes and
recreates exactly the same rows (messages cascade with their session).
All timestamps sit on 2026-01-15 so renders are deterministic.

Writes through psycopg / psycopg2 when installed, otherwise pipes SQL into
`docker exec -i autogpt_platform-db-1 psql -U postgres -d postgres`.
Tables live in the "platform" schema (backend .env DB_SCHEMA=platform).

How the frontend turns these rows into parts
(helpers/convertChatSessionToUiMessages.ts::toolCallPart):
  * assistant row `toolCalls` = OpenAI shape
    [{"id", "type": "function", "function": {"name", "arguments": "<json>"}}]
    -> part type `tool-<name>`, input = parsed arguments
  * tool row with the same `toolCallId` -> state "output-available",
    output = JSON.parse(content) (raw string if it does not parse)
  * a reload never yields state "output-error" (only the live turn log does,
    for calls a finished turn never answered). Error states therefore come
    from the OUTPUT: `{"type": "error", ...}` or, for RunMCPTool /
    ConnectIntegrationTool, a truncated JSON string (the "corrupted" path).
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time
import uuid
from datetime import datetime, timedelta

SCHEMA = "platform"
DB_CONTAINER = os.environ.get("SEED_DB_CONTAINER", "autogpt_platform-db-1")
DSN = os.environ.get(
    "SEED_DATABASE_URL",
    "postgresql://postgres:your-super-secret-and-long-postgres-password"
    "@localhost:5432/postgres",
)
BASE_TIME = datetime(2026, 1, 15, 10, 0, 0)
NAMESPACE = uuid.UUID("5eed7001-0000-4000-8000-000000000000")


def sid(n: int) -> str:
    return f"5eed7001-0000-4000-8000-{n:012d}"


def mid(session_no: int, seq: int) -> str:
    return str(uuid.uuid5(NAMESPACE, f"msg-{session_no}-{seq}"))


# ---------------------------------------------------------------------------
# Fixtures: (tool_name, input, output). output may be a dict (stored as JSON)
# or a str (stored verbatim — used for the "corrupted JSON" error path).
# Shapes follow each tool's helpers.ts and its __tests__ / styleguide fixtures.
# ---------------------------------------------------------------------------

DISCOVERY = [
    (
        "find_capability",
        {"query": "linear issue"},
        {
            "type": "capability_list",
            "query": "linear issue",
            "count": 3,
            "capabilities": [
                {
                    "id": "mcp:mcp.linear.app",
                    "name": "Linear",
                    "purpose": "Issues, projects and cycles",
                    "kind": "mcp_server",
                    "connected": True,
                },
                {
                    "id": "mcp:mcp.notion.com",
                    "name": "Notion",
                    "purpose": "Pages and databases",
                    "kind": "mcp_server",
                    "connected": "needs_expert_grant",
                },
                {
                    "id": "block:abc-123",
                    "name": "Send Web Request",
                    "purpose": "Call an HTTP endpoint",
                    "kind": "block",
                    "connected": False,
                },
            ],
            "fallback": [
                {
                    "id": "block:def-456",
                    "name": "HTTP Request",
                    "purpose": "A lower-level request",
                    "kind": "block",
                    "class": "primitive",
                }
            ],
        },
    ),
    (
        "find_block",
        {"query": "weather"},
        {
            "type": "block_list",
            "count": 3,
            "blocks": [
                {
                    "id": "block-1",
                    "name": "Get Weather",
                    "description": "Fetches current weather data for a given city.",
                    "categories": [],
                },
                {
                    "id": "block-2",
                    "name": "Weather Forecast",
                    "description": "Returns a 5-day weather forecast for any location.",
                    "categories": [],
                },
                {
                    "id": "block-3",
                    "name": "Historical Weather",
                    "description": "Retrieves weather data for the past 30 days.",
                    "categories": [],
                },
            ],
        },
    ),
    (
        "find_block",
        {"query": "teleport"},
        {"type": "error", "message": "Block search failed.", "error": "index offline"},
    ),
    (
        "find_agent",
        {"query": "youtube summarizer"},
        {
            "type": "agents_found",
            "count": 2,
            "agents": [
                {
                    "id": "creator/youtube-summarizer",
                    "name": "YouTube Summarizer",
                    "description": "Summarizes YouTube videos into bullet points.",
                    "source": "marketplace",
                },
                {
                    "id": "creator/video-digest",
                    "name": "Video Digest Pro",
                    "description": "Creates detailed summaries with timestamps.",
                    "source": "marketplace",
                },
            ],
        },
    ),
    (
        "find_library_agent",
        {"query": "email"},
        {
            "type": "agents_found",
            "count": 1,
            "agents": [
                {
                    "id": "lib-agent-1",
                    "name": "Email Summarizer",
                    "description": "Summarizes your unread email every morning.",
                    "source": "library",
                }
            ],
        },
    ),
    (
        "find_agent",
        {"query": "quantum"},
        {"type": "error", "message": "Marketplace search failed.", "error": "timeout"},
    ),
    (
        "search_docs",
        {"query": "webhooks"},
        {
            "type": "doc_search_results",
            "query": "webhooks",
            "count": 2,
            "results": [
                {
                    "title": "Webhook Configuration Guide",
                    "path": "platform/webhooks/configuration.md",
                    "section": "Setup",
                    "snippet": "Webhooks let you receive real-time notifications.",
                    "doc_url": "https://docs.agpt.co/platform/webhooks/configuration",
                },
                {
                    "title": "Webhook Events Reference",
                    "path": "platform/webhooks/events.md",
                    "section": "Event Types",
                    "snippet": "A reference of all webhook event types.",
                    "doc_url": "https://docs.agpt.co/platform/webhooks/events",
                },
            ],
        },
    ),
    (
        "get_doc_page",
        {"path": "platform/getting-started.md"},
        {
            "type": "doc_page",
            "title": "Getting Started",
            "path": "platform/getting-started.md",
            "content": "Welcome!\n\n## Quick Start\n1. Open the Builder\n2. Add blocks",
            "doc_url": "https://docs.agpt.co/platform/getting-started",
        },
    ),
    (
        "search_docs",
        {"query": "webhooks"},
        {"type": "error", "message": "Docs search failed.", "error": "index offline"},
    ),
]

RUN = [
    (
        "run_block",
        {"block_id": "scraper-303", "dry_run": True},
        {
            "type": "block_output",
            "block_id": "scraper-303",
            "block_name": "Web Scraper",
            "message": "Scraped 6 articles from the feed.",
            "is_dry_run": True,
            "outputs": {
                "articles": [
                    {"title": f"Article {i}", "url": f"https://example.com/{i}"}
                    for i in range(1, 7)
                ]
            },
        },
    ),
    (
        "run_block",
        {"block_id": "weather-block-123"},
        {
            "type": "error",
            "message": "Something went wrong while running this step.",
            "error": "Execution timed out after 30 seconds.",
        },
    ),
    (
        "run_agent",
        {"username_agent_slug": "creator/my-agent"},
        {
            "type": "execution_started",
            "execution_id": "exec-abc-123-def-456",
            "graph_id": "graph-123",
            "graph_name": "YouTube Summarizer",
            "message": "Execution started. Track progress in your library.",
            "status": "running",
            "library_agent_link": "/library/agents/lib-123",
        },
    ),
    (
        "run_agent",
        {"username_agent_slug": "creator/broken"},
        {"type": "error", "message": "Could not start the run.", "error": "graph not found"},
    ),
    (
        "schedule_agent",
        {"username_agent_slug": "creator/my-agent", "cron": "0 9 * * *"},
        {
            "type": "execution_started",
            "execution_id": "sched-1",
            "graph_id": "graph-123",
            "graph_name": "YouTube Summarizer",
            "message": "Scheduled to run every day at 9:00.",
            "status": "scheduled",
            "library_agent_link": "/library/agents/lib-123",
        },
    ),
    (
        "view_agent_output",
        {"agent_name": "YouTube Summarizer", "execution_id": "exec-abc-123"},
        {
            "type": "agent_output",
            "agent_id": "agent-123",
            "agent_name": "YouTube Summarizer",
            "message": "Here are the results from the last execution.",
            "library_agent_link": "/library/agents/lib-agent-123",
            "execution": {
                "execution_id": "exec-abc-123",
                "status": "completed",
                "inputs_summary": {"video_url": "https://youtube.com/watch?v=x"},
                "outputs": {"summary": ["Key points: 1, 2, 3"], "keywords": ["a", "b"]},
            },
        },
    ),
    (
        "view_agent_output",
        {"agent_name": "Ghost"},
        {"type": "error", "message": "Could not load the output.", "error": "not found"},
    ),
    (
        "setup_agent_webhook_trigger",
        {"agent_id": "lib-1"},
        {
            "type": "trigger_setup",
            "message": "Webhook trigger ready.",
            "preset_id": "p1",
            "library_agent_id": "lib-1",
            "library_agent_link": "/library/agents/lib-1",
            "name": "My Trigger",
            "is_active": True,
            "provider": "generic_webhook",
            "manual_setup_required": True,
            "webhook_url": "https://backend.example/api/integrations/generic_webhook/webhooks/wh-1/ingress",
        },
    ),
    (
        "setup_agent_webhook_trigger",
        {"agent_id": "lib-2"},
        {"type": "error", "message": "Could not set up the trigger.", "error": "bad provider"},
    ),
    (
        "connect_integration",
        {"provider": "github"},
        '{"setup_info":{"agent_name":"GitHub"',  # truncated -> "corrupted" error state
    ),
]

MCP = [
    (
        "run_mcp_tool",
        {"server_url": "https://mcp.linear.app/mcp", "tool_name": "search_issues"},
        {
            "type": "mcp_tool_output",
            "message": "Tool ran.",
            "server_url": "https://mcp.linear.app/mcp",
            "tool_name": "search_issues",
            "result": "INT-42 Add dark mode\nINT-87 Dark theme for output viewer",
            "success": True,
        },
    ),
    (
        "run_mcp_tool",
        {"server_url": "https://mcp.linear.app/mcp", "tool_name": "create_issue"},
        {
            "type": "error",
            "message": "The MCP server rejected the call.",
            "error": "401 Unauthorized",
        },
    ),
    (
        "run_mcp_tool",
        {"server_url": "https://mcp.notion.com/mcp", "tool_name": "search"},
        '{"type":"setup_requirements","message":"Connect Noti',  # corrupted
    ),
    (
        "run_mcp_tool",
        {"server_url": "https://mcp.sentry.dev/mcp", "tool_name": "list_issues"},
        {
            "type": "setup_requirements",
            "message": "Connect Sentry to continue.",
            "setup_info": {
                "agent_id": "https://mcp.sentry.dev/mcp",
                "agent_name": "Sentry",
                "requirements": {},
                "user_readiness": {
                    "has_all_credentials": False,
                    "missing_credentials": {},
                    "ready_to_run": False,
                },
            },
        },
    ),
]

BUILD = [
    (
        "decompose_goal",
        {"goal": "Build a news summarizer"},
        {
            "type": "task_decomposition",
            "message": "Here's the plan (4 steps):",
            "goal": "Build a news summarizer",
            "step_count": 4,
            "steps": [
                {
                    "step_id": "step_1",
                    "description": "Accept a topic from the user",
                    "action": "add_input",
                    "block_name": None,
                    "status": "completed",
                },
                {
                    "step_id": "step_2",
                    "description": "Summarize the topic with AI",
                    "action": "add_block",
                    "block_name": "AI Text Generator",
                    "status": "in_progress",
                },
                {
                    "step_id": "step_3",
                    "description": "Fetch matching headlines",
                    "action": "add_block",
                    "block_name": "RSS Reader",
                    "status": "failed",
                },
                {
                    "step_id": "step_4",
                    "description": "Hand the result back to the user",
                    "action": "connect_blocks",
                    "block_name": None,
                    "status": "pending",
                },
            ],
        },
    ),
    (
        "decompose_goal",
        {"goal": "???"},
        {"type": "error", "error": "Could not break the goal down.", "message": "Try a clearer goal."},
    ),
    (
        "create_agent",
        {"goal": "Summarize my email"},
        {
            "type": "agent_builder_saved",
            "agent_id": "agent-789",
            "agent_name": "Email Summarizer",
            "library_agent_id": "lib-agent-789",
            "library_agent_link": "/library/agents/lib-agent-789",
            "agent_page_link": "/build?agent=agent-789",
            "message": "'Email Summarizer' has been saved to your library!",
        },
    ),
    (
        "create_agent",
        {"goal": "Make me rich"},
        {
            "type": "suggested_goal",
            "message": "That goal is too vague to build.",
            "suggested_goal": "Track daily prices of 5 stocks and email me a summary",
            "reason": "The original goal has no measurable outcome.",
            "original_goal": "Make me rich",
            "goal_type": "vague",
        },
    ),
    (
        "create_agent",
        {"goal": "Broken"},
        {"type": "error", "message": "Could not build that.", "error": "validation failed"},
    ),
    (
        "edit_agent",
        {"agent_id": "agent-789", "changes": "Add a Slack step"},
        {
            "type": "agent_builder_saved",
            "agent_id": "agent-789",
            "agent_name": "Email Summarizer",
            "library_agent_id": "lib-agent-789",
            "library_agent_link": "/library/agents/lib-agent-789",
            "agent_page_link": "/build?agent=agent-789",
            "message": "Updated 'Email Summarizer'.",
        },
    ),
    (
        "edit_agent",
        {"agent_id": "agent-000"},
        {"type": "error", "message": "Could not edit that.", "error": "not found"},
    ),
    (
        "ask_question",
        {"question": "Which inbox?"},
        {
            "type": "agent_builder_clarification_needed",
            "message": "I need a bit more detail.",
            "questions": [
                {"question": "Which inbox should I read?", "keyword": "inbox", "example": "work@acme.com"}
            ],
        },
    ),
    (
        "ask_question",
        {"question": "?"},
        {"type": "error", "message": "Could not ask the question.", "error": "bad input"},
    ),
]

_FOLDER = {
    "id": "folder-1",
    "name": "Marketing",
    "parent_id": None,
    "icon": None,
    "color": None,
    "agent_count": 2,
    "subfolder_count": 1,
    "agents": [
        {"id": "a1", "name": "Email Summarizer"},
        {"id": "a2", "name": "Tweet Writer"},
    ],
}

FOLDERS_AND_REQUESTS = [
    ("create_folder", {"name": "Marketing"}, {"type": "folder_created", "message": "Created Marketing", "folder": _FOLDER}),
    (
        "list_folders",
        {},
        {
            "type": "folder_list",
            "message": "2 folders",
            "count": 2,
            "tree": [
                {
                    **_FOLDER,
                    "children": [
                        {
                            "id": "folder-2",
                            "name": "Campaigns",
                            "parent_id": "folder-1",
                            "agent_count": 0,
                            "subfolder_count": 0,
                            "children": [],
                        }
                    ],
                }
            ],
        },
    ),
    ("delete_folder", {"folder_id": "folder-x"}, {"type": "error", "message": "Folder not found", "error": "404"}),
    (
        "search_feature_requests",
        {"query": "dark mode"},
        {
            "type": "feature_request_search",
            "message": 'Found 2 feature request(s) matching "dark mode".',
            "query": "dark mode",
            "count": 2,
            "results": [
                {"id": "fr-001", "identifier": "INT-42", "title": "Add dark mode", "description": "Reduce eye strain."},
                {"id": "fr-002", "identifier": "INT-87", "title": "Dark output viewer", "description": "Dark theme for runs."},
            ],
        },
    ),
    (
        "create_feature_request",
        {"title": "Add dark mode", "description": "Please."},
        {
            "type": "feature_request_created",
            "message": "Created new feature request [INT-105] Add dark mode.",
            "issue_id": "issue-new-123",
            "issue_identifier": "INT-105",
            "issue_title": "Add dark mode",
            "issue_url": "https://linear.app/autogpt/issue/INT-105/add-dark-mode",
            "is_new_issue": True,
            "customer_name": "user-abc-123",
        },
    ),
    (
        "search_feature_requests",
        {"query": "x"},
        {"type": "error", "message": "Feature request search failed.", "error": "linear down"},
    ),
]

GENERIC = [
    (
        "bash_exec",
        {"command": "ls /nope && echo done"},
        {
            "type": "bash_exec",
            "stdout": "done\n",
            "stderr": "ls: cannot access '/nope': No such file or directory\n",
            "exit_code": 2,
            "message": "Command failed",
        },
    ),
    (
        "bash_exec",
        {"command": "echo hello"},
        {"type": "bash_exec", "stdout": "hello\n", "stderr": "", "exit_code": 0, "message": "Command completed"},
    ),
    (
        "web_search",
        {"query": "AutoGPT platform"},
        {
            "type": "web_search",
            "query": "AutoGPT platform",
            "answer": "AutoGPT is a platform for building AI workflows.",
            "citations": [{"title": "AutoGPT", "url": "https://agpt.co"}],
            "results": [
                {
                    "title": "AutoGPT Platform",
                    "url": "https://agpt.co",
                    "snippet": "Build, deploy and run AI workflows.",
                    "page_age": "2 days ago",
                },
                {
                    "title": "AutoGPT on GitHub",
                    "url": "https://github.com/Significant-Gravitas/AutoGPT",
                    "snippet": "The open source repository.",
                    "page_age": "1 week ago",
                },
            ],
        },
    ),
    (
        "web_fetch",
        {"url": "https://example.com"},
        {"type": "web_fetch", "url": "https://example.com", "status_code": 200, "content": "Example Domain"},
    ),
    (
        "edit_file",
        {"file_path": "notes/todo.md", "old_string": "- [ ] ship it", "new_string": "- [x] ship it"},
        {"type": "workspace_file_written", "message": "Edited notes/todo.md"},
    ),
    (
        "TodoWrite",
        {
            "todos": [
                {"content": "Research", "status": "completed", "activeForm": "Researching"},
                {"content": "Draft", "status": "in_progress", "activeForm": "Drafting"},
                {"content": "Review", "status": "pending", "activeForm": "Reviewing"},
            ]
        },
        {"type": "todo_write", "message": "Todos updated"},
    ),
    (
        "mystery_tool",
        {"x": 1},
        {"type": "error", "message": "Unknown tool failed", "error": "boom"},
    ),
]

SESSIONS = [
    (1, "Seed: discovery tools", DISCOVERY),
    (2, "Seed: run tools", RUN),
    (3, "Seed: MCP tools", MCP),
    (4, "Seed: build tools", BUILD),
    (5, "Seed: folders and feature requests", FOLDERS_AND_REQUESTS),
    (6, "Seed: generic tools", GENERIC),
]


# ---------------------------------------------------------------------------
# SQL
# ---------------------------------------------------------------------------


def lit(value) -> str:
    """SQL literal: NULL, or a dollar-quoted string."""
    if value is None:
        return "NULL"
    text = str(value)
    tag = "$s$"
    while tag in text:
        tag = tag[:-1] + "x$"
    return f"{tag}{text}{tag}"


def ts(dt: datetime) -> str:
    return f"'{dt.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]}'"


def build_sql(user_id: str, delete_only: bool) -> str:
    ids = ", ".join(f"'{sid(n)}'" for n, _, _ in SESSIONS)
    out = [
        "BEGIN;",
        f'DELETE FROM {SCHEMA}."ChatSession" WHERE id IN ({ids});',
    ]
    if delete_only:
        out.append("COMMIT;")
        return "\n".join(out)

    for n, title, fixtures in SESSIONS:
        start = BASE_TIME + timedelta(hours=n)
        rows = []
        seq = 0

        def add(role, content=None, tool_call_id=None, tool_calls=None, duration=None):
            nonlocal seq
            rows.append(
                "("
                + ", ".join(
                    [
                        lit(mid(n, seq)),
                        ts(start + timedelta(seconds=seq)),
                        lit(sid(n)),
                        lit(role),
                        lit(content),
                        lit(tool_call_id),
                        (lit(json.dumps(tool_calls)) + "::jsonb") if tool_calls else "NULL",
                        str(seq),
                        str(duration) if duration is not None else "NULL",
                    ]
                )
                + ")"
            )
            seq += 1

        for i, (tool, args, output) in enumerate(fixtures):
            call_id = f"call_seed{n}_{i:02d}"
            add("user", f"Show the {tool} card ({i + 1}).")
            add(
                "assistant",
                None,
                tool_calls=[
                    {
                        "id": call_id,
                        "type": "function",
                        "function": {"name": tool, "arguments": json.dumps(args)},
                    }
                ],
            )
            add(
                "tool",
                output if isinstance(output, str) else json.dumps(output),
                tool_call_id=call_id,
            )
            add("assistant", f"Done with {tool} ({i + 1}).", duration=1200)

        end = start + timedelta(seconds=seq)
        out.append(
            f'INSERT INTO {SCHEMA}."ChatSession" '
            '(id, "createdAt", "updatedAt", "userId", title, "chatStatus") VALUES '
            f"({lit(sid(n))}, {ts(start)}, {ts(end)}, {lit(user_id)}, {lit(title)}, 'idle');"
        )
        out.append(
            f'INSERT INTO {SCHEMA}."ChatMessage" '
            '(id, "createdAt", "sessionId", role, content, "toolCallId", "toolCalls", sequence, "durationMs") VALUES\n  '
            + ",\n  ".join(rows)
            + ";"
        )
    out.append("COMMIT;")
    return "\n".join(out)


# ---------------------------------------------------------------------------
# Execution
# ---------------------------------------------------------------------------


def _run_driver(sql: str, check_sql: str) -> str | None:
    try:
        import psycopg  # type: ignore

        with psycopg.connect(DSN, autocommit=True) as conn:
            row = conn.execute(check_sql).fetchone()
            if not row:
                return None
            conn.execute(sql)
            return "ok"
    except ImportError:
        pass
    try:
        import psycopg2  # type: ignore

        conn = psycopg2.connect(DSN)
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(check_sql)
            if not cur.fetchone():
                return None
            cur.execute(sql)
        conn.close()
        return "ok"
    except ImportError:
        return "no-driver"


def _psql(sql: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["docker", "exec", "-i", DB_CONTAINER, "psql", "-U", "postgres", "-d", "postgres",
         "-v", "ON_ERROR_STOP=1", "-qtA"],
        input=sql,
        text=True,
        capture_output=True,
    )


def wait_for_db(timeout: int = 180) -> None:
    deadline = time.time() + timeout
    while True:
        res = _psql(f'SELECT 1 FROM {SCHEMA}."ChatSession" LIMIT 1;')
        if res.returncode == 0:
            return
        if time.time() > deadline:
            sys.exit(f"Database not ready: {res.stderr.strip()}")
        print("waiting for database / migrations ...", file=sys.stderr)
        time.sleep(5)


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    if len(args) != 1:
        sys.exit(__doc__)
    user_id = args[0]
    delete_only = "--delete" in flags
    sql = build_sql(user_id, delete_only)

    if "--dry-run" in flags:
        print(sql)
        return

    check_sql = f'SELECT 1 FROM {SCHEMA}."User" WHERE id = {lit(user_id)}'
    result = _run_driver(sql, check_sql)
    if result is None:
        sys.exit(f"No user with id {user_id} in {SCHEMA}.\"User\".")
    if result == "no-driver":
        if not shutil.which("docker"):
            sys.exit("Neither psycopg/psycopg2 nor docker is available.")
        wait_for_db()
        res = _psql(check_sql + ";")
        if res.returncode != 0 or not res.stdout.strip():
            sys.exit(f"No user with id {user_id} in {SCHEMA}.\"User\". {res.stderr.strip()}")
        res = _psql(sql)
        if res.returncode != 0:
            sys.exit(f"psql failed:\n{res.stderr}")

    if delete_only:
        print("Deleted seed sessions.")
        return
    for n, title, fixtures in SESSIONS:
        tools = ", ".join(t for t, _, _ in fixtures)
        print(f"{sid(n)}  {title}  [{tools}]")
        print(f"    http://localhost:3000/copilot?sessionId={sid(n)}")


if __name__ == "__main__":
    main()
