#!/usr/bin/env bash
# Host health snapshot — sudo once at start; redact secrets in printed cmdlines.
# Run on Linux hosts (e.g. OCI VM). Optional: chmod +x scripts/host-health.sh && ./scripts/host-health.sh
set -euo pipefail

# --- Option B (uncomment): re-exec entire script as root; one password, no mid-script sudo ---
# if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
#   exec sudo -E env "PATH=$PATH" bash "$0" "$@"
# fi

redact_secrets() {
	sed -E \
		-e 's/(^|[[:space:]])(--token|--access-token|--password|--api-key|--apikey|--secret)(\s+)([^[:space:]]+)/\1\2\3[REDACTED]/g' \
		-e 's/(password|secret|token|authorization)=[^[:space:]&]+/\1=[REDACTED]/Ig' \
		-e 's/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/[REDACTED_JWT]/g'
}

# Summarize common risk signals from /proc and df (Traditional Chinese for operators).
print_health_reminders() {
	local issues=0
	local buf=""
	local mem_avail_k mem_total_k swap_total_k swap_free_k
	local avail_pct swap_used_k swap_used_m
	local load1 cpus cap mnt mem_some_avg10

	mem_avail_k=$(awk '/^MemAvailable:/ {print $2; exit}' /proc/meminfo 2>/dev/null || echo 0)
	mem_total_k=$(awk '/^MemTotal:/ {print $2; exit}' /proc/meminfo 2>/dev/null || echo 0)
	swap_total_k=$(awk '/^SwapTotal:/ {print $2; exit}' /proc/meminfo 2>/dev/null || echo 0)
	swap_free_k=$(awk '/^SwapFree:/ {print $2; exit}' /proc/meminfo 2>/dev/null || echo 0)

	if [[ "${mem_total_k:-0}" =~ ^[0-9]+$ ]] && [[ "${mem_total_k}" -gt 0 ]] && [[ "${mem_avail_k:-0}" =~ ^[0-9]+$ ]]; then
		avail_pct=$((mem_avail_k * 100 / mem_total_k))
		if [[ "${avail_pct}" -lt 12 ]]; then
			buf+=$'• 記憶體：可用記憶體比例約 '"${avail_pct}"$'%（偏低；建議 ≥12% 較安全）。可能即將觸發 swap 或 OOM，請檢查佔用行程或加 RAM。\n'
			issues=1
		fi
	fi

	if [[ "${swap_total_k:-0}" =~ ^[0-9]+$ ]] && [[ "${swap_total_k}" -gt 0 ]] && [[ "${swap_free_k:-0}" =~ ^[0-9]+$ ]]; then
		swap_used_k=$((swap_total_k - swap_free_k))
		swap_used_m=$((swap_used_k / 1024))
		if [[ "${swap_used_m}" -gt 16 ]]; then
			buf+=$'• Swap：已使用約 '"${swap_used_m}"$' MiB（非 0）。通常代表 RAM 偏緊；請對照上方 vmstat 的 si/so 與 kswapd。\n'
			issues=1
		fi
	fi

	load1=$(awk '{print $1; exit}' /proc/loadavg 2>/dev/null || echo 0)
	cpus=$(nproc 2>/dev/null || echo 1)
	if [[ "${cpus}" -lt 1 ]]; then
		cpus=1
	fi
	if [[ "${load1:-0}" =~ ^[0-9]+\.?[0-9]*$ ]] && awk -v l="${load1}" -v c="${cpus}" 'BEGIN { exit !(l > c * 1.8) }'; then
		buf+=$'• 負載：1 分鐘 load（'"${load1}"$'）相對 CPU 數（'"${cpus}"$'）偏高（門檻約 1.8×CPU）。請對照 top / mpstat 是否長期過載。\n'
		issues=1
	fi

	while IFS= read -r cap mnt; do
		[[ -z "${cap}" ]] && continue
		if [[ "${cap}" =~ ^[0-9]+$ ]] && [[ "${cap}" -ge 85 ]]; then
			buf+=$'• 磁碟：'"${mnt}"$' 使用率 '"${cap}"$'%（≥85%）。請清 log / Docker 層 / 舊檔或擴容；根分割區滿會導致服務寫入失敗。\n'
			issues=1
		fi
	done < <(df -P 2>/dev/null | awk 'NR>1 && $1!="tmpfs" && $1!="devtmpfs" && $1!="efivarfs" {
		c=$5; gsub(/%/,"",c); if (c+0 >= 85) print c, $NF
	}')

	if [[ -r /proc/pressure/memory ]]; then
		mem_some_avg10=$(sed -n 's/.*some avg10=\([0-9.]*\).*/\1/p' /proc/pressure/memory 2>/dev/null | head -1)
		mem_some_avg10=${mem_some_avg10:-0}
		if [[ "${mem_some_avg10}" =~ ^[0-9.]+$ ]] && awk -v v="${mem_some_avg10}" 'BEGIN { exit !(v > 0.35) }'; then
			buf+=$'• PSI（memory some avg10='"${mem_some_avg10}"$'）：記憶體排隊壓力偏高。請優先檢查 RAM/swap 與主要佔用行程。\n'
			issues=1
		fi
	fi

	echo "=== health reminders (auto) ==="
	if [[ "${issues}" -eq 0 ]]; then
		echo "（自動檢查）未偵測到常見高風險項（可用記憶體比例、swap 使用、load、磁碟≥85%、PSI memory）。仍請對照上方原始輸出做判斷。"
	else
		printf '%b' "${buf}"
		echo "請依上述項目對照上方各區段（memory / vmstat / mpstat / df / docker）再下結論。"
	fi
	echo
}

SUDO=""
if [[ "$(id -u)" -eq 0 ]]; then
	SUDO=""
elif command -v sudo >/dev/null 2>&1; then
	sudo -v
	SUDO="sudo"
else
	echo "WARN: no sudo and not root; docker/iostat may fail" >&2
fi

# Clear terminal before snapshot so previous commands do not clutter the report.
command -v clear >/dev/null 2>&1 && clear || true

echo "========== $(date -Is)  hostname: $(hostname -f 2>/dev/null || hostname) =========="
echo "=== whoami / id ==="
id
echo

echo "=== uptime (load average) ==="
uptime || true
echo

echo "=== memory / swap ==="
free -h || true
echo
command -v swapon >/dev/null 2>&1 && { echo "=== swapon -s ==="; swapon -s; echo; } || true

echo "=== vmstat 1 5 ==="
vmstat 1 5 || true
echo

if command -v mpstat >/dev/null 2>&1; then
	echo "=== mpstat -P ALL 1 5 ==="
	mpstat -P ALL 1 5 || true
	echo
else
	echo "=== mpstat: not installed (e.g. dnf install sysstat), skip ==="
	echo
fi

if [[ -r /proc/pressure/memory ]]; then
	echo "=== PSI (/proc/pressure) ==="
	for f in /proc/pressure/cpu /proc/pressure/memory /proc/pressure/io; do
		[[ -r "$f" ]] && echo "--- $f ---" && cat "$f"
	done
	echo
fi

echo "=== disk free (df -h) ==="
df -hT 2>/dev/null | head -n 30 || df -h | head -n 30 || true
echo

echo "=== top memory (RSS), redacted ==="
ps aux --sort=-%mem 2>/dev/null | head -n 25 | redact_secrets || true
echo

echo "=== top CPU, redacted ==="
ps aux --sort=-%cpu 2>/dev/null | head -n 25 | redact_secrets || true
echo

if command -v docker >/dev/null 2>&1; then
	echo "=== docker ps (brief) ==="
	$SUDO docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' 2>/dev/null || true
	echo
	echo "=== docker stats --no-stream ==="
	$SUDO docker stats --no-stream 2>/dev/null || true
	echo
else
	echo "=== docker: not installed, skip ==="
	echo
fi

if command -v iostat >/dev/null 2>&1; then
	echo "=== iostat -xz 1 3 ==="
	$SUDO iostat -xz 1 3 2>/dev/null || iostat -xz 1 3 || true
	echo
fi

echo "=== vm.swappiness ==="
sysctl vm.swappiness 2>/dev/null || true
echo
print_health_reminders || true
echo "========== end =========="
