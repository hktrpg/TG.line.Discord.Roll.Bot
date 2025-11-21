# Discord Bot Safe Restart Script (PowerShell Version)
# This script ensures no duplicate Discord shard processes during restart

Write-Host "=== Discord Bot Safe Restart Script ===" -ForegroundColor Green
Write-Host "Time: $(Get-Date)" -ForegroundColor Yellow

# Check if PM2 is running
try {
    $pm2Version = pm2 --version
    Write-Host "PM2 Version: $pm2Version" -ForegroundColor Green
} catch {
    Write-Host "Error: PM2 not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if Discord process is running
$discordProcess = pm2 list | Select-String "hktrpg-discord"
if (-not $discordProcess) {
    Write-Host "Error: Discord process not running" -ForegroundColor Red
    exit 1
}

Write-Host "1. Checking current Discord process status..." -ForegroundColor Cyan
pm2 list | Select-String "hktrpg-discord"

Write-Host ""
Write-Host "2. Stopping Discord process..." -ForegroundColor Cyan
pm2 stop hktrpg-discord

# Wait for process to completely stop
Write-Host "3. Waiting for process to completely stop..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check for any remaining Discord processes
Write-Host "4. Checking for remaining processes..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
$discordProcesses = $nodeProcesses | Where-Object { 
    $_.ProcessName -eq "node" -and 
    ($_.CommandLine -like "*discord*" -or $_.CommandLine -like "*index.js*")
}

if ($discordProcesses) {
    Write-Host "Found remaining processes:" -ForegroundColor Yellow
    $discordProcesses | ForEach-Object {
        Write-Host "PID: $($_.Id), Command: $($_.CommandLine)" -ForegroundColor Yellow
    }
}

# Force kill any remaining processes
Write-Host "5. Force cleaning remaining processes..." -ForegroundColor Cyan
try {
    # Kill Discord related processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*discord*" -or 
        $_.CommandLine -like "*discord-hybrid-sharding*" -or
        $_.CommandLine -like "*discord_bot.js*" -or
        $_.CommandLine -like "*core-Discord.js*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "Cleaned Discord related processes" -ForegroundColor Green
} catch {
    Write-Host "Error cleaning processes: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Wait for cleanup to complete
Start-Sleep -Seconds 5

Write-Host "6. Restarting Discord process..." -ForegroundColor Cyan
pm2 start hktrpg-discord

# Wait for process to start
Write-Host "7. Waiting for process to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "8. Checking new process status..." -ForegroundColor Cyan
pm2 list | Select-String "hktrpg-discord"

Write-Host "9. Checking process logs..." -ForegroundColor Cyan
Write-Host "Recent log output:" -ForegroundColor Yellow
pm2 logs hktrpg-discord --lines 10

Write-Host ""
Write-Host "=== Restart Complete ===" -ForegroundColor Green
Write-Host "Time: $(Get-Date)" -ForegroundColor Yellow

# Check if process is running normally
$finalStatus = pm2 list | Select-String "hktrpg-discord"
if ($finalStatus -match "online") {
    Write-Host "✅ Discord process successfully restarted and running" -ForegroundColor Green
} else {
    Write-Host "❌ Discord process restart failed" -ForegroundColor Red
    Write-Host "Please check logs: pm2 logs hktrpg-discord" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Restart script execution completed!" -ForegroundColor Green 