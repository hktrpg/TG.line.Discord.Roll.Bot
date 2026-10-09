#!/bin/bash
# check-qrcode.sh
# Watch a bot container's logs and push ntfy when WhatsApp needs a device link.
#
# The phone alert tells you to run `qr`. That alias is this same script with
# --show: it keeps the latest scannable QR on screen. Do not cat last-qr.ascii.
#
# Notify policy (QR and pairing code share one waiting period):
# - One push when a link wait starts (QR RECEIVED / PAIRING CODE, or a refresh
#   if this script started mid-wait). Later refreshes do not push.
# - If that code is then killed by LOGOUT, one correction push, plus one push
#   for the replacement QR or pairing code.
# - Further flaps stay quiet until MIN_NOTIFY_INTERVAL_SEC.
#
# Pairing code mode (WHATSAPP_PAIR_PHONE) does not emit QR lines. The bot logs
# "[Whatsapp] PAIRING CODE ABCD-EFGH" instead, about every 3 minutes.
#
# Config via env:
#   CONTAINER_NAME=tg-bot
#   NTFY_TOPIC=your_super_secret_topic
#   MIN_NOTIFY_INTERVAL_SEC=600
#   QR_COMMAND=qr
#   QR_TTL_SEC=20
#   QR_PATH=/app/.wwebjs_auth/last-qr.ascii
#   QR_POLL_SEC=1
#   DOCKER_BIN=docker
#   # docker only as the bot user:
#   # DOCKER_BIN='sudo -u hktrpgbot docker'
#
# Run:
#   NTFY_TOPIC=... ./scripts/check-qrcode.sh
#   ./scripts/check-qrcode.sh --show
#
# Admin alias (replace the old `docker exec ... cat last-qr.ascii`):
#   alias qr='DOCKER_BIN="sudo -u hktrpgbot docker" bash /path/to/scripts/check-qrcode.sh --show'

set -u

CONTAINER_NAME="${CONTAINER_NAME:-tg-bot}"
TOPIC="${NTFY_TOPIC:-YOUR_SECRET_TOPIC_HERE}"
MIN_NOTIFY_INTERVAL_SEC="${MIN_NOTIFY_INTERVAL_SEC:-600}"
QR_COMMAND="${QR_COMMAND:-qr}"
QR_TTL_SEC="${QR_TTL_SEC:-20}"
QR_PATH="${QR_PATH:-/app/.wwebjs_auth/last-qr.ascii}"
QR_POLL_SEC="${QR_POLL_SEC:-1}"
DOCKER_BIN="${DOCKER_BIN:-docker}"

LINK_LOG_PATTERN='\[Whatsapp\] QR RECEIVED|\[Whatsapp\] QR code refreshed|\[Whatsapp\] PAIRING CODE|\[WhatsApp\] Client disconnected: LOGOUT|\[Whatsapp\] Client is ready|\[Whatsapp\] Client reconnected and is ready'

last_notify_epoch=0
# idle: we have not asked anyone to link. waiting: last signal was a live QR or pairing code.
# qr | pairing — selects the ntfy hint for the current wait.
wait_mode=qr
state=idle
# 1 after we pushed "please scan" and have not yet corrected it.
scan_push_open=0
# 1 after a LOGOUT correction; the next new QR may push once inside the cooldown.
replacement_pending=0
# 1 after that correction was sent. Blocks a second correction until the cooldown window ends.
logout_corrected=0
suppressed_logged=0

log() {
	echo "[$(date)] $*"
}

link_hint() {
	local mode="${1:-qr}"
	if [ "${mode}" = "pairing" ]; then
		echo "On the phone: Linked devices → Link with phone number. The code lasts about 3 minutes. LOGOUT invalidates it."
		return 0
	fi
	echo "Run ${QR_COMMAND} and leave it open. Scan only while it says LIVE (~${QR_TTL_SEC}s). LOGOUT kills the code."
}

send_ntfy() {
	local reason="$1"
	local mode="${2:-qr}"
	log "WhatsApp link pending (${reason}) — sending ntfy..."

	if [ "${TOPIC}" = "YOUR_SECRET_TOPIC_HERE" ] || [ -z "${TOPIC}" ]; then
		log "NTFY_TOPIC not set; skip push. $(link_hint "${mode}")"
		return 1
	fi

	if ! curl -sS --max-time 15 \
		-H "Title: WhatsApp Login Required (${CONTAINER_NAME})" \
		-H "Priority: high" \
		-H "Tags: warning,mobile_phone" \
		-d "${CONTAINER_NAME}: ${reason}. $(link_hint "${mode}")" \
		"https://ntfy.sh/${TOPIC}"; then
		log "ntfy curl failed (non-fatal)"
		return 1
	fi
	echo
	return 0
}

mark_notified() {
	last_notify_epoch=$(date +%s)
	suppressed_logged=0
}

notify() {
	local reason="$1"
	local mode="${2:-${wait_mode}}"
	if send_ntfy "${reason}" "${mode}"; then
		mark_notified
		return 0
	fi
	return 1
}

# mode is qr or pairing. Refreshes while already waiting do not push.
begin_wait() {
	local reason="$1"
	local mode="$2"
	if [ "${state}" = "waiting" ]; then
		return 0
	fi

	local current_epoch seconds_since_last push_reason
	current_epoch=$(date +%s)
	seconds_since_last=$((current_epoch - last_notify_epoch))
	push_reason="${reason}"

	if [ "${replacement_pending}" -eq 1 ]; then
		push_reason="replacement after LOGOUT: ${reason}"
	elif [ "${seconds_since_last}" -lt "${MIN_NOTIFY_INTERVAL_SEC}" ]; then
		if [ "${suppressed_logged}" -eq 0 ]; then
			log "New link (${reason}) during cooldown (${seconds_since_last}s < ${MIN_NOTIFY_INTERVAL_SEC}s); not pushing."
			suppressed_logged=1
		fi
		return 0
	fi

	# Stay idle when the push fails so the next QR or pairing code retries.
	if ! notify "${push_reason}" "${mode}"; then
		log "ntfy was not sent; will retry on the next QR or pairing code."
		return 0
	fi

	if [ "${replacement_pending}" -eq 1 ]; then
		replacement_pending=0
	else
		logout_corrected=0
	fi
	state=waiting
	wait_mode="${mode}"
	scan_push_open=1
}

on_qr() {
	begin_wait "new QR (${1})" "qr"
}

on_pairing() {
	local code="$1"
	begin_wait "pairing code ${code}" "pairing"
}

on_logout() {
	if [ "${state}" != "waiting" ]; then
		state=idle
		return 0
	fi
	if [ "${scan_push_open}" -ne 1 ] || [ "${logout_corrected}" -eq 1 ]; then
		state=idle
		scan_push_open=0
		log "LOGOUT; not pushing (no outstanding scan alert, or this window was already corrected)."
		return 0
	fi
	if ! notify "previous code invalidated by LOGOUT — do not use it" "${wait_mode}"; then
		state=idle
		scan_push_open=0
		log "LOGOUT correction was not sent; the next code will notify."
		return 0
	fi
	state=idle
	scan_push_open=0
	logout_corrected=1
	replacement_pending=1
}

on_ready() {
	if [ "${state}" = "waiting" ]; then
		log "Client is ready. Scan no longer needed."
	fi
	state=idle
	scan_push_open=0
	replacement_pending=0
	logout_corrected=0
	wait_mode=qr
}

handle_line() {
	local line="$1"
	case "${line}" in
		*'Client disconnected: LOGOUT'*)
			on_logout
			;;
		*'Client reconnected and is ready'*|*'Client is ready'*)
			on_ready
			;;
		*'PAIRING CODE'*)
			local code="${line##*PAIRING CODE }"
			code="${code%% *}"
			code="${code//$'\r'/}"
			on_pairing "${code}"
			;;
		*'QR RECEIVED'*)
			on_qr "QR RECEIVED"
			;;
		*'QR code refreshed'*)
			on_qr "QR refreshed"
			;;
	esac
}

latest_link_line() {
	${DOCKER_BIN} logs --tail 400 "${CONTAINER_NAME}" 2>&1 | grep -E "${LINK_LOG_PATTERN}" | tail -n 1 || true
}

# --show: redraw the QR file until Ctrl+C. Hides codes that are stale or logged out.
redraw_screen() {
	if [ -t 1 ]; then
		printf '\033[H\033[J'
	fi
}

read_qr_snapshot() {
	${DOCKER_BIN} exec -e "QR_PATH=${QR_PATH}" "${CONTAINER_NAME}" sh -c '
		pick=""
		if [ -f "$QR_PATH" ]; then
			pick="$QR_PATH"
		elif [ -f /app/temp/last-qr.ascii ]; then
			pick="/app/temp/last-qr.ascii"
		else
			echo "STATUS missing"
			exit 0
		fi
		payload=$(head -c 16 "${pick%.ascii}.txt" 2>/dev/null || true)
		case "$payload" in
			undefined*)
				echo "STATUS badpayload"
				echo "PICK $pick"
				exit 0
				;;
		esac
		echo "STATUS ok"
		echo "PICK $pick"
		echo "MTIME $(stat -c %Y "$pick")"
		echo "NOW $(date +%s)"
		echo BEGIN_QR
		cat "$pick"
	'
}

read_link_state() {
	local line
	line=$(${DOCKER_BIN} logs --tail 80 "${CONTAINER_NAME}" 2>&1 | grep -E "${LINK_LOG_PATTERN}" | tail -n 1 || true)
	case "${line}" in
		*'Client disconnected: LOGOUT'*) echo logout ;;
		*'Client reconnected and is ready'*|*'Client is ready'*) echo ready ;;
		*'PAIRING CODE'*)
			local code="${line##*PAIRING CODE }"
			code="${code%% *}"
			code="${code//$'\r'/}"
			echo "pairing ${code}"
			;;
		*'QR RECEIVED'*|*'QR code refreshed'*) echo qr ;;
		*) echo unknown ;;
	esac
}

assess_snapshot() {
	local status="$1" mtime="$2" now="$3" link_state="$4"
	SHOW_ASCII=0
	case "${link_state}" in
		ready)
			STATUS_TEXT="Already linked. Client is ready — do not scan."
			return 0
			;;
		logout)
			STATUS_TEXT="INVALID. Client logged out. The file still holds a dead code — do not scan.
Waiting for the next QR."
			return 0
			;;
		pairing*)
			local code="${link_state#pairing }"
			if [ -n "${code}" ]; then
				STATUS_TEXT="PAIRING. Enter this code on the phone: ${code}
Linked devices → Link with phone number. A new code replaces this one about every 3 minutes."
			else
				STATUS_TEXT="PAIRING. The latest code was not on the last log line. Use the ntfy alert."
			fi
			return 0
			;;
	esac
	case "${status}" in
		missing)
			STATUS_TEXT="No QR file yet. Waiting for WhatsApp to write one."
			return 0
			;;
		badpayload)
			STATUS_TEXT="INVALID. Latest code is malformed (library sent an empty ref). Do not scan.
Waiting for the next QR."
			return 0
			;;
	esac
	if [ -z "${mtime}" ] || [ -z "${now}" ]; then
		STATUS_TEXT="Could not read the QR file age. Not showing a code."
		return 0
	fi
	local age=$((now - mtime))
	if [ "${age}" -lt 0 ]; then
		age=0
	fi
	local remain=$((QR_TTL_SEC - age))
	if [ "${remain}" -le 0 ]; then
		STATUS_TEXT="STALE. File is ${age}s old (limit ${QR_TTL_SEC}s). Do not scan.
Waiting for the next write."
		return 0
	fi
	SHOW_ASCII=1
	STATUS_TEXT="LIVE. Written ${age}s ago — scan within about ${remain}s.
Leave this window open. It redraws when WhatsApp rotates the code."
}

render_qr() {
	local status_text="$1"
	local ascii="$2"
	redraw_screen
	echo "WhatsApp link QR — ${CONTAINER_NAME}"
	echo "${status_text}"
	if [ -n "${ascii}" ]; then
		echo
		printf '%s\n' "${ascii}"
	fi
	echo
	echo "Ctrl+C to stop."
}

show_qr_main() {
	trap 'printf "\n"; exit 0' INT TERM
	if ! ${DOCKER_BIN} inspect "${CONTAINER_NAME}" >/dev/null 2>&1; then
		log "Container '${CONTAINER_NAME}' not found (DOCKER_BIN='${DOCKER_BIN}')."
		exit 1
	fi
	while true; do
		local snapshot="" link_state="unknown"
		if ! snapshot=$(read_qr_snapshot); then
			render_qr "docker exec failed. Retrying..." ""
			sleep "${QR_POLL_SEC}"
			continue
		fi
		if ! link_state=$(read_link_state); then
			link_state="unknown"
		fi

		local status="missing" pick="" mtime="" now="" ascii="" mode="meta" line=""
		while IFS= read -r line || [ -n "${line}" ]; do
			if [ "${mode}" = "qr" ]; then
				ascii="${ascii}${line}"$'\n'
				continue
			fi
			case "${line}" in
				STATUS\ *) status="${line#STATUS }" ;;
				PICK\ *) pick="${line#PICK }" ;;
				MTIME\ *) mtime="${line#MTIME }" ;;
				NOW\ *) now="${line#NOW }" ;;
				BEGIN_QR) mode="qr" ;;
			esac
		done <<< "${snapshot}"

		SHOW_ASCII=0
		STATUS_TEXT=""
		assess_snapshot "${status}" "${mtime}" "${now}" "${link_state}"
		local ascii_out=""
		if [ "${SHOW_ASCII}" -eq 1 ]; then
			ascii_out="${ascii}"
			if [ -n "${pick}" ]; then
				STATUS_TEXT="${STATUS_TEXT}"$'\n'"File: ${pick}"
			fi
		fi
		render_qr "${STATUS_TEXT}" "${ascii_out}"
		sleep "${QR_POLL_SEC}"
	done
}

if [ "${1:-}" = "--show" ]; then
	show_qr_main
	exit $?
fi

if ! ${DOCKER_BIN} inspect "${CONTAINER_NAME}" >/dev/null 2>&1; then
	log "Container '${CONTAINER_NAME}' not found (DOCKER_BIN='${DOCKER_BIN}'). Exiting."
	exit 1
fi

log "Starting link monitor for '${CONTAINER_NAME}' (ntfy: ${TOPIC}, cooldown ${MIN_NOTIFY_INTERVAL_SEC}s, command: ${QR_COMMAND})"
log "Scan with: ${QR_COMMAND}   (check-qrcode.sh --show — not cat last-qr.ascii)"

startup_line=$(latest_link_line)
case "${startup_line}" in
	*'PAIRING CODE'*|*'QR RECEIVED'*|*'QR code refreshed'*)
		handle_line "${startup_line}"
		;;
	*)
		log "No pending WhatsApp link (QR or pairing code) in recent logs; watching for new events..."
		;;
esac

# Follow only new lines. Process substitution keeps notify state in this shell.
while IFS= read -r line || [ -n "${line}" ]; do
	handle_line "${line}"
done < <(${DOCKER_BIN} logs -f --tail 0 "${CONTAINER_NAME}" 2>&1 | grep --line-buffered -E "${LINK_LOG_PATTERN}")

log "Log stream ended; exiting."
exit 1
