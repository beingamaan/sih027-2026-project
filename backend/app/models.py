import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, BigInteger, String, Float, ForeignKey, DateTime, Text, Boolean, JSON, Enum as SQLEnum, event
)
from sqlalchemy.orm import relationship
from app.database import Base

# ==============================================================================
# 1. CORE ENUMS & 3 SEPARATE STATE MACHINES (SIH26027 ARCHITECTURE BLUEPRINT)
# ==============================================================================

class TaskStatus(str, enum.Enum):
    """
    A. TASK STATE MACHINE:
    Lifecycle of maintenance tasks from defect reporting to handback & closure.
    """
    # Primary lifecycle
    REPORTED = "REPORTED"
    VERIFIED = "VERIFIED"
    ELIGIBLE = "ELIGIBLE"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    EXECUTED = "EXECUTED"
    CLOSED = "CLOSED"
    # Side states
    DEFERRED = "DEFERRED"
    LANE_A_MANUAL = "LANE_A_MANUAL"
    CANCELLED = "CANCELLED"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            val_upper = value.upper()
            aliases = {
                "PENDING": cls.ELIGIBLE,
                "OPEN": cls.REPORTED,
                "ACKNOWLEDGED": cls.VERIFIED,
                "READY": cls.ELIGIBLE,
                "WORK_STARTED": cls.EXECUTED,
                "WORK_COMPLETED": cls.EXECUTED,
                "LINE_HANDED_BACK": cls.CLOSED,
                "DONE": cls.CLOSED,
            }
            if val_upper in aliases:
                return aliases[val_upper]
        return super()._missing_(value)


class SafetyLane(str, enum.Enum):
    """
    A. SAFETY LANE CLASSIFICATION:
    - LANE_A: Emergency/Safety-Critical (excluded from automated scheduling)
    - LANE_B1: Planned / Preventive / Condition-based
    - LANE_B2: Statutory-Due planned maintenance
    """
    LANE_A = "LANE_A"
    LANE_B1 = "LANE_B1"
    LANE_B2 = "LANE_B2"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            val_upper = value.upper()
            aliases = {
                "A_EMERGENCY": cls.LANE_A,
                "EMERGENCY": cls.LANE_A,
                "B1_PLANNED": cls.LANE_B1,
                "PLANNED": cls.LANE_B1,
                "B2_STATUTORY": cls.LANE_B2,
                "STATUTORY": cls.LANE_B2,
            }
            if val_upper in aliases:
                return aliases[val_upper]
        return super()._missing_(value)


class Department(str, enum.Enum):
    """
    A. DEPARTMENT CODES:
    - ENG: Engineering / P.Way
    - TRD: Traction / Electrical
    - SNT: Signal & Telecommunication
    """
    ENG = "ENG"
    TRD = "TRD"
    SNT = "SNT"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            val_upper = value.upper()
            aliases = {
                "ENGINEERING": cls.ENG,
                "PWAY": cls.ENG,
                "P_WAY": cls.ENG,
                "TRACK": cls.ENG,
                "ELECTRICAL": cls.TRD,
                "TRACTION": cls.TRD,
                "S_AND_T": cls.SNT,
                "ST": cls.SNT,
                "S&T": cls.SNT,
                "SIGNAL": cls.SNT,
                "SIGNALLING": cls.SNT,
            }
            if val_upper in aliases:
                return aliases[val_upper]
        return super()._missing_(value)


class BlockPlanStatus(str, enum.Enum):
    """
    B. BLOCK_REQUEST STATE MACHINE:
    Advisory corridor plan lifecycle through multi-role review and official sanction.
    """
    # Primary lifecycle
    DRAFT = "DRAFT"
    RECOMMENDED = "RECOMMENDED"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    NOTIFIED = "NOTIFIED"
    ACK_COMPLETE = "ACK_COMPLETE"
    SANCTION_READY = "SANCTION_READY"
    IN_PROGRESS = "IN_PROGRESS"
    HANDBACK_READY = "HANDBACK_READY"
    HANDED_BACK = "HANDED_BACK"
    CLOSED = "CLOSED"
    # Side states
    REJECTED = "REJECTED"
    REPLAN_REQUIRED = "REPLAN_REQUIRED"
    SUPERSEDED = "SUPERSEDED"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            val_upper = value.upper()
            aliases = {
                "PENDING": cls.PENDING_APPROVAL,
                "OVERRIDDEN": cls.REJECTED,
                "FEASIBLE": cls.RECOMMENDED,
                "OPTIMAL": cls.RECOMMENDED,
                "SANCTIONED": cls.APPROVED,
            }
            if val_upper in aliases:
                return aliases[val_upper]
        return super()._missing_(value)


class FieldEventType(str, enum.Enum):
    """
    C. FIELD_EVENT MODEL EVENT TYPES:
    Discrete operational actions recorded on site. Append-only event log.
    """
    ACK = "ACK"
    READY = "READY"
    START = "START"
    COMPLETE = "COMPLETE"
    HANDBACK = "HANDBACK"
    DELAY = "DELAY"
    PHOTO_ADDED = "PHOTO_ADDED"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            val_upper = value.upper()
            aliases = {
                "ACKNOWLEDGE": cls.ACK,
                "ACKNOWLEDGED": cls.ACK,
                "WORK_STARTED": cls.START,
                "WORK_COMPLETED": cls.COMPLETE,
                "LINE_HANDED_BACK": cls.HANDBACK,
            }
            if val_upper in aliases:
                return aliases[val_upper]
        return super()._missing_(value)


class DelayLossCode(str, enum.Enum):
    """
    C. DELAY LOSS CODES:
    Granular root causes for maintenance delays or window extensions.
    """
    MATERIAL_SHORT = "MATERIAL_SHORT"
    LATE_LINE_CLEAR = "LATE_LINE_CLEAR"
    MACHINE_LATE = "MACHINE_LATE"
    STAFF_SHORT = "STAFF_SHORT"
    PTW_DELAY = "PTW_DELAY"
    WEATHER = "WEATHER"
    EQUIPMENT_FAILURE = "EQUIPMENT_FAILURE"
    TRAFFIC_PRESSURE = "TRAFFIC_PRESSURE"
    SCOPE_GROWTH = "SCOPE_GROWTH"
    OTHER = "OTHER"


# ==============================================================================
# INFRASTRUCTURE & REFERENCE MODELS
# ==============================================================================

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(String, unique=True, index=True, nullable=True)
    employee_id = Column(String, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    designation = Column(String, nullable=False, default="Railway Official")
    role = Column(String, nullable=False)  # SECTION_CONTROLLER, DEPT_SUPERVISOR, DIVISIONAL_OFFICER, FIELD_EXEC_LEAD, FIELD_INSPECTOR, STATION_MASTER
    department = Column(String, nullable=False)  # ENG, TRD, SNT, OPS
    division_id = Column(String, nullable=False, default="DLI")
    division = Column(String, nullable=False, default="DLI")
    section_ids = Column(JSON, default=list)  # e.g. [1, 2, 3]
    team_id = Column(Integer, nullable=True)
    station_id = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        if "service_id" in kwargs and "employee_id" not in kwargs:
            kwargs["employee_id"] = kwargs["service_id"]
        elif "employee_id" in kwargs and "service_id" not in kwargs:
            kwargs["service_id"] = kwargs["employee_id"]

        if "division_id" in kwargs and "division" not in kwargs:
            kwargs["division"] = kwargs["division_id"]
        elif "division" in kwargs and "division_id" not in kwargs:
            kwargs["division_id"] = kwargs["division"]

        if "is_active" in kwargs and "active" not in kwargs:
            kwargs["active"] = 1 if kwargs["is_active"] else 0
        elif "active" in kwargs and "is_active" not in kwargs:
            kwargs["is_active"] = bool(kwargs["active"])

        super().__init__(**kwargs)


class Station(Base):
    __tablename__ = "stations"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=True)
    station_code = Column(String, unique=True, nullable=True)
    name = Column(String, nullable=False)
    division = Column(String, nullable=False, default="DLI")
    chainage_km = Column(Float, nullable=False)

    interlocking_areas = relationship("InterlockingArea", back_populates="station")

    def __init__(self, **kwargs):
        if "code" in kwargs and "station_code" not in kwargs:
            kwargs["station_code"] = kwargs["code"]
        elif "station_code" in kwargs and "code" not in kwargs:
            kwargs["code"] = kwargs["station_code"]
        super().__init__(**kwargs)


class TrainSchedule(Base):
    __tablename__ = "train_schedules"
    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String, index=True, nullable=False)
    train_name = Column(String, nullable=False)
    priority_class = Column(String, nullable=False)  # 'PREMIUM', 'SUPERFAST', 'EXPRESS', 'GOODS', 'SUBURBAN'
    origin_time = Column(String, nullable=False)     # "HH:MM"
    station_entries = Column(JSON, default=list)     # Array of { station_code: str, km: float, arr: str, dep: str, arr_min: int, dep_min: int }
    created_at = Column(DateTime, default=datetime.utcnow)


class BlockSection(Base):
    __tablename__ = "block_sections"
    id = Column(Integer, primary_key=True, index=True)
    section_code = Column(String, unique=True, nullable=False)
    from_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    to_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    km_start = Column(Float, nullable=False)
    km_end = Column(Float, nullable=False)
    number_of_lines = Column(Integer, nullable=False)

    from_station = relationship("Station", foreign_keys=[from_station_id])
    to_station = relationship("Station", foreign_keys=[to_station_id])
    physical_lines = relationship("PhysicalLine", back_populates="block_section")
    elementary_sections = relationship("ElementarySection", back_populates="block_section")
    tasks = relationship("Task", back_populates="block_section")
    train_paths = relationship("TrainPath", back_populates="block_section")
    block_windows = relationship("BlockWindow", back_populates="block_section")


class PhysicalLine(Base):
    __tablename__ = "physical_lines"
    id = Column(Integer, primary_key=True, index=True)
    block_section_id = Column(Integer, ForeignKey("block_sections.id"), nullable=False)
    line_code = Column(String, nullable=False)  # UP, DOWN, ALL
    line_name = Column(String, nullable=False)
    line_type = Column(String, nullable=False)  # DOUBLE_MAIN, SINGLE_MAIN
    electrified = Column(Integer, default=1)
    speed_limit_kmph = Column(Float, default=110.0)

    block_section = relationship("BlockSection", back_populates="physical_lines")


class ElementarySection(Base):
    __tablename__ = "elementary_sections"
    id = Column(Integer, primary_key=True, index=True)
    block_section_id = Column(Integer, ForeignKey("block_sections.id"), nullable=False)
    section_code = Column(String, nullable=False)
    km_start = Column(Float, nullable=False)
    km_end = Column(Float, nullable=False)
    track_line = Column(String, default="UP")

    block_section = relationship("BlockSection", back_populates="elementary_sections")


class InterlockingArea(Base):
    __tablename__ = "interlocking_areas"
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    area_name = Column(String, nullable=False)
    gear_count = Column(Integer, default=10)

    station = relationship("Station", back_populates="interlocking_areas")


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


# ==============================================================================
# 2. TASK MODEL (STATE MACHINE 1)
# ==============================================================================

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String, unique=True, nullable=False)
    department = Column(SQLEnum(Department, native_enum=False), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    block_section_id = Column(Integer, ForeignKey("block_sections.id"), nullable=False)
    km_from = Column(Float, nullable=False)
    km_to = Column(Float, nullable=False)
    work_type = Column(String, nullable=False)
    lane = Column(SQLEnum(SafetyLane, native_enum=False), nullable=False)
    status = Column(SQLEnum(TaskStatus, native_enum=False), default=TaskStatus.REPORTED, nullable=False)
    readiness_score = Column(Float, default=100.0)
    statutory_due_date = Column(DateTime, nullable=True)
    post_work_tsr_speed_kmph = Column(Float, default=0.0)
    post_work_tsr_days = Column(Integer, default=0)
    assigned_to = Column(String, nullable=True)
    division_id = Column(String, default="DLI", nullable=False)
    team_id = Column(Integer, default=101, nullable=False)
    deferral_forbidden = Column(Integer, default=0, nullable=False)

    # Topology & Scope
    elementary_section_id = Column(Integer, ForeignKey("elementary_sections.id"), nullable=True)
    interlocking_area_id = Column(Integer, ForeignKey("interlocking_areas.id"), nullable=True)

    # Priority & Safety classification
    safety_class = Column(String)
    priority_band = Column(String)
    priority_score = Column(Float)

    # Execution requirements (Optimizer / Resource calculations)
    requires_line_block = Column(Integer, default=0)
    requires_power_block = Column(Integer, default=0)
    requires_disconnection = Column(Integer, default=0)
    required_block_type = Column(String)
    estimated_duration_minutes = Column(Integer, nullable=False)
    duration_buffer_minutes = Column(Integer, nullable=False, default=15)
    actual_duration_minutes = Column(Integer)
    required_machine_type = Column(String)
    required_gang_size = Column(Integer)

    # Readiness indicators
    material_ready = Column(Integer, default=0)
    ptw_ready = Column(Integer, default=0)
    power_ready = Column(Integer, default=0)
    disconnection_ready = Column(Integer, default=0)
    worksite_ready = Column(Integer, default=0)
    weather_suitable = Column(Integer, default=1)
    overdue_days = Column(Integer, default=0)
    post_work_tsr_cost = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    block_section = relationship("BlockSection", back_populates="tasks")


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
    start_km = Column(Float, nullable=False, default=100.0)
    end_km = Column(Float, nullable=False, default=120.0)
    direction = Column(String, nullable=False)
    traffic_density_factor = Column(Float, default=1.0)
    priority_weight = Column(Float, default=1.0)

    block_section = relationship("BlockSection", back_populates="train_paths")


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

    block_section = relationship("BlockSection", back_populates="block_windows")


# ==============================================================================
# 3. BLOCK PLAN MODEL (STATE MACHINE 2)
# ==============================================================================

class BlockPlan(Base):
    __tablename__ = "block_plans"
    id = Column(Integer, primary_key=True, index=True)
    plan_code = Column(String, unique=True, nullable=False)
    plan_version = Column(Integer, default=1, nullable=False)
    version_count = Column(Integer, default=1, nullable=False)
    superseded_by_id = Column(Integer, ForeignKey("block_plans.id"), nullable=True)
    status = Column(SQLEnum(BlockPlanStatus, native_enum=False), default=BlockPlanStatus.PENDING_APPROVAL, nullable=False)

    p50_duration_minutes = Column(Float, default=120.0)
    p90_duration_minutes = Column(Float, default=180.0)
    regulation_cost_wtm = Column(Float, default=0.0)
    stability_index = Column(Float, default=85.0)

    # Legacy & planning fields preserved
    version = Column(Integer, default=1)
    plan_type = Column(String, default="PLAN_A", nullable=False)
    horizon_start = Column(DateTime, nullable=False, default=datetime.utcnow)
    horizon_end = Column(DateTime, nullable=False, default=datetime.utcnow)
    total_cost = Column(Float)
    train_impact_cost = Column(Float)
    tsr_cost = Column(Float)
    failure_risk_cost = Column(Float)
    late_completion_cost = Column(Float)
    instability_cost = Column(Float)
    solver_status = Column(String, default="OPTIMAL", nullable=False)
    solver_time_seconds = Column(Float)
    approval_status = Column(String, default="PENDING", nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    override_reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    planned_tasks = relationship("PlannedTask", back_populates="block_plan", cascade="all, delete-orphan")
    field_events = relationship("FieldEvent", back_populates="block_plan", cascade="all, delete-orphan")
    superseded_by = relationship("BlockPlan", remote_side=[id])


class PlannedTask(Base):
    __tablename__ = "planned_tasks"
    id = Column(Integer, primary_key=True, index=True)
    block_plan_id = Column(Integer, ForeignKey("block_plans.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    block_window_id = Column(Integer, ForeignKey("block_windows.id"), nullable=False)
    assigned_resource_id = Column(Integer, ForeignKey("resources.id"))
    planned_start = Column(DateTime, nullable=False)
    planned_end = Column(DateTime, nullable=False)
    setup_minutes = Column(Integer, default=15)
    work_minutes = Column(Integer, default=60)
    clearance_minutes = Column(Integer, default=20)
    handback_minutes = Column(Integer, default=10)
    deferred = Column(Integer, default=0)
    defer_reason = Column(String)
    explanation = Column(String)
    readiness_score = Column(Float, default=100.0)

    block_plan = relationship("BlockPlan", back_populates="planned_tasks")
    task = relationship("Task")
    block_window = relationship("BlockWindow")
    assigned_resource = relationship("Resource")


# ==============================================================================
# 4. FIELD EVENT MODEL (STATE MACHINE 3 - APPEND-ONLY LOG)
# ==============================================================================

class FieldEvent(Base):
    """
    C. FIELD_EVENT MODEL:
    Append-Only Event Log, NOT a status field.
    Tracks chronological operational transitions on site with delay loss codes.
    """
    __tablename__ = "field_events"
    id = Column(Integer, primary_key=True, index=True)
    block_plan_id = Column(Integer, ForeignKey("block_plans.id"), index=True, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), index=True, nullable=True)
    actor_id = Column(String, nullable=False)
    plan_version = Column(Integer, nullable=False, default=1)
    event_type = Column(SQLEnum(FieldEventType, native_enum=False), nullable=False)
    loss_code = Column(SQLEnum(DelayLossCode, native_enum=False), nullable=True)
    remarks = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    block_plan = relationship("BlockPlan", back_populates="field_events")
    task = relationship("Task")


# Preserved for backward compatibility with legacy routes
class BlockEvent(Base):
    __tablename__ = "block_events"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    block_plan_id = Column(Integer, ForeignKey("block_plans.id"))
    block_section_id = Column(Integer, ForeignKey("block_sections.id"), nullable=False)
    event_type = Column(String, nullable=False)
    event_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    actor_id = Column(Integer, ForeignKey("users.id"), default=1)
    loss_code = Column(String)
    notes = Column(String)
    client_event_uuid = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task")
    block_section = relationship("BlockSection")


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


# ==============================================================================
# 5. IMMUTABLE AUDIT LOG MODEL (APPEND-ONLY)
# ==============================================================================

class AuditLog(Base):
    """
    2. IMMUTABLE AUDIT LOG MODEL:
    Strictly append-only audit trail capturing all advisory recommendations,
    sanctions, overrides, and cancellations with tamper-proof event listener blocks.
    """
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(String, nullable=False)
    actor_role = Column(String, nullable=False)
    division_id = Column(String, default="DLI", nullable=False)
    action = Column(String, nullable=False)
    entity_type = Column(String, default="BLOCK_PLAN", nullable=False)
    entity_id = Column(String, default="1", nullable=False)
    before_json = Column(Text, nullable=True)
    after_json = Column(Text, nullable=True)
    reason_code = Column(String, nullable=True)
    reason_text = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Legacy fields preserved for backward compatibility
    role = Column(String, nullable=True)
    division = Column(String, nullable=True)
    plan_id = Column(Integer, ForeignKey("block_plans.id"), nullable=True)
    plan_version = Column(Integer, default=1, nullable=True)
    input_snapshot_reference = Column(String, nullable=True)
    rules_version = Column(String, default="v1.0-explainable-rules", nullable=True)
    cost_breakdown_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)

    def __init__(self, **kwargs):
        # Support legacy and modern argument signatures seamlessly
        if "role" in kwargs and "actor_role" not in kwargs:
            kwargs["actor_role"] = kwargs["role"]
        elif "actor_role" in kwargs and "role" not in kwargs:
            kwargs["role"] = kwargs["actor_role"]

        if "division" in kwargs and "division_id" not in kwargs:
            kwargs["division_id"] = kwargs["division"]
        elif "division_id" in kwargs and "division" not in kwargs:
            kwargs["division"] = kwargs["division_id"]

        if "created_at" in kwargs and "timestamp" not in kwargs:
            kwargs["timestamp"] = kwargs["created_at"]
        elif "timestamp" in kwargs and "created_at" not in kwargs:
            kwargs["created_at"] = kwargs["timestamp"]

        if "plan_id" in kwargs:
            if "entity_id" not in kwargs:
                kwargs["entity_id"] = str(kwargs["plan_id"])
            if "entity_type" not in kwargs:
                kwargs["entity_type"] = "BLOCK_PLAN"

        if "actor_id" in kwargs:
            kwargs["actor_id"] = str(kwargs["actor_id"])

        super().__init__(**kwargs)


class SecurityAuditLog(Base):
    __tablename__ = "security_audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(String, nullable=True, index=True)
    actor_role = Column(String, nullable=True)
    action = Column(String, nullable=False)  # LOGIN_SUCCESS, LOGIN_FAILED, ACCESS_DENIED
    endpoint = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


# ==============================================================================
# IMMUTABILITY ENFORCEMENT HOOKS
# ==============================================================================

@event.listens_for(AuditLog, 'before_update')
def prevent_audit_log_update(mapper, connection, target):
    raise RuntimeError("AuditLog is immutable. Updates are strictly forbidden.")


@event.listens_for(AuditLog, 'before_delete')
def prevent_audit_log_delete(mapper, connection, target):
    raise RuntimeError("AuditLog is immutable. Deletions are strictly forbidden.")


@event.listens_for(FieldEvent, 'before_update')
def prevent_field_event_update(mapper, connection, target):
    raise RuntimeError("FieldEvent is an append-only log. Updates are strictly forbidden.")


@event.listens_for(FieldEvent, 'before_delete')
def prevent_field_event_delete(mapper, connection, target):
    raise RuntimeError("FieldEvent is an append-only log. Deletions are strictly forbidden.")


@event.listens_for(SecurityAuditLog, 'before_update')
def prevent_security_audit_log_update(mapper, connection, target):
    raise RuntimeError("SecurityAuditLog is immutable. Updates are strictly forbidden.")


@event.listens_for(SecurityAuditLog, 'before_delete')
def prevent_security_audit_log_delete(mapper, connection, target):
    raise RuntimeError("SecurityAuditLog is immutable. Deletions are strictly forbidden.")


# ==============================================================================
# 4. APPEND-ONLY EVENT LOG & REBUILDABLE STATE PROJECTIONS (PHASE 2 BLUEPRINT)
# ==============================================================================

class EventLog(Base):
    __tablename__ = "event_log"
    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    ref_type = Column(String, nullable=False)   # 'TASK' | 'BLOCK_REQUEST'
    ref_id = Column(String, index=True, nullable=False)
    stage = Column(String, nullable=False)
    event = Column(String, nullable=False)
    actor_id = Column(String, nullable=False)
    actor_role = Column(String, nullable=False)
    actor_dept = Column(String, nullable=False)
    plan_version = Column(Integer, default=1)
    reason_code = Column(String, nullable=True)
    payload = Column(JSON, nullable=True)
    ts = Column(DateTime, default=datetime.utcnow, index=True)


class StateProjection(Base):
    __tablename__ = "state_projection"
    id = Column(Integer, primary_key=True)
    ref_type = Column(String, index=True, nullable=False)  # 'TASK' | 'BLOCK_REQUEST'
    ref_id = Column(String, unique=True, index=True, nullable=False)
    stage = Column(String, nullable=False)
    plan_version = Column(Integer, default=1)
    last_event = Column(String, nullable=False)
    last_actor_id = Column(String, nullable=False)
    last_event_ts = Column(DateTime, nullable=False)
    reason_code = Column(String, nullable=True)


@event.listens_for(EventLog, 'before_update')
def prevent_event_log_update(mapper, connection, target):
    raise RuntimeError("CRITICAL ARCHITECTURAL VIOLATION: event_log is strictly append-only. Modifying or deleting records is forbidden.")


@event.listens_for(EventLog, 'before_delete')
def prevent_event_log_delete(mapper, connection, target):
    raise RuntimeError("CRITICAL ARCHITECTURAL VIOLATION: event_log is strictly append-only. Modifying or deleting records is forbidden.")
