import sqlite3

for path in ['database/railway.db', 'backend/railway.db']:
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    count = cur.execute("SELECT count(*) FROM tasks").fetchone()[0] if ('tasks',) in tables else 0
    print(path, "Tables:", [t[0] for t in tables], "Task count:", count)
    if count > 0:
        print("Sample tasks:", cur.execute("SELECT task_code, lane FROM tasks LIMIT 5").fetchall())
    conn.close()
