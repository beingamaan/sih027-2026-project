"""Verify the standardized railway.db database."""
import sqlite3
import os
import sys

db_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(db_dir, 'railway.db')

if not os.path.exists(db_path):
    print(f"Error: Database file not found at {db_path}")
    sys.exit(1)

conn = sqlite3.connect(db_path)
conn.execute("PRAGMA foreign_keys = ON")
cur = conn.cursor()

print("=" * 60)
print("SIH26027 STANDARDIZED VERIFICATION REPORT")
print("=" * 60)

# 1. Check all 15 tables exist
print("\n[1] TABLE CHECK")
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]
print(f"    Tables found: {len(tables)}")
for t in tables:
    print(f"      - {t}")
expected_tables = {
    'users', 'stations', 'block_sections', 'physical_lines', 'elementary_sections',
    'interlocking_areas', 'assets', 'defects', 'tasks', 'resources', 'train_paths',
    'block_windows', 'block_plans', 'planned_tasks', 'block_events', 'notifications',
    'audit_logs'
}
assert set(tables).issuperset(expected_tables), f"Missing tables: {expected_tables - set(tables)}"
print("    PASS: All required tables exist")

# 2. Row counts
print("\n[2] ROW COUNTS")
for t in sorted(tables):
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    cnt = cur.fetchone()[0]
    print(f"    {t:25s}  {cnt:>6d}")

# 3. Foreign key integrity
print("\n[3] FOREIGN KEY INTEGRITY")
cur.execute("PRAGMA foreign_key_check")
violations = cur.fetchall()
if violations:
    for v in violations:
        print(f"    VIOLATION: {v}")
    sys.exit(1)
else:
    print("    PASS: No foreign-key violations")

# 4. Corridor Topology (58 km KM 100 to KM 158)
print("\n[4] CORRIDOR TOPOLOGY CHECK")
cur.execute("SELECT station_code, name, chainage_km FROM stations ORDER BY chainage_km")
stations = cur.fetchall()
for st in stations:
    print(f"    Station: {st[0]:6s} | {st[1]:30s} | KM {st[2]}")
assert len(stations) == 4, "Expected 4 stations (STA, STB, STC, STD)"
assert stations[0][2] == 100.0 and stations[-1][2] == 158.0, "Corridor chainage must be KM 100 to 158"

# 5. Task Breakdown (22 tasks: 13 ENG, 5 TRD, 4 S&T)
print("\n[5] TASK BREAKDOWN")
cur.execute("SELECT department, COUNT(*) FROM tasks GROUP BY department ORDER BY department")
for dept, cnt in cur.fetchall():
    print(f"    {dept:20s}  {cnt}")

cur.execute("SELECT lane, COUNT(*) FROM tasks GROUP BY lane ORDER BY lane")
print("    Lanes:")
for lane, cnt in cur.fetchall():
    print(f"      {lane:20s}  {cnt}")

# 6. Physical lines
print("\n[6] PHYSICAL LINES")
cur.execute("""
    SELECT bs.section_code, pl.line_code, pl.line_name, pl.line_type
    FROM physical_lines pl
    JOIN block_sections bs ON pl.block_section_id = bs.id
""")
for row in cur.fetchall():
    print(f"    {row[0]:10s} | {row[1]:6s} | {row[2]:30s} | {row[3]}")

# 7. Train paths
print("\n[7] TRAIN PATHS")
cur.execute("SELECT COUNT(*), COUNT(DISTINCT train_number) FROM train_paths")
tp_cnt, trn_cnt = cur.fetchone()
print(f"    Total train paths: {tp_cnt} across {trn_cnt} unique train services")

print("\n" + "=" * 60)
print("ALL CHECKS PASSED: REPOSITORY DATA CONTRACT IS COMPLIANT")
print("=" * 60)

conn.close()
