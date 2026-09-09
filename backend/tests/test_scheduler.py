from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_generate_plan():
    response = client.post("/api/plans/generate")
    if response.status_code == 200:
        data = response.json()
        assert "plan_a" in data or "plan_a_id" in data
        assert "plan_b" in data or "plan_b_id" in data
