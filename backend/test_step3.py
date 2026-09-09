from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import Task, BlockPlan, PlannedTask, AuditLog, SafetyLane, TaskStatus, BlockPlanStatus, Department
from app.schemas import (
    StatutoryIngestSchema, ConditionIngestSchema, DefectIngestSchema,
    ReadinessCalculationRequest, ReadinessPillars, TaskCreate
)
from app.services.readiness import (
    calculate_readiness_score, classify_readiness_band, evaluate_readiness,
    check_and_apply_post_approval_invalidation
)
from app.routes.tasks import (
    ingest_statutory_task, ingest_condition_task, ingest_field_defect,
    update_task_readiness, create_task
)
from fastapi import HTTPException

db = SessionLocal()

print("=== 1. TEST 100-POINT READINESS FORMULA & 3 DECISION BANDS ===")
# Exact formula test
# Formula: (0.25 * Machine) + (0.20 * Gang) + (0.20 * Material) + (0.20 * PTW) + (0.15 * SiteWeather)
score_100 = calculate_readiness_score(100, 100, 100, 100, 100)
assert score_100 == 100.0
band_100 = classify_readiness_band(score_100)
assert band_100["status"] == "PLAN_A_ELIGIBLE"
assert band_100["plan_a_allowed"] is True
assert band_100["plan_b_mandatory"] is False
assert band_100["deferral_recommended"] is False
print("Score 100 -> PLAN_A_ELIGIBLE passed.")

# Test 60-79 Critical Missing Band:
# 0.25*60 + 0.20*80 + 0.20*70 + 0.20*60 + 0.15*100 = 15 + 16 + 14 + 12 + 15 = 72.0
score_72 = calculate_readiness_score(60, 80, 70, 60, 100)
assert score_72 == 72.0
band_72 = classify_readiness_band(score_72)
assert band_72["status"] == "PLAN_B_MANDATORY"
assert band_72["plan_a_allowed"] is False
assert band_72["plan_b_mandatory"] is True
assert band_72["deferral_recommended"] is False
assert "Enforced buffer applied due to execution risk" in band_72["system_alert"]
print(f"Score {score_72} -> PLAN_B_MANDATORY (60-79 band) with enforced buffer passed.")

# Test < 60 High Risk Deferral:
# 0.25*40 + 0.20*40 + 0.20*40 + 0.20*40 + 0.15*40 = 40.0
score_40 = calculate_readiness_score(40, 40, 40, 40, 40)
assert score_40 == 40.0
band_40 = classify_readiness_band(score_40)
assert band_40["status"] == "HIGH_RISK_DEFERRAL"
assert band_40["plan_a_allowed"] is False
assert band_40["plan_b_mandatory"] is False
assert band_40["deferral_recommended"] is True
assert "Recommend work deferral" in band_40["recommendation"]
print(f"Score {score_40} -> HIGH_RISK_DEFERRAL (<60 band) passed.")

print("\n=== 2. TEST POST-APPROVAL INVALIDATION HOOK ===")
# Create a test task and an approved Plan A containing this task
test_task = Task(
    task_code=f"TSK_TEST_REPLAN_{datetime.utcnow().strftime('%M%S')}",
    department=Department.ENG,
    work_type="TAMPING",
    block_section_id=1,
    km_from=115.0,
    km_to=117.0,
    lane=SafetyLane.LANE_B1,
    status=TaskStatus.SCHEDULED,
    readiness_score=85.0,
    estimated_duration_minutes=120,
    duration_buffer_minutes=15
)
db.add(test_task)
db.flush()

test_plan = BlockPlan(
    plan_code=f"PLAN_TEST_A_{datetime.utcnow().strftime('%M%S')}",
    plan_version=1,
    version_count=1,
    plan_type="PLAN_A",
    status=BlockPlanStatus.APPROVED,
    approval_status="APPROVED",
    horizon_start=datetime.utcnow(),
    horizon_end=datetime.utcnow() + timedelta(days=1)
)
db.add(test_plan)
db.flush()

pt = PlannedTask(
    block_plan_id=test_plan.id,
    task_id=test_task.id,
    block_window_id=1,
    planned_start=datetime.utcnow(),
    planned_end=datetime.utcnow() + timedelta(hours=2),
    readiness_score=85.0,
    explanation="Initial Plan A approval"
)
db.add(pt)
db.commit()

# Now simulate readiness drop from 85.0 to 55.0 (material shortage)
invalidated_plans = check_and_apply_post_approval_invalidation(
    task_id=test_task.id,
    old_score=85.0,
    new_score=55.0,
    db=db
)
assert test_plan.id in invalidated_plans
db.refresh(test_plan)
assert test_plan.status == BlockPlanStatus.REPLAN_REQUIRED
assert test_plan.approval_status == "REPLAN_REQUIRED"

# Verify AuditLog entry for readiness drop
audit_drop = db.query(AuditLog).filter(
    AuditLog.entity_id == str(test_plan.id),
    AuditLog.action == "READINESS_DROP_TRIGGER_REPLAN"
).order_by(AuditLog.id.desc()).first()
assert audit_drop is not None
assert audit_drop.reason_code == "READINESS_DEGRADATION"
print(f"Post-approval invalidation verified: Plan {test_plan.plan_code} -> REPLAN_REQUIRED, Audit ID {audit_drop.id}.")

print("\n=== 3. TEST THREE DISTINCT INGESTION CHANNELS ===")
# Channel A: Statutory Ingestion (days_remaining <= 14)
stat_req = StatutoryIngestSchema(
    asset_type="TURNOUT",
    work_type="POINT_OVERHAUL",
    cycle_days=90,
    last_serviced_date=datetime.utcnow() - timedelta(days=80),  # 10 days remaining
    department=Department.ENG,
    km_from=105.0,
    km_to=107.0
)
stat_task = ingest_statutory_task(stat_req, db=db)
assert stat_task["lane"] == "LANE_B2"
assert stat_task["safety_class"] == "STATUTORY_DUE"
assert stat_task["status"] == "ELIGIBLE"
print(f"Channel A Statutory Ingest passed: {stat_task['task_code']}, Lane={stat_task['lane']}, Status={stat_task['status']}")

# Channel B: Condition Ingestion (TGI < 72 or USFD flaw)
cond_req = ConditionIngestSchema(
    tgi_score=68.5,  # Urgent condition: TGI < 72
    usfd_flaw_detected=False,
    work_type="TAMPING",
    km_from=110.0,
    km_to=112.0
)
cond_task = ingest_condition_task(cond_req, db=db)
assert cond_task["lane"] == "LANE_B1"
assert cond_task["priority_score"] >= 85.0
assert cond_task["status"] == "ELIGIBLE"
print(f"Channel B Condition Ingest passed: {cond_task['task_code']}, Lane={cond_task['lane']}, Priority={cond_task['priority_score']}")

# Channel C: Defect Ingestion Routine
def_req = DefectIngestSchema(
    description="Minor ballast deficiency at turnout",
    km_from=122.0,
    km_to=122.5,
    severity="ROUTINE"
)
routine_task = ingest_field_defect(def_req, db=db)
assert routine_task["lane"] == "LANE_B1"
assert routine_task["status"] == "REPORTED"
print(f"Channel C Routine Defect Ingest passed: {routine_task['task_code']}, Status={routine_task['status']}")

print("\n=== 4. TEST LANE A EMERGENCY PROTECTION INTERSTITIAL ===")
# Test 1: Emergency without safety protocol acknowledgement -> HTTP 400
emerg_unacked = DefectIngestSchema(
    description="Rail fracture detected at KM 104.2",
    km_from=104.2,
    km_to=104.3,
    severity="EMERGENCY",
    safety_protocol_acknowledged=False
)
try:
    ingest_field_defect(emerg_unacked, db=db)
    raise AssertionError("Emergency defect without safety acknowledgement was not blocked!")
except HTTPException as e:
    assert e.status_code == 400
    assert "Statutory Emergency Barrier" in e.detail
    print("Emergency without safety acknowledgement correctly blocked with HTTP 400.")

# Test 2: Emergency with safety protocol acknowledged -> LANE_A_MANUAL
emerg_acked = DefectIngestSchema(
    description="Rail fracture detected at KM 104.2",
    km_from=104.2,
    km_to=104.3,
    severity="EMERGENCY",
    safety_protocol_acknowledged=True
)
emerg_task = ingest_field_defect(emerg_acked, db=db)
assert emerg_task["lane"] == "LANE_A"
assert emerg_task["status"] == "LANE_A_MANUAL"
assert emerg_task["priority_score"] == 100.0
print(f"Emergency with safety acknowledgement passed: {emerg_task['task_code']}, Lane={emerg_task['lane']}, Status={emerg_task['status']}")

# Test 3: General create_task Lane A protection barrier
gen_task_unacked = TaskCreate(
    department=Department.ENG,
    work_type="FRACTURE_CLAMPING",
    block_section_id=1,
    km_from=108.0,
    km_to=108.2,
    lane=SafetyLane.LANE_A,
    estimated_duration_minutes=60,
    safety_protocol_acknowledged=False
)
try:
    create_task(gen_task_unacked, db=db)
    raise AssertionError("create_task Lane A without safety protocol was not blocked!")
except HTTPException as e:
    assert e.status_code == 400
    assert "Statutory Emergency Barrier" in e.detail
    print("create_task Lane A protection barrier correctly blocked with HTTP 400.")

print("\nALL STEP 3 VERIFICATIONS PASSED SUCCESSFULLY!")
