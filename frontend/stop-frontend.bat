@echo off
title CivicLens AI - Stop Frontend
echo Stopping Frontend process on port 3026...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3026') do (
    echo Found process (PID: %%a). Terminating...
    taskkill /f /pid %%a >nul 2>&1
)
echo Frontend service stopped.
echo.
pause
