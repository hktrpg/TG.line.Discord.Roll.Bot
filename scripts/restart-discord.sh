#!/bin/bash

# Discord Bot Safe Restart Script
# This script ensures no duplicate Discord shard processes during restart

echo "=== Discord Bot Safe Restart Script ==="
echo "Time: $(date)"

# Check if PM2 is running
if ! command -v pm2 &> /dev/null; then
    echo "Error: PM2 not installed or not in PATH"
    exit 1
fi

# Check if Discord process is running
if ! pm2 list | grep -q "hktrpg-discord"; then
    echo "Error: Discord process not running"
    exit 1
fi

echo "1. Checking current Discord process status..."
pm2 list | grep "hktrpg-discord"

echo ""
echo "2. Stopping Discord process..."
pm2 stop hktrpg-discord

# Wait for process to completely stop
echo "3. Waiting for process to completely stop..."
sleep 10

# Check for any remaining Discord processes
echo "4. Checking for remaining processes..."
ps aux | grep -E "(discord|node.*index\.js)" | grep -v grep

# Force kill any remaining processes
echo "5. Force cleaning remaining processes..."
pkill -f "discord-hybrid-sharding" 2>/dev/null || true
pkill -f "discord_bot.js" 2>/dev/null || true
pkill -f "core-Discord.js" 2>/dev/null || true

# Wait for cleanup to complete
sleep 5

echo "6. Restarting Discord process..."
pm2 start hktrpg-discord

# Wait for process to start
echo "7. Waiting for process to start..."
sleep 15

echo "8. Checking new process status..."
pm2 list | grep "hktrpg-discord"

echo "9. Checking process logs..."
echo "Recent log output:"
pm2 logs hktrpg-discord --lines 10

echo ""
echo "=== Restart Complete ==="
echo "Time: $(date)"

# Check if process is running normally
if pm2 list | grep "hktrpg-discord" | grep -q "online"; then
    echo "✅ Discord process successfully restarted and running"
else
    echo "❌ Discord process restart failed"
    echo "Please check logs: pm2 logs hktrpg-discord"
    exit 1
fi 