#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BASE_DIR="${1:-/data/bots}"
LOGS_DIR="${2:-/data/logs}"
COMPOSE_FILE="${3:-${SCRIPT_DIR}/docker-compose.yml}"

if [ -d "${BASE_DIR}" ]; then
  cd "${BASE_DIR}"
fi

mkdir -p "${LOGS_DIR}/discord-bot" "${LOGS_DIR}/tg-bot"

echo "=== $(date) Update Discord current.log ==="
docker compose -f "${COMPOSE_FILE}" logs --no-color --timestamps discord-bot > "${LOGS_DIR}/discord-bot/current.log" 2>&1

echo "=== $(date) Update TG current.log ==="
docker compose -f "${COMPOSE_FILE}" logs --no-color --timestamps tg-bot > "${LOGS_DIR}/tg-bot/current.log" 2>&1

echo "[ $(date) ] current.log Update completed"

