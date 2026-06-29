@echo off
REM Software Inc Mod Studio — Quick Start (Windows)
REM Requires Node.js: https://nodejs.org/

echo ==========================================
echo   Software Inc Mod Studio
echo ==========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: npm install failed. Make sure Node.js is installed.
        echo Download from https://nodejs.org/
        pause
        exit /b 1
    )
    echo.
)

echo Starting server...
echo Open http://localhost:8080 in your browser
echo Press Ctrl+C to stop
echo.

node server.js
