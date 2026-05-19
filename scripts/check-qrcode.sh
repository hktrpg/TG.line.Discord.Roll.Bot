#!/bin/bash
# Monitor tg-bot logs and send an ntfy push notification when a WhatsApp QR code is requested.

TOPIC="YOUR_SECRET_TOPIC_HERE" 

echo "[$(date)] Starting to monitor tg-bot for WhatsApp QR Code requests..."

# Continuously monitor the container logs and filter for the keyword
docker logs -f tg-bot 2>&1 | grep --line-buffered "QR RECEIVED" | while read -r line ; do
    echo "[$(date)] QR Code request detected! Sending push notification..."

    curl -s \
        -H "Title:   WhatsApp Login Required" \
        -H "Priority: high" \
        -H "Tags: warning,mobile_phone" \
        -d "tg-bot is waiting for a WhatsApp QR code scan! Please check the logs for the latest QR Code." \
        "https://ntfy.sh/${TOPIC}"

    # Prevent notification spam by adding a 60-second cooldown
    sleep 60
done