import sqlite3

db_path = 'railway.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

# Drop all tables
for table_name in tables:
    if table_name[0] != 'sqlite_sequence':
        cursor.execute(f"DROP TABLE IF EXISTS {table_name[0]}")
conn.commit()

with open('schema.sql', 'r') as f:
    conn.executescript(f.read())
with open('seed.sql', 'r') as f:
    conn.executescript(f.read())

conn.close()
print("Database initialized successfully.")
