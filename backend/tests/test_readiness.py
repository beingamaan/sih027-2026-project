from app.services.readiness import evaluate_readiness, classify_readiness_band
from app.models import Task, Department, SafetyLane

def test_readiness_high():
    task = Task(
        department=Department.ENG,
        lane=SafetyLane.LANE_B1,
        material_ready=1,
        ptw_ready=1,
        worksite_ready=1,
        weather_suitable=1
    )
    res = evaluate_readiness(task, override_pillars={"machine": 100, "gang": 100, "material": 100, "ptw": 100, "site_weather": 100})
    assert res["level"] == "HIGH"
    assert res["plan_a_allowed"] is True

def test_readiness_low():
    task = Task(
        department=Department.ENG,
        lane=SafetyLane.LANE_B1,
        material_ready=0,
        ptw_ready=0,
        worksite_ready=0,
        weather_suitable=0
    )
    res = evaluate_readiness(task, override_pillars={"machine": 20, "gang": 20, "material": 0, "ptw": 0, "site_weather": 30})
    assert res["level"] == "LOW"
    assert res["plan_a_allowed"] is False
