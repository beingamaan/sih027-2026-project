import os
import sys
from datetime import datetime, timedelta

# Add current dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import BlockPlan, Task, EventLog, StateProjection, SafetyLane, Department
from app.config import get_settings
import jwt

settings = get_settings()

def make_token(payload_dict):
    payload = {
        **payload_dict,
        "exp": datetime.utcnow() + timedelta(hours=12)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

client = TestClient(app)

def test_replan_and_stale_invalidation():
    print("\n--- TEST 1: Replan & Version Invalidation Engine ---")
    db = SessionLocal()
    try:
        # Get an active block plan
        bp = db.query(BlockPlan).filter(BlockPlan.plan_code == "BLK-2026-DLI-04").first() or db.query(BlockPlan).first()
        assert bp is not None
        plan_code = bp.plan_code
        v1 = bp.plan_version or 1

        # Reset projection to NOTIFIED for deterministic test run
        proj = db.query(StateProjection).filter(StateProjection.ref_id == plan_code).first()
        if proj:
            proj.stage = "NOTIFIED"
            db.commit()

        print(f"Initial block {plan_code} is at version V{v1}")

        # Trigger Replan
        token_controller = make_token({
            "sub": "IR-OPS-1102",
            "service_id": "IR-OPS-1102",
            "role": "SECTION_CONTROLLER",
            "department": "OPS",
            "division_id": "DLI"
        })

        replan_resp = client.post(
            f"/api/blocks/{plan_code}/replan",
            json={"reason": "Traffic density overrun on adjacent section"},
            headers={"Authorization": f"Bearer {token_controller}"}
        )
        print(f"Replan Status Code: {replan_resp.status_code}")
        replan_data = replan_resp.json()
        print("Replan response:", replan_data)
        assert replan_resp.status_code == 200
        assert replan_data["new_version"] == v1 + 1
        assert replan_data["stage"] == "REPLAN_REQUIRED"

        # Verify event_log record
        ev = db.query(EventLog).filter(
            EventLog.ref_type == "BLOCK_REQUEST",
            EventLog.ref_id == plan_code,
            EventLog.event == "PLAN_VERSION_BUMP"
        ).order_by(EventLog.id.desc()).first()
        assert ev is not None
        assert ev.plan_version == v1 + 1

        print("[OK] Replan & version bump verified in event log and projection cache.")

        # TEST 2: Stale version barrier
        print("\n--- TEST 2: Stale Plan Version Execution Barrier ---")
        token_field = make_token({
            "sub": "IR-FLD-8845",
            "service_id": "IR-FLD-8845",
            "role": "FIELD_EXEC_LEAD",
            "department": "ENG",
            "division_id": "DLI"
        })

        stale_resp = client.post(
            f"/api/blocks/{plan_code}/field-event",
            json={
                "task_id": 1,
                "step_event": "START",
                "plan_version": v1  # STALE version!
            },
            headers={"Authorization": f"Bearer {token_field}"}
        )
        print(f"Stale Field Event Status: {stale_resp.status_code}")
        print("Detail:", stale_resp.json().get("detail"))
        assert stale_resp.status_code == 409
        assert "STALE PLAN" in stale_resp.json()["detail"]
        print("[OK] Stale plan version rejection (HTTP 409) verified.")

    finally:
        db.close()


def test_joint_handback_interlock():
    print("\n--- TEST 3: Joint Handback Safety Gate Interlock ---")
    db = SessionLocal()
    try:
        bp = db.query(BlockPlan).filter(BlockPlan.plan_code == "BLK-2026-DLI-04").first() or db.query(BlockPlan).first()
        plan_code = bp.plan_code
        v_current = bp.plan_version or 1

        # Reset projection to IN_PROGRESS for handback test
        proj = db.query(StateProjection).filter(StateProjection.ref_id == plan_code).first()
        if proj:
            proj.stage = "IN_PROGRESS"
            db.commit()

        token_field = make_token({
            "sub": "IR-FLD-8845",
            "service_id": "IR-FLD-8845",
            "role": "FIELD_EXEC_LEAD",
            "department": "ENG",
            "division_id": "DLI"
        })

        # Ensure at least one task is not EXECUTED to test lockout
        bundled_tasks = [db.query(Task).filter(Task.id == pt.task_id).first() for pt in bp.planned_tasks if pt.task_id]
        if bundled_tasks:
            # Set one task to SCHEDULED (not yet completed)
            bundled_tasks[0].status = "SCHEDULED"
            db.commit()

            # Attempt HANDBACK while partner task is incomplete
            hb_resp = client.post(
                f"/api/blocks/{plan_code}/field-event",
                json={
                    "step_event": "HANDBACK",
                    "plan_version": v_current
                },
                headers={"Authorization": f"Bearer {token_field}"}
            )
            print(f"Handback with incomplete partner Status: {hb_resp.status_code}")
            print("Detail:", hb_resp.json().get("detail"))
            assert hb_resp.status_code == 422
            assert "Joint Handback Locked" in hb_resp.json()["detail"]
            print("[OK] Joint Handback lockout (HTTP 422) verified when partner tasks in progress.")

            # Now mark all tasks EXECUTED
            for t in bundled_tasks:
                if t:
                    t.status = "EXECUTED"
            db.commit()

            # Retry HANDBACK
            hb_ok = client.post(
                f"/api/blocks/{plan_code}/field-event",
                json={
                    "step_event": "HANDBACK",
                    "plan_version": v_current
                },
                headers={"Authorization": f"Bearer {token_field}"}
            )
            print(f"Handback with all partners complete Status: {hb_ok.status_code}")
            assert hb_ok.status_code == 200
            assert hb_ok.json()["status"] == "SUCCESS"
            print("[OK] Successful joint handback confirmed when all partner works complete.")

    finally:
        db.close()


def test_station_master_acknowledgment():
    print("\n--- TEST 4: Station Master Advisory Receipt ---")
    db = SessionLocal()
    try:
        bp = db.query(BlockPlan).first()
        token_sm = make_token({
            "sub": "IR-STN-0450",
            "service_id": "IR-STN-0450",
            "role": "STATION_MASTER",
            "department": "OPS",
            "station_id": 10
        })

        sm_resp = client.post(
            f"/api/blocks/{bp.plan_code}/sm-ack?station_code=STA",
            headers={"Authorization": f"Bearer {token_sm}"}
        )
        print(f"SM Ack Status: {sm_resp.status_code}")
        assert sm_resp.status_code == 200
        assert sm_resp.json()["event"] == "SM_ACK"

        # Verify in event_log
        ev = db.query(EventLog).filter(
            EventLog.ref_type == "BLOCK_REQUEST",
            EventLog.ref_id == bp.plan_code,
            EventLog.event == "SM_ACK"
        ).first()
        assert ev is not None
        assert ev.actor_role == "STATION_MASTER"
        print("[OK] Station Master advisory acknowledgment recorded in event log.")

    finally:
        db.close()


def test_defect_ingestion_routing():
    print("\n--- TEST 5: Field Inspector Defect Ingestion & Lane A Routing ---")
    # Subtest 5A: Safety Critical without protocol ack -> HTTP 400
    fail_resp = client.post(
        "/api/tasks/ingest/defect",
        json={
            "description": "Rail hairline crack near KM 119.3",
            "km_from": 119.3,
            "km_to": 119.5,
            "severity": "SAFETY_CRITICAL",
            "department": "ENG",
            "safety_protocol_acknowledged": False
        }
    )
    print(f"Safety critical without protocol ack Status: {fail_resp.status_code}")
    assert fail_resp.status_code == 400
    print("[OK] Statutory emergency barrier enforced for SAFETY_CRITICAL defects.")

    # Subtest 5B: Safety Critical with protocol ack -> Lane A / LANE_A_MANUAL
    pass_resp = client.post(
        "/api/tasks/ingest/defect",
        json={
            "description": "Rail hairline crack near KM 119.3",
            "km_from": 119.3,
            "km_to": 119.5,
            "severity": "SAFETY_CRITICAL",
            "department": "ENG",
            "safety_protocol_acknowledged": True,
            "estimated_duration_minutes": 60
        }
    )
    print(f"Safety critical with protocol ack Status: {pass_resp.status_code}")
    assert pass_resp.status_code == 200
    task_data = pass_resp.json()
    print(f"Generated Task: {task_data['task_code']}, Lane: {task_data['lane']}, Status: {task_data['status']}")
    assert task_data["lane"] == "LANE_A"
    assert task_data["status"] == "LANE_A_MANUAL"
    assert task_data["safety_class"] == "CRITICAL"
    print("[OK] SAFETY_CRITICAL defect correctly routed to Lane A manual dispatch.")

    # Subtest 5C: Normal defect -> Lane B1 / REPORTED
    normal_resp = client.post(
        "/api/tasks/ingest/defect",
        json={
            "description": "Routine ballast dressing required",
            "km_from": 105.0,
            "km_to": 106.0,
            "severity": "NORMAL",
            "department": "ENG",
            "estimated_duration_minutes": 90
        }
    )
    assert normal_resp.status_code == 200
    normal_data = normal_resp.json()
    print(f"Routine Task: {normal_data['task_code']}, Lane: {normal_data['lane']}, Status: {normal_data['status']}")
    assert normal_data["lane"] == "LANE_B1"
    assert normal_data["status"] == "REPORTED"
    print("[OK] Routine defect correctly routed to Lane B1 condition candidate pool.")


if __name__ == "__main__":
    test_replan_and_stale_invalidation()
    test_joint_handback_interlock()
    test_station_master_acknowledgment()
    test_defect_ingestion_routing()
    print("\n=======================================================")
    print("ALL PHASE 5 BACKEND AND INTEGRATION TESTS PASSED 100%!")
    print("=======================================================\n")
