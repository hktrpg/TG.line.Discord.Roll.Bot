#!/bin/bash
# check-qrcode.sh
# Monitor a bot container's logs and push a notification (via ntfy.sh) when WhatsApp needs a QR code scan.
#
# Why this exists: WhatsApp web.js shows a QR when LocalAuth session is missing/invalid.
# Admins get a phone push instead of tailing logs 24/7.
#
# Trigger lines (modules/core-Whatsapp.js):
# - "QR RECEIVED" — first QR of an auth-waiting period (files written)
# - "QR code refreshed" — subsequent codes (~20-30s); files are updated, full ASCII omitted from logs
# Both must be watched: if this script starts after the first RECEIVED, only "refreshed" keeps firing.
#
# Rate limit (default 10 min) prevents ntfy spam while QR keeps rotating.
#
# Config via env:
#   CONTAINER_NAME=tg-bot
#   NTFY_TOPIC=your_super_secret_topic
#   MIN_NOTIFY_INTERVAL_SEC=600
#   DOCKER_BIN=docker          # or "sudo docker" if needed
#
# Run:
#   NTFY_TOPIC=... ./scripts/check-qrcode.sh
#
# Scan QR after alert:
#   $DOCKER_BIN exec "$CONTAINER_NAME" cat /app/.wwebjs_auth/last-qr.ascii
#   $DOCKER_BIN exec "$CONTAINER_NAME" cat /app/temp/last-qr.ascii

set -u

CONTAINER_NAME="${CONTAINER_NAME:-tg-bot}"
TOPIC="${NTFY_TOPIC:-YOUR_SECRET_TOPIC_HERE}"
MIN_NOTIFY_INTERVAL_SEC="${MIN_NOTIFY_INTERVAL_SEC:-600}"
DOCKER_BIN="${DOCKER_BIN:-docker}"

# Match first QR and refreshes (do not match unrelated "QR" text).
QR_LOG_PATTERN='\[Whatsapp\] QR RECEIVED|\[Whatsapp\] QR code refreshed'

last_notify_epoch=0

log() {
	echo "[$(date)] $*"
}

qr_scan_hint() {
	echo "Scan: ${DOCKER_BIN} exec ${CONTAINER_NAME} cat /app/.wwebjs_auth/last-qr.ascii (fallback: /app/temp/last-qr.ascii)"
}

send_ntfy() {
	local reason="$1"
	log "WhatsApp QR pending (${reason}) — sending ntfy..."

	if [ "${TOPIC}" = "YOUR_SECRET_TOPIC_HERE" ] || [ -z "${TOPIC}" ]; then
		log "NTFY_TOPIC not set; skip push. $(qr_scan_hint)"
		return 1
	fi

	if ! curl -sS --max-time 15 \
		-H "Title: WhatsApp Login Required (${CONTAINER_NAME})" \
		-H "Priority: high" \
		-H "Tags: warning,mobile_phone" \
		-d "${CONTAINER_NAME}: WhatsApp QR needed (${reason}). $(qr_scan_hint)" \
		"https://ntfy.sh/${TOPIC}"; then
		log "ntfy curl failed (non-fatal)"
		return 1
	fi
	echo
	return 0
}

maybe_notify() {
	local reason="$1"
	local current_epoch seconds_since_last
	current_epoch=$(date +%s)
	seconds_since_last=$((current_epoch - last_notify_epoch))

	if [ "${seconds_since_last}" -lt "${MIN_NOTIFY_INTERVAL_SEC}" ]; then
		log "Saw QR (${reason}) but skipping notify (${seconds_since_last}s < ${MIN_NOTIFY_INTERVAL_SEC}s cooldown)"
		return 0
	fi

	if send_ntfy "${reason}"; then
		last_notify_epoch=${current_epoch}
	fi
}

# True if recent logs show QR activity after the latest ready event (still waiting to scan).
has_pending_qr() {
	local logs last_qr_line last_ready_line
	logs=$(${DOCKER_BIN} logs --tail 400 "${CONTAINER_NAME}" 2>&1) || return 1

	last_qr_line=$(printf '%s\n' "${logs}" | grep -n -E "${QR_LOG_PATTERN}" | tail -1 | cut -d: -f1)
	last_ready_line=$(printf '%s\n' "${logs}" | grep -n '\[Whatsapp\] Client is ready' | tail -1 | cut -d: -f1)

	if [ -z "${last_qr_line}" ]; then
		return 1
	fi
	if [ -z "${last_ready_line}" ] || [ "${last_qr_line}" -gt "${last_ready_line}" ]; then
		return 0
	fi
	return 1
}

if ! ${DOCKER_BIN} inspect "${CONTAINER_NAME}" >/dev/null 2>&1; then
	log "Container '${CONTAINER_NAME}' not found (DOCKER_BIN='${DOCKER_BIN}'). Exiting."
	exit 1
fi

log "Starting QR monitor for '${CONTAINER_NAME}' (ntfy: ${TOPIC}, cooldown ${MIN_NOTIFY_INTERVAL_SEC}s, docker: ${DOCKER_BIN})"

# Catch-up: script often starts after the one-shot "QR RECEIVED" line already scrolled by.
if has_pending_qr; then
	maybe_notify "already waiting at monitor start"
else
	log "No pending WhatsApp QR in recent logs; watching for new events..."
fi

# Follow only new lines. Process substitution keeps last_notify_epoch in this shell.
while IFS= read -r line || [ -n "${line}" ]; do
	case "${line}" in
		*'QR RECEIVED'*)
			maybe_notify "QR RECEIVED"
			;;
		*'QR code refreshed'*)
			maybe_notify "QR refreshed"
			;;
	esac
done < <(${DOCKER_BIN} logs -f --tail 0 "${CONTAINER_NAME}" 2>&1 | grep --line-buffered -E "${QR_LOG_PATTERN}")

log "Log stream ended; exiting."
exit 1
