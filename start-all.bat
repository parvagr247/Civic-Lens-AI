@echo off
title CivicLens AI - Services Launcher
echo ===================================================
echo             CivicLens AI Services Launcher
echo ===================================================
echo.
echo [1/2] Starting Spring Boot Backend on port 9526...
start "CivicLens AI Backend (Port 9526)" cmd /k "cd backend && call mvnw.cmd spring-boot:run"

echo [2/2] Starting React (Vite) Frontend on port 3026...
start "CivicLens AI Frontend (Port 3026)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo All services launched!
echo Backend logs are running in secondary console.
echo Frontend server is running in secondary console.
echo ===================================================
echo.
pause
