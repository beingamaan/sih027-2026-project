import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, init_db
from app.models import EventLog, StateProjection, Task, BlockPlan
from app.services.event_engine import append_event, rebuild_projections, validate_transition
from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("=== PHASE 2 COMPREHENSIVE VERIFICATION SUITE ===")
    db = SessionLocal()

    # -------------------------------------------------------------
    # TEST 1: EventLog Immutability Enforcement (before_update, before_delete)
    # -------------------------------------------------------------
    print("\n[TEST 1] Testing EventLog Immutability...")
    sample_event = db.query(EventLog).first()
    assert sample_event is not None, "At least one EventLog record should exist"

    # Attempt update
    try:
        sample_event.stage = "MUTATED"
        db.commit()
        raise AssertionError("FAILURE: EventLog update did not raise RuntimeError!")
    except RuntimeError as e:
        db.rollback()
        print(f"  [PASS] EventLog UPDATE successfully blocked: {e}")

    # Attempt delete
    try:
        db.delete(sample_event)
        db.commit()
        raise AssertionError("FAILURE: EventLog delete did not raise RuntimeError!")
    except RuntimeError as e:
        db.rollback()
        print(f"  [PASS] EventLog DELETE successfully blocked: {e}")

    # -------------------------------------------------------------
    # TEST 2: Lifecycle Transition Constraints & Compensation Rule T10
    # -------------------------------------------------------------
    print("\n[TEST 2] Testing Lifecycle Transition & Compensation Rules...")
    # Illegal Task Transition
    try:
        validate_transition("TASK", "REPORTED", "EXECUTED", "SKIP_AHEAD", None)
        raise AssertionError("FAILURE: Illegal transition REPORTED -> EXECUTED was not blocked!")
    except ValueError as e:
        print(f"  [PASS] Illegal transition correctly rejected: {e}")

    # Illegal Block Transition
    try:
        validate_transition("BLOCK_REQUEST", "DRAFT", "APPROVED", "SKIP_APPROVAL", None)
        raise AssertionError("FAILURE: Illegal transition DRAFT -> APPROVED was not blocked!")
    except ValueError as e:
        print(f"  [PASS] Illegal block transition correctly rejected: {e}")

    # Compensation without reason_code (Rule T10)
    try:
        validate_transition("BLOCK_REQUEST", "PENDING_APPROVAL", "REJECTED", "REJECTED", None)
        raise AssertionError("FAILURE: Compensation event without reason_code was not blocked!")
    except ValueError as e:
        print(f"  [PASS] Compensation without reason_code correctly rejected: {e}")

    # Compensation WITH reason_code (Rule T10)
    validate_transition("BLOCK_REQUEST", "PENDING_APPROVAL", "REJECTED", "REJECTED", "RESOURCE_UNAVAILABLE")
    print("  [PASS] Compensation with valid reason_code permitted.")

    # -------------------------------------------------------------
    # TEST 3: Deterministic Projection Rebuild from Scratch
    # -------------------------------------------------------------
    print("\n[TEST 3] Testing Projection Rebuild from EventLog Replay...")
    count_before = db.query(StateProjection).count()
    events_count = db.query(EventLog).count()
    print(f"  Existing projections: {count_before}, Total events: {events_count}")

    # Wipe projection cache table completely
    db.query(StateProjection).delete()
    db.commit()
    assert db.query(StateProjection).count() == 0, "Projection table should be empty"
    print("  Projection cache cleared to 0.")

    # Replay all events
    rebuilt_count = rebuild_projections(db)
    print(f"  Rebuilt projections: {rebuilt_count}")
    assert rebuilt_count == count_before, f"Expected {count_before} rebuilt, got {rebuilt_count}"

    # Verify Delhi block projection
    block_proj = db.query(StateProjection).filter(
        StateProjection.ref_type == "BLOCK_REQUEST",
        StateProjection.ref_id == "BLK-2026-DLI-04"
    ).first()
    assert block_proj is not None, "BLK-2026-DLI-04 projection must exist"
    print(f"  [PASS] BLK-2026-DLI-04 projection verified: Stage={block_proj.stage}, LastEvent={block_proj.last_event}")

    # -------------------------------------------------------------
    # TEST 4: REST API Integration via TestClient
    # -------------------------------------------------------------
    print("\n[TEST 4] Testing REST API Endpoints...")
    client = TestClient(app)

    # 4.1 Tasks list
    res = client.get("/api/tasks")
    assert res.status_code == 200, f"GET /api/tasks failed: {res.text}"
    tasks = res.json()
    assert len(tasks) >= 22, f"Expected at least 22 tasks, got {len(tasks)}"
    t0 = tasks[0]
    print(f"  [PASS] GET /api/tasks: {len(tasks)} tasks returned. Sample task {t0['task_code']} status={t0['status']}")

    # 4.2 Task history
    res = client.get(f"/api/tasks/{t0['task_code']}/history")
    assert res.status_code == 200, f"GET /api/tasks/{t0['task_code']}/history failed: {res.text}"
    hist = res.json()
    assert len(hist["events"]) >= 1, "Task history should have at least 1 event"
    print(f"  [PASS] GET /api/tasks/{t0['task_code']}/history: {len(hist['events'])} events found. Current stage={hist['current_stage']}")

    # 4.3 Task transition
    # Find a task in REPORTED stage
    rep_task = next((t for t in tasks if t.get("status") == "REPORTED"), None)
    if rep_task:
        trans_res = client.post(
            f"/api/tasks/{rep_task['task_code']}/transition",
            json={
                "ref_id": rep_task["task_code"],
                "stage": "VERIFIED",
                "event": "SUPERVISOR_VERIFIED",
                "actor_id": "DS_ENG_01",
                "actor_role": "DEPT_SUPERVISOR",
                "actor_dept": "ENG",
                "payload": {"verification_notes": "Track inspection cross-checked"}
            }
        )
        assert trans_res.status_code == 200, f"Task transition failed: {trans_res.text}"
        print(f"  [PASS] POST /api/tasks/{rep_task['task_code']}/transition: Stage advanced to VERIFIED")

        # Confirm GET now returns VERIFIED
        check_res = client.get(f"/api/tasks/{rep_task['task_code']}")
        assert check_res.status_code == 200
        assert check_res.json()["status"] == "VERIFIED"
        print("  [PASS] GET /api/tasks/{task_id} confirms stage updated to VERIFIED from projection cache.")

    # 4.4 Blocks list
    b_res = client.get("/api/blocks")
    assert b_res.status_code == 200, f"GET /api/blocks failed: {b_res.text}"
    blocks = b_res.json()
    dli_block = next((b for b in blocks if b["plan_code"] == "BLK-2026-DLI-04"), None)
    assert dli_block is not None, "BLK-2026-DLI-04 must be present in blocks list"
    assert dli_block["stage"] == "RECOMMENDED"
    print(f"  [PASS] GET /api/blocks: {len(blocks)} blocks returned. BLK-2026-DLI-04 stage={dli_block['stage']}")

    # 4.5 Block detail
    bd_res = client.get("/api/blocks/BLK-2026-DLI-04")
    assert bd_res.status_code == 200, f"GET /api/blocks/BLK-2026-DLI-04 failed: {bd_res.text}"
    bd = bd_res.json()
    assert bd["plan_code"] == "BLK-2026-DLI-04"
    assert len(bd["planned_tasks"]) == 3, f"Expected 3 planned tasks, got {len(bd['planned_tasks'])}"
    print(f"  [PASS] GET /api/blocks/BLK-2026-DLI-04: {len(bd['planned_tasks'])} integrated tasks mapped.")

    # 4.6 Block history
    bh_res = client.get("/api/blocks/BLK-2026-DLI-04/history")
    assert bh_res.status_code == 200, f"GET /api/blocks/BLK-2026-DLI-04/history failed: {bh_res.text}"
    b_hist = bh_res.json()
    assert len(b_hist["events"]) >= 2, f"Expected at least 2 events, got {len(b_hist['events'])}"
    print(f"  [PASS] GET /api/blocks/BLK-2026-DLI-04/history: {len(b_hist['events'])} events returned.")

    # 4.7 Rebuild projections route
    reb_res = client.post("/api/blocks/rebuild-projections")
    assert reb_res.status_code == 200
    print(f"  [PASS] POST /api/blocks/rebuild-projections: {reb_res.json()['message']}")

    db.close()
    print("\nALL PHASE 2 VERIFICATION CHECKS PASSED PERFECTLY! 100% SUCCESS.")

if __name__ == "__main__":
    run_tests()
