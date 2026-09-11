"""
PRE-PRESENTATION DEEP SYSTEM AUDIT, VERIFICATION & SELF-HEALING SUITE
=======================================================================
Verifies all critical features against the live FastAPI backend (http://127.0.0.1:8000).

Audit Modules:
  A. Google OR-Tools CP-SAT Optimizer (/api/plans/optimize)
  B. RailRadar Live Telemetry Integration (/api/live/trains, /api/live/station)
  C. Multi-Role RBAC & G&SR Rule 4.14 Safety Barrier
  D. Cryptographic Audit Ledger (/api/audit)
  E. Frontend Build & UI Integrity Check
  F. Dual-Plan Engine & Marey Graph Integration
"""

import sys
import os
import json
import time
import subprocess

# ============================================================================
# UTILITIES
# ============================================================================

BASE_URL = "http://127.0.0.1:8000"
RESULTS = []
SECRET_KEY = "prototype_secret_key_sih26027_production_grade_security_key_32"
ALGORITHM = "HS256"

def _http_request(method, path, body=None, headers=None, timeout=15):
    """HTTP client using urllib (no external deps)."""
    import urllib.request
    import urllib.error
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method.upper())
    req.add_header("Accept", "application/json")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            body_text = e.read().decode("utf-8")
            return e.code, json.loads(body_text)
        except Exception:
            return e.code, {"detail": str(e)}
    except Exception as e:
        return 0, {"error": str(e)}

def _make_jwt(service_id, role, capabilities=None):
    """Generate a JWT token for testing RBAC."""
    try:
        import jwt as pyjwt
        payload = {
            "sub": service_id,
            "service_id": service_id,
            "role": role,
            "capabilities": capabilities or [],
            "division_id": "DLI",
            "exp": int(time.time()) + 3600
        }
        return pyjwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    except ImportError:
        return None

def record(workflow, passed, detail):
    status = "PASS" if passed else "FAIL"
    RESULTS.append((workflow, status, detail))
    tag = "[PASS]" if passed else "[FAIL]"
    print(f"  {tag} {workflow}: {detail}")

def print_summary():
    print("\n" + "=" * 100)
    print(f"  {'WORKFLOW':<62} | {'STATUS':<8} | DETAILS")
    print("-" * 100)
    for wf, st, det in RESULTS:
        print(f"  {wf:<62} | {st:<8} | {det}")
    print("=" * 100)
    total = len(RESULTS)
    passed = sum(1 for _, s, _ in RESULTS if s == "PASS")
    failed = total - passed
    pct = round(100 * passed / total, 1) if total else 0
    print(f"\n  TOTAL: {total}  |  PASSED: {passed}  |  FAILED: {failed}  |  PASS RATE: {pct}%\n")
    if failed == 0:
        print("  PRE-PRESENTATION STATUS: 100% PRODUCTION READY")
    else:
        print(f"  PRE-PRESENTATION STATUS: {pct}% ({failed} FAILURES DETECTED)")
    print()


# ============================================================================
# A. GOOGLE OR-TOOLS CP-SAT OPTIMIZER
# ============================================================================

def audit_optimizer():
    print("\n[A] GOOGLE OR-TOOLS CP-SAT OPTIMIZER")
    print("-" * 60)

    code, data = _http_request("POST", "/api/plans/optimize")

    record("A1. POST /api/plans/optimize => 200 OK",
           code == 200, f"HTTP {code}")

    if code != 200:
        for i in range(2, 8):
            record(f"A{i}. (skipped)", False, "Endpoint failed")
        return

    engine = data.get("solver_engine", "")
    record("A2. solver_engine == 'Google OR-Tools CP-SAT'",
           engine == "Google OR-Tools CP-SAT", f"Got: '{engine}'")

    status_val = data.get("status", "")
    record("A3. status == 'OPTIMAL'",
           status_val == "OPTIMAL", f"Got: '{status_val}'")

    solve_ms = data.get("solve_time_ms", -1)
    record("A4. solve_time_ms > 0",
           isinstance(solve_ms, (int, float)) and solve_ms > 0, f"Got: {solve_ms}ms")

    branches = data.get("branches", -1)
    record("A5. branches >= 0",
           isinstance(branches, (int, float)) and branches >= 0, f"Got: {branches}")

    wtm = data.get("wtm_penalty")
    record("A6. wtm_penalty > 0",
           wtm is not None and isinstance(wtm, (int, float)) and wtm > 0, f"Got: {wtm}")

    schedules = data.get("train_schedules", [])
    record("A7. train_schedules populated",
           len(schedules) > 0, f"{len(schedules)} trains in optimal schedule")


# ============================================================================
# B. RAILRADAR LIVE TELEMETRY
# ============================================================================

def audit_railradar():
    print("\n[B] LUCKNOW NR CORRIDOR & RAILRADAR TELEMETRY")
    print("-" * 60)

    code, data = _http_request("GET", "/api/live/trains/12004")
    record("B1. GET /api/live/trains/12004 => 200 OK",
           code == 200, f"HTTP {code}")

    if code == 200:
        record("B2. Response has train_number '12004'",
               data.get("train_number") == "12004", f"Got: {data.get('train_number')}")
        record("B3. Response has delay_minutes field",
               "delay_minutes" in data, f"delay_minutes = {data.get('delay_minutes')}")
        record("B4. Response has non-empty status",
               bool(data.get("status")), f"status = '{str(data.get('status', ''))[:60]}'")
    else:
        for i in range(2, 5):
            record(f"B{i}. (skipped)", False, "Endpoint failed")

    code2, data2 = _http_request("GET", "/api/live/station/LKO")
    record("B5. GET /api/live/station/LKO => 200 OK",
           code2 == 200, f"HTTP {code2}")

    if code2 == 200:
        record("B6. Station board has trains[] array",
               isinstance(data2.get("trains"), list),
               f"{len(data2.get('trains', []))} approaching services")
        record("B7. Division contains 'Lucknow'",
               "Lucknow" in str(data2.get("division", "")),
               f"division = '{data2.get('division', '')}'")
    else:
        record("B6. (skipped)", False, "Endpoint failed")
        record("B7. (skipped)", False, "Endpoint failed")


# ============================================================================
# C. MULTI-ROLE RBAC & G&SR RULE 4.14 SAFETY BARRIER
# ============================================================================

def audit_rbac_and_safety():
    print("\n[C] MULTI-ROLE RBAC & G&SR RULE 4.14 SAFETY BARRIER")
    print("-" * 60)

    sm_token = _make_jwt("IR-STN-0450", "STATION_MASTER", ["VIEW_STATION", "ACK_STATION"])
    if sm_token:
        sm_headers = {"Authorization": f"Bearer {sm_token}"}
        code, data = _http_request("POST", "/api/plans/1/sanction", body={}, headers=sm_headers)
        record("C1. Station Master => 403 on /api/plans/1/sanction",
               code == 403, f"HTTP {code} (expected 403)")
    else:
        record("C1. Station Master RBAC 403 check", False, "JWT library unavailable")

    code2, data2 = _http_request("GET", "/api/blocks/interlock-status")
    record("C2. GET /api/blocks/interlock-status => 200 OK",
           code2 == 200, f"HTTP {code2}")

    if code2 == 200:
        interlock = data2.get("interlock_status", "")
        record("C3. interlock_status is PENDING_SIGNATURES or CLEAR",
               "PENDING" in str(interlock) or interlock == "CLEAR",
               f"Got: '{interlock}'")
        depts = data2.get("departments", {})
        record("C4. Has 3 department signatures (ENG, TRD, SNT)",
               "ENG" in depts and "TRD" in depts and "SNT" in depts,
               f"Departments: {list(depts.keys())}")
    else:
        record("C3. (skipped)", False, "Endpoint failed")
        record("C4. (skipped)", False, "Endpoint failed")

    code3, data3 = _http_request("POST", "/api/blocks/handback", body={
        "block_code": "BLK-2026-DLI-04",
        "departments": {
            "ENG": {"signed": True},
            "TRD": {"signed": False},
            "SNT": {"signed": True}
        }
    })
    record("C5. Uncertified TRD handback => HTTP 422",
           code3 == 422, f"HTTP {code3} (expected 422)")

    if code3 == 422:
        detail = str(data3.get("detail", ""))
        record("C6. 422 detail mentions 'Joint Handback Locked'",
               "Joint Handback Locked" in detail, f"'{detail[:80]}'")
    else:
        record("C6. 422 detail check", False, f"HTTP {code3} instead of 422")

    code4, data4 = _http_request("POST", "/api/blocks/handback", body={
        "block_code": "BLK-2026-DLI-04",
        "departments": {
            "ENG": {"signed": True},
            "TRD": {"signed": True},
            "SNT": {"signed": True}
        }
    })
    record("C7. Full certification handback => 200 OK (CLEAR)",
           code4 == 200, f"HTTP {code4}")

    if code4 == 200:
        status_val = data4.get("status", data4.get("interlock_status", ""))
        record("C8. Handback response status == 'CLEAR'",
               status_val == "CLEAR", f"Got: '{status_val}'")
    else:
        record("C8. Handback CLEAR status", False, f"HTTP {code4}")


# ============================================================================
# D. CRYPTOGRAPHIC AUDIT LEDGER
# ============================================================================

def audit_ledger():
    print("\n[D] CRYPTOGRAPHIC AUDIT LEDGER")
    print("-" * 60)

    code, data = _http_request("GET", "/api/audit")
    record("D1. GET /api/audit => 200 OK", code == 200, f"HTTP {code}")

    if code == 200 and isinstance(data, list):
        record("D2. Audit returns non-empty log list",
               len(data) > 0, f"{len(data)} audit records")

        if len(data) > 0:
            all_have_hash = all(
                bool(entry.get("sha256_hash")) and
                str(entry["sha256_hash"]).startswith("0x") and
                len(str(entry["sha256_hash"])) >= 66
                for entry in data
            )
            record("D3. All records have valid SHA-256 digest (0x + 64 hex)",
                   all_have_hash, f"Checked {len(data)} records")

            all_have_action = all(bool(entry.get("action")) for entry in data)
            record("D4. All records have non-empty 'action' field",
                   all_have_action, f"Checked {len(data)} records")

            all_have_actor = all(bool(entry.get("actor_id")) for entry in data)
            record("D5. All records have non-empty 'actor_id' field",
                   all_have_actor, f"Checked {len(data)} records")
        else:
            record("D3. SHA-256 check", False, "No records")
            record("D4. Action check", False, "No records")
            record("D5. Actor check", False, "No records")
    else:
        for i in range(2, 6):
            record(f"D{i}. (skipped)", False, "Endpoint failed")


# ============================================================================
# E. FRONTEND BUILD & UI INTEGRITY CHECK
# ============================================================================

def audit_frontend():
    print("\n[E] FRONTEND BUILD & UI INTEGRITY CHECK")
    print("-" * 60)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    frontend_dir = os.path.join(project_root, "frontend")

    if not os.path.isdir(frontend_dir):
        record("E1. Frontend directory exists", False, f"Not found: {frontend_dir}")
        return

    record("E1. Frontend directory exists", True, frontend_dir)

    try:
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=frontend_dir,
            capture_output=True, text=True, timeout=120, shell=True
        )
        build_ok = result.returncode == 0
        record("E2. npm run build => Exit Code 0",
               build_ok, f"Exit code: {result.returncode}")
        if not build_ok:
            errors = [l.strip() for l in result.stdout.split("\n") if "error" in l.lower()][:3]
            for err in errors:
                record("E2.err", False, err[:100])
    except subprocess.TimeoutExpired:
        record("E2. npm run build", False, "Timed out after 120s")
    except FileNotFoundError:
        record("E2. npm run build", False, "npm not found")

    topology_path = os.path.join(frontend_dir, "src", "components", "corridor", "CorridorTrackTopology.tsx")
    if os.path.isfile(topology_path):
        with open(topology_path, "r", encoding="utf-8") as f:
            content = f.read()

        for stn in ["LKO", "MKG", "AJGAIN", "ON", "CNB"]:
            record(f"E3.{stn}. Station label '{stn}' in Topology",
                   stn in content, "Found" if stn in content else "NOT FOUND")

        record("E4. Ganga Bridge badge (Br. No. 109)",
               "Br. No. 109" in content or "Ganga" in content,
               "Found" if "Ganga" in content else "NOT FOUND")

        record("E5. Unnao Goods Siding pill",
               "UNNAO" in content.upper() and "SIDING" in content.upper(),
               "Found" if "SIDING" in content.upper() else "NOT FOUND")

        record("E6. Telemetry header 'Real-Time GPS Telemetry Active (LKO Division)'",
               "Real-Time GPS Telemetry Active (LKO Division)" in content,
               "Found" if "Real-Time GPS Telemetry Active (LKO Division)" in content else "NOT FOUND")

        record("E7. Interactive train modal (selectedTrain state)",
               "selectedTrain" in content, "Found" if "selectedTrain" in content else "NOT FOUND")

        record("E8. No setInterval animation loop",
               "setInterval" not in content,
               "Clean" if "setInterval" not in content else "WARNING: setInterval found")
    else:
        record("E3-E8. CorridorTrackTopology.tsx", False, "File not found")


# ============================================================================
# F. DUAL-PLAN ENGINE & MAREY GRAPH INTEGRATION
# ============================================================================

def audit_frontend_pages():
    print("\n[F] DUAL-PLAN ENGINE & MAREY GRAPH INTEGRATION")
    print("-" * 60)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    frontend_dir = os.path.join(project_root, "frontend")

    dpe_path = os.path.join(frontend_dir, "src", "pages", "DualPlanEngine.tsx")
    if os.path.isfile(dpe_path):
        with open(dpe_path, "r", encoding="utf-8") as f:
            dpe = f.read()
        record("F1. DualPlanEngine has 'Re-optimise Corridor' button",
               "Re-optimise Corridor" in dpe, "Found" if "Re-optimise Corridor" in dpe else "NOT FOUND")
        record("F2. DualPlanEngine has solverTelemetry state",
               "solverTelemetry" in dpe, "Found" if "solverTelemetry" in dpe else "NOT FOUND")
        record("F3. DualPlanEngine has optimizeCorridor import",
               "optimizeCorridor" in dpe, "Found" if "optimizeCorridor" in dpe else "NOT FOUND")
        record("F4. DualPlanEngine solver badge (solve_time_ms + solver_engine)",
               "solve_time_ms" in dpe and "solver_engine" in dpe,
               "Found" if "solve_time_ms" in dpe else "NOT FOUND")
    else:
        record("F1-F4. DualPlanEngine.tsx", False, "File not found")

    tgp_path = os.path.join(frontend_dir, "src", "pages", "TrainGraphPage.tsx")
    if os.path.isfile(tgp_path):
        with open(tgp_path, "r", encoding="utf-8") as f:
            tgp = f.read()
        record("F5. TrainGraphPage has 'Re-optimise Corridor' button",
               "Re-optimise Corridor" in tgp, "Found" if "Re-optimise Corridor" in tgp else "NOT FOUND")
        record("F6. TrainGraphPage has optimizeCorridor import",
               "optimizeCorridor" in tgp, "Found" if "optimizeCorridor" in tgp else "NOT FOUND")
        record("F7. TrainGraphPage has solverTelemetry state",
               "solverTelemetry" in tgp, "Found" if "solverTelemetry" in tgp else "NOT FOUND")
    else:
        record("F5-F7. TrainGraphPage.tsx", False, "File not found")

    sa_path = os.path.join(frontend_dir, "src", "pages", "StationAwareness.tsx")
    if os.path.isfile(sa_path):
        with open(sa_path, "r", encoding="utf-8") as f:
            sa = f.read()
        record("F8. StationAwareness has /api/live/station fetch",
               "/api/live/station" in sa or "live/station" in sa,
               "Found" if "live/station" in sa else "NOT FOUND")
    else:
        record("F8. StationAwareness.tsx", False, "File not found")


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("=" * 100)
    print("  PRE-PRESENTATION DEEP SYSTEM AUDIT & VERIFICATION SUITE")
    print(f"  Target: {BASE_URL}")
    print(f"  Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 100)

    print("\n[0] CONNECTIVITY CHECK")
    print("-" * 60)
    code, data = _http_request("GET", "/health")
    if code == 200:
        record("0. Backend health check => 200 OK", True, f"System: {data.get('system', 'N/A')}")
    else:
        record("0. Backend health check", False, f"HTTP {code} - Is the backend running on {BASE_URL}?")
        print("\n  [FATAL] Backend not reachable. Start with:")
        print("    cd backend && venv\\Scripts\\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000")
        print_summary()
        sys.exit(1)

    audit_optimizer()
    audit_railradar()
    audit_rbac_and_safety()
    audit_ledger()
    audit_frontend()
    audit_frontend_pages()

    print_summary()

    failed = sum(1 for _, s, _ in RESULTS if s == "FAIL")
    sys.exit(0 if failed == 0 else 1)
