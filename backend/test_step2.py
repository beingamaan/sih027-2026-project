import jwt
from datetime import datetime, timedelta
from app.config import get_settings
from app.database import SessionLocal
from app.models import Task, BlockPlan, PlannedTask, AuditLog, BlockPlanStatus
from app.routes.auth import login_as, ROLE_CONFIGS
from app.schemas import LoginAsRequest, OverrideRequest
from app.dependencies import get_current_user, require_capabilities, decode_jwt_token
from app.routes.tasks import get_tasks
from app.routes.plans import override_plan
from fastapi import HTTPException

settings = get_settings()
db = SessionLocal()

print("=== 1. TEST LOGIN-AS & JWT GENERATION ===")
# Test login for each of the 6 roles
tokens = {}
for role, cfg in ROLE_CONFIGS.items():
    req = LoginAsRequest(role=role, username=f"USER_{role}")
    res = login_as(req)
    assert res["access_token"] is not None
    assert res["role"] == role
    assert res["department"] == cfg["dept"]
    tokens[role] = res["access_token"]
    # Decode token payload
    decoded = decode_jwt_token(res["access_token"])
    assert decoded["sub"] == f"USER_{role}"
    assert decoded["role"] == role
    assert decoded["division_id"] == "DLI"
print(f"Verified login and token generation for all {len(tokens)} roles.")

# Test invalid role rejection
try:
    login_as(LoginAsRequest(role="INVALID_ROLE", username="hacker"))
    raise AssertionError("Invalid role was not rejected!")
except HTTPException as e:
    assert e.status_code == 400
    print("Invalid role correctly rejected with HTTP 400.")

print("\n=== 2. TEST CAPABILITIES GUARD & ACCESS DENIED AUDITING ===")
# Test valid capability
officer_user = decode_jwt_token(tokens["DIVISIONAL_OFFICER"])
checker = require_capabilities("DIVISIONAL_OFFICER")

class DummyRequest:
    class DummyURL:
        path = "/api/plans/1/override"
    url = DummyURL()

passed_user = checker(request=DummyRequest(), current_user=officer_user, db=db)
assert passed_user["role"] == "DIVISIONAL_OFFICER"
print("Authorized role passed capabilities guard.")

# Test unauthorized capability & audit log verification
inspector_user = decode_jwt_token(tokens["FIELD_INSPECTOR"])
audit_count_before = db.query(AuditLog).filter(AuditLog.action == "ACCESS_DENIED").count()
try:
    checker(request=DummyRequest(), current_user=inspector_user, db=db)
    raise AssertionError("Unauthorized user was not blocked!")
except HTTPException as e:
    assert e.status_code == 403
    print("Unauthorized user correctly blocked with HTTP 403.")

audit_count_after = db.query(AuditLog).filter(AuditLog.action == "ACCESS_DENIED").count()
assert audit_count_after > audit_count_before
latest_denied = db.query(AuditLog).filter(AuditLog.action == "ACCESS_DENIED").order_by(AuditLog.id.desc()).first()
assert latest_denied.entity_type == "SECURITY_BARRIER"
assert latest_denied.actor_role == "FIELD_INSPECTOR"
print("ACCESS_DENIED security barrier audit log successfully logged.")

print("\n=== 3. TEST ROW-LEVEL SCOPING & CO-BLOCK READ-ONLY EXCEPTION ===")
# A. Controller gets full corridor tasks
controller_user = decode_jwt_token(tokens["SECTION_CONTROLLER"])
all_tasks = get_tasks(db=db, current_user=controller_user)
total_tasks_count = db.query(Task).count()
assert len(all_tasks) == total_tasks_count
print(f"SECTION_CONTROLLER retrieved all {len(all_tasks)} corridor tasks.")

# B. Supervisor gets department tasks + co-block read-only partner tasks
supervisor_user = decode_jwt_token(tokens["DEPT_SUPERVISOR"])
sup_tasks = get_tasks(db=db, current_user=supervisor_user)
trd_primary = [t for t in sup_tasks if not t["read_only"]]
co_block_partners = [t for t in sup_tasks if t["read_only"]]
print(f"DEPT_SUPERVISOR retrieved {len(trd_primary)} department tasks and {len(co_block_partners)} co-block read-only partners.")
assert all(t["department"] == "TRD" for t in trd_primary)
for ct in co_block_partners:
    assert ct["read_only"] is True
    assert ct["co_block_partner"] is True
    assert ct["assigned_to"] is None  # Stripped for external department
print("DEPT_SUPERVISOR co-block read-only exception verified.")

# C. Inspector gets assigned tasks
inspector_user = decode_jwt_token(tokens["FIELD_INSPECTOR"])
inspector_tasks = get_tasks(db=db, current_user=inspector_user)
print(f"FIELD_INSPECTOR retrieved {len(inspector_tasks)} assigned tasks.")
assert all(t["assigned_to"] is not None for t in inspector_tasks)

print("\n=== 4. TEST OFFICER OVERRIDE WITH MANDATORY REASON CODE ===")
plan = db.query(BlockPlan).first()
original_version_count = plan.version_count or 1

# Invalid reason code -> HTTP 422
try:
    override_plan(
        plan_id=plan.id,
        payload=OverrideRequest(reason_code="INVALID_REASON"),
        db=db,
        current_user=officer_user
    )
    raise AssertionError("Invalid reason code was not rejected!")
except HTTPException as e:
    assert e.status_code == 422
    print("Invalid override reason code correctly rejected with HTTP 422.")

# Empty reason code -> HTTP 422
try:
    override_plan(
        plan_id=plan.id,
        payload=OverrideRequest(reason_code=""),
        db=db,
        current_user=officer_user
    )
    raise AssertionError("Empty reason code was not rejected!")
except HTTPException as e:
    assert e.status_code == 422
    print("Empty override reason code correctly rejected with HTTP 422.")

# Valid reason code by DIVISIONAL_OFFICER
valid_override_res = override_plan(
    plan_id=plan.id,
    payload=OverrideRequest(
        reason_code="TRAFFIC_PRESSURE",
        reason_text="Prioritizing urgent freight rake clearance through section"
    ),
    db=db,
    current_user=officer_user
)
assert valid_override_res["success"] is True
db.refresh(plan)
assert plan.status == BlockPlanStatus.SUPERSEDED
assert plan.approval_status == "OVERRIDDEN"
assert plan.version_count == original_version_count + 1
print(f"Plan overridden successfully: Status={plan.status}, VersionCount={plan.version_count}")

# Verify audit log for override
override_audit = db.query(AuditLog).filter(
    AuditLog.entity_id == str(plan.id),
    AuditLog.action == "OVERRIDE"
).order_by(AuditLog.id.desc()).first()
assert override_audit is not None
assert override_audit.reason_code == "TRAFFIC_PRESSURE"
assert override_audit.actor_role == "DIVISIONAL_OFFICER"
print(f"Verified AuditLog for override: Reason={override_audit.reason_code}, Role={override_audit.actor_role}")

print("\nALL STEP 2 VERIFICATIONS PASSED SUCCESSFULLY!")
