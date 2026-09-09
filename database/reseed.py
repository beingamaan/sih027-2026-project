import sqlite3
import os

with open('database/seed.sql', 'r', encoding='utf-8') as f:
    seed_sql = f.read()

for path in ['database/railway.db', 'backend/railway.db']:
    if os.path.exists(path):
        conn = sqlite3.connect(path)
        conn.execute("PRAGMA foreign_keys = OFF")
        
        # Clear existing data
        tables = [
            'audit_logs', 'notifications', 'block_events', 'planned_tasks',
            'block_plans', 'train_paths', 'block_windows', 'resources',
            'tasks', 'defects', 'assets', 'interlocking_areas',
            'elementary_sections', 'physical_lines', 'block_sections',
            'stations', 'users'
        ]
        for t in tables:
            try:
                conn.execute(f"DELETE FROM {t}")
            except Exception as e:
                pass
        conn.commit()
        
        # Execute seed
        conn.executescript(seed_sql)
        conn.commit()
        
        task_count = conn.execute("SELECT count(*) FROM tasks").fetchone()[0]
        train_count = conn.execute("SELECT count(*) FROM train_paths").fetchone()[0]
        print(f"Populated {path}: {task_count} tasks, {train_count} trains")
        
        conn.close()
