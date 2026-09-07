#!/bin/bash
# keepalive.sh — Pings Render every 3 minutes to prevent free-tier sleep
# Run: ./scripts/keepalive.sh
# Stop: Ctrl+C

URL="https://api.mousebase.dev/health/"
INTERVAL=180  # 3 minutes

echo "Keepalive started. Pinging $URL every ${INTERVAL}s"
echo "Press Ctrl+C to stop"

while true; do
    TIMESTAMP=$(date +%H:%M:%S)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 90 "$URL" || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "[$TIMESTAMP] OK $HTTP_CODE"
    else
        echo "[$TIMESTAMP] HTTP $HTTP_CODE"
    fi
    sleep $INTERVAL
done
