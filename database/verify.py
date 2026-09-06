"""Verify the railway.db database."""
import sqlite3, sys

conn = sqlite3.connect("railway.db")
conn.execute("PRAGMA foreign_keys = ON")
cur = conn.cursor()

print("=" * 60)
print("VERIFICATION REPORT")
print("=" * 60)

# 1. Check all 14 tables exist
print("\n[1] TABLE CHECK")
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]
print(f"    Tables found: {len(tables)}")
for t in tables:
    print(f"      - {t}")
assert len(tables) == 14, f"Expected 14 tables, got {len(tables)}"
print("    PASS: All 14 tables exist")

# 2. Row counts
print("\n[2] ROW COUNTS")
for t in sorted(tables):
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    cnt = cur.fetchone()[0]
    print(f"    {t:20s}  {cnt:>6d}")

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

# 4. Task breakdown
print("\n[4] TASK BREAKDOWN BY DEPARTMENT")
cur.execute("SELECT department, COUNT(*) FROM tasks GROUP BY department ORDER BY department")
for dept, cnt in cur.fetchall():
    print(f"    {dept:15s}  {cnt}")

print("\n    BY LANE")
cur.execute("SELECT lane, COUNT(*) FROM tasks GROUP BY lane ORDER BY lane")
for lane, cnt in cur.fetchall():
    print(f"    {lane:15s}  {cnt}")

print("\n    BY STATUS")
cur.execute("SELECT status, COUNT(*) FROM tasks GROUP BY status ORDER BY status")
for st, cnt in cur.fetchall():
    print(f"    {st:15s}  {cnt}")

# 5. Indexes
print("\n[5] INDEXES")
cur.execute("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name")
indexes = [r[0] for r in cur.fetchall()]
print(f"    Custom indexes: {len(indexes)}")
for idx in indexes:
    print(f"      - {idx}")

# 6. Sample queries
print("\n[6] SAMPLE QUERIES")

# Tasks with defects
cur.execute("""
    SELECT t.task_code, t.description, d.severity, d.defect_code
    FROM tasks t
    JOIN defects d ON t.defect_id = d.id
    LIMIT 5
""")
print("    Tasks with defects:")
for row in cur.fetchall():
    desc = row[1][:50]
    print(f"      {row[0]}: {desc}... | {row[2]} | {row[3]}")

# Block sections with distance
cur.execute("""
    SELECT bs.section_code, s1.station_code, s2.station_code, bs.distance_km
    FROM block_sections bs
    JOIN stations s1 ON bs.from_station_id = s1.id
    JOIN stations s2 ON bs.to_station_id = s2.id
""")
print("    Block sections:")
for row in cur.fetchall():
    print(f"      {row[0]}: {row[1]} -> {row[2]} ({row[3]} km)")

# Total corridor distance
cur.execute("SELECT SUM(distance_km) FROM block_sections")
total_km = cur.fetchone()[0]
print(f"    Total corridor: {total_km} km")

# Train paths per day
cur.execute("""
    SELECT DATE(scheduled_start) as day, COUNT(*) / 3 as trains
    FROM train_paths
    GROUP BY day
    ORDER BY day
    LIMIT 7
""")
print("    Trains per day (approx):")
for row in cur.fetchall():
    print(f"      {row[0]}: ~{row[1]} trains")

# TSR scenarios
cur.execute("""
    SELECT task_code, post_work_tsr_speed_kmph, post_work_tsr_days, post_work_tsr_cost
    FROM tasks
    WHERE post_work_tsr_speed_kmph IS NOT NULL
    ORDER BY post_work_tsr_cost DESC
    LIMIT 5
""")
print("    TSR scenarios (top 5 by cost):")
for row in cur.fetchall():
    print(f"      {row[0]}: {row[1]} kmph for {row[2]} days, cost={row[3]}")

# Readiness variation
cur.execute("""
    SELECT task_code, material_ready, machine_ready, gang_ready,
           power_permit_ready, site_ready, weather_suitable
    FROM tasks LIMIT 6
""")
print("    Readiness (mat/mach/gang/pwr/site/wx):")
for row in cur.fetchall():
    flags = "/".join(str(x) for x in row[1:])
    print(f"      {row[0]}: {flags}")

# Planned tasks join
cur.execute("""
    SELECT pt.id, bp.plan_code, t.task_code, r.resource_code, pt.readiness_level
    FROM planned_tasks pt
    JOIN block_plans bp ON pt.plan_id = bp.id
    JOIN tasks t ON pt.task_id = t.id
    JOIN resources r ON pt.assigned_resource_id = r.id
""")
print("    Planned task allocations:")
for row in cur.fetchall():
    print(f"      PT-{row[0]}: {row[1]} | {row[2]} | {row[3]} | {row[4]}")

# Block events
cur.execute("""
    SELECT be.event_type, t.task_code, be.performed_by, be.event_time
    FROM block_events be
    JOIN tasks t ON be.task_id = t.id
    ORDER BY be.event_time
""")
print("    Block events timeline:")
for row in cur.fetchall():
    print(f"      {row[3]}  {row[0]:15s}  {row[1]}  by {row[2]}")

print("\n" + "=" * 60)
print("ALL CHECKS PASSED")
print("=" * 60)

conn.close()
