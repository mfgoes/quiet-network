"""
Simple Flask server for Quiet Network Bot Dashboard
Provides a web interface to run bot scripts and view status
"""

import json
import subprocess
import sys
import os
import webbrowser
import threading
from pathlib import Path
from flask import Flask, jsonify, send_file, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
SEED_SCRIPT = SCRIPT_DIR / "seed_bots.py"
POSTS_FILE = SCRIPT_DIR / "circles" / "haarlem" / "posts.json"
SYNTHETIC_FILE = SCRIPT_DIR / "circles" / "haarlem" / "synthetic_content.json"
ENV_FILE = SCRIPT_DIR / "circles" / "shared" / ".env"


def run_script(script_path, args=None):
    """Run a Python script and capture output."""
    cmd = [sys.executable, str(script_path)]
    if args:
        cmd.extend(args)

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
            cwd=str(SCRIPT_DIR),
        )
        return {
            "ok": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }
    except subprocess.TimeoutExpired:
        return {"ok": False, "stdout": "", "stderr": "Script timed out (120s)"}
    except Exception as e:
        return {"ok": False, "stdout": "", "stderr": str(e)}


# ── Dashboard ──────────────────────────────────────────────

@app.route("/")
def dashboard():
    """Serve the dashboard HTML."""
    html_path = SCRIPT_DIR / "dashboard.html"
    if html_path.exists():
        return send_file(str(html_path))
    return "<h1>Dashboard not found</h1><p>dashboard.html is missing</p>", 404


# ── API ────────────────────────────────────────────────────

@app.route("/api/status")
def status():
    """Check configuration status."""
    # Check if seed script exists
    seed_ok = SEED_SCRIPT.exists()

    # Check if env file exists and is configured
    env_ok = False
    env_msg = ".env not found"
    if ENV_FILE.exists():
        content = ENV_FILE.read_text()
        # Check for both new and old variable names
        has_url = "SUPABASE_URL=" in content
        has_key = "SUPABASE_SERVICE_ROLE_KEY=" in content or "SUPABASE_KEY=" in content
        has_placeholder = "your-service-role-key-here" in content or "your-url" in content

        if not has_url or not has_key or has_placeholder:
            env_msg = ".env found but needs configuration"
        else:
            env_ok = True
            env_msg = ".env configured"

    # Count posts
    posts_count = 0
    synthetic_count = 0

    if POSTS_FILE.exists():
        try:
            posts_count = len(json.loads(POSTS_FILE.read_text()))
        except Exception:
            pass

    if SYNTHETIC_FILE.exists():
        try:
            data = json.loads(SYNTHETIC_FILE.read_text())
            if "posts" in data:
                synthetic_count = len(data["posts"])
            elif "metadata" in data and "total_posts" in data["metadata"]:
                synthetic_count = data["metadata"]["total_posts"]
        except Exception:
            pass

    return jsonify({
        "seed_script": {"ok": seed_ok, "message": "Ready" if seed_ok else "Not found"},
        "env": {"ok": env_ok, "message": env_msg},
        "posts_count": posts_count,
        "synthetic_count": synthetic_count,
    })


@app.route("/api/seed", methods=["POST"])
def seed():
    """Run the seed_bots.py script."""
    return jsonify(run_script(SEED_SCRIPT))


@app.route("/api/posts")
def view_posts():
    """View posts.json content."""
    if not POSTS_FILE.exists():
        return jsonify([])
    try:
        return jsonify(json.loads(POSTS_FILE.read_text()))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/synthetic")
def view_synthetic():
    """View synthetic_content.json."""
    if not SYNTHETIC_FILE.exists():
        return jsonify({"error": "File not found"}), 404
    try:
        return jsonify(json.loads(SYNTHETIC_FILE.read_text()))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/circles")
def list_circles():
    """Fetch available circles from Supabase."""
    # Read Supabase config from .env file
    try:
        if not ENV_FILE.exists():
            return jsonify({"error": ".env file not found"}), 500

        # Parse .env file
        from dotenv import dotenv_values
        config = dotenv_values(ENV_FILE)

        supabase_url = config.get("SUPABASE_URL")
        service_key = config.get("SUPABASE_SERVICE_ROLE_KEY") or config.get("SUPABASE_KEY")

        if not supabase_url or not service_key:
            return jsonify({"error": "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"}), 500

        # Make request to Supabase
        import urllib.request
        import urllib.error

        api_url = f"{supabase_url}/rest/v1/circles?select=id,name,description"
        headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
        }

        req = urllib.request.Request(api_url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            circles = json.loads(resp.read().decode())
            return jsonify(circles)

    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        return jsonify({"error": f"Supabase API error: {error_body}"}), e.code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("=" * 60)
    print("Quiet Network Bot Dashboard")
    print("=" * 60)
    print(f"\nDashboard: http://localhost:5000")
    print("Press CTRL+C to stop.\n")
    print("=" * 60)

    # Auto-open browser after 1 second
    threading.Timer(1.0, lambda: webbrowser.open("http://localhost:5000")).start()

    app.run(host="127.0.0.1", port=5000, debug=False)
