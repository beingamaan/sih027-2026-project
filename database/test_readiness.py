import sqlite3
import sys
sys.path.append('backend')
from app.services.readiness import evaluate_readiness

class DummyTask:
    def __init__(self, d):
        for k, v in d.items():
            setattr(self, k, v)

conn = sqlite3.connect('database/railway.db')
conn.row_factory = sqlite3.Row
rows = conn.execute("SELECT * FROM tasks").fetchall()
for r in rows:
    task = DummyTask(dict(r))
    res = evaluate_readiness(task)
    print(f"{task.task_code}: {res['readiness_score']} pts - {res['status']} ({res['reasons']})")
conn.close()
