from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_db_health():
    response = client.get("/health/database")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_get_tasks():
    response = client.get("/api/tasks")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "tasks" in data["data"]
