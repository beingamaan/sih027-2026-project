from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TaskBase(BaseModel):
    task_code: str
    department: str
    work_type: str
    lane: str
    estimated_duration_minutes: int
    duration_buffer_minutes: int
    status: str

class TaskOut(TaskBase):
    id: int
    km_from: float
    km_to: float
    material_ready: int
    ptw_ready: int
    power_ready: int
    disconnection_ready: int
    worksite_ready: int
    weather_suitable: int
    class Config:
        orm_mode = True

class LaneClassificationOut(BaseModel):
    lane: str
    optimizer_eligible: bool
    message: str

class ReadinessOut(BaseModel):
    status: str
    reasons: List[str]

class PlanBase(BaseModel):
    plan_code: str
    plan_type: str
    total_cost: Optional[float]

class PlanOut(PlanBase):
    id: int
    version: int
    horizon_start: datetime
    horizon_end: datetime
    solver_status: str
    approval_status: str
    created_at: datetime
    tasks: Optional[List[dict]] = None
    class Config:
        orm_mode = True

class EventSyncRequest(BaseModel):
    task_id: int
    event_type: str
    loss_code: Optional[str] = None
    notes: Optional[str] = None

class ActionResponse(BaseModel):
    success: bool
    message: str

class WhatIfRequest(BaseModel):
    scenario: str
    delay_minutes: Optional[int] = None
    task_id: Optional[int] = None
    resource_id: Optional[int] = None

class WhatIfResponse(BaseModel):
    scenario: str
    train_impact_change: str
    cost_change: str
    risks: List[str]
    explanation: str
    affected_tasks: List[int]
    original_schedule: str
    revised_schedule: str
