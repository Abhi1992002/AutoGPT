"""Seeds the screenshot user (DS5e evidence). Usage: python3 -I seed_ds5e.py <token-file>"""
import json, sys, time, urllib.request, uuid

API = "http://localhost:8006/api"
TOKEN = open(sys.argv[1]).read().strip()


def call(method, path, body=None, raw=None, ctype="application/json"):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(f"{API}{path}", data=data, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    if data is not None:
        req.add_header("Content-Type", ctype)
    with urllib.request.urlopen(req, timeout=60) as r:
        text = r.read().decode()
        return json.loads(text) if text else None


blocks = {b["name"]: b for b in call("GET", "/blocks")}
inp, out = blocks["AgentInputBlock"], blocks["AgentOutputBlock"]


def make_graph(name, description):
    a, b = str(uuid.uuid4()), str(uuid.uuid4())
    graph = {
        "name": name,
        "description": description,
        "nodes": [
            {"id": a, "block_id": inp["id"], "input_default": {"name": "topic", "title": "Topic"}, "metadata": {"position": {"x": 0, "y": 0}}},
            {"id": b, "block_id": out["id"], "input_default": {"name": "result", "title": "Result"}, "metadata": {"position": {"x": 400, "y": 0}}},
        ],
        "links": [{"source_id": a, "sink_id": b, "source_name": "result", "sink_name": "value"}],
    }
    return call("POST", "/graphs", {"graph": graph, "source": "builder"})


existing = call("GET", "/graphs")
if existing:
    print("already seeded:", [g["name"] for g in existing])
    sys.exit(0)

g1 = make_graph("Weekly market digest", "Summarises the week's market news into a short digest.")
g2 = make_graph("Lead enrichment", "Looks up each new lead and adds company details.")
for topic in ["AI chips", "Solar"]:
    call("POST", f"/graphs/{g1['id']}/execute/{g1['version']}", {"inputs": {"topic": topic}, "credentials_inputs": {}})
call("POST", f"/graphs/{g2['id']}/execute/{g2['version']}", {"inputs": {"topic": "Acme"}, "credentials_inputs": {}})
call("POST", f"/graphs/{g1['id']}/schedules", {"graph_version": g1["version"], "name": "Monday digest", "cron": "0 9 * * 1", "inputs": {"topic": "Markets"}, "credentials": {}, "timezone": "UTC"})
call("POST", "/library/folders", {"name": "Research", "color": "#7733F5"})

boundary = "ds5e" + uuid.uuid4().hex
files = [("notes.md", "text/markdown", b"# Weekly notes\n\n- Ship the digest\n- Review leads\n"), ("leads.csv", "text/csv", b"name,company\nAda,Acme\nLin,Globex\n")]
for fname, ctype, content in files:
    body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{fname}\"\r\nContent-Type: {ctype}\r\n\r\n").encode() + content + f"\r\n--{boundary}--\r\n".encode()
    call("POST", "/workspace/files/upload", raw=body, ctype=f"multipart/form-data; boundary={boundary}")
call("POST", "/workspace/folders", {"name": "Reports"})

time.sleep(15)
for g in (g1, g2):
    execs = call("GET", f"/graphs/{g['id']}/executions")
    print(g["name"], [e.get("status") for e in (execs if isinstance(execs, list) else execs.get("executions", []))])
lib = call("GET", "/library/agents")
print("library:", [(a["id"], a["name"]) for a in lib["agents"]])
