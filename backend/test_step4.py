from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import (
    Task, BlockPlan, PlannedTask, FieldEvent, AuditLog,
    SafetyLane, TaskStatus, BlockPlanStatus, Department, FieldEventType
)
from app.schemas import AlterPlanRequest, FieldEventSubmission
from app.routes.plans import alter_or_replan_block
from app.routes.field import submit_field_event, get_co_block_partner_status
from fastapi import HTTPException

db = SessionLocal()

print("=== 1. SETUP MULTI-DEPARTMENT BLOCK PLAN ===")
# Create a multi-department joint block with ENG task and TRD task
eng_task = Task(
    task_code=f"TSK_ENG_STEP4_{datetime.utcnow().strftime('%M%S')}",
    department=Department.ENG,
    work_type="POINT_RENEWAL",
    block_section_id=1,
    km_from=102.0,
    km_to=103.0,
    lane=SafetyLane.LANE_B1,
    status=TaskStatus.SCHEDULED,
    readiness_score=95.0,
    estimated_duration_minutes=120,
    duration_buffer_minutes=15
)
trd_task = Task(
    task_code=f"TSK_TRD_STEP4_{datetime.utcnow().strftime('%M%S')}",
    department=Department.TRD,
    work_type="OHE_CANTILEVER_ADJUST",
    block_section_id=1,
    km_from=102.0,
    km_to=103.0,
    lane=SafetyLane.LANE_B1,
    status=TaskStatus.SCHEDULED,
    readiness_score=90.0,
    estimated_duration_minutes=100,
    duration_buffer_minutes=15
)
db.add(eng_task)
db.add(trd_task)
db.flush()

joint_plan = BlockPlan(
    plan_code=f"PLAN_JOINT_{datetime.utcnow().strftime('%M%S')}",
    plan_version=1,
    version_count=1,
    plan_type="PLAN_A",
    status=BlockPlanStatus.APPROVED,
    approval_status="APPROVED",
    horizon_start=datetime.utcnow(),
    horizon_end=datetime.utcnow() + timedelta(hours=3)
)
db.add(joint_plan)
db.flush()

pt1 = PlannedTask(
    block_plan_id=joint_plan.id,
    task_id=eng_task.id,
    block_window_id=1,
    planned_start=datetime.utcnow(),
    planned_end=datetime.utcnow() + timedelta(hours=2),
    readiness_score=95.0,
    explanation="ENG component of joint block"
)
pt2 = PlannedTask(
    block_plan_id=joint_plan.id,
    task_id=trd_task.id,
    block_window_id=1,
    planned_start=datetime.utcnow(),
    planned_end=datetime.utcnow() + timedelta(hours=2),
    readiness_score=90.0,
    explanation="TRD component of joint block"
)
db.add(pt1)
db.add(pt2)
db.commit()
print(f"Created Multi-Department Joint Plan #{joint_plan.id} with ENG #{eng_task.id} & TRD #{trd_task.id} (Version 1).")

# Initial ACK on Version 1
initial_ack = FieldEvent(
    block_plan_id=joint_plan.id,
    task_id=eng_task.id,
    actor_id="FLD_SUPERVISOR_ENG",
    plan_version=1,
    event_type=FieldEventType.ACK,
    remarks="Initial acknowledgement on V1"
)
db.add(initial_ack)
db.commit()
print("Initial ACK for V1 recorded.")

print("\n=== 2. TEST BLOCK ALTERATION ADVICE (BAA) & VERSION BUMPING ===")
baa_result = alter_or_replan_block(
    plan_id=joint_plan.id,
    payload=AlterPlanRequest(
        trigger_reason="MACHINE_LATE",
        new_window_start=datetime.utcnow() + timedelta(hours=1),
        new_window_end=datetime.utcnow() + timedelta(hours=4),
        remarks="Tamping machine delayed at staging siding"
    ),
    db=db,
    current_user={"sub": "CONTROLLER_01", "role": "SECTION_CONTROLLER", "division_id": "DLI"}
)
assert baa_result["old_version"] == 1
assert baa_result["new_version"] == 2
assert baa_result["advice_id"] == f"BAA-{joint_plan.id}-V2"
assert baa_result["trigger_reason"] == "MACHINE_LATE"
assert baa_result["invalidated_ack_count"] == 1

db.refresh(joint_plan)
assert joint_plan.plan_version == 2
assert joint_plan.status == BlockPlanStatus.REPLAN_REQUIRED
print(f"Block Alteration Advice verified: {baa_result['advice_id']}, Plan bumped to V{joint_plan.plan_version}.")

# Verify Audit Log
baa_audit = db.query(AuditLog).filter(
    AuditLog.entity_id == str(joint_plan.id),
    AuditLog.action == "PLAN_VERSION_BUMP"
).order_by(AuditLog.id.desc()).first()
assert baa_audit is not None
assert baa_audit.reason_code == "MACHINE_LATE"
print(f"PLAN_VERSION_BUMP audit log verified with reason: {baa_audit.reason_code}.")

print("\n=== 3. TEST STALE PLAN REJECTION (HTTP 409 CONFLICT) ===")
# Attempting to act on V1 when plan is now V2
stale_submission = FieldEventSubmission(
    block_id=joint_plan.id,
    task_id=eng_task.id,
    event_type="START",
    plan_version=1  # Stale version!
)
try:
    submit_field_event(
        data=stale_submission,
        db=db,
        current_user={"sub": "FLD_LEAD_01", "role": "FIELD_EXEC_LEAD"}
    )
    raise AssertionError("Stale plan version was not rejected with HTTP 409!")
except HTTPException as e:
    assert e.status_code == 409
    assert "STALE PLAN" in e.detail
    assert "Please refresh and re-acknowledge" in e.detail
    print("Stale plan version correctly rejected with HTTP 409 Conflict.")

# Re-acknowledge on new version V2
reack_submission = FieldEventSubmission(
    block_id=joint_plan.id,
    task_id=eng_task.id,
    event_type="ACK",
    plan_version=2  # Current version
)
reack_res = submit_field_event(
    data=reack_submission,
    db=db,
    current_user={"sub": "FLD_LEAD_01", "role": "FIELD_EXEC_LEAD"}
)
assert reack_res["success"] is True
assert reack_res["plan_version"] == 2
print("Re-acknowledgement on V2 succeeded.")

print("\n=== 4. TEST INTEGRATED JOINT HANDBACK GATE (HTTP 422 LOCK) ===")
# Start both tasks
submit_field_event(FieldEventSubmission(block_id=joint_plan.id, task_id=eng_task.id, event_type="START", plan_version=2), db=db)
submit_field_event(FieldEventSubmission(block_id=joint_plan.id, task_id=trd_task.id, event_type="START", plan_version=2), db=db)

# Complete ONLY the ENG task
submit_field_event(FieldEventSubmission(block_id=joint_plan.id, task_id=eng_task.id, event_type="COMPLETE", plan_version=2), db=db)
print("ENG task marked COMPLETE. TRD task is still in progress.")

# Attempt HANDBACK while partner (TRD) task has not recorded COMPLETE
try:
    submit_field_event(
        data=FieldEventSubmission(
            block_id=joint_plan.id,
            task_id=eng_task.id,
            event_type="HANDBACK",
            plan_version=2
        ),
        db=db,
        current_user={"sub": "FLD_LEAD_01", "role": "FIELD_EXEC_LEAD"}
    )
    raise AssertionError("Premature joint handback was not locked!")
except HTTPException as e:
    assert e.status_code == 422
    assert "Joint Handback Locked" in e.detail
    assert "All bundled departments must finish work before handback" in e.detail
    print("Joint Handback Gate correctly locked with HTTP 422 Unprocessable Entity.")

# Now complete the partner TRD task
submit_field_event(FieldEventSubmission(block_id=joint_plan.id, task_id=trd_task.id, event_type="COMPLETE", plan_version=2), db=db)
print("Partner TRD task marked COMPLETE. Both departments are now finished.")

# Now attempt HANDBACK again - must succeed with safety disclaimer
handback_res = submit_field_event(
    data=FieldEventSubmission(
        block_id=joint_plan.id,
        task_id=eng_task.id,
        event_type="HANDBACK",
        plan_version=2
    ),
    db=db,
    current_user={"sub": "FLD_LEAD_01", "role": "FIELD_EXEC_LEAD"}
)
assert handback_res["success"] is True
assert "Actual Railway line restoration and Line Clear cancellation follow authorized Railway operating rules" in handback_res["safety_disclaimer"]
print("Joint Handback authorized successfully with safety disclaimer.")

print("\n=== 5. TEST CO-BLOCK PARTNER STATUS READOUT ENDPOINT ===")
partner_statuses = get_co_block_partner_status(block_id=joint_plan.id, db=db)
assert len(partner_statuses) == 2
depts = {ps["department"] for ps in partner_statuses}
assert "ENG" in depts and "TRD" in depts
for ps in partner_statuses:
    assert ps["is_complete"] is True
print(f"Partner status readout verified for {len(partner_statuses)} bundled tasks:")
for ps in partner_statuses:
    print(f"  - [{ps['department']}] {ps['task_name']}: Status={ps['status']}, Complete={ps['is_complete']}")

print("\nALL STEP 4 VERIFICATIONS PASSED SUCCESSFULLY!")
