from app.services.readiness import evaluate_readiness
from app.models import Task

def test_readiness_high():
    task = Task(
        department="ENGINEERING",
        material_ready=1,
        machine_ready=1,
        gang_ready=1,
        site_ready=1,
        weather_suitable=1,
        required_machine="M1",
        required_gang="G1"
    )
    res = evaluate_readiness(task)
    assert res["level"] == "HIGH"
    assert res["eligible_for_plan_a"] is True

def test_readiness_low():
    task = Task(
        department="ENGINEERING",
        material_ready=0,
        machine_ready=0,
        gang_ready=0,
        site_ready=0,
        weather_suitable=0,
        required_machine="M1",
        required_gang="G1"
    )
    res = evaluate_readiness(task)
    assert res["level"] == "LOW"
    assert res["eligible_for_plan_a"] is False
