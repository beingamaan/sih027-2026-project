import sqlite3
import os
import shutil

db_dir = os.path.dirname(os.path.abspath(__file__))
schema_path = os.path.join(db_dir, 'schema.sql')
seed_path = os.path.join(db_dir, 'seed.sql')
db_path = os.path.join(db_dir, 'railway.db')

if os.path.exists(db_path):
    os.remove(db_path)

conn = sqlite3.connect(db_path)
conn.execute("PRAGMA foreign_keys = ON")

with open(schema_path, 'r', encoding='utf-8') as f:
    conn.executescript(f.read())

with open(seed_path, 'r', encoding='utf-8') as f:
    conn.executescript(f.read())

conn.commit()
conn.close()

# Also ensure backend directory has a synced copy if running from different working directory
backend_db_path = os.path.join(db_dir, '..', 'backend', 'railway.db')
shutil.copy2(db_path, backend_db_path)

print(f"Database initialized successfully at {db_path} and synced to {backend_db_path}")
