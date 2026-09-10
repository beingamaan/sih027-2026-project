import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, init_db
from app.models import Station, TrainSchedule
from app.services.metrics import PRIORITY_WEIGHTS, compute_wtm
from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("=== PHASE 3 COMPREHENSIVE VERIFICATION SUITE ===")
    db = SessionLocal()

    # -------------------------------------------------------------
    # TEST 1: Station Seeding (7 authentic stations across KM 100-158)
    # -------------------------------------------------------------
    print("\n[TEST 1] Testing Corridor Station Topology...")
    stations = db.query(Station).order_by(Station.chainage_km.asc()).all()
    stn_map = {s.code or s.station_code: s.chainage_km for s in stations}
    
    expected_chainages = {
        "STA": 100.0,
        "ANVR": 108.4,
        "BRHN": 119.2,
        "CHL": 128.5,
        "DDP": 137.9,
        "ETAH": 148.1,
        "STD": 158.0
    }

    for code, km in expected_chainages.items():
        assert code in stn_map, f"Station {code} missing from database!"
        assert abs(stn_map[code] - km) < 0.01, f"Station {code} chainage mismatch: expected {km}, got {stn_map[code]}"
        print(f"  [PASS] Station {code}: Chainage {km} KM verified.")

    # -------------------------------------------------------------
    # TEST 2: 24-Hour Timetable Seeding (18 diverse services)
    # -------------------------------------------------------------
    print("\n[TEST 2] Testing 24-Hour Timetable Seeding...")
    schedules = db.query(TrainSchedule).all()
    assert len(schedules) >= 18, f"Expected at least 18 schedules, got {len(schedules)}"
    print(f"  [PASS] Total services seeded: {len(schedules)}")

    sched_map = {s.train_number: s for s in schedules}
    required_services = ["12951", "12004", "BOXN-9021", "12418"]
    for num in required_services:
        assert num in sched_map, f"Required service {num} not found in train schedules!"
        s = sched_map[num]
        print(f"  [PASS] Service {num} ({s.train_name}) [Priority: {s.priority_class}] verified.")

    # -------------------------------------------------------------
    # TEST 3: WTM Engine & Mathematical Invariant Validation
    # -------------------------------------------------------------
    print("\n[TEST 3] Testing WTM Engine & Mathematical Invariant...")
    # Priority weights check
    assert PRIORITY_WEIGHTS["PREMIUM"] == 3.0
    assert PRIORITY_WEIGHTS["SUPERFAST"] == 2.0
    assert PRIORITY_WEIGHTS["EXPRESS"] == 1.5
    assert PRIORITY_WEIGHTS["GOODS"] == 1.0
    print("  [PASS] Priority weights verified strictly per IR rules.")

    train_data = [
        {
            "train_number": s.train_number,
            "train_name": s.train_name,
            "priority_class": s.priority_class,
            "origin_time": s.origin_time,
            "station_entries": s.station_entries
        }
        for s in schedules
    ]

    # Plan A (02:00 - 04:00, 120m to 240m)
    wtm_a = compute_wtm(
        plan_start_min=120,
        plan_end_min=240,
        block_km_start=120.0,
        block_km_end=140.0,
        trains=train_data
    )
    
    # Mathematical Invariant check
    sum_a = round(sum(item["wtm_penalty"] for item in wtm_a["ledger"]), 1)
    assert wtm_a["total_wtm"] == sum_a, f"Mathematical Invariant violated: {wtm_a['total_wtm']} != {sum_a}"
    print(f"  [PASS] Plan A WTM Invariant: total_wtm ({wtm_a['total_wtm']}) == sum(ledger) ({sum_a})")

    # Conflict verification for Plan A
    conflicts_a = {item["train_number"] for item in wtm_a["ledger"] if item["has_conflict"]}
    assert "12951" in conflicts_a, "12951 Mumbai Rajdhani must conflict with Plan A"
    assert "12004" in conflicts_a, "12004 Lucknow Shatabdi must conflict with Plan A"
    assert "BOXN-9021" not in conflicts_a, "BOXN-9021 must clear before Plan A"
    assert "12418" not in conflicts_a, "12418 Prayagraj Exp must clear Plan A (starts 04:15 >= 04:00)"
    print(f"  [PASS] Plan A Conflicts strictly verified: {conflicts_a}")

    # Plan B (02:00 - 04:45, 120m to 285m)
    wtm_b = compute_wtm(
        plan_start_min=120,
        plan_end_min=285,
        block_km_start=120.0,
        block_km_end=140.0,
        trains=train_data
    )

    sum_b = round(sum(item["wtm_penalty"] for item in wtm_b["ledger"]), 1)
    assert wtm_b["total_wtm"] == sum_b, f"Mathematical Invariant violated: {wtm_b['total_wtm']} != {sum_b}"
    print(f"  [PASS] Plan B WTM Invariant: total_wtm ({wtm_b['total_wtm']}) == sum(ledger) ({sum_b})")

    conflicts_b = {item["train_number"] for item in wtm_b["ledger"] if item["has_conflict"]}
    assert "12951" in conflicts_b, "12951 Mumbai Rajdhani must conflict with Plan B"
    assert "12004" in conflicts_b, "12004 Lucknow Shatabdi must conflict with Plan B"
    assert "12418" in conflicts_b, "12418 Prayagraj Exp must conflict with Plan B (starts 04:15 < 04:45)"
    assert "BOXN-9021" not in conflicts_b, "BOXN-9021 must clear before Plan B"
    print(f"  [PASS] Plan B Conflicts strictly verified: {conflicts_b}")

    # -------------------------------------------------------------
    # TEST 4: REST API Integration via TestClient
    # -------------------------------------------------------------
    print("\n[TEST 4] Testing REST API Endpoints...")
    client = TestClient(app)

    # 4.1 Stations
    res_stn = client.get("/api/trains/stations")
    assert res_stn.status_code == 200
    stns_res = res_stn.json()
    assert len(stns_res) >= 7
    print(f"  [PASS] GET /api/trains/stations: {len(stns_res)} stations returned.")

    # 4.2 Schedules
    res_sched = client.get("/api/trains/schedules")
    assert res_sched.status_code == 200
    scheds_res = res_sched.json()
    assert len(scheds_res) >= 18
    print(f"  [PASS] GET /api/trains/schedules: {len(scheds_res)} schedules returned.")

    # 4.3 Occupancy Plan A
    res_occ_a = client.get("/api/trains/occupancy?plan_mode=A")
    assert res_occ_a.status_code == 200
    occ_a = res_occ_a.json()
    assert occ_a["plan_mode"] == "PLAN_A"
    assert occ_a["conflict_count"] == 2
    assert occ_a["total_wtm"] == wtm_a["total_wtm"]
    print(f"  [PASS] GET /api/trains/occupancy?plan_mode=A: Total WTM={occ_a['total_wtm']}, Conflicts={occ_a['conflict_count']}")

    # 4.4 Occupancy Plan B
    res_occ_b = client.get("/api/trains/occupancy?plan_mode=B")
    assert res_occ_b.status_code == 200
    occ_b = res_occ_b.json()
    assert occ_b["plan_mode"] == "PLAN_B"
    assert occ_b["conflict_count"] == 3
    assert occ_b["total_wtm"] == wtm_b["total_wtm"]
    print(f"  [PASS] GET /api/trains/occupancy?plan_mode=B: Total WTM={occ_b['total_wtm']}, Conflicts={occ_b['conflict_count']}")

    db.close()
    print("\nALL PHASE 3 VERIFICATION CHECKS PASSED WITH 100% MATHEMATICAL RIGOR!")

if __name__ == "__main__":
    run_tests()
