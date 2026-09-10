import os
import sys

# Add current dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Task, Department, SafetyLane, TaskStatus, User
from app.services.bundling_engine import (
    validate_engineering_gates,
    generate_bundle_recommendation
)
from app.config import get_settings
import jwt
from datetime import datetime, timedelta

settings = get_settings()

def make_token(payload_dict):
    payload = {
        **payload_dict,
        "exp": datetime.utcnow() + timedelta(hours=12)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

client = TestClient(app)

def test_bundling_engine_gates():
    print("\n--- TEST 1: Bundling Engine 6 Engineering Gates ---")
    
    # Bundle 1: Compatible tasks
    t1 = Task(
        id=1, task_code="TSK_ENG_04", department=Department.ENG,
        work_type="Deep Screening", km_from=119.2, km_to=121.0,
        lane=SafetyLane.LANE_B1, estimated_duration_minutes=120,
        block_section_id=2, elementary_section_id=103, interlocking_area_id=201,
        requires_line_block=1, requires_power_block=0, requires_disconnection=0,
        material_ready=1, ptw_ready=1, power_ready=1, disconnection_ready=1,
        worksite_ready=1, weather_suitable=1
    )
    t2 = Task(
        id=2, task_code="TSK_TRD_03", department=Department.TRD,
        work_type="OHE Cantilever", km_from=119.5, km_to=120.8,
        lane=SafetyLane.LANE_B1, estimated_duration_minutes=90,
        block_section_id=2, elementary_section_id=103, interlocking_area_id=None,
        requires_line_block=0, requires_power_block=1, requires_disconnection=0,
        material_ready=1, ptw_ready=1, power_ready=1, disconnection_ready=1,
        worksite_ready=1, weather_suitable=1
    )
    t3 = Task(
        id=3, task_code="TSK_SNT_04", department=Department.SNT,
        work_type="Point Machine", km_from=119.2, km_to=119.2,
        lane=SafetyLane.LANE_B1, estimated_duration_minutes=75,
        block_section_id=2, elementary_section_id=None, interlocking_area_id=201,
        requires_line_block=0, requires_power_block=0, requires_disconnection=1,
        material_ready=1, ptw_ready=1, power_ready=1, disconnection_ready=1,
        worksite_ready=1, weather_suitable=1
    )

    result = validate_engineering_gates([t1, t2, t3])
    print(f"Compatible bundle all gates passed: {result['all_passed']}")
    for c in result['checks']:
        print(f"  [{c['name']}] {c['title']}: passed={c['passed']}, details={c['details']}")
    assert result['all_passed'] is True
    assert len(result['checks']) == 6
    assert all(c['passed'] for c in result['checks'])

    # Bundle 2: Spatial violation (> 2.0 km delta)
    t_far = Task(
        id=4, task_code="TSK_ENG_FAR", department=Department.ENG,
        work_type="Rail Replacement", km_from=125.0, km_to=126.0,
        lane=SafetyLane.LANE_B1, estimated_duration_minutes=90,
        block_section_id=2, elementary_section_id=105, interlocking_area_id=None,
        requires_line_block=1, requires_power_block=0, requires_disconnection=0,
        material_ready=1, ptw_ready=1, power_ready=1, disconnection_ready=1,
        worksite_ready=1, weather_suitable=1
    )
    res_spatial = validate_engineering_gates([t1, t_far])
    spatial_check = next(c for c in res_spatial['checks'] if c['name'] == 'SPATIAL')
    print(f"Spatial violation test: passed={res_spatial['all_passed']}, spatial_passed={spatial_check['passed']}")
    assert res_spatial['all_passed'] is False
    assert spatial_check['passed'] is False

    # Bundle 3: Safety Gate violation (Lane A emergency cannot be bundled)
    t_emergency = Task(
        id=5, task_code="TSK_LANE_A", department=Department.ENG,
        work_type="Emergency Broken Rail", km_from=119.3, km_to=119.4,
        lane=SafetyLane.LANE_A, estimated_duration_minutes=45,
        block_section_id=2, elementary_section_id=103, interlocking_area_id=None,
        requires_line_block=1, requires_power_block=0, requires_disconnection=0,
        material_ready=1, ptw_ready=1, power_ready=1, disconnection_ready=1,
        worksite_ready=1, weather_suitable=1
    )
    res_safety = validate_engineering_gates([t1, t_emergency])
    safety_check = next(c for c in res_safety['checks'] if c['name'] == 'SAFETY')
    print(f"Safety Lane A violation test: passed={res_safety['all_passed']}, safety_passed={safety_check['passed']}")
    assert res_safety['all_passed'] is False
    assert safety_check['passed'] is False

    print("[OK] All Gate logic assertions verified successfully.")

def test_recommendation_endpoint():
    print("\n--- TEST 2: Recommendation Endpoint GET /api/blocks/recommendation ---")
    resp = client.get("/api/blocks/recommendation")
    print(f"Status Code: {resp.status_code}")
    data = resp.json()
    print("Summary:", data.get("summary"))
    print("Plan A:", data.get("plan_a"))
    print("Plan B:", data.get("plan_b"))
    assert resp.status_code == 200
    assert data["summary"]["bundle_feasible"] is True
    assert data["summary"]["gates_passed_count"] == 6
    assert data["plan_a"]["duration_minutes"] == 120
    assert data["plan_a"]["wtm_delay_loss"] == 1243.0
    assert data["plan_b"]["total_window_minutes"] == 165
    assert data["plan_b"]["wtm_delay_loss"] == 1554.0
    print("[OK] Recommendation endpoint response structure validated.")

def test_coblock_task_scoping():
    print("\n--- TEST 3: Row-level Co-Block Visibility Scoping ---")
    # Generate token for ENG supervisor: IR-ENG-4471
    token = make_token({
        "sub": "IR-ENG-4471",
        "service_id": "IR-ENG-4471",
        "role": "DEPT_SUPERVISOR",
        "dept": "ENG",
        "department": "ENG",
        "division_id": "DLI",
        "section_ids": [1, 2, 3],
        "capabilities": ["VERIFY_READINESS", "UPDATE_READINESS", "DECLARE_LANE_B"]
    })

    resp = client.get("/api/tasks", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    tasks = resp.json()
    print(f"Total tasks received for ENG supervisor: {len(tasks)}")

    eng_tasks = [t for t in tasks if t["department"] == "ENG"]
    coblock_tasks = [t for t in tasks if t.get("co_block_partner") is True]

    print(f"  ENG Tasks: {len(eng_tasks)}")
    print(f"  Co-Block Partner Tasks: {len(coblock_tasks)}")

    for ct in coblock_tasks:
        print(f"  Partner task: {ct['task_code']} ({ct['department']}) - read_only={ct['read_only']}, edit_actions={ct['edit_actions']}")
        assert ct["read_only"] is True
        assert ct["edit_actions"] == []
        assert ct["assigned_to"] is None

    # Check that own ENG tasks have edit_actions
    for et in eng_tasks:
        assert et["read_only"] is False
        assert "VERIFY" in et["edit_actions"]
        assert "ACKNOWLEDGE" in et["edit_actions"]

    print("[OK] Row-level Co-block scoping and read-only field stripping verified.")

if __name__ == "__main__":
    test_bundling_engine_gates()
    test_recommendation_endpoint()
    test_coblock_task_scoping()
    print("\n=======================================================")
    print("ALL PHASE 4 BACKEND AND INTEGRATION TESTS PASSED 100%!")
    print("=======================================================\n")
