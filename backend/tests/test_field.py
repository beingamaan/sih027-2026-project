from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_field_invalid_task():
    response = client.post("/api/field/tasks/9999/acknowledge", json={"reason": "test", "user_id": 1})
    assert response.status_code == 404
