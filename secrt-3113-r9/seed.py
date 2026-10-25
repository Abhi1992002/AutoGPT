import json, os, subprocess, sys
email = sys.argv[1]
def psql(sql):
    return subprocess.run(["docker","exec","-i","autogpt_platform-db-1","psql","-U","postgres","-d","postgres","-tA","-v","ON_ERROR_STOP=1"],input=sql,capture_output=True,text=True,check=True).stdout
schema = psql("select table_schema from information_schema.tables where table_name='ChatSession' limit 1;").strip()
uid = psql(f'select id from {schema}."User" where email=\'{email}\';').strip()
print("schema", schema, "user", uid)
T1 = """Here is the comparison you asked for, with **bold text**, *italic text*, `inline code` and a [link to the docs](https://docs.agpt.co).

| Plan | Runs per month | Status | Cost |
| --- | --- | --- | --- |
| Starter | `100` | **Active** | $1.20 |
| Pro | `1,000` | Paused, see [settings](/settings/profile) | $3.60 |
| Team | `10,000` | **Trial** with `api_key_rotation` on | $12.00 |

```python
def total(turns):
    return sum(t.cost for t in turns)
```

The formula is $x^2 + y^2 = z^2$, and three turns at 1.2 cents come to 3.6 cents."""
T2 = """Sure. Steps:

1. Open **Settings**.
2. Pick `Integrations`.
3. Connect your account.

| Step | Where | Note |
| --- | --- | --- |
| 1 | Sidebar | `Cmd+K` also works |
| 2 | Settings | **Required** |"""
sessions = [
  ("5eed7113-0000-4000-8000-000000000001", "Plan comparison", [("user","Compare the three plans in a table, please."),("assistant",T1),("user","Thanks! And how do I connect an account?"),("assistant",T2)]),
  ("5eed7113-0000-4000-8000-000000000002", "Short thread", [("user","How do I download my workspace files?\nI tried the menu."),("assistant","Open the **Files** panel and choose `Download all`. See [the guide](https://docs.agpt.co).")]),
]
def q(s): return "'" + s.replace("'", "''") + "'"
sql = []
for sid, title, msgs in sessions:
    sql.append(f'delete from {schema}."ChatSession" where id={q(sid)};')
    sql.append(f'insert into {schema}."ChatSession"(id,"userId",title,"createdAt","updatedAt") values ({q(sid)},{q(uid)},{q(title)},\'2026-01-15T11:00:00Z\',\'2026-01-15T11:00:00Z\');')
    for i,(role,content) in enumerate(msgs):
        sql.append(f'insert into {schema}."ChatMessage"(id,"sessionId",role,content,sequence,"createdAt") values (gen_random_uuid(),{q(sid)},{q(role)},{q(content)},{i},\'2026-01-15T11:0{i}:00Z\');')
print(psql("\n".join(sql)))
