#!/bin/bash
# before (base build) -> after, after-repeat (head build), same DB and stack.
C=/home/vercel-sandbox/autogpt/.context
serve() {  # dir
  cd "$1" && setsid bash -c 'exec pnpm start -p 3000' > /tmp/serve.log 2>&1 &
  SPID=$!
  for i in $(seq 1 60); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)" = "200" ] && break; sleep 2; done
  echo "serving $1 (pgid $SPID)"
}
stop() { kill -TERM -- -$SPID; sleep 5; curl -s -o /dev/null -w 'after stop: %{http_code}\n' http://localhost:3000/login; }
serve /home/vercel-sandbox/wt-base/autogpt_platform/frontend
$C/capture.sh $C/shots/before
stop
serve /home/vercel-sandbox/autogpt/autogpt_platform/frontend
$C/capture.sh $C/shots/after
$C/capture.sh $C/shots/after-repeat
echo "head server left running, pgid $SPID"
echo ALL-DONE
