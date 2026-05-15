@echo off
REM Spring Boot Backend Startup Script
REM Runs the development server on localhost:8000/api

cd /d "%~dp0spring-boot-backend"
echo.
echo =====================================
echo   Starting Spring Boot Backend Server
echo =====================================
echo.
echo Backend URL: http://localhost:8000/api
echo.
echo Press CTRL+C to stop the server
echo.

echo Building and running Spring Boot application...
call mvn spring-boot:run

pause
