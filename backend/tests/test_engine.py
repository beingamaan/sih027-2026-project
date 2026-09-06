import pytest
from app.services.classification import classify_lane
from app.services.priority import calculate_priority
from app.services.readiness import evaluate_readiness

class MockTask:
    def __init__(self, lane, safety_class="LOW", overdue_days=0, **kwargs):
        self.lane = lane
        self.safety_class = safety_class
        self.overdue_days = overdue_days
        for k, v in kwargs.items():
            setattr(self, k, v)

def test_lane_a_bypass():
    task = MockTask(lane="A_EMERGENCY")
    res = classify_lane(task)
    assert res['lane'] == "A_EMERGENCY"
    assert res['optimizer_eligible'] is False

def test_b1_scheduling():
    task = MockTask(lane="B1_PLANNED")
    res = classify_lane(task)
    assert res['optimizer_eligible'] is True

def test_priority_calculation():
    task = MockTask(lane="B2_STATUTORY", overdue_days=2, safety_class="HIGH")
    res = calculate_priority(task)
    assert res['priority_score'] == 100.0  # 80 + 10 (overdue) + 15 (safety) capped at 100
    assert res['priority_band'] == "CRITICAL"

def test_readiness_gate():
    # HIGH readiness (all ready)
    task1 = MockTask(lane="B1", material_ready=1, ptw_ready=1, requires_power_block=0)
    res1 = evaluate_readiness(task1)
    assert res1['status'] == "HIGH"
    
    # MEDIUM readiness (1 missing)
    task2 = MockTask(lane="B1", material_ready=0, ptw_ready=1, requires_power_block=0)
    res2 = evaluate_readiness(task2)
    assert res2['status'] == "MEDIUM"
    
    # LOW readiness (2 missing)
    task3 = MockTask(lane="B1", material_ready=0, ptw_ready=0, requires_power_block=0)
    res3 = evaluate_readiness(task3)
    assert res3['status'] == "LOW"
