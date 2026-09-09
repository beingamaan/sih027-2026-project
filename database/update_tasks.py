import sqlite3
import os

for path in ['database/railway.db', 'backend/railway.db']:
    if os.path.exists(path):
        conn = sqlite3.connect(path)
        cur = conn.cursor()
        cur.execute("UPDATE tasks SET material_ready = 0, ptw_ready = 0 WHERE task_code = 'TSK_ENG_03'")
        cur.execute("UPDATE tasks SET power_ready = 0 WHERE task_code = 'TSK_TRD_02'")
        conn.commit()
        rows = cur.execute("SELECT task_code, material_ready, ptw_ready, power_ready FROM tasks WHERE task_code IN ('TSK_ENG_02', 'TSK_ENG_03', 'TSK_TRD_02')").fetchall()
        print(path, rows)
        conn.close()
