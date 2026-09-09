PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    division TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    division TEXT NOT NULL,
    chainage_km REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS block_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_code TEXT NOT NULL UNIQUE,
    from_station_id INTEGER NOT NULL,
    to_station_id INTEGER NOT NULL,
    km_start REAL NOT NULL,
    km_end REAL NOT NULL,
    number_of_lines INTEGER NOT NULL,
    FOREIGN KEY (from_station_id) REFERENCES stations(id),
    FOREIGN KEY (to_station_id) REFERENCES stations(id)
);

CREATE TABLE IF NOT EXISTS physical_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_section_id INTEGER NOT NULL,
    line_code TEXT NOT NULL,
    line_name TEXT NOT NULL,
    line_type TEXT NOT NULL,
    electrified INTEGER DEFAULT 1,
    speed_limit_kmph REAL DEFAULT 110.0,
    FOREIGN KEY (block_section_id) REFERENCES block_sections(id)
);

CREATE TABLE IF NOT EXISTS elementary_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_section_id INTEGER NOT NULL,
    section_code TEXT NOT NULL,
    km_start REAL NOT NULL,
    km_end REAL NOT NULL,
    track_line TEXT DEFAULT 'UP',
    FOREIGN KEY (block_section_id) REFERENCES block_sections(id)
);

CREATE TABLE IF NOT EXISTS interlocking_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    area_name TEXT NOT NULL,
    gear_count INTEGER DEFAULT 10,
    FOREIGN KEY (station_id) REFERENCES stations(id)
);

CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_code TEXT NOT NULL UNIQUE,
    asset_type TEXT NOT NULL,
    department TEXT NOT NULL,
    block_section_id INTEGER,
    km REAL,
    condition_score REAL,
    last_maintenance_date DATETIME,
    status TEXT,
    FOREIGN KEY (block_section_id) REFERENCES block_sections(id)
);

CREATE TABLE IF NOT EXISTS defects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    defect_code TEXT NOT NULL UNIQUE,
    asset_id INTEGER NOT NULL,
    severity TEXT NOT NULL,
    detected_at DATETIME NOT NULL,
    description TEXT,
    tsr_active INTEGER DEFAULT 0,
    tsr_speed_kmph REAL,
    tsr_start REAL,
    tsr_end REAL,
    protocol_reference TEXT,
    lane TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_code TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    work_type TEXT NOT NULL,
    asset_id INTEGER,
    block_section_id INTEGER NOT NULL,
    elementary_section_id INTEGER,
    interlocking_area_id INTEGER,
    km_from REAL NOT NULL,
    km_to REAL NOT NULL,
    lane TEXT NOT NULL,
    safety_class TEXT,
    priority_band TEXT,
    priority_score REAL,
    requires_line_block INTEGER DEFAULT 0,
    requires_power_block INTEGER DEFAULT 0,
    requires_disconnection INTEGER DEFAULT 0,
    required_block_type TEXT,
    estimated_duration_minutes INTEGER NOT NULL,
    duration_buffer_minutes INTEGER NOT NULL,
    actual_duration_minutes INTEGER,
    required_machine_type TEXT,
    required_gang_size INTEGER,
    material_ready INTEGER DEFAULT 0,
    ptw_ready INTEGER DEFAULT 0,
    power_ready INTEGER DEFAULT 0,
    disconnection_ready INTEGER DEFAULT 0,
    worksite_ready INTEGER DEFAULT 0,
    weather_suitable INTEGER DEFAULT 1,
    statutory_due_date DATETIME,
    overdue_days INTEGER DEFAULT 0,
    post_work_tsr_speed_kmph REAL,
    post_work_tsr_days INTEGER,
    post_work_tsr_cost REAL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (block_section_id) REFERENCES block_sections(id),
    FOREIGN KEY (elementary_section_id) REFERENCES elementary_sections(id),
    FOREIGN KEY (interlocking_area_id) REFERENCES interlocking_areas(id)
);

CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_code TEXT NOT NULL UNIQUE,
    resource_type TEXT NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    home_location TEXT,
    available_from DATETIME,
    available_to DATETIME,
    capacity INTEGER,
    status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS train_paths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_number TEXT NOT NULL,
    train_class TEXT NOT NULL,
    weight_category TEXT,
    block_section_id INTEGER NOT NULL,
    line TEXT NOT NULL,
    scheduled_start DATETIME NOT NULL,
    scheduled_end DATETIME NOT NULL,
    start_km REAL NOT NULL,
    end_km REAL NOT NULL,
    direction TEXT NOT NULL,
    traffic_density_factor REAL DEFAULT 1.0,
    priority_weight REAL DEFAULT 1.0,
    FOREIGN KEY (block_section_id) REFERENCES block_sections(id)
);

CREATE TABLE IF NOT EXISTS block_windows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    window_code TEXT NOT NULL UNIQUE,
    block_section_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    line TEXT NOT NULL,
    block_type TEXT NOT NULL,
    valid INTEGER DEFAULT 1,
    calendar_restriction TEXT,
    restriction_reason TEXT,
    FOREIGN KEY (block_section_id) REFERENCES block_sections(id)
);

CREATE TABLE IF NOT EXISTS block_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_code TEXT NOT NULL UNIQUE,
    version INTEGER NOT NULL,
    plan_type TEXT NOT NULL,
    horizon_start DATETIME NOT NULL,
    horizon_end DATETIME NOT NULL,
    total_cost REAL,
    train_impact_cost REAL,
    tsr_cost REAL,
    failure_risk_cost REAL,
    late_completion_cost REAL,
    instability_cost REAL,
    solver_status TEXT NOT NULL,
    solver_time_seconds REAL,
    approval_status TEXT NOT NULL,
    approved_by INTEGER,
    approved_at DATETIME,
    override_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS planned_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_plan_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    block_window_id INTEGER NOT NULL,
    assigned_resource_id INTEGER,
    planned_start DATETIME NOT NULL,
    planned_end DATETIME NOT NULL,
    setup_minutes INTEGER DEFAULT 15,
    work_minutes INTEGER DEFAULT 60,
    clearance_minutes INTEGER DEFAULT 20,
    handback_minutes INTEGER DEFAULT 10,
    deferred INTEGER DEFAULT 0,
    defer_reason TEXT,
    explanation TEXT,
    readiness_score REAL DEFAULT 100.0,
    FOREIGN KEY (block_plan_id) REFERENCES block_plans(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (block_window_id) REFERENCES block_windows(id),
    FOREIGN KEY (assigned_resource_id) REFERENCES resources(id)
);

CREATE TABLE IF NOT EXISTS block_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    block_plan_id INTEGER,
    block_section_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    event_time DATETIME NOT NULL,
    actor_id INTEGER DEFAULT 1,
    loss_code TEXT,
    notes TEXT,
    client_event_uuid TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (block_plan_id) REFERENCES block_plans(id),
    FOREIGN KEY (block_section_id) REFERENCES block_sections(id),
    FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_code TEXT NOT NULL UNIQUE,
    block_plan_id INTEGER,
    recipient_user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    sent_at DATETIME NOT NULL,
    acknowledged_at DATETIME,
    status TEXT NOT NULL,
    acknowledgement_channel TEXT,
    plan_version INTEGER,
    FOREIGN KEY (block_plan_id) REFERENCES block_plans(id),
    FOREIGN KEY (recipient_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    division TEXT NOT NULL,
    action TEXT NOT NULL,
    plan_id INTEGER,
    plan_version INTEGER DEFAULT 1,
    reason_code TEXT,
    reason_text TEXT,
    input_snapshot_reference TEXT,
    rules_version TEXT DEFAULT 'v1.0-explainable-rules',
    cost_breakdown_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES users(id),
    FOREIGN KEY (plan_id) REFERENCES block_plans(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_lane ON tasks(lane);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_train_paths_time ON train_paths(scheduled_start, scheduled_end);
CREATE INDEX IF NOT EXISTS idx_block_events_task ON block_events(task_id);
