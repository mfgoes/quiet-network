@echo off
title Quiet Network Bot Dashboard
echo ============================================================
echo Quiet Network Bot Dashboard
echo ============================================================
echo.
echo Starting Bot Dashboard on http://localhost:5000
echo Starting Vite dev server (npm run dev)...
echo Browser will open automatically...
echo.
echo Press CTRL+C to stop the servers
echo ============================================================
echo.

cd /d "%~dp0"

REM Start Vite dev server in a separate window
start "Quiet Network - Vite Dev Server" cmd /k "cd /d "%~dp0.." && npm run dev"

REM Activate virtual environment
if exist "circles\shared\venv\Scripts\activate.bat" (
    call circles\shared\venv\Scripts\activate.bat
) else (
    echo Error: Virtual environment not found!
    echo Please run: python -m venv circles\shared\venv
    echo Then run: circles\shared\venv\Scripts\activate.bat
    echo Then run: pip install -r requirements.txt
    pause
    exit /b 1
)

REM Start the Flask dashboard server
python server.py

pause
