"""Seeds the sub-agent update scenario: graph A (v1 -> v2 with its connected input renamed,
an incompatible update) and graph B whose Agent Executor node still points at A v1.
Prints B's id. Idempotent."""
import json, urllib.request
tok = open("/home/vercel-sandbox/autogpt/.context/run-stack/token").read().strip()
BE = "http://localhost:8006"
def api(method, path, body=None):
    r = urllib.request.Request(BE + path, method=method, data=json.dumps(body).encode() if body is not None else None, headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(r).read() or "null")
graphs = {g["name"]: g for g in api("GET", "/api/graphs")}
if "Evidence parent" in graphs:
    print(graphs["Evidence parent"]["id"]); raise SystemExit
blocks = {b["name"]: b["id"] for b in api("GET", "/api/blocks")}
def sub(name):
    return {"name": "Evidence sub-workflow", "description": "", "nodes": [
        {"id": "i", "block_id": blocks["AgentInputBlock"], "input_default": {"name": name}, "metadata": {"position": {"x": 0, "y": 0}}},
        {"id": "o", "block_id": blocks["AgentOutputBlock"], "input_default": {"name": "answer"}, "metadata": {"position": {"x": 500, "y": 0}}}],
        "links": [{"source_id": "i", "sink_id": "o", "source_name": "result", "sink_name": "value"}]}
a1 = api("POST", "/api/graphs", {"graph": sub("topic")})
a2 = api("PUT", f"/api/graphs/{a1['id']}", {**sub("subject"), "id": a1["id"], "version": a1["version"]})
api("PUT", f"/api/graphs/{a1['id']}/versions/active", {"active_graph_version": a2["version"]}) if False else None
parent = {"name": "Evidence parent", "description": "", "nodes": [
    {"id": "in", "block_id": blocks["AgentInputBlock"], "input_default": {"name": "topic"}, "metadata": {"position": {"x": 0, "y": 0}}},
    {"id": "ex", "block_id": blocks["AgentExecutorBlock"], "input_default": {
        "user_id": a1["user_id"], "graph_id": a1["id"], "graph_version": a1["version"],
        "input_schema": a1["input_schema"], "output_schema": a1["output_schema"], "inputs": {}},
     "metadata": {"position": {"x": 500, "y": 0}}}],
    "links": [{"source_id": "in", "sink_id": "ex", "source_name": "result", "sink_name": "topic"}]}
b = api("POST", "/api/graphs", {"graph": parent})
print(b["id"], "sub", a1["id"], "v", a1["version"], "->", a2["version"])
