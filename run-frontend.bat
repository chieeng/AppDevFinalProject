@echo off
REM React Frontend Startup Script
REM Runs the development server on localhost:3000

cd /d "%~dp0"
echo.
echo =====================================
echo   Starting React Development Server
echo =====================================
echo.
echo Frontend URL: http://localhost:3000/
echo.
echo Press CTRL+C to stop the server
echo.

call npm start

pause
