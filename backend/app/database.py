import os
import sqlite3
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def apply_migrations():
    """
    Safely migrates existing SQLite tables to support the 3 separate state machines
    and new blueprint columns without dropping or modifying existing seeded data rows.
    """
    with engine.connect() as conn:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        # 1. TASKS TABLE MIGRATIONS
        if "tasks" in existing_tables:
            task_cols = [c["name"] for c in inspector.get_columns("tasks")]
            if "readiness_score" not in task_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN readiness_score REAL DEFAULT 100.0"))
            if "assigned_to" not in task_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN assigned_to TEXT"))
            if "post_work_tsr_speed_kmph" not in task_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN post_work_tsr_speed_kmph REAL DEFAULT 0.0"))
            if "post_work_tsr_days" not in task_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN post_work_tsr_days INTEGER DEFAULT 0"))
            if "division_id" not in task_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN division_id TEXT DEFAULT 'DLI'"))
            if "team_id" not in task_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN team_id INTEGER DEFAULT 101"))
            if "deferral_forbidden" not in task_cols:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN deferral_forbidden INTEGER DEFAULT 0"))

            # Normalize legacy task values to blueprint enums
            conn.execute(text("UPDATE tasks SET department = 'ENG' WHERE department IN ('ENGINEERING', 'PWAY', 'P_WAY')"))
            conn.execute(text("UPDATE tasks SET department = 'SNT' WHERE department IN ('S_AND_T', 'ST', 'S&T')"))
            conn.execute(text("UPDATE tasks SET lane = 'LANE_A' WHERE lane IN ('A_EMERGENCY', 'EMERGENCY')"))
            conn.execute(text("UPDATE tasks SET lane = 'LANE_B1' WHERE lane IN ('B1_PLANNED', 'PLANNED')"))
            conn.execute(text("UPDATE tasks SET lane = 'LANE_B2' WHERE lane IN ('B2_STATUTORY', 'STATUTORY')"))
            conn.execute(text("UPDATE tasks SET status = 'ELIGIBLE' WHERE status IN ('PENDING', 'OPEN')"))
            conn.execute(text("UPDATE tasks SET status = 'EXECUTED' WHERE status IN ('WORK_COMPLETED', 'LINE_HANDED_BACK')"))
            conn.execute(text("UPDATE tasks SET readiness_score = 100.0 WHERE readiness_score IS NULL"))
            conn.execute(text("UPDATE tasks SET division_id = 'DLI' WHERE division_id IS NULL"))
            conn.execute(text("UPDATE tasks SET team_id = 101 WHERE team_id IS NULL OR department = 'ENG'"))
            conn.execute(text("UPDATE tasks SET team_id = 102 WHERE department = 'TRD'"))
            conn.execute(text("UPDATE tasks SET team_id = 103 WHERE department = 'SNT'"))
            conn.execute(text("UPDATE tasks SET assigned_to = 'INSPECTOR_01' WHERE id IN (1, 2)"))

        # 2. BLOCK_PLANS TABLE MIGRATIONS
        if "block_plans" in existing_tables:
            plan_cols = [c["name"] for c in inspector.get_columns("block_plans")]
            if "plan_version" not in plan_cols:
                conn.execute(text("ALTER TABLE block_plans ADD COLUMN plan_version INTEGER DEFAULT 1"))
            if "version_count" not in plan_cols:
                conn.execute(text("ALTER TABLE block_plans ADD COLUMN version_count INTEGER DEFAULT 1"))
            if "superseded_by_id" not in plan_cols:
                conn.execute(text("ALTER TABLE block_plans ADD COLUMN superseded_by_id INTEGER REFERENCES block_plans(id)"))
            if "status" not in plan_cols:
                conn.execute(text("ALTER TABLE block_plans ADD COLUMN status TEXT DEFAULT 'PENDING_APPROVAL'"))
            if "p50_duration_minutes" not in plan_cols:
                conn.execute(text("ALTER TABLE block_plans ADD COLUMN p50_duration_minutes REAL DEFAULT 120.0"))
            if "p90_duration_minutes" not in plan_cols:
                conn.execute(text("ALTER TABLE block_plans ADD COLUMN p90_duration_minutes REAL DEFAULT 180.0"))
            if "regulation_cost_wtm" not in plan_cols:
                conn.execute(text("ALTER TABLE block_plans ADD COLUMN regulation_cost_wtm REAL DEFAULT 0.0"))
            if "stability_index" not in plan_cols:
                conn.execute(text("ALTER TABLE block_plans ADD COLUMN stability_index REAL DEFAULT 85.0"))

            # Normalize legacy block plan values
            conn.execute(text("UPDATE block_plans SET plan_version = COALESCE(version, 1) WHERE plan_version IS NULL"))
            conn.execute(text("UPDATE block_plans SET version_count = 1 WHERE version_count IS NULL"))
            conn.execute(text("UPDATE block_plans SET status = 'PENDING_APPROVAL' WHERE status IS NULL OR status = 'PENDING'"))
            conn.execute(text("UPDATE block_plans SET p50_duration_minutes = 120.0 WHERE p50_duration_minutes IS NULL"))
            conn.execute(text("UPDATE block_plans SET p90_duration_minutes = 180.0 WHERE p90_duration_minutes IS NULL"))
            conn.execute(text("UPDATE block_plans SET regulation_cost_wtm = COALESCE(total_cost, 0.0) WHERE regulation_cost_wtm IS NULL OR regulation_cost_wtm = 0.0"))
            conn.execute(text("UPDATE block_plans SET stability_index = 85.0 WHERE stability_index IS NULL"))

        # 3. AUDIT_LOGS TABLE MIGRATIONS
        if "audit_logs" in existing_tables:
            audit_cols = [c["name"] for c in inspector.get_columns("audit_logs")]
            if "actor_role" not in audit_cols:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN actor_role TEXT"))
            if "division_id" not in audit_cols:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN division_id TEXT DEFAULT 'DLI'"))
            if "entity_type" not in audit_cols:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN entity_type TEXT DEFAULT 'BLOCK_PLAN'"))
            if "entity_id" not in audit_cols:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN entity_id TEXT DEFAULT '1'"))
            if "before_json" not in audit_cols:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN before_json TEXT"))
            if "after_json" not in audit_cols:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN after_json TEXT"))
            if "timestamp" not in audit_cols:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN timestamp DATETIME"))

            # Populate new columns from existing legacy records
            conn.execute(text("UPDATE audit_logs SET actor_role = COALESCE(role, 'OPERATOR') WHERE actor_role IS NULL"))
            conn.execute(text("UPDATE audit_logs SET division_id = COALESCE(division, 'DLI') WHERE division_id IS NULL"))
            conn.execute(text("UPDATE audit_logs SET entity_type = 'BLOCK_PLAN' WHERE entity_type IS NULL"))
            conn.execute(text("UPDATE audit_logs SET entity_id = CAST(COALESCE(plan_id, 1) AS TEXT) WHERE entity_id IS NULL"))
            conn.execute(text("UPDATE audit_logs SET timestamp = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE timestamp IS NULL"))

        # 4. USERS TABLE MIGRATIONS
        if "users" in existing_tables:
            user_cols = [c["name"] for c in inspector.get_columns("users")]
            if "service_id" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN service_id TEXT"))
            if "designation" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN designation TEXT DEFAULT 'Railway Official'"))
            if "division_id" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN division_id TEXT DEFAULT 'DLI'"))
            if "section_ids" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN section_ids TEXT DEFAULT '[1, 2, 3]'"))
            if "team_id" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN team_id INTEGER"))
            if "station_id" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN station_id INTEGER"))
            if "is_active" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1"))

            # Sync existing service_id with employee_id if null
            conn.execute(text("UPDATE users SET service_id = employee_id WHERE service_id IS NULL AND employee_id IS NOT NULL"))
            conn.execute(text("UPDATE users SET employee_id = service_id WHERE employee_id IS NULL AND service_id IS NOT NULL"))
            conn.execute(text("UPDATE users SET division_id = COALESCE(division, 'DLI') WHERE division_id IS NULL"))
            conn.execute(text("UPDATE users SET is_active = COALESCE(active, 1) WHERE is_active IS NULL"))

        # 4. STATIONS TABLE MIGRATIONS
        if "stations" in existing_tables:
            stn_cols = [c["name"] for c in inspector.get_columns("stations")]
            if "code" not in stn_cols:
                conn.execute(text("ALTER TABLE stations ADD COLUMN code TEXT"))
                conn.execute(text("UPDATE stations SET code = station_code WHERE code IS NULL"))

        conn.commit()


def init_db():
    """
    Initializes database schema, creates any missing tables (e.g. field_events, security_audit_logs),
    runs incremental non-destructive migrations, and seeds official users.
    """
    # Import all models to ensure metadata registration before create_all
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    apply_migrations()
    
    # Auto-seed official railway user profiles
    try:
        from app.seeds.seed_users import seed_official_users
        with SessionLocal() as db:
            seed_official_users(db)
    except Exception as e:
        print(f"[seed_users warning]: {e}")

    # Auto-seed pristine demo tasks, blocks, and event sourcing log
    try:
        from app.seeds.seed_demo_data import seed_pristine_demo_data
        with SessionLocal() as db:
            seed_pristine_demo_data(db)
    except Exception as e:
        print(f"[seed_demo_data warning]: {e}")

    # Auto-seed 24-hour corridor timetable and stations
    try:
        from app.data.seeds.train_schedule import seed_corridor_stations_and_schedules
        with SessionLocal() as db:
            seed_corridor_stations_and_schedules(db)
    except Exception as e:
        print(f"[seed_train_schedule warning]: {e}")


# Auto-initialize on module load
try:
    init_db()
except Exception as e:
    # Log warning if DB file is temporarily locked or in read-only environment
    print(f"[init_db warning]: {e}")
