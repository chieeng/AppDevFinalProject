@echo off
REM Full Stack Startup Script
REM Starts both Spring Boot backend and React frontend

cd /d "%~dp0"
echo.
echo =====================================
echo   Full Stack Development Environment
echo =====================================
echo.
echo Starting Backend...
echo.

REM Start Spring Boot backend in a new window
start "Spring Boot Backend - localhost:8000/api" cmd /k cd spring-boot-backend ^& mvn spring-boot:run

REM Wait 5 seconds for backend to start
timeout /t 5 /nobreak

echo Starting Frontend...
echo.

REM Start React frontend in a new window
start "React Frontend - localhost:3000" cmd /k npm start

echo.
echo =====================================
echo   Both servers are starting!
echo =====================================
echo.
echo Backend API: http://localhost:8000/api
echo Frontend:    http://localhost:3000
echo.
echo Press CTRL+C in each window to stop the servers
echo.
echo Backend:  http://localhost:8000/
echo Admin:    http://localhost:8000/admin/
echo Frontend: http://localhost:3000/
echo.
echo Close individual windows to stop each server
echo.

pause
