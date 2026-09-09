import pytest
import uuid
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import (
    Task, BlockPlan, PlannedTask, AuditLog, Department, 
    SafetyLane, TaskStatus, BlockPlanStatus
)
from app.services.readiness import (
    calculate_readiness_score, classify_readiness_band, evaluate_readiness
)

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper to obtain auth token
def get_auth_token(role: str, username: str = None) -> str:
    user = username or f"Officer_{role}"
    res = client.post("/api/auth/login-as", json={"role": role, "username": user})
    assert res.status_code == 200, f"Login failed for role {role}: {res.text}"
    return res.json()["access_token"]


# ==============================================================================
# TEST 1: FIELD EXEC LEAD CANNOT SANCTION PLAN (HTTP 403 & AUDIT ACCESS_DENIED)
# ==============================================================================
def test_field_exec_lead_cannot_sanction_plan(db_session):
    """
    1. Verify that FIELD_EXEC_LEAD attempting to approve/sanction a plan
       is blocked with HTTP 403 Forbidden.
    2. Verify that an ACCESS_DENIED security barrier entry is created in AuditLog.
    """
    token = get_auth_token("FIELD_EXEC_LEAD")
    headers = {"Authorization": f"Bearer {token}"}

    # Ensure a plan exists
    plan = db_session.query(BlockPlan).first()
    if not plan:
        plan = BlockPlan(
            plan_code=f"PLAN_TEST_APPROVE_{uuid.uuid4().hex[:6]}",
            version=1,
            plan_version=1,
            status=BlockPlanStatus.PENDING_APPROVAL,
            horizon_start=datetime.now(),
            horizon_end=datetime.now() + timedelta(hours=4),
            p50_duration_minutes=120.0
        )
        db_session.add(plan)
        db_session.commit()
        db_session.refresh(plan)

    audit_count_before = db_session.query(AuditLog).filter(
        AuditLog.action == "ACCESS_DENIED",
        AuditLog.actor_role == "FIELD_EXEC_LEAD"
    ).count()

    response = client.post(f"/api/plans/{plan.id}/approve", headers=headers)
    assert response.status_code == 403, f"Expected 403 Forbidden but got {response.status_code}: {response.text}"
    assert "lacks required capabilities" in response.json()["detail"] or "forbidden" in response.json()["detail"].lower()

    # Verify AuditLog security barrier
    latest_denied = db_session.query(AuditLog).filter(
        AuditLog.action == "ACCESS_DENIED",
        AuditLog.actor_role == "FIELD_EXEC_LEAD"
    ).order_by(AuditLog.id.desc()).first()

    assert latest_denied is not None
    assert latest_denied.entity_type == "SECURITY_BARRIER"
    assert latest_denied.action == "ACCESS_DENIED"
    assert latest_denied.actor_role == "FIELD_EXEC_LEAD"


# ==============================================================================
# TEST 2: ROW-LEVEL ISOLATION (TRD SUPERVISOR CANNOT SEE UNSHARED ENG TASK)
# ==============================================================================
def test_row_level_isolation_trd_supervisor_cannot_see_unshared_eng_task(db_session):
    """
    1. Ensure an unshared ENG task exists.
    2. Authenticate as DEPT_SUPERVISOR (TRD).
    3. Assert that the unshared ENG task is NOT present in the returned list.
    """
    unique_code = f"TSK_ENG_ISOLATED_{uuid.uuid4().hex[:6]}"
    isolated_eng_task = Task(
        task_code=unique_code,
        department=Department.ENG,
        work_type="TRACK_ALIGNMENT_UNSHARED",
        block_section_id=1,
        km_from=105.0,
        km_to=106.0,
        lane=SafetyLane.LANE_B1,
        estimated_duration_minutes=90,
        status=TaskStatus.ELIGIBLE,
        division_id="DLI",
        team_id=101
    )
    db_session.add(isolated_eng_task)
    db_session.commit()
    db_session.refresh(isolated_eng_task)

    token = get_auth_token("DEPT_SUPERVISOR")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/tasks", headers=headers)
    assert response.status_code == 200

    tasks_returned = response.json()
    task_codes = [t["task_code"] for t in tasks_returned]

    # The unshared ENG task must NOT be visible to TRD Supervisor
    assert unique_code not in task_codes, f"Row-level isolation failed: {unique_code} was visible to TRD Supervisor!"


# ==============================================================================
# TEST 3: CO-BLOCK READ-ONLY EXCEPTION FOR INTEGRATED BLOCKS
# ==============================================================================
def test_co_block_read_only_exception_for_integrated_blocks(db_session):
    """
    1. Ensure an integrated block exists containing both a TRD task and an ENG task.
    2. Authenticate as DEPT_SUPERVISOR (TRD).
    3. Assert that the ENG task IS present, has read_only=True, and its editable attributes are stripped.
    """
    unique_id = uuid.uuid4().hex[:6]
    eng_code = f"TSK_ENG_COBLOCK_{unique_id}"
    trd_code = f"TSK_TRD_COBLOCK_{unique_id}"
    plan_code = f"PLAN_INTEGRATED_{unique_id}"

    # Create integrated plan
    plan = BlockPlan(
        plan_code=plan_code,
        version=1,
        plan_version=1,
        status=BlockPlanStatus.PENDING_APPROVAL,
        horizon_start=datetime.now(),
        horizon_end=datetime.now() + timedelta(hours=4),
        p50_duration_minutes=150.0
    )
    db_session.add(plan)
    db_session.commit()
    db_session.refresh(plan)

    # Create ENG task
    eng_task = Task(
        task_code=eng_code,
        department=Department.ENG,
        work_type="POINT_RENEWAL_COBLOCK",
        block_section_id=1,
        km_from=110.0,
        km_to=111.0,
        lane=SafetyLane.LANE_B1,
        estimated_duration_minutes=120,
        assigned_to="PWAY_GANG_01",
        status=TaskStatus.ELIGIBLE,
        division_id="DLI",
        team_id=101
    )
    # Create TRD task
    trd_task = Task(
        task_code=trd_code,
        department=Department.TRD,
        work_type="OHE_MAINTENANCE_COBLOCK",
        block_section_id=1,
        km_from=110.0,
        km_to=111.0,
        lane=SafetyLane.LANE_B1,
        estimated_duration_minutes=120,
        assigned_to="TRD_TOWER_01",
        status=TaskStatus.ELIGIBLE,
        division_id="DLI",
        team_id=102
    )
    db_session.add_all([eng_task, trd_task])
    db_session.commit()
    db_session.refresh(eng_task)
    db_session.refresh(trd_task)

    # Bundle both tasks into the integrated block plan
    pt_eng = PlannedTask(
        block_plan_id=plan.id,
        task_id=eng_task.id,
        block_window_id=1,
        planned_start=datetime.now(),
        planned_end=datetime.now() + timedelta(hours=2),
        setup_minutes=15,
        work_minutes=90,
        clearance_minutes=15,
        handback_minutes=10,
        readiness_score=100.0,
        explanation="Integrated ENG possession"
    )
    pt_trd = PlannedTask(
        block_plan_id=plan.id,
        task_id=trd_task.id,
        block_window_id=1,
        planned_start=datetime.now(),
        planned_end=datetime.now() + timedelta(hours=2),
        setup_minutes=15,
        work_minutes=90,
        clearance_minutes=15,
        handback_minutes=10,
        readiness_score=100.0,
        explanation="Integrated TRD possession"
    )
    db_session.add_all([pt_eng, pt_trd])
    db_session.commit()

    token = get_auth_token("DEPT_SUPERVISOR")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/tasks", headers=headers)
    assert response.status_code == 200

    tasks_returned = response.json()
    matching_eng = next((t for t in tasks_returned if t["task_code"] == eng_code), None)

    assert matching_eng is not None, "Integrated co-block ENG task should be visible to TRD supervisor under co-block exception"
    assert matching_eng["read_only"] is True, "Co-block partner task must be marked read_only: True"
    assert matching_eng["co_block_partner"] is True, "Co-block partner task must be flagged co_block_partner: True"
    assert matching_eng["assigned_to"] is None, "Editable attributes like assigned_to must be stripped for external department tasks"


# ==============================================================================
# TEST 4: MANDATORY REASON CODE VALIDATION ON OVERRIDE (HTTP 422)
# ==============================================================================
def test_mandatory_reason_code_validation_on_override(db_session):
    """
    1. Authenticate as DIVISIONAL_OFFICER.
    2. Attempt POST /api/plans/{id}/override with empty/missing reason_code -> HTTP 422.
    3. Attempt POST /api/plans/{id}/override with valid reason_code -> HTTP 200 & AuditLog action="OVERRIDE".
    """
    token = get_auth_token("DIVISIONAL_OFFICER")
    headers = {"Authorization": f"Bearer {token}"}

    plan = db_session.query(BlockPlan).first()
    assert plan is not None

    # Empty reason code -> 422
    res_empty = client.post(
        f"/api/plans/{plan.id}/override",
        json={"reason_code": ""},
        headers=headers
    )
    assert res_empty.status_code == 422, f"Expected 422 for empty reason code, got {res_empty.status_code}"

    # Missing reason code payload -> 422
    res_missing = client.post(
        f"/api/plans/{plan.id}/override",
        json={},
        headers=headers
    )
    assert res_missing.status_code == 422, f"Expected 422 for missing reason code, got {res_missing.status_code}"

    # Invalid reason code -> 422
    res_invalid = client.post(
        f"/api/plans/{plan.id}/override",
        json={"reason_code": "INVALID_CODE"},
        headers=headers
    )
    assert res_invalid.status_code == 422, f"Expected 422 for invalid reason code, got {res_invalid.status_code}"

    # Valid reason code -> 200
    res_valid = client.post(
        f"/api/plans/{plan.id}/override",
        json={"reason_code": "TRAFFIC_PRESSURE", "reason_text": "High priority container train movement"},
        headers=headers
    )
    assert res_valid.status_code == 200, f"Expected 200 for valid override, got {res_valid.status_code}: {res_valid.text}"
    assert res_valid.json()["success"] is True

    # Verify AuditLog entry
    latest_audit = db_session.query(AuditLog).filter(
        AuditLog.action == "OVERRIDE",
        AuditLog.entity_id == str(plan.id)
    ).order_by(AuditLog.id.desc()).first()

    assert latest_audit is not None
    assert latest_audit.action == "OVERRIDE"
    assert latest_audit.reason_code == "TRAFFIC_PRESSURE"
    assert latest_audit.actor_role == "DIVISIONAL_OFFICER"


# ==============================================================================
# TEST 5: READINESS GATE 60-79 BAND FORCES PLAN B
# ==============================================================================
def test_readiness_gate_60_79_band_forces_plan_b():
    """
    1. Ingest/calculate scores yielding a 70.0 readiness score.
    2. Assert that status is "PLAN_B_MANDATORY".
    3. Assert that plan_b_mandatory is True and plan_a_allowed is False.
    4. Assert that the +45m uncertainty buffer is enforced.
    """
    # 5-Pillar weights: Machine(0.25), Gang(0.20), Material(0.20), PTW(0.20), Weather(0.15)
    # Balanced inputs at 70.0 produce exactly 70.0
    score = calculate_readiness_score(
        machine=70.0,
        gang=70.0,
        material=70.0,
        ptw=70.0,
        site_weather=70.0
    )
    assert score == 70.0

    band = classify_readiness_band(score)
    assert band["status"] == "PLAN_B_MANDATORY"
    assert band["plan_b_mandatory"] is True
    assert band["plan_a_allowed"] is False
    assert "+45m" in band["recommendation"], "Must enforce +45m uncertainty buffer"
    assert "Enforced buffer applied" in band["system_alert"]

    # Also verify evaluate_readiness with dummy task object
    class DummyTask:
        task_code = "TSK_TEST_BAND_70"
        lane = SafetyLane.LANE_B1
        material_ready = 1
        ptw_ready = 1
        worksite_ready = 1
        weather_suitable = 1
        requires_line_block = 1
        id = 999

    override_pillars = {
        "machine": 70.0,
        "gang": 70.0,
        "material": 70.0,
        "ptw": 70.0,
        "site_weather": 70.0
    }
    assessment = evaluate_readiness(DummyTask(), override_pillars=override_pillars)
    assert assessment["readiness_score"] == 70.0
    assert assessment["status"] == "PLAN_B_MANDATORY"
    assert assessment["plan_b_mandatory"] is True
    assert assessment["plan_a_allowed"] is False
    assert "+45m" in assessment["recommendation"]
