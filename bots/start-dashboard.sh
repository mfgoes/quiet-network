#!/bin/bash
echo "============================================================"
echo "Quiet Network Bot Dashboard"
echo "============================================================"
echo ""
echo "Starting Bot Dashboard on http://localhost:5000"
echo "Starting Vite dev server (npm run dev)..."
echo "Browser will open automatically..."
echo ""
echo "Press CTRL+C to stop the servers"
echo "============================================================"
echo ""

# Change to the bots directory
cd "$(dirname "$0")"

# Start Vite dev server in a new terminal tab/window
if command -v osascript &> /dev/null; then
    osascript -e "tell application \"Terminal\" to do script \"cd '$(dirname "$0")/..' && npm run dev\""
else
    # Fallback: run in background
    (cd .. && npm run dev) &
fi

# Activate virtual environment
VENV_ACTIVATE="circles/shared/venv/bin/activate"
if [ -f "$VENV_ACTIVATE" ]; then
    source "$VENV_ACTIVATE"
else
    echo "Error: Virtual environment not found!"
    echo "Please run: python3 -m venv circles/shared/venv"
    echo "Then run:   source circles/shared/venv/bin/activate"
    echo "Then run:   pip install -r requirements.txt"
    exit 1
fi

# Start the Flask dashboard server
python server.py
