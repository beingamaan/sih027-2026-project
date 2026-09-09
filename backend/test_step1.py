from app.database import SessionLocal, init_db
from app.models import (
    Task, BlockPlan, FieldEvent, AuditLog,
    TaskStatus, SafetyLane, Department,
    BlockPlanStatus, FieldEventType, DelayLossCode
)
from app.schemas import TaskOut, PlanOut, FieldEventOut, AuditLogOut
from app.routes.plans import generate_dual_plans
from datetime import datetime

print("=== 1. VERIFY ENUMS ===")
assert [e.value for e in Department] == ['ENG', 'TRD', 'SNT']
assert [e.value for e in SafetyLane] == ['LANE_A', 'LANE_B1', 'LANE_B2']
assert 'REPORTED' in [e.value for e in TaskStatus] and 'CLOSED' in [e.value for e in TaskStatus]
assert 'DRAFT' in [e.value for e in BlockPlanStatus] and 'CLOSED' in [e.value for e in BlockPlanStatus]
assert [e.value for e in FieldEventType] == ['ACK', 'READY', 'START', 'COMPLETE', 'HANDBACK', 'DELAY', 'PHOTO_ADDED']
assert 'MATERIAL_SHORT' in [e.value for e in DelayLossCode]
print("Enums verified successfully.")

print("=== 2. VERIFY DB & MODELS ===")
db = SessionLocal()
task = db.query(Task).first()
assert task is not None
print(f"Task: {task.task_code}, Dept: {task.department}, Lane: {task.lane}, Status: {task.status}, Readiness: {task.readiness_score}")

plan = db.query(BlockPlan).first()
assert plan is not None
print(f"Plan: {plan.plan_code}, Version: {plan.plan_version}, Status: {plan.status}, P50: {plan.p50_duration_minutes}m, P90: {plan.p90_duration_minutes}m, WTM: {plan.regulation_cost_wtm}")

print("=== 3. VERIFY APPEND-ONLY FIELD EVENT ===")
fe = FieldEvent(
    block_plan_id=plan.id,
    task_id=task.id,
    actor_id='FLD_LEAD_01',
    plan_version=plan.plan_version,
    event_type=FieldEventType.READY,
    loss_code=None,
    remarks='Worksite ready'
)
db.add(fe)
db.commit()
print("Created FieldEvent id:", fe.id)

try:
    fe.remarks = "Attempting update"
    db.commit()
    raise AssertionError("FieldEvent update was not prevented!")
except RuntimeError as e:
    print("FieldEvent update correctly blocked by hook:", e)
db.rollback()

try:
    db.delete(fe)
    db.commit()
    raise AssertionError("FieldEvent delete was not prevented!")
except RuntimeError as e:
    print("FieldEvent delete correctly blocked by hook:", e)
db.rollback()

print("=== 4. VERIFY IMMUTABLE AUDIT LOG ===")
al = AuditLog(
    actor_id="USR_DOM_01",
    actor_role="DIVISIONAL_OFFICER",
    division_id="DLI",
    action="OVERRIDE",
    entity_type="BLOCK_PLAN",
    entity_id=str(plan.id),
    before_json='{"status":"RECOMMENDED"}',
    after_json='{"status":"APPROVED"}',
    reason_code="TRAFFIC_PRIORITY",
    reason_text="High priority freight clearance window approved"
)
db.add(al)
db.commit()
print("Created AuditLog id:", al.id)

try:
    al.reason_text = "Attempting audit update"
    db.commit()
    raise AssertionError("AuditLog update was not prevented!")
except RuntimeError as e:
    print("AuditLog update correctly blocked by hook:", e)
db.rollback()

try:
    db.delete(al)
    db.commit()
    raise AssertionError("AuditLog delete was not prevented!")
except RuntimeError as e:
    print("AuditLog delete correctly blocked by hook:", e)
db.rollback()

print("=== 5. VERIFY SCHEDULER & OPTIMIZER ===")
dual_result = generate_dual_plans(db)
assert dual_result['plan_a_id'] is not None and dual_result['plan_b_id'] is not None
print(f"Optimizer dual plans generated: Plan A ID={dual_result['plan_a_id']}, Plan B ID={dual_result['plan_b_id']}")

print("ALL VERIFICATIONS PASSED SUCCESSFULLY!")
