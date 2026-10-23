#!/bin/bash
# Seeds the screenshot user: sign-up, onboarding done, one API-key credential,
# one workflow (text input -> output) and one finished run whose output is
# markdown. Idempotent enough for one shared DB: run once, before any capture.
set -euo pipefail
STACK_DIR=/home/vercel-sandbox/autogpt/.context/run-stack
USER_ENV=$STACK_DIR/user.env
if [ ! -f "$USER_ENV" ]; then
  printf 'SCREENSHOT_EMAIL=evidence-ds5c@example.com\nSCREENSHOT_PASSWORD=%s\n' "$(head -c 12 /dev/urandom | od -An -tx1 | tr -d " \n")" > "$USER_ENV"
  chmod 600 "$USER_ENV"
fi
set -a; . "$USER_ENV"; set +a
JAR=$STACK_DIR/cookies.txt
PAY=$(jq -nc '{email:$ENV.SCREENSHOT_EMAIL,password:$ENV.SCREENSHOT_PASSWORD,name:"Evidence User"}')
curl -s --noproxy localhost -X POST http://localhost:3000/api/auth/sign-up/email -H 'Content-Type: application/json' -d "$PAY" | head -c 200; echo
curl -s --noproxy localhost -c "$JAR" -X POST http://localhost:3000/api/auth/sign-in/email -H 'Content-Type: application/json' -d "$PAY" | head -c 200; echo
TOKEN=$(curl -s -b "$JAR" http://localhost:3000/api/auth/token | jq -r '.token // ""')
[ -n "$TOKEN" ] || { echo "no token"; exit 1; }
API=http://localhost:8006/api
H=(-H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json')
curl -s -X POST "$API/onboarding/step?step=ONBOARDING_COMPLETE" "${H[@]}" >/dev/null || true

curl -s -X POST "$API/integrations/openai/credentials" "${H[@]}" \
  -d '{"type":"api_key","provider":"openai","title":"Evidence OpenAI key","api_key":"sk-evidence-0000000000000000"}' | head -c 300; echo

IN=c0a8e994-ebf1-4a9c-a4d8-89d09c86741b
OUT=363ae599-353e-4804-937e-b2ee3cef3da4
GRAPH=$(jq -nc --arg in "$IN" --arg out "$OUT" '{graph:{name:"Evidence workflow",description:"Echoes its input as the output.",nodes:[
  {id:"n-in",block_id:$in,input_default:{name:"topic",title:"Topic",description:"What to write about"},metadata:{position:{x:0,y:0}}},
  {id:"n-out",block_id:$out,input_default:{name:"result",title:"Result"},metadata:{position:{x:500,y:0}}}],
  links:[{source_id:"n-in",sink_id:"n-out",source_name:"result",sink_name:"value"}]}}')
G=$(curl -s -X POST "$API/graphs" "${H[@]}" -d "$GRAPH")
GID=$(echo "$G" | jq -r .id); GV=$(echo "$G" | jq -r .version)
echo "graph $GID v$GV"
MD=$'# Release notes\n\nSome **bold** text, a [link](https://example.com) and `inline code`.\n\n## Changes\n\n- first item\n- second item\n\n> A quoted line\n\n| name | value |\n| --- | --- |\n| alpha | 1 |\n| beta | 2 |\n\n```python\nprint("hello")\n```\n\n---\n\n~~struck~~ and done.'
RUN=$(curl -s -X POST "$API/graphs/$GID/execute/$GV" "${H[@]}" -d "$(jq -nc --arg md "$MD" '{inputs:{topic:$md},credentials_inputs:{}}')")
echo "run $(echo "$RUN" | head -c 300)"
LIB=$(curl -s "$API/library/agents/by-graph/$GID" "${H[@]}" | jq -r '.id // empty')
printf 'GRAPH_ID=%s\nGRAPH_VERSION=%s\nLIBRARY_AGENT_ID=%s\nEXECUTION_ID=%s\n' "$GID" "$GV" "$LIB" "$(echo "$RUN" | jq -r '.id // .graph_exec_id // empty')" > $STACK_DIR/seed.env
cat $STACK_DIR/seed.env
