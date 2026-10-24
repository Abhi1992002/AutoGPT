#!/bin/bash
# usage: serve2.sh <frontend dir> <port>   starts next start on <port> (pid in /tmp/srv-<port>.pid), no changelog cache
[ -f /tmp/srv-$2.pid ] && kill $(cat /tmp/srv-$2.pid) 2>/dev/null
cd "$1" && rm -rf .next/cache/fetch-cache
NEXT_PUBLIC_PW_TEST=true nohup setsid pnpm exec next start -p $2 > /tmp/server-$2.log 2>&1 &
echo $! > /tmp/srv-$2.pid
for i in $(seq 1 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:$2/login)" = "200" ] && { echo "up: $1 :$2"; break; }; sleep 2; done
echo "changelog: $(curl -s -o /dev/null -w '%{http_code}' --max-time 20 http://localhost:$2/api/changelog)"
