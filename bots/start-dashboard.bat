@echo off
title Quiet Network Bot Dashboard
echo ============================================================
echo Quiet Network Bot Dashboard
echo ============================================================
echo.
echo Starting server on http://localhost:5000
echo Browser will open automatically...
echo.
echo Press CTRL+C to stop the server
echo ============================================================
echo.

cd /d "%~dp0"

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

REM Start the server
python server.py

pause
