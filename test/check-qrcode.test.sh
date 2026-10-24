#!/usr/bin/env bash
# Offline monitor tests: no Docker access and no real push notifications.
set -eu

monitor="$(cd "$(dirname "$0")/.." && pwd)/scripts/check-qrcode.sh"
export CONTAINER_NAME=test-bot NTFY_TOPIC=test-only DOCKER_BIN=fake_docker

fake_docker() {
	case "$1" in
		inspect) return 0 ;;
		logs)
			if [ "$2" = '-f' ]; then
				printf '%s\n' "${QR_TEST_STREAM}"
			else
				printf '%s\n' "${QR_TEST_HISTORY}"
			fi
			;;
	esac
}
curl() {
	printf '\nTEST_PUSH\n'
	return "${QR_TEST_CURL_STATUS:-0}"
}
export -f fake_docker curl

check() {
	local name="$1" expected="$2" output count status=0
	# The monitor deliberately exits 1 when the finite mock log stream ends.
	output=$(bash "${monitor}") || status=$?
	[ "${status}" -eq 1 ] || { echo "FAIL ${name}: unexpected exit ${status}"; exit 1; }
	count=$(printf '%s\n' "${output}" | grep -c '^TEST_PUSH$' || true)
	[ "${count}" -eq "${expected}" ] || { echo "FAIL ${name}: expected ${expected} pushes, got ${count}"; exit 1; }
	if [[ "${output}" == *'skipping notify'* ]]; then
		echo "FAIL ${name}: noisy skipped-notification log"
		exit 1
	fi
	if [ "${QR_TEST_CURL_STATUS:-0}" -ne 0 ] && [[ "${output}" != *'ntfy curl failed'* ]]; then
		echo "FAIL ${name}: failed notification not reported"
		exit 1
	fi
	echo "PASS ${name}"
}

export QR_TEST_HISTORY='' QR_TEST_STREAM='[Whatsapp] QR RECEIVED
[Whatsapp] QR code refreshed
[Whatsapp] QR code refreshed
[Whatsapp] Client is ready!
[Whatsapp] QR RECEIVED'
check 'forward scheduled reminders and immediately notify a new login flow' 4

export QR_TEST_STREAM='' QR_TEST_HISTORY='[Whatsapp] QR RECEIVED'
check 'catch up when a QR is pending' 1

export QR_TEST_HISTORY='[Whatsapp] QR RECEIVED
[Whatsapp] Client is ready!'
check 'no stale alert after login' 0

export QR_TEST_HISTORY='[Whatsapp] QR RECEIVED
[Whatsapp] Client reconnected and is ready!'
check 'no stale alert after reconnect' 0

export QR_TEST_HISTORY='[Whatsapp] Client is ready!
[Whatsapp] QR RECEIVED'
check 'new pending QR after an earlier login' 1

export QR_TEST_CURL_STATUS=22 QR_TEST_HISTORY='' QR_TEST_STREAM='[Whatsapp] QR RECEIVED
[Whatsapp] QR code refreshed'
check 'failed pushes are reported and the stream continues' 2
