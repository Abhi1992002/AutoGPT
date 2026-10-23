#!/bin/bash
# before (base build) -> after (head) -> after-repeat (head), each from the same state.
set -u
D=/home/vercel-sandbox/autogpt/.context/ds5c
serve() { # $1 frontend dir, $2 storybook dir
  for p in $(ps -eo pid,args | grep -E "next-server|http.server 6006" | grep -v grep | awk '{print $1}'); do
    case "$(readlink /proc/$p/cwd)" in /home/vercel-sandbox/*) kill $p;; esac
  done
  sleep 3
  (cd "$1" && NEXT_PUBLIC_PW_TEST=true nohup setsid pnpm start -p 3000 > /tmp/start.log 2>&1 &)
  (cd "$2" && nohup python3 -m http.server 6006 > /tmp/sb-serve.log 2>&1 &)
  until [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)" = "200" ]; do sleep 2; done
  echo "serving $1 / $2"
}
for run in before after after-repeat; do
  if [ $run = before ]; then serve /home/vercel-sandbox/base-wt/autogpt_platform/frontend /home/vercel-sandbox/sb-base
  else serve /home/vercel-sandbox/autogpt/autogpt_platform/frontend /home/vercel-sandbox/sb-head; fi
  rm -rf /home/vercel-sandbox/shots/$run
  bash $D/reset.sh
  $D/capture-all.sh /home/vercel-sandbox/shots/$run > /tmp/cap-$run.log 2>&1
  echo "$run done: $(ls /home/vercel-sandbox/shots/$run | wc -l) files; $(grep -cvE '^ok ' /tmp/cap-$run.log) non-ok lines"
done
