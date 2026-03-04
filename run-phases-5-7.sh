#!/bin/bash
# Run GSD phases 5-7 after 1:00 AM on 2026-02-25
# Usage: nohup bash run-phases-5-7.sh > phases-5-7.log 2>&1 &

set -e
cd /Users/melfice/code/ga

TARGET=$(date -j -f "%Y-%m-%d %H:%M:%S" "2026-02-25 01:00:00" "+%s")
NOW=$(date "+%s")
DELAY=$((TARGET - NOW))

if [ "$DELAY" -gt 0 ]; then
  echo "[$(date)] Sleeping ${DELAY}s until 1:00 AM..."
  sleep "$DELAY"
fi

echo "[$(date)] Starting Phase 5..."
claude --dangerously-skip-permissions -p '/gsd:execute-phase 5'

echo "[$(date)] Starting Phase 6..."
claude --dangerously-skip-permissions -p '/gsd:execute-phase 6'

echo "[$(date)] Starting Phase 7..."
claude --dangerously-skip-permissions -p '/gsd:execute-phase 7'

echo "[$(date)] All phases complete."
