#!/bin/bash
# usage: serve.sh <frontend dir>   restarts next start on :3000 from that build, with no changelog cache
for p in $(pgrep -f "^next-server"); do kill $p; done; sleep 2
cd "$1" && rm -rf .next/cache/fetch-cache
NEXT_PUBLIC_PW_TEST=true nohup setsid pnpm exec next start -p 3000 > /tmp/server.log 2>&1 &
for i in $(seq 1 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)" = "200" ] && { echo "up: $1"; break; }; sleep 2; done
echo "changelog: $(curl -s -o /dev/null -w '%{http_code}' --max-time 20 http://localhost:3000/api/changelog)"
