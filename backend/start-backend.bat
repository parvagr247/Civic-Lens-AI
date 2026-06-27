@echo off
title CivicLens AI - Backend Service
echo ===================================================
echo             CivicLens AI Backend Service
echo ===================================================
echo.
echo Starting Spring Boot Backend on port 9526...
call mvnw.cmd spring-boot:run
echo.
pause
