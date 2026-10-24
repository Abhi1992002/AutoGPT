#!/bin/bash
# usage: serve_app.sh <worktree>  -> next start on :3000
for p in $(pgrep -f "next-server"); do kill $p 2>/dev/null; done; sleep 3
cd /home/vercel-sandbox/$1/autogpt_platform/frontend && (nohup setsid bash -c 'pnpm start -p 3000' > /tmp/app-$1.log 2>&1 &)
for i in $(seq 1 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)" = "200" ] && { echo "$1 up ($(git rev-parse --short HEAD))"; exit 0; }; sleep 2; done; echo "$1 FAILED"; exit 1
