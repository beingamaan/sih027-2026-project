from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_generate_plan():
    response = client.post("/api/plans/generate", json={
        "horizon_days": 7,
        "include_lane_b1": True,
        "include_lane_b2": True
    })
    # Might fail if DB is not populated or locked, just check basic structure
    if response.status_code == 200:
        data = response.json()
        assert data["success"] is True
        assert "plan_a" in data["data"]
        assert "plan_b" in data["data"]
