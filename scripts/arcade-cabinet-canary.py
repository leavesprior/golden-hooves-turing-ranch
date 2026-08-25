#!/usr/bin/env python3
"""Wheelwright stdout must be JSON only. Arcade cabinet canary."""
import json
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path('/home/granny/bobr-visual64')
BASE = 'http://127.0.0.1:3099'


def http(path, timeout=6):
    url = BASE + path
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'bobr-arcade-canary'})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read().decode('utf-8', 'replace')
            return int(r.status), body
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode('utf-8', 'replace')
        except Exception:
            body = ''
        return int(e.code), body
    except Exception as e:
        return 0, e.__class__.__name__


def run_tsx(rel):
    try:
        p = subprocess.run(
            ['npx', 'tsx', rel],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=40,
        )
        return p.returncode == 0, (p.stdout or p.stderr or '')[-400:]
    except Exception as e:
        return False, e.__class__.__name__


u1_ok, _u1 = run_tsx('src/lib/arcadeFirstLevel.test.ts')
u2_ok, _u2 = run_tsx('src/lib/exploreQrGate.test.ts')
u3_ok, _u3 = run_tsx('src/app/oregon-trail/data/adamsEasterEggs.bridge.test.ts')
u4_ok, _u4 = run_tsx('src/lib/gpsProximity.test.ts')
code_home, home = http('/')
code_lock, lock = http('/explore')
code_qr, qr = http('/explore?qr=ranch-house')
server_up = code_home == 200
lock_ok = (not server_up) or (code_lock == 200 and 'at the ranch house' in lock.lower())
qr_ok = (not server_up) or (code_qr == 200)
book_ok = (not server_up) or (code_home == 200 and 'airbnb.com/h/backofbeyondranch' in home.lower())
png = ROOT / 'public/qr-codes/ranch-house.png'
out = {
    'ok': bool(u1_ok and u2_ok and u3_ok and u4_ok and (not server_up or (lock_ok and qr_ok and book_ok))),
    'server_up': server_up,
    'units': {'arcade': u1_ok, 'qr_gate': u2_ok, 'bridge': u3_ok, 'gps': u4_ok},
    'http': {'home': code_home, 'lock': code_lock, 'qr': code_qr},
    'lock_ok': lock_ok,
    'qr_ok': qr_ok,
    'book_ok': book_ok,
    'qr_png': png.exists() and png.stat().st_size > 800,
    '_conf': 1 if server_up else -1,
}
print(json.dumps(out))
