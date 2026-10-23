#!/bin/bash
# Captures one story N times with the DS5g harness and prints the distinct images.
side=$1; n=${2:-10}
for i in $(seq 1 $n); do
  npx tsx .screenshot-pages-ds5g.ts capture --out /home/vercel-sandbox/shots/variants-$side/$i --routes "" --storybook-url http://localhost:6006 --stories copilot-artifactpanel--mobile > /dev/null 2>&1
done
for vp in desktop mobile; do
  echo "$side $vp: $(md5sum /home/vercel-sandbox/shots/variants-$side/*/story__copilot-artifactpanel--mobile__$vp.png | awk '{print substr($1,1,8)}' | sort | uniq -c | tr '\n' ' ')"
done
