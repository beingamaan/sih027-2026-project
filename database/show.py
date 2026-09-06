import sqlite3

conn = sqlite3.connect("railway.db")
cur = conn.cursor()

print("=== STATIONS ===")
for r in cur.execute("SELECT id, station_code, station_name, location FROM stations"):
    print(f"  {r[0]}  {r[1]:<6s}  {r[2]:<25s}  {r[3]}")

print("\n=== BLOCK SECTIONS ===")
for r in cur.execute("SELECT section_code, distance_km FROM block_sections"):
    print(f"  {r[0]:<12s}  {r[1]} km")

print("\n=== TASKS (all 22) ===")
header = f"  {'Code':<12s} {'Description':<45s} {'Dept':<12s} {'Lane':<8s} {'Prio':<10s} {'Status':<12s}"
print(header)
print("  " + "-" * len(header))
for r in cur.execute("SELECT task_code, description, department, lane, priority, status FROM tasks ORDER BY id"):
    desc = (r[1][:42] + "...") if len(r[1]) > 45 else r[1]
    print(f"  {r[0]:<12s} {desc:<45s} {r[2]:<12s} {r[3]:<8s} {r[4]:<10s} {r[5]:<12s}")

print("\n=== RESOURCES ===")
for r in cur.execute("SELECT resource_code, resource_name, resource_type, department FROM resources"):
    print(f"  {r[0]:<12s}  {r[1]:<35s}  {r[2]:<10s}  {r[3]}")

print("\n=== DEFECTS (top 5 by severity) ===")
for r in cur.execute("SELECT defect_code, severity, is_safety_critical, description FROM defects ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END LIMIT 5"):
    safety = "SAFETY" if r[2] else ""
    desc = (r[3][:50] + "...") if len(r[3]) > 50 else r[3]
    print(f"  {r[0]:<10s}  {r[1]:<10s}  {safety:<8s}  {desc}")

print("\n=== ROW COUNTS ===")
tables = ["users","stations","block_sections","assets","defects","tasks",
          "resources","train_paths","block_windows","block_plans",
          "planned_tasks","block_events","notifications","audit_logs"]
for t in tables:
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    print(f"  {t:<20s}  {cur.fetchone()[0]:>6}")

conn.close()
