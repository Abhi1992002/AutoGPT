#!/bin/bash
# usage: capture-stories2.sh <outdir> <storybook port>
cd /home/vercel-sandbox/autogpt/autogpt_platform/frontend
npx tsx scripts/screenshot-pages.ts capture --out $1 --routes --storybook-url http://localhost:$2 --stories molecules-,organisms-,renderers- --skip atoms-progress--live
