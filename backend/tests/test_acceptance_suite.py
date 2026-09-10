"""
Indian Railways AI-Powered Block Planning Engine (SIH26027)
Acceptance Tests Suite (T1 to T12)
Validating all 12 non-negotiable hackathon architectural & safety criteria.
"""

import os
import uuid
import json
from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models import (
    User, Task, BlockPlan, PlannedTask, EventLog, StateProjection,
    SecurityAuditLog, AuditLog, Department, SafetyLane, TaskStatus,
    BlockPlanStatus, Defect
)
from app.services.event_engine import append_event
from app.services.bundling_engine import evaluate_compatibility_gates, generate_bundle_recommendation

client = TestClient(app)

@pytest.fixture(scope="function")
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


def get_token_for(service_id: str, password: str = "railway@2026") -> str:
    """Helper to authenticate and obtain verified JWT token."""
    res = client.post("/api/auth/login", json={"service_id": service_id, "password": password})
    assert res.status_code == 200, f"Login failed for {service_id}: {res.text}"
    return res.json()["access_token"]


# ==============================================================================
# T1: STATION_MASTER Access Barrier
# Authenticate as IR-STN-0450. Attempt GET /api/command or GET /command.
# Assert status_code == 403.
# Assert a row with action="ACCESS_DENIED" was appended to security audit logs.
# ==============================================================================
def test_t1_station_master_access_barrier(db):
    token = get_token_for("IR-STN-0450")
    headers = {"Authorization": f"Bearer {token}"}

    sec_count_before = db.query(SecurityAuditLog).filter(
        SecurityAuditLog.actor_id == "IR-STN-0450",
        SecurityAuditLog.action == "ACCESS_DENIED"
    ).count()

    response = client.get("/api/command", headers=headers)
    assert response.status_code == 403, f"Expected 403 Forbidden, got {response.status_code}"
    assert "forbidden" in response.text.lower() or "lacks required capability" in response.text.lower()

    sec_count_after = db.query(SecurityAuditLog).filter(
        SecurityAuditLog.actor_id == "IR-STN-0450",
        SecurityAuditLog.action == "ACCESS_DENIED"
    ).count()

    assert sec_count_after > sec_count_before, "Expected new ACCESS_DENIED security audit log entry"

    latest_sec_log = db.query(SecurityAuditLog).filter(
        SecurityAuditLog.actor_id == "IR-STN-0450",
        SecurityAuditLog.action == "ACCESS_DENIED"
    ).order_by(SecurityAuditLog.id.desc()).first()
    assert latest_sec_log is not None
    assert latest_sec_log.actor_role == "STATION_MASTER"
    assert "/api/command" in latest_sec_log.endpoint


# ==============================================================================
# T2: Server-Side RBAC Enforcement on Optimization
# Authenticate as IR-ENG-4471 (DEPT_SUPERVISOR).
# Issue POST /api/blocks/optimize with a valid token.
# Assert server returns HTTP 403 Forbidden (not handled merely by UI).
# ==============================================================================
def test_t2_server_side_rbac_on_optimization(db):
    token = get_token_for("IR-ENG-4471")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/api/blocks/optimize", json={}, headers=headers)
    assert response.status_code == 403, f"Expected 403 Forbidden for DEPT_SUPERVISOR, got {response.status_code}"
    assert "forbidden" in response.text.lower() or "lacks required capability" in response.text.lower()


# ==============================================================================
# T3: Non-Empty First Paint for Marey / Occupancy
# Hit GET /api/trains/occupancy without query params.
# Assert len(response.data["ledger"]) >= 1.
# Assert train count >= 3.
# ==============================================================================
def test_t3_non_empty_first_paint_for_marey():
    response = client.get("/api/trains/occupancy")
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    data = response.json()

    assert "ledger" in data
    assert len(data["ledger"]) >= 1, "Expected non-empty ledger for first paint"
    assert data.get("train_count", len(data["ledger"])) >= 3, "Expected train count >= 3"


# ==============================================================================
# T4: Single Source of Truth for WTM
# Fetch block occupancy summary.
# Assert response.data["total_wtm"] == sum(item["wtm_penalty"] for item in response.data["ledger"]).
# ==============================================================================
def test_t4_single_source_of_truth_for_wtm():
    response = client.get("/api/trains/occupancy")
    assert response.status_code == 200
    data = response.json()

    ledger = data["ledger"]
    calculated_sum = round(sum(item["wtm_penalty"] for item in ledger), 2)
    reported_total = round(data["total_wtm"], 2)

    assert reported_total == calculated_sum, (
        f"WTM Mathematical Invariant Violated: total_wtm ({reported_total}) != sum(ledger) ({calculated_sum})"
    )


# ==============================================================================
# T5: Zero Forbidden Strings in Codebase
# Grep all frontend and backend source files for forbidden terms:
# ['RADAR', 'live targets', 'Auto-Interlocking', 'free window'].
# Assert zero occurrences across all .py, .ts, .tsx files.
# ==============================================================================
def test_t5_zero_forbidden_strings_in_codebase():
    forbidden_terms = ['RADAR', 'live targets', 'Auto-Interlocking', 'free window']
    violations = []

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

    for root, dirs, files in os.walk(base_dir):
        if any(ignored in root for ignored in ['node_modules', 'venv', '.git', '.pytest_cache', 'dist', 'build']):
            continue
        for f in files:
            if f.endswith(('.py', '.ts', '.tsx')):
                filepath = os.path.join(root, f)
                if 'test_acceptance_suite.py' in filepath or 'verify_system.py' in filepath:
                    continue
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as fp:
                        content = fp.read()
                        for term in forbidden_terms:
                            if term.lower() in content.lower():
                                violations.append((filepath, term))
                except Exception:
                    pass

    assert len(violations) == 0, f"Found forbidden terms in codebase: {violations}"


# ==============================================================================
# T6: Traceable Numerical Metrics
# Assert all dashboard counts (Active Tasks, Ready, TSR count) map to live DB queries
# or carry explicit 'PROTOTYPE' markers.
# ==============================================================================
def test_t6_traceable_numerical_metrics(db):
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()

    db_total_tasks = db.query(Task).count()
    db_active_tsrs = db.query(Defect).filter(Defect.tsr_active == 1).count()
    db_plans = db.query(BlockPlan).count()

    assert data["total_tasks"] == db_total_tasks, f"total_tasks mismatch: API {data['total_tasks']} != DB {db_total_tasks}"
    assert data["active_tsrs"] == db_active_tsrs, f"active_tsrs mismatch: API {data['active_tsrs']} != DB {db_active_tsrs}"
    assert data["generated_plans"] == db_plans, f"generated_plans mismatch: API {data['generated_plans']} != DB {db_plans}"
    assert "high_readiness_pct" in data
    assert 0 <= data["high_readiness_pct"] <= 100


# ==============================================================================
# T7: Replan Version Invalidation
# Approve a block (plan_version = 1), then trigger replan/edit.
# Assert plan_version increments to 2.
# Assert previous acks for this block are marked invalid.
# ==============================================================================
def test_t7_replan_version_invalidation(db):
    plan_code = f"BLK-T7-{uuid.uuid4().hex[:6]}"
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

    initial_version = block.plan_version or 1

    # Record an initial ACK on version 1
    ack_event = EventLog(
        ref_type="BLOCK_REQUEST",
        ref_id=block.plan_code,
        stage="ACK_COMPLETE",
        event="BLOCK_ACK",
        actor_id="IR-ENG-4471",
        actor_role="DEPT_SUPERVISOR",
        actor_dept="ENG",
        plan_version=initial_version,
        payload={"status": "VALID_ACK"},
        ts=datetime.utcnow()
    )
    db.add(ack_event)
    db.commit()

    # Trigger replan
    response = client.post(
        f"/api/blocks/{block.plan_code}/replan",
        json={"reason_code": "WEATHER_DISRUPTION", "reason": "Heavy fog requiring corridor adjustment"}
    )
    assert response.status_code == 200, f"Replan failed: {response.text}"
    replan_data = response.json()

    assert replan_data["new_version"] == initial_version + 1, "plan_version should increment by 1"

    db.refresh(block)
    assert block.plan_version == initial_version + 1

    # Check that event_log recorded PLAN_VERSION_BUMP marking invalidation
    bump_event = db.query(EventLog).filter(
        EventLog.ref_id == block.plan_code,
        EventLog.event == "PLAN_VERSION_BUMP",
        EventLog.plan_version == block.plan_version
    ).first()
    assert bump_event is not None
    assert bump_event.payload.get("invalidated_acks") is True

    # Check stale version action is rejected with HTTP 409
    stale_res = client.post(
        f"/api/blocks/{block.plan_code}/field-event",
        json={
            "step_event": "START",
            "plan_version": initial_version,
            "remarks": "Operating on stale version"
        }
    )
    assert stale_res.status_code == 409, "Action on previous version must return HTTP 409 Conflict"


# ==============================================================================
# T8: Joint Handback Interlock
# For a multi-department block where Dept A is COMPLETE but Dept B is IN_PROGRESS:
# Attempt POST /api/blocks/{id}/field-event with step_event="HANDBACK".
# Assert server responds with HTTP 422 (Joint Handback Lockout).
# ==============================================================================
def test_t8_joint_handback_interlock(db):
    unique_code = f"BLK-INTERLOCK-{uuid.uuid4().hex[:6]}"
    block = BlockPlan(
        plan_code=unique_code,
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

    eng_task = Task(
        task_code=f"TSK_ENG_LOCK_{uuid.uuid4().hex[:6]}",
        department=Department.ENG,
        work_type="TRACK_REPAIR",
        block_section_id=1,
        km_from=115.0,
        km_to=116.0,
        lane=SafetyLane.LANE_B1,
        estimated_duration_minutes=90,
        status=TaskStatus.EXECUTED,
        division_id="DLI"
    )
    trd_task = Task(
        task_code=f"TSK_TRD_LOCK_{uuid.uuid4().hex[:6]}",
        department=Department.TRD,
        work_type="OHE_CHECK",
        block_section_id=1,
        km_from=115.0,
        km_to=116.0,
        lane=SafetyLane.LANE_B1,
        estimated_duration_minutes=90,
        status=TaskStatus.IN_PROGRESS,
        division_id="DLI"
    )
    db.add_all([eng_task, trd_task])
    db.commit()
    db.refresh(eng_task)
    db.refresh(trd_task)

    now = datetime.utcnow()
    pt1 = PlannedTask(block_plan_id=block.id, task_id=eng_task.id, block_window_id=1, planned_start=now, planned_end=now + timedelta(hours=2), setup_minutes=10, work_minutes=90, clearance_minutes=10)
    pt2 = PlannedTask(block_plan_id=block.id, task_id=trd_task.id, block_window_id=1, planned_start=now, planned_end=now + timedelta(hours=2), setup_minutes=10, work_minutes=90, clearance_minutes=10)
    db.add_all([pt1, pt2])
    db.commit()

    # Attempt HANDBACK while TRD is still IN_PROGRESS -> HTTP 422
    response = client.post(
        f"/api/blocks/{block.id}/field-event",
        json={
            "task_id": eng_task.id,
            "step_event": "HANDBACK",
            "plan_version": block.plan_version,
            "remarks": "Attempting premature handback while partner is in progress"
        }
    )
    assert response.status_code == 422, f"Expected 422 Unprocessable Entity, got {response.status_code}: {response.text}"
    assert "Joint Handback Locked" in response.json()["detail"]


# ==============================================================================
# T9: Offline Field Sync Recovery
# Simulate an offline array of 5 field events with client timestamps.
# Send bulk sync to backend.
# Assert all 5 events persist in event_log with server-generated ts.
# ==============================================================================
def test_t9_offline_field_sync_recovery(db):
    unique_block = f"BLK-SYNC-{uuid.uuid4().hex[:6]}"
    offline_events = [
        {"block_id": unique_block, "step_event": "ACK", "plan_version": 1, "client_timestamp": "2026-09-09T01:30:00.000Z", "remarks": "Offline ack step"},
        {"block_id": unique_block, "step_event": "READY", "plan_version": 1, "client_timestamp": "2026-09-09T01:45:00.000Z", "remarks": "Offline site ready step"},
        {"block_id": unique_block, "step_event": "START", "plan_version": 1, "client_timestamp": "2026-09-09T02:00:00.000Z", "remarks": "Offline work started"},
        {"block_id": unique_block, "step_event": "PROGRESS_CHECK", "plan_version": 1, "client_timestamp": "2026-09-09T02:45:00.000Z", "remarks": "Offline mid-possession telemetry"},
        {"block_id": unique_block, "step_event": "COMPLETE", "plan_version": 1, "client_timestamp": "2026-09-09T03:30:00.000Z", "remarks": "Offline work completed"}
    ]

    before_sync_ts = datetime.utcnow() - timedelta(seconds=2)

    response = client.post("/api/blocks/sync-events", json={"events": offline_events})
    assert response.status_code == 200, f"Sync failed: {response.text}"
    data = response.json()

    assert data["status"] == "SUCCESS"
    assert data["synced_count"] == 5

    synced_rows = db.query(EventLog).filter(EventLog.ref_id == unique_block).all()
    assert len(synced_rows) == 5

    for row in synced_rows:
        assert row.ts >= before_sync_ts, "Row must carry server-generated timestamp"
        payload = row.payload if isinstance(row.payload, dict) else (json.loads(row.payload) if row.payload else {})
        assert payload.get("offline_synced") is True
        assert payload.get("client_timestamp") is not None


# ==============================================================================
# T10: Append-Only EventLog Integrity
# Attempt an UPDATE or DELETE on any row in event_log.
# Assert RuntimeError is thrown by ORM event listeners.
# Assert a compensating event (RETURNED/REJECTED) successfully reverts state projection.
# ==============================================================================
def test_t10_append_only_eventlog_integrity(db):
    row = db.query(EventLog).first()
    assert row is not None

    # 1. Attempt UPDATE -> RuntimeError
    with pytest.raises(RuntimeError) as exc_update:
        row.actor_id = "MALICIOUS_ACTOR"
        db.commit()
    assert "strictly append-only" in str(exc_update.value)
    db.rollback()

    # 2. Attempt DELETE -> RuntimeError
    fresh_row = db.query(EventLog).first()
    with pytest.raises(RuntimeError) as exc_delete:
        db.delete(fresh_row)
        db.commit()
    assert "strictly append-only" in str(exc_delete.value)
    db.rollback()

    # 3. Create fresh task and test compensating event
    unique_task_code = f"TSK_T10_{uuid.uuid4().hex[:6]}"
    test_task = Task(
        task_code=unique_task_code,
        department=Department.ENG,
        work_type="TRACK_ALIGNMENT",
        block_section_id=1,
        km_from=110.0,
        km_to=111.0,
        lane=SafetyLane.LANE_B1,
        estimated_duration_minutes=90,
        status=TaskStatus.REPORTED,
        division_id="DLI"
    )
    db.add(test_task)
    db.commit()

    append_event(
        db=db,
        ref_type="TASK",
        ref_id=unique_task_code,
        stage="VERIFIED",
        event="DEPT_VERIFY",
        actor_id="IR-ENG-4471",
        actor_role="DEPT_SUPERVISOR",
        actor_dept="ENG"
    )
    db.commit()

    proj = db.query(StateProjection).filter(StateProjection.ref_id == unique_task_code).first()
    assert proj is not None
    assert proj.stage == "VERIFIED"

    # Compensating event: REJECTED / RETURNED to REPORTED
    append_event(
        db=db,
        ref_type="TASK",
        ref_id=unique_task_code,
        stage="REPORTED",
        event="RETURNED",
        actor_id="IR-ENG-4471",
        actor_role="DEPT_SUPERVISOR",
        actor_dept="ENG",
        reason_code="RESOURCE_DEFICIT"
    )
    db.commit()

    db.refresh(proj)
    assert proj.stage == "REPORTED", "Compensating event successfully transitioned projection back to REPORTED"


# ==============================================================================
# T11: Field Inspector Isolation
# Submit defect via IR-INS-6612.
# Assert task enters DEPT_SUPERVISOR's Verification Queue in stage='REPORTED'.
# Assert task is NOT visible on Section Controller's /command until stage becomes 'ELIGIBLE'.
# ==============================================================================
def test_t11_field_inspector_isolation(db):
    inspector_token = get_token_for("IR-INS-6612")
    supervisor_token = get_token_for("IR-ENG-4471")
    controller_token = get_token_for("IR-OPS-1102")

    defect_payload = {
        "defect_type": "TRACK_SURFACE",
        "description": "Minor ballast pocket depression",
        "km_from": 125.4,
        "km_to": 125.6,
        "severity": "NORMAL",
        "department": "ENG",
        "reported_by": "IR-INS-6612"
    }

    # 1. Inspector logs defect
    res = client.post("/api/tasks/ingest/defect", json=defect_payload, headers={"Authorization": f"Bearer {inspector_token}"})
    assert res.status_code == 200, f"Defect ingest failed: {res.text}"
    created_task = res.json()
    task_code = created_task["task_code"]

    db.expire_all()
    # 2. Check stage in DB projection is REPORTED
    proj = db.query(StateProjection).filter(StateProjection.ref_id == task_code).first()
    assert proj is not None
    assert proj.stage == "REPORTED"

    # 3. Visible in DEPT_SUPERVISOR's queue
    dept_res = client.get("/api/tasks", headers={"Authorization": f"Bearer {supervisor_token}"})
    assert dept_res.status_code == 200
    dept_task_codes = [t["task_code"] for t in dept_res.json()]
    assert task_code in dept_task_codes, "Task must be visible in DEPT_SUPERVISOR verification queue"

    # 4. NOT visible on Section Controller's /command endpoint
    cmd_res = client.get("/api/command", headers={"Authorization": f"Bearer {controller_token}"})
    assert cmd_res.status_code == 200
    controller_task_codes = cmd_res.json().get("task_codes", [])
    assert task_code not in controller_task_codes, "Task in REPORTED stage must NOT be visible on Section Controller /command"

    # 5. Transition task through supervisor verification to ELIGIBLE
    client.post(
        f"/api/tasks/{task_code}/transition",
        json={
            "stage": "VERIFIED",
            "event": "DEPT_VERIFY",
            "actor_id": "IR-ENG-4471",
            "actor_role": "DEPT_SUPERVISOR",
            "actor_dept": "ENG"
        },
        headers={"Authorization": f"Bearer {supervisor_token}"}
    )
    client.post(
        f"/api/tasks/{task_code}/transition",
        json={
            "stage": "ELIGIBLE",
            "event": "STATUTORY_READINESS_CONFIRMED",
            "actor_id": "IR-ENG-4471",
            "actor_role": "DEPT_SUPERVISOR",
            "actor_dept": "ENG"
        },
        headers={"Authorization": f"Bearer {supervisor_token}"}
    )

    # 6. Now visible on Section Controller's /command
    cmd_res_after = client.get("/api/command", headers={"Authorization": f"Bearer {controller_token}"})
    assert cmd_res_after.status_code == 200
    assert task_code in cmd_res_after.json().get("task_codes", []), "Once ELIGIBLE, task becomes visible on /command"


# ==============================================================================
# T12: Lane A Optimizer Exclusion
# Mark a task with severity='SAFETY_CRITICAL' (Lane A).
# Run bundling optimizer.
# Assert Lane A task is never bundled into candidate blocks.
# ==============================================================================
def test_t12_lane_a_optimizer_exclusion(db):
    inspector_token = get_token_for("IR-INS-6612")

    # Ingest Lane A emergency defect
    res = client.post(
        "/api/tasks/ingest/defect",
        json={
            "defect_type": "RAIL_FRACTURE",
            "description": "Rail weld crack KM 130.2 - EMERGENCY PROTECTION",
            "km_from": 130.2,
            "km_to": 130.3,
            "severity": "SAFETY_CRITICAL",
            "safety_protocol_acknowledged": True,
            "department": "ENG",
            "reported_by": "IR-INS-6612"
        },
        headers={"Authorization": f"Bearer {inspector_token}"}
    )
    assert res.status_code == 200
    task_data = res.json()
    lane_a_code = task_data["task_code"]

    db.expire_all()
    lane_a_task = db.query(Task).filter(Task.task_code == lane_a_code).first()
    assert lane_a_task is not None
    assert lane_a_task.lane == SafetyLane.LANE_A

    normal_trd = db.query(Task).filter(Task.department == Department.TRD, Task.lane != SafetyLane.LANE_A).first()
    normal_snt = db.query(Task).filter(Task.department == Department.SNT, Task.lane != SafetyLane.LANE_A).first()

    candidate_tasks = [lane_a_task, normal_trd, normal_snt]

    gate_eval = evaluate_compatibility_gates(candidate_tasks)
    assert gate_eval["all_passed"] is False, "Bundling including Lane A task must fail gate evaluation"

    safety_gate = next(c for c in gate_eval["checks"] if c["name"] == "SAFETY")
    assert safety_gate["passed"] is False, "Safety gate must fail when Lane A task is present"
    assert "Lane A emergency task detected" in safety_gate["details"]

    rec = generate_bundle_recommendation(candidate_tasks)
    assert rec["bundle_feasible"] is False, "Bundle containing Lane A task cannot be feasible"
