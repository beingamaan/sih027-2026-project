"""
Generate seed.sql for the SIH26027 railway block-planning prototype.
Run: python generate_seed.py > seed.sql   (or it writes to seed.sql directly)
"""
import datetime, random, json, os

random.seed(42)

# ── helpers ──────────────────────────────────────────────────
HORIZON_START = datetime.date(2026, 9, 5)
HORIZON_DAYS  = 7
HORIZON_END   = HORIZON_START + datetime.timedelta(days=HORIZON_DAYS)

def ts(dt):
    """ISO-8601 timestamp string."""
    if isinstance(dt, datetime.datetime):
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    return dt.strftime("%Y-%m-%d") + " 00:00:00"

def q(s):
    """Quote a string for SQL, escaping single-quotes."""
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

NOW = ts(datetime.datetime(2026, 9, 5, 8, 0, 0))

lines: list[str] = []
def emit(sql):
    lines.append(sql)

# ────────────────────────────────────────────────────────────
# 1. USERS  (ids 1-5)
# ────────────────────────────────────────────────────────────
emit("-- =====================================================")
emit("-- SEED DATA — SIH26027 Prototype (Synthetic / Mock)")
emit("-- =====================================================")
emit("")
emit("PRAGMA foreign_keys = ON;")
emit("")
emit("-- 1. USERS")

users = [
    (1, "admin@railway-demo.in",    "Rajesh Kumar",     "ADMIN"),
    (2, "planner@railway-demo.in",  "Priya Sharma",     "PLANNER"),
    (3, "super@railway-demo.in",    "Anil Verma",       "SUPERVISOR"),
    (4, "field1@railway-demo.in",   "Sunil Yadav",      "FIELD_USER"),
    (5, "viewer@railway-demo.in",   "Meera Patel",      "VIEWER"),
]
for uid, email, name, role in users:
    emit(f"INSERT INTO users (id, email, full_name, role, is_active, created_at, updated_at) "
         f"VALUES ({uid}, {q(email)}, {q(name)}, {q(role)}, 1, {q(NOW)}, {q(NOW)});")

# ────────────────────────────────────────────────────────────
# 2. STATIONS  (ids 1-4)
# ────────────────────────────────────────────────────────────
emit("")
emit("-- 2. STATIONS")

stations = [
    (1, "NDLS", "New Delhi",          "Delhi NCR",      28.6442, 77.2161),
    (2, "GZB",  "Ghaziabad Junction", "Uttar Pradesh",  28.6604, 77.4381),
    (3, "HPJN", "Hapur Junction",     "Uttar Pradesh",  28.7307, 77.7753),
    (4, "MB",   "Moradabad Junction", "Uttar Pradesh",  28.8386, 78.7733),
]
for sid, code, name, loc, lat, lon in stations:
    emit(f"INSERT INTO stations (id, station_code, station_name, location, latitude, longitude, created_at) "
         f"VALUES ({sid}, {q(code)}, {q(name)}, {q(loc)}, {lat}, {lon}, {q(NOW)});")

# ────────────────────────────────────────────────────────────
# 3. BLOCK SECTIONS  (ids 1-3, total ≈ 58 km)
# ────────────────────────────────────────────────────────────
emit("")
emit("-- 3. BLOCK SECTIONS")

sections = [
    (1, "NDLS-GZB",  1, 2, 20.0, "DOUBLE", "BOTH", "ACTIVE"),
    (2, "GZB-HPJN",  2, 3, 18.5, "DOUBLE", "BOTH", "ACTIVE"),
    (3, "HPJN-MB",   3, 4, 19.5, "DOUBLE", "BOTH", "ACTIVE"),
]
for sid, code, fs, ts_id, dist, lt, dr, st in sections:
    emit(f"INSERT INTO block_sections (id, section_code, from_station_id, to_station_id, distance_km, "
         f"line_type, direction, status, created_at) "
         f"VALUES ({sid}, {q(code)}, {fs}, {ts_id}, {dist}, {q(lt)}, {q(dr)}, {q(st)}, {q(NOW)});")

# ────────────────────────────────────────────────────────────
# 4. ASSETS  (ids 1-25)
# ────────────────────────────────────────────────────────────
emit("")
emit("-- 4. ASSETS")

assets_data = [
    # ENGINEERING — TRACK assets
    ( 1, "TRK-NDLS-001", "TRACK",          "ENGINEERING", 1,  3.5, "Rail section — weld joint cluster",      "FAIR",      "HIGH",     "2026-06-15", "2026-09-15"),
    ( 2, "TRK-NDLS-002", "TRACK",          "ENGINEERING", 1,  8.2, "Curved track segment — 3° curve",        "GOOD",      "MEDIUM",   "2026-07-01", "2026-10-01"),
    ( 3, "TRK-GZB-001",  "TRACK",          "ENGINEERING", 2,  1.5, "Track bed — ballast deficiency zone",    "POOR",      "HIGH",     "2026-05-20", "2026-09-07"),
    ( 4, "TRK-GZB-002",  "TRACK",          "ENGINEERING", 2, 10.0, "Level crossing approach track",          "FAIR",      "MEDIUM",   "2026-06-10", "2026-09-20"),
    ( 5, "TRK-HPJN-001", "TRACK",          "ENGINEERING", 3,  5.0, "Bridge approach track",                  "GOOD",      "HIGH",     "2026-07-10", "2026-10-10"),
    ( 6, "TRK-HPJN-002", "TRACK",          "ENGINEERING", 3, 12.0, "Track section — SEJ zone",               "FAIR",      "MEDIUM",   "2026-06-25", "2026-09-25"),
    ( 7, "LC-GZB-001",   "LEVEL_CROSSING", "ENGINEERING", 2, 14.0, "Level crossing No. 14 — manned",        "FAIR",      "HIGH",     "2026-07-15", "2026-09-08"),
    ( 8, "LC-HPJN-001",  "LEVEL_CROSSING", "ENGINEERING", 3, 16.5, "Level crossing No. 18 — manned",        "GOOD",      "MEDIUM",   "2026-08-01", "2026-10-15"),

    # TRD — OHE assets
    ( 9, "OHE-NDLS-001", "OHE",            "TRD",         1,  5.0, "OHE mast 45-52 — catenary wire",        "FAIR",      "HIGH",     "2026-06-01", "2026-09-10"),
    (10, "OHE-GZB-001",  "OHE",            "TRD",         2,  6.5, "OHE section — contact wire worn",       "POOR",      "CRITICAL", "2026-05-15", "2026-09-06"),
    (11, "OHE-GZB-002",  "OHE",            "TRD",         2, 12.0, "OHE insulator cluster",                  "GOOD",      "MEDIUM",   "2026-07-20", "2026-10-20"),
    (12, "OHE-HPJN-001", "OHE",            "TRD",         3,  8.0, "OHE cantilever assembly",                "FAIR",      "HIGH",     "2026-06-15", "2026-09-15"),

    # S&T — Signals + Point machines
    (13, "SIG-NDLS-001", "SIGNAL",         "S&T",         1,  0.5, "Home signal — NDLS approach",            "GOOD",      "CRITICAL", "2026-08-01", "2026-11-01"),
    (14, "SIG-GZB-001",  "SIGNAL",         "S&T",         2,  0.2, "Starter signal — GZB yard",              "FAIR",      "HIGH",     "2026-07-01", "2026-09-12"),
    (15, "PM-GZB-001",   "POINT_MACHINE",  "S&T",         2,  0.3, "Point machine No. 4 — GZB yard",        "FAIR",      "CRITICAL", "2026-06-10", "2026-09-09"),
    (16, "SIG-HPJN-001", "SIGNAL",         "S&T",         3,  0.1, "Distant signal — HPJN approach",         "GOOD",      "HIGH",     "2026-08-15", "2026-11-15"),
    (17, "PM-HPJN-001",  "POINT_MACHINE",  "S&T",         3,  0.2, "Point machine No. 2 — HPJN yard",       "GOOD",      "MEDIUM",   "2026-07-20", "2026-10-20"),

    # Extra ENGINEERING
    (18, "TRK-NDLS-003", "TRACK",          "ENGINEERING", 1, 15.0, "Track section — fish-plated joint zone", "POOR",      "HIGH",     "2026-05-01", "2026-09-06"),
    (19, "TRK-GZB-003",  "TRACK",          "ENGINEERING", 2, 17.0, "Track drainage culvert zone",            "FAIR",      "MEDIUM",   "2026-06-20", "2026-09-18"),
    (20, "TRK-HPJN-003", "TRACK",          "ENGINEERING", 3, 18.0, "Track section — deep screening due",     "POOR",      "HIGH",     "2026-04-15", "2026-09-10"),

    # Extra TRD
    (21, "OHE-NDLS-002", "OHE",            "TRD",         1, 18.0, "OHE jumper wire and dropper section",    "FAIR",      "MEDIUM",   "2026-07-01", "2026-10-01"),

    # Extra S&T
    (22, "SIG-NDLS-002", "SIGNAL",         "S&T",         1, 19.5, "Signal relay room — NDLS outer",         "GOOD",      "HIGH",     "2026-08-10", "2026-11-10"),

    # Misc
    (23, "TRK-NDLS-004", "TRACK",          "ENGINEERING", 1, 12.5, "Track — turnout No. 12",                 "FAIR",      "HIGH",     "2026-06-05", "2026-09-11"),
    (24, "OHE-HPJN-002", "OHE",            "TRD",         3, 15.0, "OHE neutral section",                    "GOOD",      "LOW",      "2026-08-01", "2026-11-01"),
    (25, "PM-NDLS-001",  "POINT_MACHINE",  "S&T",         1,  1.0, "Point machine No. 8 — NDLS yard",       "FAIR",      "CRITICAL", "2026-06-20", "2026-09-08"),
]
for a in assets_data:
    aid, code, atype, dept, bsid, km, desc, cond, crit, lmd, ndd = a
    emit(f"INSERT INTO assets (id, asset_code, asset_type, department, block_section_id, location_km, "
         f"description, condition, criticality, last_maintenance_date, next_due_date, status, created_at, updated_at) "
         f"VALUES ({aid}, {q(code)}, {q(atype)}, {q(dept)}, {bsid}, {km}, {q(desc)}, "
         f"{q(cond)}, {q(crit)}, {q(lmd)}, {q(ndd)}, 'ACTIVE', {q(NOW)}, {q(NOW)});")

# ────────────────────────────────────────────────────────────
# 5. DEFECTS  (ids 1-10)
# ────────────────────────────────────────────────────────────
emit("")
emit("-- 5. DEFECTS")

defects_data = [
    ( 1,  1, "DEF-001", "Weld joint crack detected by USFD",                  "CRITICAL", "2026-09-02 06:30:00", 1, "Emergency rail replacement required",    "OPEN"),
    ( 2,  3, "DEF-002", "Ballast voids under sleepers — TGI < 40",            "HIGH",     "2026-09-01 14:00:00", 0, "Tamping required within 7 days",          "OPEN"),
    ( 3, 10, "DEF-003", "Contact wire wear exceeding 25%",                    "HIGH",     "2026-08-28 10:00:00", 1, "Replace contact wire section",            "IN_PROGRESS"),
    ( 4, 15, "DEF-004", "Point machine sluggish — detection delay > 3 sec",   "HIGH",     "2026-09-03 08:00:00", 1, "Overhauling and testing required",        "OPEN"),
    ( 5,  7, "DEF-005", "Level crossing gate arm misalignment",               "MEDIUM",   "2026-09-01 11:00:00", 0, "Realignment and lubrication",             "OPEN"),
    ( 6, 18, "DEF-006", "Fish plate cracks at 3 locations",                   "CRITICAL", "2026-09-04 07:15:00", 1, "Immediate fish plate replacement",        "OPEN"),
    ( 7, 14, "DEF-007", "Signal lamp dim — LED degradation",                  "LOW",      "2026-08-30 16:00:00", 0, "Replace signal lamp unit",                "OPEN"),
    ( 8, 20, "DEF-008", "Ballast contamination — deep screening overdue",     "HIGH",     "2026-08-25 09:00:00", 0, "Deep screening required",                 "OPEN"),
    ( 9, 25, "DEF-009", "Point machine motor overheating",                    "HIGH",     "2026-09-04 14:30:00", 1, "Motor replacement and testing",           "OPEN"),
    (10, 12, "DEF-010", "OHE cantilever tilt exceeding tolerance",            "MEDIUM",   "2026-09-02 12:00:00", 0, "Cantilever realignment",                  "OPEN"),
]
for d in defects_data:
    did, aid, code, desc, sev, det, safety, rec, st = d
    emit(f"INSERT INTO defects (id, asset_id, defect_code, description, severity, detected_at, "
         f"is_safety_critical, recommended_action, status, created_at, updated_at) "
         f"VALUES ({did}, {aid}, {q(code)}, {q(desc)}, {q(sev)}, {q(det)}, "
         f"{safety}, {q(rec)}, {q(st)}, {q(NOW)}, {q(NOW)});")

# ────────────────────────────────────────────────────────────
# 6. TASKS  (ids 1-22)
# ────────────────────────────────────────────────────────────
emit("")
emit("-- 6. TASKS  (22 total: 13 ENG, 5 TRD, 4 S&T)")

# (id, task_code, asset_id, bs_id, defect_id|None, description, department,
#  task_type, lane, priority, status,
#  est_dur, p50, p90, overrun_prob,
#  req_machine, req_gang, mat, mach, gang, power, site, weather,
#  deadline, pref_start, tsr_speed, tsr_days, tsr_cost)
tasks_data = [
    # ── ENGINEERING  (13 tasks) ──────────────────────────────
    # LANE_A — emergency
    ( 1, "TSK-E-001",  1, 1,    1, "Emergency rail replacement — weld crack",
      "ENGINEERING", "EMERGENCY", "LANE_A", "CRITICAL", "OPEN",
      120, 100, 150, 0.25,
      None, "GANG-P01", 1, 1, 1, 0, 1, 1,
      "2026-09-05", "2026-09-05 10:00:00", 30.0, 3, 45000.0),

    ( 2, "TSK-E-002", 18, 1,    6, "Emergency fish plate replacement",
      "ENGINEERING", "EMERGENCY", "LANE_A", "CRITICAL", "OPEN",
      90, 75, 120, 0.20,
      None, "GANG-P01", 1, 1, 1, 0, 1, 1,
      "2026-09-05", "2026-09-05 14:00:00", 20.0, 2, 30000.0),

    # LANE_B1 — planned preventive
    ( 3, "TSK-E-003",  3, 2,    2, "Machine tamping — ballast voids correction",
      "ENGINEERING", "CORRECTIVE", "LANE_B1", "HIGH", "CLASSIFIED",
      180, 160, 240, 0.30,
      "TAMP-01", "GANG-P02", 1, 1, 1, 0, 1, 1,
      "2026-09-12", "2026-09-07 02:00:00", 40.0, 5, 65000.0),

    ( 4, "TSK-E-004",  2, 1, None, "Preventive rail grinding — curve maintenance",
      "ENGINEERING", "PREVENTIVE", "LANE_B1", "MEDIUM", "READY",
      240, 210, 300, 0.15,
      "TAMP-01", "GANG-P01", 1, 0, 1, 0, 1, 1,
      "2026-09-15", "2026-09-08 01:00:00", None, None, None),

    ( 5, "TSK-E-005",  4, 2, None, "Level crossing approach track renewal",
      "ENGINEERING", "PREVENTIVE", "LANE_B1", "MEDIUM", "CLASSIFIED",
      150, 130, 190, 0.20,
      None, "GANG-P02", 1, 1, 0, 0, 1, 1,
      "2026-09-14", "2026-09-09 02:30:00", 30.0, 4, 50000.0),

    ( 6, "TSK-E-006",  5, 3, None, "Bridge approach track geometry correction",
      "ENGINEERING", "PREVENTIVE", "LANE_B1", "HIGH", "CLASSIFIED",
      120, 100, 160, 0.18,
      "TAMP-01", "GANG-P03", 1, 1, 1, 0, 1, 0,
      "2026-09-11", "2026-09-06 02:00:00", 20.0, 3, 35000.0),

    # LANE_B2 — statutory
    ( 7, "TSK-E-007",  6, 3, None, "Statutory SEJ inspection and maintenance",
      "ENGINEERING", "STATUTORY", "LANE_B2", "HIGH", "READY",
      90, 80, 120, 0.10,
      None, "GANG-P03", 1, 1, 1, 0, 1, 1,
      "2026-09-10", "2026-09-07 03:00:00", None, None, None),

    ( 8, "TSK-E-008",  7, 2,    5, "Level crossing gate repair and alignment",
      "ENGINEERING", "CORRECTIVE", "LANE_B1", "MEDIUM", "CLASSIFIED",
      60, 50, 80, 0.12,
      None, "GANG-P02", 1, 1, 1, 0, 1, 1,
      "2026-09-12", "2026-09-08 03:00:00", None, None, None),

    ( 9, "TSK-E-009", 19, 2, None, "Track drainage culvert cleaning",
      "ENGINEERING", "PREVENTIVE", "LANE_B1", "LOW", "OPEN",
      120, 100, 150, 0.10,
      None, "GANG-P02", 0, 1, 1, 0, 0, 0,
      "2026-09-18", None, None, None, None),

    (10, "TSK-E-010", 20, 3,    8, "Deep screening — ballast contamination",
      "ENGINEERING", "CORRECTIVE", "LANE_B1", "HIGH", "CLASSIFIED",
      360, 300, 480, 0.35,
      "TAMP-01", "GANG-P03", 0, 0, 1, 0, 1, 1,
      "2026-09-12", "2026-09-07 01:00:00", 30.0, 7, 120000.0),

    (11, "TSK-E-011", 23, 1, None, "Turnout No. 12 — sleeper replacement",
      "ENGINEERING", "PREVENTIVE", "LANE_B1", "MEDIUM", "OPEN",
      180, 150, 220, 0.20,
      None, "GANG-P01", 0, 1, 0, 0, 1, 1,
      "2026-09-14", None, 20.0, 4, 40000.0),

    (12, "TSK-E-012",  8, 3, None, "Level crossing No. 18 — statutory annual inspection",
      "ENGINEERING", "STATUTORY", "LANE_B2", "HIGH", "READY",
      45, 40, 60, 0.08,
      None, "GANG-P03", 1, 1, 1, 0, 1, 1,
      "2026-09-08", "2026-09-06 03:00:00", None, None, None),

    (13, "TSK-E-013",  3, 2, None, "Spot tamping — localized track geometry",
      "ENGINEERING", "PREVENTIVE", "LANE_B1", "LOW", "OPEN",
      90, 75, 120, 0.12,
      "TAMP-01", "GANG-P02", 1, 0, 0, 0, 1, 1,
      "2026-09-16", None, None, None, None),

    # ── TRD  (5 tasks) ──────────────────────────────────────
    (14, "TSK-T-001", 10, 2,    3, "Contact wire replacement — worn section",
      "TRD", "CORRECTIVE", "LANE_B1", "HIGH", "CLASSIFIED",
      180, 150, 240, 0.25,
      None, "GANG-T01", 1, 1, 1, 1, 1, 1,
      "2026-09-10", "2026-09-06 01:00:00", 40.0, 5, 80000.0),

    (15, "TSK-T-002",  9, 1, None, "OHE mast foundation inspection",
      "TRD", "STATUTORY", "LANE_B2", "HIGH", "READY",
      120, 100, 150, 0.15,
      None, "GANG-T01", 1, 1, 1, 1, 1, 1,
      "2026-09-09", "2026-09-06 02:00:00", None, None, None),

    (16, "TSK-T-003", 11, 2, None, "OHE insulator cleaning and testing",
      "TRD", "PREVENTIVE", "LANE_B1", "MEDIUM", "OPEN",
      90, 75, 120, 0.10,
      None, "GANG-T01", 1, 1, 0, 1, 1, 1,
      "2026-09-15", None, None, None, None),

    (17, "TSK-T-004", 12, 3,   10, "Cantilever realignment",
      "TRD", "CORRECTIVE", "LANE_B1", "MEDIUM", "CLASSIFIED",
      150, 120, 190, 0.20,
      "OHE-TWR-01", "GANG-T01", 1, 1, 1, 1, 1, 0,
      "2026-09-12", "2026-09-08 01:30:00", None, None, None),

    (18, "TSK-T-005", 21, 1, None, "OHE jumper wire and dropper replacement",
      "TRD", "PREVENTIVE", "LANE_B1", "LOW", "OPEN",
      60, 50, 80, 0.08,
      None, "GANG-T01", 0, 1, 0, 1, 1, 1,
      "2026-09-18", None, None, None, None),

    # ── S&T  (4 tasks) ──────────────────────────────────────
    (19, "TSK-S-001", 15, 2,    4, "Point machine overhaul and detection test",
      "S&T", "CORRECTIVE", "LANE_A", "CRITICAL", "OPEN",
      120, 100, 160, 0.22,
      None, "GANG-P02", 1, 1, 1, 0, 1, 1,
      "2026-09-06", "2026-09-05 22:00:00", None, None, None),

    (20, "TSK-S-002", 14, 2,    7, "Signal lamp replacement — LED unit",
      "S&T", "CORRECTIVE", "LANE_B1", "LOW", "CLASSIFIED",
      30, 25, 40, 0.05,
      None, "GANG-P02", 1, 1, 1, 0, 1, 1,
      "2026-09-12", None, None, None, None),

    (21, "TSK-S-003", 25, 1,    9, "Point machine motor replacement",
      "S&T", "CORRECTIVE", "LANE_A", "CRITICAL", "OPEN",
      150, 120, 200, 0.28,
      None, "GANG-P01", 1, 1, 1, 0, 1, 1,
      "2026-09-06", "2026-09-05 20:00:00", None, None, None),

    (22, "TSK-S-004", 16, 3, None, "Distant signal statutory annual testing",
      "S&T", "STATUTORY", "LANE_B2", "HIGH", "READY",
      60, 50, 75, 0.10,
      None, "GANG-P03", 1, 1, 1, 0, 1, 1,
      "2026-09-10", "2026-09-07 02:00:00", None, None, None),
]

for t in tasks_data:
    (tid, code, aid, bsid, did, desc, dept,
     ttype, lane, prio, st,
     est, p50, p90, oprob,
     rmach, rgang, mat, mach, gang, power, site, weather,
     dl, pref, tsr_spd, tsr_days, tsr_cost) = t
    did_sql  = "NULL" if did is None else str(did)
    rmach_sql = q(rmach)
    rgang_sql = q(rgang)
    dl_sql = q(dl)
    pref_sql = q(pref)
    tsr_spd_sql = "NULL" if tsr_spd is None else str(tsr_spd)
    tsr_days_sql = "NULL" if tsr_days is None else str(tsr_days)
    tsr_cost_sql = "NULL" if tsr_cost is None else str(tsr_cost)
    emit(f"INSERT INTO tasks (id, task_code, asset_id, block_section_id, defect_id, description, department, "
         f"task_type, lane, priority, status, "
         f"estimated_duration_minutes, p50_duration_minutes, p90_duration_minutes, overrun_probability, "
         f"required_machine, required_gang, material_ready, machine_ready, gang_ready, power_permit_ready, site_ready, weather_suitable, "
         f"deadline, preferred_start_time, post_work_tsr_speed_kmph, post_work_tsr_days, post_work_tsr_cost, "
         f"created_at, updated_at) "
         f"VALUES ({tid}, {q(code)}, {aid}, {bsid}, {did_sql}, {q(desc)}, {q(dept)}, "
         f"{q(ttype)}, {q(lane)}, {q(prio)}, {q(st)}, "
         f"{est}, {p50}, {p90}, {oprob}, "
         f"{rmach_sql}, {rgang_sql}, {mat}, {mach}, {gang}, {power}, {site}, {weather}, "
         f"{dl_sql}, {pref_sql}, {tsr_spd_sql}, {tsr_days_sql}, {tsr_cost_sql}, "
         f"{q(NOW)}, {q(NOW)});")

# ────────────────────────────────────────────────────────────
# 7. RESOURCES  (ids 1-6)
# ────────────────────────────────────────────────────────────
emit("")
emit("-- 7. RESOURCES")

resources_data = [
    (1, "TAMP-01",    "09-DX Tamping Machine",           "MACHINE",    "ENGINEERING", 1, "AVAILABLE",     "Universal tamping machine for track geometry correction"),
    (2, "OHE-TWR-01", "OHE Tower Car",                   "OHE_TOWER",  "TRD",         1, "AVAILABLE",     "Self-propelled OHE maintenance tower car"),
    (3, "GANG-P01",   "P-Way Gang — NDLS Section",       "GANG",       "ENGINEERING", 8, "AVAILABLE",     "Permanent-way maintenance gang — 8 members"),
    (4, "GANG-P02",   "P-Way Gang — GZB Section",        "GANG",       "ENGINEERING", 8, "AVAILABLE",     "Permanent-way maintenance gang — 8 members"),
    (5, "GANG-P03",   "P-Way Gang — HPJN Section",       "GANG",       "ENGINEERING", 6, "AVAILABLE",     "Permanent-way maintenance gang — 6 members"),
    (6, "GANG-T01",   "TRD Gang — OHE Maintenance",      "GANG",       "TRD",         6, "PARTIALLY_AVAILABLE", "TRD OHE maintenance gang — 6 members"),
]
for r in resources_data:
    rid, code, name, rtype, dept, cap, avail, desc = r
    emit(f"INSERT INTO resources (id, resource_code, resource_name, resource_type, department, "
         f"capacity, availability_status, description, created_at, updated_at) "
         f"VALUES ({rid}, {q(code)}, {q(name)}, {q(rtype)}, {q(dept)}, "
         f"{cap}, {q(avail)}, {q(desc)}, {q(NOW)}, {q(NOW)});")

# ────────────────────────────────────────────────────────────
# 8. TRAIN PATHS  (~96/day × 7 days  ≈  672 rows)
# ────────────────────────────────────────────────────────────
emit("")
emit("-- 8. TRAIN PATHS  (~96 trains/day × 7 days)")

train_templates = [
    # (train_number, train_name, train_type, direction, hour_start_base, duration_minutes, priority)
    # Rajdhani / Shatabdi — high priority
    ("12001", "Bhopal Shatabdi",       "SHATABDI",  "DN", 6, 12, 10),
    ("12002", "Bhopal Shatabdi",       "SHATABDI",  "UP", 21, 12, 10),
    ("12951", "Mumbai Rajdhani",       "RAJDHANI",  "DN", 16, 14, 10),
    ("12952", "Mumbai Rajdhani",       "RAJDHANI",  "UP", 8, 14, 10),
    ("12309", "Rajdhani Express",      "RAJDHANI",  "DN", 17, 15, 10),
    ("12310", "Rajdhani Express",      "RAJDHANI",  "UP", 10, 15, 10),

    # Superfast mail/express — medium-high priority
    ("12137", "Punjab Mail",           "SUPERFAST", "DN", 21, 18, 8),
    ("12138", "Punjab Mail",           "SUPERFAST", "UP", 5, 18, 8),
    ("12903", "Golden Temple Mail",    "SUPERFAST", "DN", 22, 16, 8),
    ("12904", "Golden Temple Mail",    "SUPERFAST", "UP", 7, 16, 8),
    ("14041", "Mussoorie Express",     "EXPRESS",   "DN", 22, 20, 6),
    ("14042", "Mussoorie Express",     "EXPRESS",   "UP", 4, 20, 6),

    # Regular express — medium priority
    ("14651", "Amritsar Express",      "EXPRESS",   "DN", 15, 22, 5),
    ("14652", "Amritsar Express",      "EXPRESS",   "UP", 6, 22, 5),
    ("12491", "Moradabad Express",     "EXPRESS",   "DN", 7, 25, 5),
    ("12492", "Moradabad Express",     "EXPRESS",   "UP", 18, 25, 5),
    ("14523", "Bareilly Express",      "EXPRESS",   "DN", 13, 20, 5),
    ("14524", "Bareilly Express",      "EXPRESS",   "UP", 3, 20, 5),
    ("15011", "Lucknow Express",       "EXPRESS",   "DN", 23, 22, 5),
    ("15012", "Lucknow Express",       "EXPRESS",   "UP", 2, 22, 5),
    ("12035", "Sharamjeevi Express",   "EXPRESS",   "DN", 14, 18, 5),
    ("12036", "Sharamjeevi Express",   "EXPRESS",   "UP", 9, 18, 5),

    # Passenger/local — low priority
    ("64151", "GZB MEMU Local",        "MEMU",      "DN", 8, 25, 3),
    ("64152", "GZB MEMU Local",        "MEMU",      "UP", 10, 25, 3),
    ("64153", "Hapur MEMU",            "MEMU",      "DN", 12, 30, 3),
    ("64154", "Hapur MEMU",            "MEMU",      "UP", 14, 30, 3),
    ("64155", "MB MEMU",               "MEMU",      "DN", 16, 35, 3),
    ("64156", "MB MEMU",               "MEMU",      "UP", 18, 35, 3),
    ("54471", "Passenger Slow",        "PASSENGER", "DN", 5, 40, 2),
    ("54472", "Passenger Slow",        "PASSENGER", "UP", 11, 40, 2),

    # Freight — low priority
    ("FGZB1", "Freight (Container)",   "FREIGHT",   "DN", 1, 30, 2),
    ("FGZB2", "Freight (Container)",   "FREIGHT",   "UP", 3, 30, 2),
    ("FHPJ1", "Freight (Bulk)",        "FREIGHT",   "DN", 0, 35, 1),
    ("FHPJ2", "Freight (Bulk)",        "FREIGHT",   "UP", 23, 35, 1),
]

tp_id = 0
for day_offset in range(HORIZON_DAYS):
    current_date = HORIZON_START + datetime.timedelta(days=day_offset)
    for tn, tname, ttype, direction, hour_base, dur_total, prio in train_templates:
        # Each train crosses all 3 sections sequentially
        section_dur = dur_total / 3.0  # minutes per section
        section_order = [1, 2, 3] if direction == "DN" else [3, 2, 1]
        for idx, sec_id in enumerate(section_order):
            tp_id += 1
            jitter = random.randint(-2, 2)  # ± 2 min randomness
            start_dt = datetime.datetime.combine(current_date, datetime.time(hour_base, 0)) + datetime.timedelta(minutes=idx * section_dur + jitter)
            end_dt = start_dt + datetime.timedelta(minutes=section_dur)
            emit(f"INSERT INTO train_paths (id, train_number, train_name, train_type, block_section_id, "
                 f"direction, scheduled_start, scheduled_end, priority, is_simulated, created_at) "
                 f"VALUES ({tp_id}, {q(tn)}, {q(tname)}, {q(ttype)}, {sec_id}, "
                 f"{q(direction)}, {q(ts(start_dt))}, {q(ts(end_dt))}, {prio}, 1, {q(NOW)});")

# ────────────────────────────────────────────────────────────
# 9. BLOCK WINDOWS  (7-day horizon, 15-min slots)
# ────────────────────────────────────────────────────────────
emit("")
emit("-- 9. BLOCK WINDOWS")

bw_id = 0
block_window_configs = [
    # section_id, start_hour, duration_hours, window_type
    # Night maintenance windows — each section gets a nightly window
    (1, 1, 3, "PLANNED"),     # 01:00 – 04:00
    (2, 1, 3, "PLANNED"),     # 01:00 – 04:00
    (3, 2, 3, "PLANNED"),     # 02:00 – 05:00
    # Additional daytime windows on some days
    (1, 10, 2, "MAINTENANCE"),  # 10:00 – 12:00
    (2, 11, 2, "MAINTENANCE"),  # 11:00 – 13:00
]

for day_offset in range(HORIZON_DAYS):
    current_date = HORIZON_START + datetime.timedelta(days=day_offset)
    for sec_id, start_h, dur_h, wtype in block_window_configs:
        bw_id += 1
        ws = datetime.datetime.combine(current_date, datetime.time(start_h, 0))
        we = ws + datetime.timedelta(hours=dur_h)
        dur_min = dur_h * 60
        conflicts = random.randint(0, 3)
        avail = "AVAILABLE" if conflicts <= 1 else "PARTIALLY_AVAILABLE"
        emit(f"INSERT INTO block_windows (id, block_section_id, window_start, window_end, "
             f"duration_minutes, window_type, availability_status, conflict_count, created_at) "
             f"VALUES ({bw_id}, {sec_id}, {q(ts(ws))}, {q(ts(we))}, "
             f"{dur_min}, {q(wtype)}, {q(avail)}, {conflicts}, {q(NOW)});")

# Emergency window on day 0 for LANE_A tasks
bw_id += 1
ew_start = datetime.datetime(2026, 9, 5, 10, 0, 0)
ew_end   = datetime.datetime(2026, 9, 5, 14, 0, 0)
emit(f"INSERT INTO block_windows (id, block_section_id, window_start, window_end, "
     f"duration_minutes, window_type, availability_status, conflict_count, created_at) "
     f"VALUES ({bw_id}, 1, {q(ts(ew_start))}, {q(ts(ew_end))}, 240, 'EMERGENCY', 'AVAILABLE', 0, {q(NOW)});")

bw_id += 1
ew_start2 = datetime.datetime(2026, 9, 5, 20, 0, 0)
ew_end2   = datetime.datetime(2026, 9, 6, 0, 0, 0)
emit(f"INSERT INTO block_windows (id, block_section_id, window_start, window_end, "
     f"duration_minutes, window_type, availability_status, conflict_count, created_at) "
     f"VALUES ({bw_id}, 2, {q(ts(ew_start2))}, {q(ts(ew_end2))}, 240, 'EMERGENCY', 'AVAILABLE', 0, {q(NOW)});")

# ────────────────────────────────────────────────────────────
# 10. BLOCK PLANS  (ids 1-2)
# ────────────────────────────────────────────────────────────
emit("")
emit("-- 10. BLOCK PLANS")

emit(f"INSERT INTO block_plans (id, plan_code, plan_type, status, horizon_start, horizon_end, "
     f"objective_value, estimated_train_impact_minutes, estimated_overrun_cost, estimated_tsr_cost, "
     f"estimated_failure_risk_cost, estimated_late_completion_cost, total_estimated_cost, "
     f"solver_status, generation_notes, created_by, created_at, updated_at) "
     f"VALUES (1, 'PLAN-B-20260905-001', 'PLAN_B', 'DRAFT', '2026-09-05', '2026-09-12', "
     f"NULL, NULL, NULL, NULL, NULL, NULL, NULL, "
     f"NULL, 'Awaiting optimization engine — prototype draft', 2, {q(NOW)}, {q(NOW)});")

emit(f"INSERT INTO block_plans (id, plan_code, plan_type, status, horizon_start, horizon_end, "
     f"objective_value, estimated_train_impact_minutes, estimated_overrun_cost, estimated_tsr_cost, "
     f"estimated_failure_risk_cost, estimated_late_completion_cost, total_estimated_cost, "
     f"solver_status, generation_notes, created_by, created_at, updated_at) "
     f"VALUES (2, 'PLAN-A-20260905-001', 'PLAN_A', 'DRAFT', '2026-09-05', '2026-09-12', "
     f"NULL, NULL, NULL, NULL, NULL, NULL, NULL, "
     f"NULL, 'Emergency plan — prototype draft', 2, {q(NOW)}, {q(NOW)});")

# ────────────────────────────────────────────────────────────
# 11. PLANNED TASKS  (ids 1-4, sample allocations)
# ────────────────────────────────────────────────────────────
emit("")
emit("-- 11. PLANNED TASKS  (sample allocations)")

planned_tasks_data = [
    # Emergency tasks assigned to emergency windows
    (1, 2, 1,  bw_id - 1, 3, "2026-09-05 10:00:00", "2026-09-05 12:00:00", 120, 1, "HIGH", 30.0, 45000.0,
     "Emergency rail replacement scheduled in NDLS section emergency block window"),
    (2, 2, 2,  bw_id - 1, 3, "2026-09-05 12:15:00", "2026-09-05 13:45:00", 90,  2, "HIGH", 20.0, 30000.0,
     "Emergency fish plate replacement follows rail replacement in same block"),
    # Statutory task in first available night window (section 3, day 1)
    (3, 1, 7,  3, 5, "2026-09-05 02:00:00", "2026-09-05 03:30:00", 90, 1, "HIGH", 8.0, None,
     "Statutory SEJ inspection in HPJN-MB night block"),
    # S&T emergency in section 2 evening emergency window
    (4, 2, 19, bw_id, 4, "2026-09-05 20:00:00", "2026-09-05 22:00:00", 120, 1, "HIGH", 15.0, None,
     "Point machine overhaul — safety-critical in GZB section"),
]
for pt in planned_tasks_data:
    ptid, planid, taskid, bwid, resid, ps, pe, dur, seq, rl, impact, cost, expl = pt
    cost_sql = "NULL" if cost is None else str(cost)
    emit(f"INSERT INTO planned_tasks (id, plan_id, task_id, block_window_id, assigned_resource_id, "
         f"planned_start, planned_end, planned_duration_minutes, sequence_order, readiness_level, "
         f"estimated_train_impact_minutes, estimated_cost, explanation, created_at) "
         f"VALUES ({ptid}, {planid}, {taskid}, {bwid}, {resid}, "
         f"{q(ps)}, {q(pe)}, {dur}, {seq}, {q(rl)}, "
         f"{impact}, {cost_sql}, {q(expl)}, {q(NOW)});")

# ────────────────────────────────────────────────────────────
# 12. BLOCK EVENTS  (ids 1-6)
# ────────────────────────────────────────────────────────────
emit("")
emit("-- 12. BLOCK EVENTS")

events_data = [
    (1, 2, 1,  "ACKNOWLEDGED",  "2026-09-05 09:45:00", "Anil Verma",  "Emergency block acknowledged by supervisor"),
    (2, 2, 1,  "BLOCK_OPENED",  "2026-09-05 10:00:00", "Control Room","Block opened for NDLS section — emergency"),
    (3, 2, 1,  "STARTED",       "2026-09-05 10:05:00", "Sunil Yadav", "Rail replacement work commenced"),
    (4, 2, 19, "ACKNOWLEDGED",  "2026-09-05 19:50:00", "Anil Verma",  "Point machine overhaul block acknowledged"),
    (5, 2, 19, "BLOCK_OPENED",  "2026-09-05 20:00:00", "Control Room","Block opened for GZB section — S&T emergency"),
    (6, 1, 7,  "ACKNOWLEDGED",  "2026-09-05 01:55:00", "Anil Verma",  "Night block acknowledged — statutory SEJ inspection"),
]
for ev in events_data:
    evid, planid, taskid, etype, etime, performer, remarks = ev
    emit(f"INSERT INTO block_events (id, plan_id, task_id, event_type, event_time, performed_by, remarks, created_at) "
         f"VALUES ({evid}, {planid}, {taskid}, {q(etype)}, {q(etime)}, {q(performer)}, {q(remarks)}, {q(NOW)});")

# ────────────────────────────────────────────────────────────
# 13. NOTIFICATIONS  (ids 1-6)
# ────────────────────────────────────────────────────────────
emit("")
emit("-- 13. NOTIFICATIONS")

notifs = [
    (1, 3, 1,  2, "EMERGENCY",    "Emergency Block Required",            "Weld crack detected on NDLS section — emergency rail replacement required",       "CRITICAL", 0),
    (2, 4, 1,  2, "TASK_ASSIGNED", "Task Assigned — Rail Replacement",   "You have been assigned emergency rail replacement task TSK-E-001",                "HIGH",     0),
    (3, 2, None, 1, "PLAN_GENERATED", "Plan B Draft Created",            "Block plan PLAN-B-20260905-001 has been created for 7-day horizon",                "INFO",     1),
    (4, 3, 19, 2, "EMERGENCY",    "S&T Emergency — Point Machine",       "Point machine PM-GZB-001 requires immediate overhaul — safety-critical defect",   "CRITICAL", 0),
    (5, 4, 19, 2, "TASK_ASSIGNED", "Task Assigned — PM Overhaul",        "You have been assigned point machine overhaul task TSK-S-001",                     "HIGH",     0),
    (6, 1, 21, None, "EMERGENCY",  "S&T Emergency — PM Motor",           "Point machine PM-NDLS-001 motor overheating — replacement required",              "CRITICAL", 0),
]
for n in notifs:
    nid, uid, taskid, planid, ntype, title, msg, sev, read = n
    tid_sql = "NULL" if taskid is None else str(taskid)
    pid_sql = "NULL" if planid is None else str(planid)
    emit(f"INSERT INTO notifications (id, user_id, task_id, plan_id, notification_type, title, message, severity, is_read, created_at) "
         f"VALUES ({nid}, {uid}, {tid_sql}, {pid_sql}, {q(ntype)}, {q(title)}, {q(msg)}, {q(sev)}, {read}, {q(NOW)});")

# ────────────────────────────────────────────────────────────
# 14. AUDIT LOGS  (ids 1-4)
# ────────────────────────────────────────────────────────────
emit("")
emit("-- 14. AUDIT LOGS")

audits = [
    (1, 2, "block_plans", 1, "CREATE",
     None,
     json.dumps({"plan_code": "PLAN-B-20260905-001", "status": "DRAFT"}),
     "Initial plan creation for 7-day horizon"),
    (2, 2, "block_plans", 2, "CREATE",
     None,
     json.dumps({"plan_code": "PLAN-A-20260905-001", "status": "DRAFT"}),
     "Emergency plan creation"),
    (3, 3, "tasks", 1, "UPDATE",
     json.dumps({"status": "OPEN"}),
     json.dumps({"status": "OPEN"}),
     "Supervisor acknowledged emergency task"),
    (4, 3, "tasks", 19, "UPDATE",
     json.dumps({"status": "OPEN"}),
     json.dumps({"status": "OPEN"}),
     "Supervisor acknowledged S&T emergency task"),
]
for a in audits:
    aid, uid, etype, eid, action, old, new, reason = a
    old_sql = q(old)
    new_sql = q(new)
    emit(f"INSERT INTO audit_logs (id, user_id, entity_type, entity_id, action, old_value, new_value, reason, created_at) "
         f"VALUES ({aid}, {uid}, {q(etype)}, {eid}, {q(action)}, {old_sql}, {new_sql}, {q(reason)}, {q(NOW)});")

# ── Write output ─────────────────────────────────────────────
out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed.sql")
with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"[OK] seed.sql generated  ({len(lines)} SQL statements)  ->  {out_path}")
print(f"     Train paths:    {tp_id}")
print(f"     Block windows:  {bw_id}")
