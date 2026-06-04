#!/bin/bash
# check-qrcode.sh
# Monitor a bot container's logs and push a notification (via ntfy.sh) when WhatsApp needs a QR code scan.
#
# Why this exists: WhatsApp web.js (puppeteer) shows a QR when no valid LocalAuth session exists or it was invalidated.
# This script lets a server admin get a phone/push alert instead of having to tail logs manually 24/7.
#
# Key behavior (after 2026 fixes):
# - In modules/core-Whatsapp.js the full QR + "QR RECEIVED" line is now printed **only the first time** per
#   auth-waiting period. Subsequent refreshes (library emits 'qr' every ~20s) log short messages without the
#   trigger string. This prevents log spam and repeated ntfy alerts for the *same* pending scan.
# - This script adds time-based rate limiting (default 10 min between alerts) as a safety net.
#
# Typical problem this solves: "It's been 36 minutes and ntfy is still constantly alerting for QR even though
# 'Client is ready!' lines appeared."
#
# Config via env (recommended):
#   CONTAINER_NAME=tg-bot
#   NTFY_TOPIC=your_super_secret_topic
#   MIN_NOTIFY_INTERVAL_SEC=600
#
# Run example:
#   docker compose up -d
#   NTFY_TOPIC=... ./scripts/check-qrcode.sh
#
# If you keep getting QR requests long-term after "ready" lines appear, the persisted session is likely broken
# (check docker volume mount for .wwebjs_auth / whatsapp-session, file permissions for node user,
# container restart policy, WWEBJS_AUTH_DATA_PATH env, or WhatsApp multi-device link issues on phone).
#
# The runtime logic below + the bot changes keep alerts to a minimum.

CONTAINER_NAME="${CONTAINER_NAME:-tg-bot}"
TOPIC="${NTFY_TOPIC:-YOUR_SECRET_TOPIC_HERE}"
MIN_NOTIFY_INTERVAL_SEC="${MIN_NOTIFY_INTERVAL_SEC:-600}"   # 10min default between alerts

echo "[$(date)] Starting QR monitor for container '${CONTAINER_NAME}' (ntfy: ${TOPIC}, min interval ${MIN_NOTIFY_INTERVAL_SEC}s)"

last_notify_epoch=0

# --tail 0 : only new logs (ignore history at script start)
docker logs -f --tail 0 "${CONTAINER_NAME}" 2>&1 | grep --line-buffered "QR RECEIVED" | while read -r line ; do
    current_epoch=$(date +%s)
    seconds_since_last=$(( current_epoch - last_notify_epoch ))

    if [ "$seconds_since_last" -ge "$MIN_NOTIFY_INTERVAL_SEC" ]; then
        echo "[$(date)] 'QR RECEIVED' detected for ${CONTAINER_NAME}! Sending ntfy..."

        curl -s \
            -H "Title: WhatsApp Login Required (${CONTAINER_NAME})" \
            -H "Priority: high" \
            -H "Tags: warning,mobile_phone" \
            -d "${CONTAINER_NAME} is showing a WhatsApp QR code. Check logs for the QR and scan with your phone." \
            "https://ntfy.sh/${TOPIC}" || echo "[$(date)] ntfy curl failed (non-fatal)"

        last_notify_epoch=$current_epoch
    else
        echo "[$(date)] Saw QR but skipping notify (${seconds_since_last}s < ${MIN_NOTIFY_INTERVAL_SEC}s cooldown)"
    fi

    sleep 5
done