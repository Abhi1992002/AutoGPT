"""Sign up the evidence user, mint a backend token, skip onboarding, and save one
workflow with several block types and edges. Prints the graph id."""
import json, os, subprocess, sys, urllib.request
FE, BE = "http://localhost:3000", "http://localhost:8006"
env = dict(l.strip().split("=", 1) for l in open("/home/vercel-sandbox/autogpt/.context/run-stack/user.env") if "=" in l)
jar = "/home/vercel-sandbox/autogpt/.context/run-stack/cookies.txt"
payload = json.dumps({"email": env["PR_TEST_USER_EMAIL"], "password": env["PR_TEST_USER_PASSWORD"], "name": "Evidence User"})
for path, extra in (("/api/auth/sign-up/email", []), ("/api/auth/sign-in/email", ["-c", jar])):
    subprocess.run(["curl", "-s", "--noproxy", "localhost", "-X", "POST", FE + path, "-H", "Content-Type: application/json", "--data-binary", payload, *extra], capture_output=True)
tok = json.loads(subprocess.run(["curl", "-s", "-b", jar, FE + "/api/auth/token"], capture_output=True, text=True).stdout)["token"]
open("/home/vercel-sandbox/autogpt/.context/run-stack/token", "w").write(tok)
def api(method, path, body=None):
    r = urllib.request.Request(BE + path, method=method, data=json.dumps(body).encode() if body is not None else None, headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(r).read() or "null")
api("POST", "/api/onboarding/step?step=ONBOARDING_COMPLETE")
existing = [g for g in api("GET", "/api/graphs") if g.get("name") == "Evidence flow"]
if existing:
    print(existing[0]["id"]); sys.exit(0)
blocks = {b["name"]: b["id"] for b in api("GET", "/api/blocks")}
nodes = [
    {"id": "in", "block_id": blocks["AgentInputBlock"], "input_default": {"name": "topic", "value": "tokens"}, "metadata": {"position": {"x": 0, "y": 0}}},
    {"id": "store", "block_id": blocks["StoreValueBlock"], "input_default": {}, "metadata": {"position": {"x": 450, "y": 0}}},
    {"id": "calc", "block_id": blocks["CalculatorBlock"], "input_default": {"a": 2, "b": 3, "operation": "Add"}, "metadata": {"position": {"x": 0, "y": 520}}},
    {"id": "out", "block_id": blocks["AgentOutputBlock"], "input_default": {"name": "answer"}, "metadata": {"position": {"x": 900, "y": 0}}},
    {"id": "out2", "block_id": blocks["AgentOutputBlock"], "input_default": {"name": "sum"}, "metadata": {"position": {"x": 450, "y": 520}}},
    {"id": "note", "block_id": blocks["NoteBlock"], "input_default": {"text": "A sticky note"}, "metadata": {"position": {"x": 900, "y": 520}}},
]
links = [
    {"source_id": "in", "sink_id": "store", "source_name": "result", "sink_name": "input"},
    {"source_id": "store", "sink_id": "out", "source_name": "output", "sink_name": "value"},
    {"source_id": "calc", "sink_id": "out2", "source_name": "result", "sink_name": "value"},
]
g = api("POST", "/api/graphs", {"graph": {"name": "Evidence flow", "description": "Several block types and edges", "nodes": nodes, "links": links}})
print(g["id"])
