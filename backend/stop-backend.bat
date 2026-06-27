@echo off
title CivicLens AI - Stop Backend
echo Stopping Backend process on port 9526...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9526') do (
    echo Found process (PID: %%a). Terminating...
    taskkill /f /pid %%a >nul 2>&1
)
echo Backend service stopped.
echo.
pause
