from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from app.models import (
    TaskStatus, SafetyLane, Department, BlockPlanStatus, FieldEventType, DelayLossCode
)

# ==============================================================================
# REFERENCE INFRASTRUCTURE SCHEMAS
# ==============================================================================

class StationOut(BaseModel):
    id: int
    station_code: str
    name: str
    division: str
    chainage_km: float
    model_config = ConfigDict(from_attributes=True)


class PhysicalLineOut(BaseModel):
    id: int
    block_section_id: int
    line_code: str
    line_name: str
    line_type: str
    electrified: int
    speed_limit_kmph: float
    model_config = ConfigDict(from_attributes=True)


class BlockSectionOut(BaseModel):
    id: int
    section_code: str
    from_station_id: int
    to_station_id: int
    km_start: float
    km_end: float
    number_of_lines: int
    model_config = ConfigDict(from_attributes=True)


class ResourceOut(BaseModel):
    id: int
    resource_code: str
    resource_type: str
    name: str
    department: str
    home_location: Optional[str] = None
    capacity: Optional[int] = None
    status: str
    model_config = ConfigDict(from_attributes=True)


class TrainPathOut(BaseModel):
    id: int
    train_number: str
    train_class: str
    weight_category: Optional[str] = None
    block_section_id: int
    line: str
    scheduled_start: datetime
    scheduled_end: datetime
    start_km: float
    end_km: float
    direction: str
    traffic_density_factor: float
    priority_weight: float
    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# 1. TASK STATE MACHINE SCHEMAS
# ==============================================================================

class TaskOut(BaseModel):
    id: int
    task_code: str
    department: Department
    dept: Optional[str] = None
    work_type: str
    asset_id: Optional[int] = None
    block_section_id: int
    elementary_section_id: Optional[int] = None
    interlocking_area_id: Optional[int] = None
    km_from: float
    km_to: float
    start_km: Optional[float] = None
    end_km: Optional[float] = None
    lane: SafetyLane
    workflow_lane: Optional[str] = None
    safety_class: Optional[str] = None
    priority_band: Optional[str] = None
    priority_score: Optional[float] = None
    priority_pts: Optional[float] = None
    readiness_score: Optional[float] = 100.0
    readiness_pts: Optional[float] = 100.0
    readiness_status: Optional[str] = "HIGH"
    readiness_reasons: Optional[List[str]] = []
    requires_line_block: int = 1
    requires_power_block: int = 0
    requires_disconnection: int = 0
    required_block_type: Optional[str] = None
    estimated_duration_minutes: int
    duration_min: Optional[int] = None
    duration_buffer_minutes: int = 15
    material_ready: int = 1
    ptw_ready: int = 1
    power_ready: int = 1
    disconnection_ready: int = 1
    worksite_ready: int = 1
    weather_suitable: int = 1
    statutory_due_date: Optional[datetime] = None
    overdue_days: int = 0
    post_work_tsr_speed_kmph: Optional[float] = 0.0
    post_work_tsr_days: Optional[int] = 0
    assigned_to: Optional[str] = None
    division_id: Optional[str] = "DLI"
    team_id: Optional[int] = 101
    read_only: Optional[bool] = False
    co_block_partner: Optional[bool] = False
    is_co_block_partner: Optional[bool] = False
    can_edit: Optional[bool] = True
    can_verify: Optional[bool] = True
    edit_actions: Optional[List[str]] = []
    status: TaskStatus
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


class TaskCreate(BaseModel):
    department: Department
    work_type: str
    task_code: Optional[str] = None
    asset_id: Optional[int] = None
    block_section_id: Optional[int] = 1
    km_from: Optional[float] = None
    km_to: Optional[float] = None
    start_km: Optional[float] = None
    end_km: Optional[float] = None
    lane: Optional[SafetyLane] = None
    workflow_lane: Optional[SafetyLane] = None
    estimated_duration_minutes: Optional[int] = None
    duration_min: Optional[int] = None
    priority_score: Optional[float] = None
    priority_pts: Optional[float] = None
    readiness_score: Optional[float] = 100.0
    readiness_pts: Optional[float] = 100.0
    duration_buffer_minutes: Optional[int] = 15
    requires_line_block: int = 1
    requires_power_block: int = 0
    requires_disconnection: int = 0
    required_machine_type: Optional[str] = "NONE"
    statutory_due_date: Optional[datetime] = None
    post_work_tsr_speed_kmph: Optional[float] = 0.0
    post_work_tsr_days: Optional[int] = 0
    assigned_to: Optional[str] = None
    safety_protocol_acknowledged: Optional[bool] = False
    status: Optional[TaskStatus] = TaskStatus.REPORTED
    model_config = ConfigDict(use_enum_values=True)


# ==============================================================================
# 3 INGESTION CHANNEL SCHEMAS & READINESS GATE SCHEMAS
# ==============================================================================

class StatutoryIngestSchema(BaseModel):
    """Channel A: Statutory / Periodic maintenance ingestion (Lane B2)"""
    asset_type: str
    work_type: str
    cycle_days: int
    last_serviced_date: datetime
    department: Optional[Department] = Department.ENG
    block_section_id: Optional[int] = 1
    km_from: Optional[float] = 105.0
    km_to: Optional[float] = 107.0
    estimated_duration_minutes: Optional[int] = 120
    model_config = ConfigDict(use_enum_values=True)


class ConditionIngestSchema(BaseModel):
    """Channel B: Condition / TRC-TGI inspection readings (Lane B1)"""
    tgi_score: Optional[float] = None  # Track Geometry Index (< 72 triggers urgent tamping)
    usfd_flaw_detected: Optional[bool] = False  # Ultrasonic flaw detection
    work_type: Optional[str] = "TAMPING"
    department: Optional[Department] = Department.ENG
    block_section_id: Optional[int] = 1
    km_from: float = 110.0
    km_to: float = 112.0
    notes: Optional[str] = None
    estimated_duration_minutes: Optional[int] = 150
    model_config = ConfigDict(use_enum_values=True)


class DefectIngestSchema(BaseModel):
    """Channel C: Field defect reporting with Lane A Emergency protection barrier"""
    description: str
    km_from: float
    km_to: float
    block_section_id: Optional[int] = 1
    severity: str  # EMERGENCY, URGENT, ROUTINE
    department: Optional[Department] = Department.ENG
    reported_by: Optional[str] = None
    safety_protocol_acknowledged: Optional[bool] = False
    estimated_duration_minutes: Optional[int] = 90
    model_config = ConfigDict(use_enum_values=True)


class ReadinessPillars(BaseModel):
    machine: float = Field(ge=0.0, le=100.0, default=100.0)
    gang: float = Field(ge=0.0, le=100.0, default=100.0)
    material: float = Field(ge=0.0, le=100.0, default=100.0)
    ptw: float = Field(ge=0.0, le=100.0, default=100.0)
    site_weather: float = Field(ge=0.0, le=100.0, default=100.0)


class ReadinessCalculationRequest(BaseModel):
    task_id: Optional[int] = None
    pillars: Optional[ReadinessPillars] = None


class ReadinessResponse(BaseModel):
    task_id: Optional[int] = None
    readiness_score: float
    status: str  # PLAN_A_ELIGIBLE, PLAN_B_MANDATORY, HIGH_RISK_DEFERRAL
    level: str  # HIGH, MEDIUM, LOW
    recommendation: str
    system_alert: Optional[str] = None
    plan_a_allowed: bool
    plan_b_mandatory: bool
    deferral_recommended: bool
    eligible: bool
    breakdown: Dict[str, float]
    reasons: List[str]
    invalidated_plan_ids: Optional[List[int]] = []


class PlannedTaskOut(BaseModel):
    id: Optional[int] = None
    task_id: int
    task_code: str
    department: str
    work_type: str
    km_from: float
    km_to: float
    section_name: str
    lane: str
    block_window_id: int
    planned_start: str
    planned_end: str
    setup_minutes: int
    work_minutes: int
    clearance_minutes: int
    handback_minutes: int
    readiness_score: float
    readiness_level: Optional[str] = "HIGH"
    priority_score: Optional[float] = 80.0
    explanation: str
    deferred: int
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


# ==============================================================================
# 2. BLOCK REQUEST STATE MACHINE SCHEMAS
# ==============================================================================

class PlanOut(BaseModel):
    id: int
    plan_code: str
    plan_version: int = 1
    version: int = 1
    version_count: int = 1
    superseded_by_id: Optional[int] = None
    status: BlockPlanStatus = BlockPlanStatus.PENDING_APPROVAL
    plan_type: str
    horizon_start: datetime
    horizon_end: datetime
    p50_duration_minutes: Optional[float] = 120.0
    p90_duration_minutes: Optional[float] = 180.0
    regulation_cost_wtm: Optional[float] = 0.0
    stability_index: Optional[float] = 85.0
    total_cost: Optional[float] = None
    train_impact_cost: Optional[float] = None
    tsr_cost: Optional[float] = None
    failure_risk_cost: Optional[float] = None
    late_completion_cost: Optional[float] = None
    instability_cost: Optional[float] = None
    solver_status: str
    approval_status: str
    override_reason: Optional[str] = None
    created_at: datetime
    tasks: Optional[List[Dict[str, Any]]] = None
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


class DualPlanResponse(BaseModel):
    message: str
    plan_a_id: int
    plan_b_id: int
    solver_status: str
    plan_a: Dict[str, Any]
    plan_b: Dict[str, Any]


class WhatIfRequest(BaseModel):
    scenario: str
    delay_minutes: Optional[int] = 30
    task_id: Optional[int] = None
    resource_id: Optional[int] = None


class WhatIfResponse(BaseModel):
    scenario: str
    delay_minutes: int
    additional_weighted_train_minutes: float
    train_impact_change: str
    plan_b_recommended: bool
    risks: List[str]
    explanation: str
    affected_tasks: List[int]
    original_schedule: str
    revised_schedule: str


# ==============================================================================
# 3. FIELD EVENT STATE MACHINE SCHEMAS (APPEND-ONLY)
# ==============================================================================

class FieldEventCreate(BaseModel):
    block_plan_id: int
    task_id: Optional[int] = None
    actor_id: str
    plan_version: int = 1
    event_type: FieldEventType
    loss_code: Optional[DelayLossCode] = None
    remarks: Optional[str] = None
    model_config = ConfigDict(use_enum_values=True)


class FieldEventOut(BaseModel):
    id: int
    block_plan_id: int
    task_id: Optional[int] = None
    actor_id: str
    plan_version: int
    event_type: FieldEventType
    loss_code: Optional[DelayLossCode] = None
    remarks: Optional[str] = None
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


class BlockEventCreate(BaseModel):
    task_id: Optional[int] = None
    block_plan_id: Optional[int] = None
    block_section_id: Optional[int] = 1
    event_type: str
    loss_code: Optional[str] = None
    notes: Optional[str] = None
    client_event_uuid: Optional[str] = None


class ActionResponse(BaseModel):
    success: bool
    message: str


class LoginAsRequest(BaseModel):
    role: str
    username: str
    department: Optional[str] = None
    team_id: Optional[int] = None
    division_id: Optional[str] = None


class LoginCredentialsRequest(BaseModel):
    service_id: str
    password: str


class UserProfileOut(BaseModel):
    service_id: str
    name: str
    designation: str
    role: str
    department: str
    division_id: str
    section_ids: Optional[List[int]] = None
    team_id: Optional[int] = None
    station_id: Optional[int] = None
    capabilities: List[str] = []
    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    department: str
    user: Optional[UserProfileOut] = None
    capabilities: List[str] = []
    landing_route: Optional[str] = None



class OverrideRequest(BaseModel):
    reason_code: str
    reason_text: Optional[str] = None


class FieldEventSubmission(BaseModel):
    """Field execution action submission with stale plan version checking"""
    block_id: int
    task_id: int
    event_type: str
    plan_version: int
    loss_code: Optional[str] = None
    remarks: Optional[str] = None


class FieldEventSubmissionResponse(BaseModel):
    success: bool
    message: str
    event_id: int
    plan_version: int
    safety_disclaimer: Optional[str] = None


class PartnerTaskStatus(BaseModel):
    """Real-time partner department status readout for co-block execution strip"""
    department: str
    task_id: int
    task_code: str
    task_name: str
    status: str
    is_complete: bool
    last_event_type: Optional[str] = None
    last_event_time: Optional[datetime] = None


class AlterPlanRequest(BaseModel):
    """Block Alteration Advice (BAA) and version bumping trigger"""
    trigger_reason: str
    new_window_start: Optional[datetime] = None
    new_window_end: Optional[datetime] = None
    remarks: Optional[str] = None


class BlockAlterationAdviceOut(BaseModel):
    advice_id: str
    block_id: int
    old_version: int
    new_version: int
    trigger_reason: str
    old_window_start: Optional[datetime] = None
    old_window_end: Optional[datetime] = None
    new_window_start: Optional[datetime] = None
    new_window_end: Optional[datetime] = None
    created_at: datetime
    remarks: str
    invalidated_ack_count: Optional[int] = 0


# ==============================================================================
# 4. IMMUTABLE AUDIT LOG SCHEMAS
# ==============================================================================

class AuditLogOut(BaseModel):
    id: int
    actor_id: Union[str, int]
    actor_role: Optional[str] = "CONTROLLER"
    division_id: Optional[str] = "DLI"
    action: str
    entity_type: Optional[str] = "BLOCK_PLAN"
    entity_id: Optional[Union[str, int]] = "1"
    before_json: Optional[str] = None
    after_json: Optional[str] = None
    reason_code: Optional[str] = None
    reason_text: Optional[str] = None
    timestamp: Optional[datetime] = None
    # Legacy field mappings
    role: Optional[str] = None
    division: Optional[str] = None
    plan_id: Optional[int] = None
    plan_version: Optional[int] = None
    rules_version: Optional[str] = None
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

    @field_validator('actor_id', mode='before')
    @classmethod
    def serialize_actor_id(cls, v):
        return str(v) if v is not None else "SYSTEM"


class DashboardSummaryOut(BaseModel):
    total_tasks: int
    open_tasks: int
    lane_a_count: int
    lane_b1_count: int
    lane_b2_count: int
    high_readiness_pct: int
    generated_plans: int
    active_track_blocks: int
    active_tsrs: int
    total_corridor_km: float
    solver_status: str
    operational_mode: str
    status: str


# ==============================================================================
# 5. APPEND-ONLY EVENT LOG & STATE PROJECTION SCHEMAS (PHASE 2)
# ==============================================================================

class EventLogOut(BaseModel):
    id: int
    ref_type: str
    ref_id: str
    stage: str
    event: str
    actor_id: str
    actor_role: str
    actor_dept: str
    plan_version: int = 1
    reason_code: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
    ts: datetime
    model_config = ConfigDict(from_attributes=True)


class StateProjectionOut(BaseModel):
    id: int
    ref_type: str
    ref_id: str
    stage: str
    plan_version: int = 1
    last_event: str
    last_actor_id: str
    last_event_ts: datetime
    reason_code: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class AppendEventRequest(BaseModel):
    ref_type: Optional[str] = "TASK"
    ref_id: Optional[str] = None
    stage: str
    event: str
    actor_id: Optional[str] = None
    actor_role: Optional[str] = None
    actor_dept: Optional[str] = None
    plan_version: int = 1
    reason_code: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None


class LifecycleHistoryResponse(BaseModel):
    ref_type: str
    ref_id: str
    current_stage: str
    total_events: int
    events: List[EventLogOut]


class BlockFieldEventRequest(BaseModel):
    task_id: Optional[int] = None
    step_event: str
    plan_version: int
    loss_code: Optional[str] = None
    remarks: Optional[str] = None
    actual_duration_minutes: Optional[int] = None
    model_config = ConfigDict(extra="ignore")


class BlockReplanRequest(BaseModel):
    reason: Optional[str] = "Operational Replan and Window Adjustment"
    model_config = ConfigDict(extra="ignore")
