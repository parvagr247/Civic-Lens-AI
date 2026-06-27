@echo off
title CivicLens AI - Services Stopper
echo ===================================================
echo             CivicLens AI Services Stopper
echo ===================================================
echo.

echo [1/2] Terminating Backend process on port 9526...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9526') do (
    echo Found Backend process (PID: %%a). Terminating...
    taskkill /f /pid %%a >nul 2>&1
)

echo [2/2] Terminating Frontend process on port 3026...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3026') do (
    echo Found Frontend process (PID: %%a). Terminating...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo ===================================================
echo All services stopped successfully.
echo ===================================================
echo.
pause
