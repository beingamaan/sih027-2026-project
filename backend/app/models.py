from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    department = Column(String, nullable=False)
    division = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class Station(Base):
    __tablename__ = "stations"
    id = Column(Integer, primary_key=True, index=True)
    station_code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    division = Column(String, nullable=False)
    chainage_km = Column(Float, nullable=False)

class BlockSection(Base):
    __tablename__ = "block_sections"
    id = Column(Integer, primary_key=True, index=True)
    section_code = Column(String, unique=True, nullable=False)
    from_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    to_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    km_start = Column(Float, nullable=False)
    km_end = Column(Float, nullable=False)
    number_of_lines = Column(Integer, nullable=False)

class ElementarySection(Base):
    __tablename__ = "elementary_sections"
    id = Column(Integer, primary_key=True, index=True)
    block_section_id = Column(Integer, ForeignKey("block_sections.id"), nullable=False)
    section_code = Column(String, nullable=False)
    km_start = Column(Float, nullable=False)
    km_end = Column(Float, nullable=False)

class InterlockingArea(Base):
    __tablename__ = "interlocking_areas"
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    area_name = Column(String, nullable=False)

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    asset_code = Column(String, unique=True, nullable=False)
    asset_type = Column(String, nullable=False)
    department = Column(String, nullable=False)
    block_section_id = Column(Integer, ForeignKey("block_sections.id"))
    km = Column(Float)
    condition_score = Column(Float)
    last_maintenance_date = Column(DateTime)
    status = Column(String)

class Defect(Base):
    __tablename__ = "defects"
    id = Column(Integer, primary_key=True, index=True)
    defect_code = Column(String, unique=True, nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    severity = Column(String, nullable=False)
    detected_at = Column(DateTime, nullable=False)
    description = Column(String)
    tsr_active = Column(Integer, default=0)
    tsr_speed_kmph = Column(Float)
    tsr_start = Column(Float)
    tsr_end = Column(Float)
    protocol_reference = Column(String)
    lane = Column(String, nullable=False)
    status = Column(String, nullable=False)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String, unique=True, nullable=False)
    department = Column(String, nullable=False)
    work_type = Column(String, nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    block_section_id = Column(Integer, ForeignKey("block_sections.id"), nullable=False)
    elementary_section_id = Column(Integer, ForeignKey("elementary_sections.id"))
    interlocking_area_id = Column(Integer, ForeignKey("interlocking_areas.id"))
    km_from = Column(Float, nullable=False)
    km_to = Column(Float, nullable=False)
    lane = Column(String, nullable=False)
    safety_class = Column(String)
    priority_band = Column(String)
    priority_score = Column(Float)
    requires_line_block = Column(Integer, default=0)
    requires_power_block = Column(Integer, default=0)
    requires_disconnection = Column(Integer, default=0)
    required_block_type = Column(String)
    estimated_duration_minutes = Column(Integer, nullable=False)
    duration_buffer_minutes = Column(Integer, nullable=False)
    actual_duration_minutes = Column(Integer)
    required_machine_type = Column(String)
    required_gang_size = Column(Integer)
    material_ready = Column(Integer, default=0)
    ptw_ready = Column(Integer, default=0)
    power_ready = Column(Integer, default=0)
    disconnection_ready = Column(Integer, default=0)
    worksite_ready = Column(Integer, default=0)
    weather_suitable = Column(Integer, default=1)
    statutory_due_date = Column(DateTime)
    overdue_days = Column(Integer, default=0)
    post_work_tsr_speed_kmph = Column(Float)
    post_work_tsr_days = Column(Integer)
    post_work_tsr_cost = Column(Float)
    status = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True, index=True)
    resource_code = Column(String, unique=True, nullable=False)
    resource_type = Column(String, nullable=False)
    name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    home_location = Column(String)
    available_from = Column(DateTime)
    available_to = Column(DateTime)
    capacity = Column(Integer)
    status = Column(String, nullable=False)

class TrainPath(Base):
    __tablename__ = "train_paths"
    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String, nullable=False)
    train_class = Column(String, nullable=False)
    weight_category = Column(String)
    block_section_id = Column(Integer, ForeignKey("block_sections.id"), nullable=False)
    line = Column(String, nullable=False)
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    direction = Column(String, nullable=False)
    traffic_density_factor = Column(Float)

class BlockWindow(Base):
    __tablename__ = "block_windows"
    id = Column(Integer, primary_key=True, index=True)
    window_code = Column(String, unique=True, nullable=False)
    block_section_id = Column(Integer, ForeignKey("block_sections.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    line = Column(String, nullable=False)
    block_type = Column(String, nullable=False)
    valid = Column(Integer, default=1)
    calendar_restriction = Column(String)
    restriction_reason = Column(String)

class BlockPlan(Base):
    __tablename__ = "block_plans"
    id = Column(Integer, primary_key=True, index=True)
    plan_code = Column(String, unique=True, nullable=False)
    version = Column(Integer, nullable=False)
    plan_type = Column(String, nullable=False)
    horizon_start = Column(DateTime, nullable=False)
    horizon_end = Column(DateTime, nullable=False)
    total_cost = Column(Float)
    train_impact_cost = Column(Float)
    tsr_cost = Column(Float)
    failure_risk_cost = Column(Float)
    late_completion_cost = Column(Float)
    instability_cost = Column(Float)
    solver_status = Column(String, nullable=False)
    solver_time_seconds = Column(Float)
    approval_status = Column(String, nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    override_reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class PlannedTask(Base):
    __tablename__ = "planned_tasks"
    id = Column(Integer, primary_key=True, index=True)
    block_plan_id = Column(Integer, ForeignKey("block_plans.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    block_window_id = Column(Integer, ForeignKey("block_windows.id"), nullable=False)
    planned_start = Column(DateTime, nullable=False)
    planned_end = Column(DateTime, nullable=False)
    setup_minutes = Column(Integer)
    work_minutes = Column(Integer)
    clearance_minutes = Column(Integer)
    handback_minutes = Column(Integer)
    deferred = Column(Integer, default=0)
    defer_reason = Column(String)
    explanation = Column(String)

class BlockEvent(Base):
    __tablename__ = "block_events"
    id = Column(Integer, primary_key=True, index=True)
    block_plan_id = Column(Integer, ForeignKey("block_plans.id"), nullable=False)
    block_section_id = Column(Integer, ForeignKey("block_sections.id"), nullable=False)
    event_type = Column(String, nullable=False)
    event_time = Column(DateTime, nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    loss_code = Column(String)
    notes = Column(String)
    client_event_uuid = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    notification_code = Column(String, unique=True, nullable=False)
    block_plan_id = Column(Integer, ForeignKey("block_plans.id"))
    recipient_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    sent_at = Column(DateTime, nullable=False)
    acknowledged_at = Column(DateTime)
    status = Column(String, nullable=False)
    acknowledgement_channel = Column(String)
    plan_version = Column(Integer)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)
    division = Column(String, nullable=False)
    action = Column(String, nullable=False)
    plan_id = Column(Integer, ForeignKey("block_plans.id"), nullable=False)
    plan_version = Column(Integer, nullable=False)
    reason_code = Column(String)
    reason_text = Column(String)
    input_snapshot_reference = Column(String)
    rules_version = Column(String)
    cost_breakdown_json = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
