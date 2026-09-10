#!/usr/bin/env python
"""
Standalone System Acceptance & Health Verification Script (SIH26027)
Executes all 12 Non-Negotiable Criterion Checks sequentially and prints a
comprehensive production readiness report.
"""

import os
import sys
import uuid
import json
from datetime import datetime, timedelta

# Ensure backend root is on Python module search path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import (
    User, Task, BlockPlan, PlannedTask, EventLog, StateProjection,
    SecurityAuditLog, Department, SafetyLane, TaskStatus,
    BlockPlanStatus, Defect
)
from app.services.event_engine import append_event
from app.services.bundling_engine import evaluate_compatibility_gates, generate_bundle_recommendation

client = TestClient(app)

def get_token(service_id: str, password: str = "railway@2026") -> str:
    res = client.post("/api/auth/login", json={"service_id": service_id, "password": password})
    if res.status_code != 200:
        raise RuntimeError(f"Auth failed for {service_id}: {res.text}")
    return res.json()["access_token"]


def check_t1():
    token = get_token("IR-STN-0450")
    db = SessionLocal()
    try:
        before = db.query(SecurityAuditLog).filter(
            SecurityAuditLog.actor_id == "IR-STN-0450",
            SecurityAuditLog.action == "ACCESS_DENIED"
        ).count()
        res = client.get("/api/command", headers={"Authorization": f"Bearer {token}"})
        if res.status_code != 403:
            return False, f"Expected 403, got {res.status_code}"
        after = db.query(SecurityAuditLog).filter(
            SecurityAuditLog.actor_id == "IR-STN-0450",
            SecurityAuditLog.action == "ACCESS_DENIED"
        ).count()
        if after <= before:
            return False, "Security audit log not appended"
        return True, "Station Master restricted from /api/command, ACCESS_DENIED logged"
    finally:
        db.close()


def check_t2():
    token = get_token("IR-ENG-4471")
    res = client.post("/api/blocks/optimize", json={}, headers={"Authorization": f"Bearer {token}"})
    if res.status_code != 403:
        return False, f"Expected 403 Forbidden, got {res.status_code}"
    return True, "DEPT_SUPERVISOR rejected from POST /api/blocks/optimize with 403 Forbidden"


def check_t3():
    res = client.get("/api/trains/occupancy")
    if res.status_code != 200:
        return False, f"Expected 200, got {res.status_code}"
    data = res.json()
    ledger = data.get("ledger", [])
    train_count = data.get("train_count", len(ledger))
    if len(ledger) < 1:
        return False, "Ledger empty"
    if train_count < 3:
        return False, f"Expected train count >= 3, got {train_count}"
    return True, f"First paint valid ({len(ledger)} trains in ledger, total count: {train_count})"


def check_t4():
    res = client.get("/api/trains/occupancy")
    if res.status_code != 200:
        return False, f"Expected 200, got {res.status_code}"
    data = res.json()
    ledger = data.get("ledger", [])
    calc_sum = round(sum(item["wtm_penalty"] for item in ledger), 2)
    reported = round(data.get("total_wtm", 0.0), 2)
    if reported != calc_sum:
        return False, f"total_wtm ({reported}) != sum(ledger) ({calc_sum})"
    return True, f"Single source of truth verified: total_wtm ({reported}) == sum(ledger)"


def check_t5():
    terms = ['RADAR', 'live targets', 'Auto-Interlocking', 'free window']
    violations = []
    for root, dirs, files in os.walk(PROJECT_ROOT):
        if any(ign in root for ign in ['node_modules', 'venv', '.git', '.pytest_cache', 'dist', 'build']):
            continue
        for f in files:
            if f.endswith(('.py', '.ts', '.tsx')):
                p = os.path.join(root, f)
                if 'test_acceptance_suite.py' in p or 'verify_system.py' in p:
                    continue
                try:
                    with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                        c = fp.read()
                        for term in terms:
                            if term.lower() in c.lower():
                                violations.append((f, term))
                except Exception:
                    pass
    if violations:
        return False, f"Found forbidden terms: {violations}"
    return True, "0 forbidden strings found across all source files"


def check_t6():
    db = SessionLocal()
    try:
        res = client.get("/api/dashboard/summary")
        if res.status_code != 200:
            return False, f"Expected 200, got {res.status_code}"
        d = res.json()
        db_tasks = db.query(Task).count()
        db_tsrs = db.query(Defect).filter(Defect.tsr_active == 1).count()
        if d.get("total_tasks") != db_tasks:
            return False, f"Tasks count mismatch: {d.get('total_tasks')} != {db_tasks}"
        if d.get("active_tsrs") != db_tsrs:
            return False, f"TSRs mismatch: {d.get('active_tsrs')} != {db_tsrs}"
        return True, f"Dashboard metrics mapped to live DB (Tasks: {db_tasks}, TSRs: {db_tsrs})"
    finally:
        db.close()


def check_t7():
    db = SessionLocal()
    try:
        plan_code = f"BLK-T7-SYS-{uuid.uuid4().hex[:6]}"
        block = BlockPlan(
            plan_code=plan_code,
            plan_version=1,
            version=1,
            status=BlockPlanStatus.APPROVED,
            horizon_start=datetime.utcnow(),
            horizon_end=datetime.utcnow() + timedelta(hours=3),
            p50_duration_minutes=120.0
        )
        db.add(block)
        db.commit()
        db.refresh(block)

        res = client.post(f"/api/blocks/{plan_code}/replan", json={"reason_code": "WEATHER_DISRUPTION", "reason": "Rain"})
        if res.status_code != 200:
            return False, f"Replan failed: {res.text}"
        data = res.json()
        if data["new_version"] != 2:
            return False, f"Expected version 2, got {data['new_version']}"

        stale_res = client.post(f"/api/blocks/{plan_code}/field-event", json={"step_event": "START", "plan_version": 1})
        if stale_res.status_code != 409:
            return False, f"Expected 409 for stale version, got {stale_res.status_code}"
        return True, "Replan bumped version (V1 -> V2) and invalidated prior version actions (409)"
    finally:
        db.close()


def check_t8():
    db = SessionLocal()
    try:
        block = BlockPlan(
            plan_code=f"BLK-T8-SYS-{uuid.uuid4().hex[:6]}",
            plan_version=1,
            version=1,
            status=BlockPlanStatus.APPROVED,
            horizon_start=datetime.utcnow(),
            horizon_end=datetime.utcnow() + timedelta(hours=2),
            p50_duration_minutes=120.0
        )
        db.add(block)
        db.commit()
        db.refresh(block)

        t1 = Task(
            task_code=f"TSK_SYS_E_{uuid.uuid4().hex[:6]}",
            department=Department.ENG,
            work_type="TRACK",
            block_section_id=1,
            km_from=115.0,
            km_to=116.0,
            lane=SafetyLane.LANE_B1,
            estimated_duration_minutes=90,
            status=TaskStatus.EXECUTED,
            division_id="DLI"
        )
        t2 = Task(
            task_code=f"TSK_SYS_T_{uuid.uuid4().hex[:6]}",
            department=Department.TRD,
            work_type="OHE",
            block_section_id=1,
            km_from=115.0,
            km_to=116.0,
            lane=SafetyLane.LANE_B1,
            estimated_duration_minutes=90,
            status=TaskStatus.IN_PROGRESS,
            division_id="DLI"
        )
        db.add_all([t1, t2])
        db.commit()

        now = datetime.utcnow()
        pt1 = PlannedTask(block_plan_id=block.id, task_id=t1.id, block_window_id=1, planned_start=now, planned_end=now + timedelta(hours=2))
        pt2 = PlannedTask(block_plan_id=block.id, task_id=t2.id, block_window_id=1, planned_start=now, planned_end=now + timedelta(hours=2))
        db.add_all([pt1, pt2])
        db.commit()

        res = client.post(f"/api/blocks/{block.id}/field-event", json={"task_id": t1.id, "step_event": "HANDBACK", "plan_version": block.plan_version})
        if res.status_code != 422:
            return False, f"Expected 422 Unprocessable Entity, got {res.status_code}"
        return True, "Joint handback locked (HTTP 422) while partner department is in progress"
    finally:
        db.close()


def check_t9():
    db = SessionLocal()
    try:
        code = f"BLK-SYNC-SYS-{uuid.uuid4().hex[:6]}"
        offline = [{"block_id": code, "step_event": s, "plan_version": 1, "client_timestamp": f"2026-09-09T0{i}:00:00Z"} for i, s in enumerate(["ACK", "READY", "START", "CHECK", "COMPLETE"], 1)]
        res = client.post("/api/blocks/sync-events", json={"events": offline})
        if res.status_code != 200:
            return False, f"Sync failed: {res.text}"
        rows = db.query(EventLog).filter(EventLog.ref_id == code).all()
        if len(rows) != 5:
            return False, f"Expected 5 rows in event_log, got {len(rows)}"
        return True, f"All 5 offline queued events safely recovered into append-only event log"
    finally:
        db.close()


def check_t10():
    db = SessionLocal()
    try:
        row = db.query(EventLog).first()
        try:
            row.actor_id = "TAMPERED"
            db.commit()
            return False, "UPDATE did not raise RuntimeError"
        except RuntimeError:
            db.rollback()

        fresh = db.query(EventLog).first()
        try:
            db.delete(fresh)
            db.commit()
            return False, "DELETE did not raise RuntimeError"
        except RuntimeError:
            db.rollback()

        # Compensating event
        task_code = f"TSK_COMP_{uuid.uuid4().hex[:6]}"
        t = Task(task_code=task_code, department=Department.ENG, work_type="RAIL", block_section_id=1, km_from=100.0, km_to=101.0, lane=SafetyLane.LANE_B1, estimated_duration_minutes=60, status=TaskStatus.REPORTED, division_id="DLI")
        db.add(t)
        db.commit()
        append_event(db, "TASK", task_code, "VERIFIED", "DEPT_VERIFY", "IR-ENG-4471", "DEPT_SUPERVISOR", "ENG")
        db.commit()
        append_event(db, "TASK", task_code, "REPORTED", "RETURNED", "IR-ENG-4471", "DEPT_SUPERVISOR", "ENG", reason_code="DEFICIT")
        db.commit()
        p = db.query(StateProjection).filter(StateProjection.ref_id == task_code).first()
        if not p or p.stage != "REPORTED":
            return False, f"Compensating event did not revert projection: {p.stage if p else 'None'}"
        return True, "EventLog strictly append-only (tamper-proof listeners) and compensating event reverts projection"
    finally:
        db.close()


def check_t11():
    db = SessionLocal()
    try:
        i_tok = get_token("IR-INS-6612")
        s_tok = get_token("IR-ENG-4471")
        c_tok = get_token("IR-OPS-1102")

        res = client.post("/api/tasks/ingest/defect", json={"defect_type": "TRACK", "description": "Pocket", "km_from": 120.0, "km_to": 120.2, "severity": "NORMAL", "department": "ENG", "reported_by": "IR-INS-6612"}, headers={"Authorization": f"Bearer {i_tok}"})
        if res.status_code != 200:
            return False, f"Defect ingestion failed: {res.text}"
        code = res.json()["task_code"]

        db.expire_all()
        p = db.query(StateProjection).filter(StateProjection.ref_id == code).first()
        if not p or p.stage != "REPORTED":
            return False, f"Task not in REPORTED stage: {p.stage if p else 'None'}"

        d_res = client.get("/api/tasks", headers={"Authorization": f"Bearer {s_tok}"})
        if code not in [t["task_code"] for t in d_res.json()]:
            return False, "Not in supervisor queue"

        c_res = client.get("/api/command", headers={"Authorization": f"Bearer {c_tok}"})
        if code in c_res.json().get("task_codes", []):
            return False, "Task in REPORTED unexpectedly visible to Section Controller"

        client.post(f"/api/tasks/{code}/transition", json={"stage": "VERIFIED", "event": "DEPT_VERIFY", "actor_id": "IR-ENG-4471", "actor_role": "DEPT_SUPERVISOR", "actor_dept": "ENG"}, headers={"Authorization": f"Bearer {s_tok}"})
        client.post(f"/api/tasks/{code}/transition", json={"stage": "ELIGIBLE", "event": "STATUTORY_READINESS_CONFIRMED", "actor_id": "IR-ENG-4471", "actor_role": "DEPT_SUPERVISOR", "actor_dept": "ENG"}, headers={"Authorization": f"Bearer {s_tok}"})

        c_res2 = client.get("/api/command", headers={"Authorization": f"Bearer {c_tok}"})
        if code not in c_res2.json().get("task_codes", []):
            return False, "Eligible task missing from Section Controller /command"
        return True, "Field Inspector defect isolated in supervisor queue; visible to controller only after ELIGIBLE"
    finally:
        db.close()


def check_t12():
    db = SessionLocal()
    try:
        i_tok = get_token("IR-INS-6612")
        res = client.post("/api/tasks/ingest/defect", json={"defect_type": "FRACTURE", "description": "Emergency crack", "km_from": 121.0, "km_to": 121.1, "severity": "SAFETY_CRITICAL", "safety_protocol_acknowledged": True, "department": "ENG", "reported_by": "IR-INS-6612"}, headers={"Authorization": f"Bearer {i_tok}"})
        if res.status_code != 200:
            return False, f"Failed: {res.text}"
        code = res.json()["task_code"]
        db.expire_all()
        t = db.query(Task).filter(Task.task_code == code).first()
        if not t or t.lane != SafetyLane.LANE_A:
            return False, "Task was not assigned to Lane A"

        normal = db.query(Task).filter(Task.lane != SafetyLane.LANE_A).first()
        eval_res = evaluate_compatibility_gates([t, normal])
        if eval_res["all_passed"] is not False:
            return False, "Gate did not reject Lane A task"
        rec = generate_bundle_recommendation([t, normal])
        if rec.get("bundle_feasible", rec.get("summary", {}).get("bundle_feasible")) is not False:
            return False, "Bundling recommendation admitted Lane A task"
        return True, "Lane A emergency task strictly rejected by compatibility gates and bundling engine"
    finally:
        db.close()


CHECKS = [
    ("T1: Station Master Restricted (403 Logged)", check_t1),
    ("T2: Optimizer Server-Side RBAC (403 Forbidden)", check_t2),
    ("T3: Non-Empty First Paint for Marey / Occupancy", check_t3),
    ("T4: Single Source of Truth for WTM", check_t4),
    ("T5: Zero Forbidden Strings in Codebase", check_t5),
    ("T6: Traceable Numerical Metrics", check_t6),
    ("T7: Replan Version Invalidation", check_t7),
    ("T8: Joint Handback Interlock (HTTP 422)", check_t8),
    ("T9: Offline Field Sync Recovery", check_t9),
    ("T10: Append-Only EventLog Integrity", check_t10),
    ("T11: Field Inspector Isolation", check_t11),
    ("T12: Lane A Optimizer Exclusion", check_t12)
]

def main():
    print("=" * 80)
    print("INDIAN RAILWAYS AI-POWERED BLOCK PLANNING ENGINE (SIH26027)")
    print("COMPREHENSIVE SYSTEM ACCEPTANCE & HEALTH VERIFICATION RUNNER")
    print("=" * 80)

    passed_count = 0
    total_count = len(CHECKS)

    for name, check_fn in CHECKS:
        try:
            ok, msg = check_fn()
            if ok:
                passed_count += 1
                print(f"[PASS] {name}")
            else:
                print(f"[FAIL] {name} -> {msg}")
        except Exception as e:
            print(f"[ERROR] {name} -> {type(e).__name__}: {e}")

    print("=" * 80)
    if passed_count == total_count:
        print(f"OVERALL STATUS: PRODUCTION READY ({passed_count}/{total_count} PASSED)")
        print("=" * 80)
        sys.exit(0)
    else:
        print(f"OVERALL STATUS: FAILED ({passed_count}/{total_count} PASSED)")
        print("=" * 80)
        sys.exit(1)

if __name__ == "__main__":
    main()
