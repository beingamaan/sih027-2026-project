from app.services.classification import classify_task
from app.models import Task

def test_classify_lane_a():
    task = Task(lane="LANE_A")
    res = classify_task(task)
    assert res["lane"] == "LANE_A"
    assert res["optimizer_eligible"] is False

def test_classify_lane_b1():
    task = Task(lane="LANE_B1")
    res = classify_task(task)
    assert res["lane"] == "LANE_B1"
    assert res["optimizer_eligible"] is True

def test_classify_lane_b2():
    task = Task(lane="LANE_B2")
    res = classify_task(task)
    assert res["lane"] == "LANE_B2"
    assert res["optimizer_eligible"] is True
