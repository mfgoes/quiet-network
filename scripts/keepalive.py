#!/usr/bin/env python3
"""
Supabase keepalive script for Quiet Network (project: gtlhwapapaeytlialzfrao)

Sends a lightweight authenticated REST request to Supabase every run.
Schedule this every 5-6 days via GitHub Actions cron to stay under the 7-day
inactivity threshold.

Required env vars:
  SUPABASE_URL      - e.g. https://gtlhwapapaeytlialzfrao.supabase.co
  SUPABASE_ANON_KEY - your anon/public key (safe to use here, read-only)
"""

import os
import sys
import urllib.request
import urllib.error
import json
from datetime import datetime, timezone

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
MAX_RETRIES = 3


def ping():
    # Lightweight read: fetch 1 row from the circles table (anon read allowed)
    url = f"{SUPABASE_URL}/rest/v1/circles?select=id&limit=1"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }
    req = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.urlopen(req, timeout=15) as resp:
        status = resp.status
        body = resp.read().decode()
        return status, body


def main():
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set", file=sys.stderr)
        sys.exit(1)

    now = datetime.now(timezone.utc).isoformat()
    print(f"[{now}] Pinging Supabase project...")

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            status, body = ping()
            if status == 200:
                data = json.loads(body)
                print(f"[{now}] OK (HTTP {status}) — got {len(data)} row(s). Project is alive.")
                return
            else:
                print(f"[{now}] Attempt {attempt}: unexpected status {status}")
        except urllib.error.URLError as e:
            print(f"[{now}] Attempt {attempt}: network error — {e}")
        except Exception as e:
            print(f"[{now}] Attempt {attempt}: error — {e}")

        if attempt < MAX_RETRIES:
            import time
            time.sleep(5 * attempt)

    print(f"[{now}] All {MAX_RETRIES} attempts failed.", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
