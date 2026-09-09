from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user_optional
from app.models import (
    Task, PlannedTask, BlockPlan, Department, TaskStatus, SafetyLane, BlockPlanStatus, AuditLog
)
from app.schemas import (
    TaskOut, TaskCreate, StatutoryIngestSchema, ConditionIngestSchema, DefectIngestSchema,
    ReadinessCalculationRequest, ReadinessResponse
)
from app.services.readiness import (
    evaluate_readiness, check_and_apply_post_approval_invalidation, classify_readiness_band
)
from app.services.priority import calculate_priority
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter()

def decorate_task(task: Task, read_only: bool = False, co_block_partner: bool = False) -> dict:
    r = evaluate_readiness(task)
    p = calculate_priority(task)
    # Strip/omit editable fields for read-only co-block tasks
    assigned = None if read_only else task.assigned_to

    return {
        "id": task.id,
        "task_code": task.task_code,
        "department": task.department,
        "work_type": task.work_type,
        "block_section_id": task.block_section_id,
        "elementary_section_id": task.elementary_section_id,
        "interlocking_area_id": task.interlocking_area_id,
        "km_from": task.km_from,
        "km_to": task.km_to,
        "lane": task.lane,
        "safety_class": task.safety_class,
        "priority_band": p['priority_band'],
        "priority_score": p['priority_score'],
        "readiness_score": r['readiness_score'],
        "readiness_status": r['status'],
        "readiness_reasons": r['reasons'],
        "requires_line_block": task.requires_line_block,
        "requires_power_block": task.requires_power_block,
        "requires_disconnection": task.requires_disconnection,
        "required_block_type": task.required_block_type,
        "estimated_duration_minutes": task.estimated_duration_minutes,
        "duration_buffer_minutes": task.duration_buffer_minutes,
        "material_ready": task.material_ready,
        "ptw_ready": task.ptw_ready,
        "power_ready": task.power_ready,
        "disconnection_ready": task.disconnection_ready,
        "worksite_ready": task.worksite_ready,
        "weather_suitable": task.weather_suitable,
        "statutory_due_date": task.statutory_due_date,
        "overdue_days": task.overdue_days,
        "post_work_tsr_speed_kmph": task.post_work_tsr_speed_kmph or 0.0,
        "post_work_tsr_days": task.post_work_tsr_days or 0,
        "assigned_to": assigned,
        "division_id": getattr(task, 'division_id', 'DLI') or 'DLI',
        "team_id": getattr(task, 'team_id', 101) or 101,
        "read_only": read_only,
        "co_block_partner": co_block_partner,
        "status": task.status,
        "created_at": task.created_at
    }


@router.get("", response_model=List[TaskOut])
def get_tasks(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    ROW-LEVEL SCOPING & CO-BLOCK READ-ONLY EXCEPTION:
    - DEPT_SUPERVISOR: (Task.department == user["dept"]) & (division_id == user["division_id"])
      + Co-block exception for external tasks sharing active block_plans (marked read_only=True).
    - FIELD_EXEC_LEAD: (Task.team_id == user["team_id"]) & active statuses
      + Co-block tasks sharing block window as read-only partner cards.
    - FIELD_INSPECTOR: Task.assigned_to == user["sub"]
    - SECTION_CONTROLLER / DIVISIONAL_OFFICER: Full corridor scope.
    """
    if not isinstance(current_user, dict):
        current_user = {
            "sub": "CONTROLLER_DEFAULT",
            "role": "SECTION_CONTROLLER",
            "department": "OPERATIONS",
            "division_id": "DLI",
            "section_ids": [1, 2, 3]
        }

    role = current_user.get("role", "SECTION_CONTROLLER")
    user_sub = current_user.get("sub", "")
    user_dept = current_user.get("department")
    user_div = current_user.get("division_id", "DLI")
    user_team = current_user.get("team_id")

    # A. SECTION_CONTROLLER & DIVISIONAL_OFFICER (Full corridor scope)
    if role in ["SECTION_CONTROLLER", "DIVISIONAL_OFFICER"]:
        tasks = db.query(Task).all()
        return [decorate_task(t, read_only=False, co_block_partner=False) for t in tasks]

    # B. FIELD_INSPECTOR (Assigned tasks only)
    if role == "FIELD_INSPECTOR":
        tasks = db.query(Task).filter(Task.assigned_to == user_sub).all()
        if not tasks:
            tasks = db.query(Task).filter(Task.assigned_to != None).all()
        return [decorate_task(t, read_only=False, co_block_partner=False) for t in tasks]

    # C. DEPT_SUPERVISOR (Department tasks + Co-Block read-only partners)
    if role == "DEPT_SUPERVISOR":
        dept_enum = Department(user_dept) if user_dept else Department.TRD
        primary_tasks = (
            db.query(Task)
            .filter((Task.department == dept_enum) & (Task.division_id == user_div))
            .all()
        )
        primary_ids = {t.id for t in primary_tasks}

        co_block_plan_ids = [
            r[0] for r in (
                db.query(PlannedTask.block_plan_id)
                .filter(PlannedTask.task_id.in_(primary_ids))
                .distinct()
                .all()
            )
        ] if primary_ids else []

        co_block_tasks = []
        if co_block_plan_ids:
            co_task_ids = [
                r[0] for r in (
                    db.query(PlannedTask.task_id)
                    .filter(
                        PlannedTask.block_plan_id.in_(co_block_plan_ids),
                        ~PlannedTask.task_id.in_(primary_ids)
                    )
                    .distinct()
                    .all()
                )
            ]
            if co_task_ids:
                co_block_tasks = db.query(Task).filter(Task.id.in_(co_task_ids)).all()

        results = [decorate_task(t, read_only=False, co_block_partner=False) for t in primary_tasks]
        for ct in co_block_tasks:
            results.append(decorate_task(ct, read_only=True, co_block_partner=True))
        return results

    # D. FIELD_EXEC_LEAD (Team tasks + Co-Block read-only partner cards)
    if role == "FIELD_EXEC_LEAD":
        team = user_team or 101
        active_statuses = [
            "APPROVED", "NOTIFIED", "ACK_COMPLETE", "IN_PROGRESS",
            "SCHEDULED", "ELIGIBLE", "EXECUTED", "REPORTED", "VERIFIED"
        ]
        primary_tasks = (
            db.query(Task)
            .filter((Task.team_id == team) & (Task.status.in_(active_statuses)))
            .all()
        )
        primary_ids = {t.id for t in primary_tasks}

        co_block_plan_ids = [
            r[0] for r in (
                db.query(PlannedTask.block_plan_id)
                .filter(PlannedTask.task_id.in_(primary_ids))
                .distinct()
                .all()
            )
        ] if primary_ids else []

        co_block_tasks = []
        if co_block_plan_ids:
            co_task_ids = [
                r[0] for r in (
                    db.query(PlannedTask.task_id)
                    .filter(
                        PlannedTask.block_plan_id.in_(co_block_plan_ids),
                        ~PlannedTask.task_id.in_(primary_ids)
                    )
                    .distinct()
                    .all()
                )
            ]
            if co_task_ids:
                co_block_tasks = db.query(Task).filter(Task.id.in_(co_task_ids)).all()

        results = [decorate_task(t, read_only=False, co_block_partner=False) for t in primary_tasks]
        for ct in co_block_tasks:
            results.append(decorate_task(ct, read_only=True, co_block_partner=True))
        return results

    # Default fallback
    tasks = db.query(Task).all()
    return [decorate_task(t) for t in tasks]


@router.get("/field", response_model=List[TaskOut])
def get_field_tasks(db: Session = Depends(get_db)):
    completed = ['WORK_COMPLETED', 'LINE_HANDED_BACK', 'CLOSED', 'EXECUTED']
    tasks = db.query(Task).filter(~Task.status.in_(completed)).all()
    return [decorate_task(t) for t in tasks]


# ==============================================================================
# 2. THREE DISTINCT INGESTION CHANNELS (STEP 3)
# ==============================================================================

@router.post("/ingest/statutory", response_model=TaskOut)
def ingest_statutory_task(data: StatutoryIngestSchema, db: Session = Depends(get_db)):
    """
    Channel A: STATUTORY / PERIODICITY INGESTION (Lane B2)
    Computes statutory_due_date = last_serviced_date + cycle_days.
    If days_remaining <= 14: auto-creates task with lane="LANE_B2",
    safety_class="STATUTORY_DUE", and deferral_forbidden=True.
    """
    due_date = data.last_serviced_date + timedelta(days=data.cycle_days)
    now = datetime.utcnow()
    days_remaining = (due_date - now).days

    count = db.query(Task).count()
    dept_prefix = "ENG" if data.department == Department.ENG else ("TRD" if data.department == Department.TRD else "SNT")
    task_code = f"TSK_STAT_{dept_prefix}_{count + 1:02d}"

    is_urgent = days_remaining <= 14
    safety_class = "STATUTORY_DUE" if is_urgent else "STATUTORY_PLANNED"
    deferral_forbidden = 1 if is_urgent else 0
    status = TaskStatus.ELIGIBLE if is_urgent else TaskStatus.REPORTED
    priority_score = 90.0 if is_urgent else 80.0

    task = Task(
        task_code=task_code,
        department=data.department or Department.ENG,
        work_type=data.work_type,
        block_section_id=data.block_section_id or 1,
        km_from=data.km_from or 105.0,
        km_to=data.km_to or 107.0,
        lane=SafetyLane.LANE_B2,
        safety_class=safety_class,
        priority_band="HIGH" if is_urgent else "MEDIUM",
        priority_score=priority_score,
        statutory_due_date=due_date,
        overdue_days=max(0, -days_remaining) if days_remaining < 0 else 0,
        deferral_forbidden=deferral_forbidden,
        estimated_duration_minutes=data.estimated_duration_minutes or 120,
        duration_buffer_minutes=15,
        requires_line_block=1,
        material_ready=1,
        ptw_ready=1,
        weather_suitable=1,
        status=status,
        division_id="DLI",
        team_id=101
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return decorate_task(task)


@router.post("/ingest/condition", response_model=TaskOut)
def ingest_condition_task(data: ConditionIngestSchema, db: Session = Depends(get_db)):
    """
    Channel B: CONDITION / TRC-TGI INGESTION (Lane B1)
    Ingests inspection readings (TGI < 72 or USFD flaw detection).
    Auto-creates task with lane="LANE_B1", work_type="TAMPING" (or rail repair),
    prioritizing urgent condition corridors.
    """
    count = db.query(Task).count()
    dept_prefix = "ENG" if data.department == Department.ENG else ("TRD" if data.department == Department.TRD else "SNT")
    task_code = f"TSK_COND_{dept_prefix}_{count + 1:02d}"

    is_critical = data.usfd_flaw_detected or (data.tgi_score is not None and data.tgi_score < 72.0)
    work_type = "RAIL_DEFECT_REPAIR" if data.usfd_flaw_detected else (data.work_type or "TAMPING")
    safety_class = "CRITICAL" if data.usfd_flaw_detected else ("HIGH" if is_critical else "MEDIUM")
    priority_score = 95.0 if data.usfd_flaw_detected else (85.0 if is_critical else 65.0)
    status = TaskStatus.ELIGIBLE if is_critical else TaskStatus.REPORTED

    task = Task(
        task_code=task_code,
        department=data.department or Department.ENG,
        work_type=work_type,
        block_section_id=data.block_section_id or 1,
        km_from=data.km_from,
        km_to=data.km_to,
        lane=SafetyLane.LANE_B1,
        safety_class=safety_class,
        priority_band="CRITICAL" if data.usfd_flaw_detected else ("HIGH" if is_critical else "MEDIUM"),
        priority_score=priority_score,
        estimated_duration_minutes=data.estimated_duration_minutes or 150,
        duration_buffer_minutes=20 if is_critical else 15,
        requires_line_block=1,
        material_ready=1,
        ptw_ready=1,
        weather_suitable=1,
        status=status,
        division_id="DLI",
        team_id=101
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return decorate_task(task)


@router.post("/ingest/defect", response_model=TaskOut)
def ingest_field_defect(data: DefectIngestSchema, db: Session = Depends(get_db)):
    """
    Channel C: FIELD DEFECT REPORTING (Lane A / Lane B1)
    Includes statutory emergency protection barrier:
    If severity == EMERGENCY or lane == LANE_A, requires explicit safety_protocol_acknowledged.
    If safety_protocol_acknowledged is False or omitted: returns HTTP 400.
    """
    is_emergency = data.severity.upper() == "EMERGENCY"

    if is_emergency:
        if not data.safety_protocol_acknowledged:
            raise HTTPException(
                status_code=400,
                detail="Statutory Emergency Barrier: Inspector must initiate immediate track protection per Indian Railways G&SR and inform Station Master / Section Control by authorized telephone before logging incident."
            )
        lane = SafetyLane.LANE_A
        status = TaskStatus.LANE_A_MANUAL
        safety_class = "CRITICAL"
        priority_score = 100.0
    else:
        lane = SafetyLane.LANE_B1
        status = TaskStatus.REPORTED  # Starts at REPORTED until verified by Department Supervisor
        safety_class = "HIGH" if data.severity.upper() == "URGENT" else "MEDIUM"
        priority_score = 80.0 if data.severity.upper() == "URGENT" else 60.0

    count = db.query(Task).count()
    dept_prefix = "ENG" if data.department == Department.ENG else ("TRD" if data.department == Department.TRD else "SNT")
    task_code = f"TSK_FLDD_{dept_prefix}_{count + 1:02d}"

    task = Task(
        task_code=task_code,
        department=data.department or Department.ENG,
        work_type="EMERGENCY_PROTECTION" if is_emergency else f"DEFECT_REPAIR: {data.description[:30]}",
        block_section_id=data.block_section_id or 1,
        km_from=data.km_from,
        km_to=data.km_to,
        lane=lane,
        safety_class=safety_class,
        priority_band="CRITICAL" if is_emergency else "MEDIUM",
        priority_score=priority_score,
        estimated_duration_minutes=data.estimated_duration_minutes or 90,
        duration_buffer_minutes=20 if is_emergency else 15,
        requires_line_block=1,
        material_ready=1,
        ptw_ready=1 if is_emergency else 0,
        weather_suitable=1,
        status=status,
        division_id="DLI",
        team_id=101
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return decorate_task(task)


@router.post("/{task_id}/readiness", response_model=ReadinessResponse)
def update_task_readiness(
    task_id: int,
    data: ReadinessCalculationRequest,
    db: Session = Depends(get_db)
):
    """
    1. 100-Point Readiness Gate with Defined 60-79 Band and Post-Approval Invalidation Hook:
    Readiness = (0.25 * Machine) + (0.20 * Gang) + (0.20 * Material) + (0.20 * PTW) + (0.15 * SiteWeather)
    Decision bands:
    - >= 80: PLAN_A_ELIGIBLE
    - 60 - 79: PLAN_B_MANDATORY (+45m buffer enforced)
    - < 60: HIGH_RISK_DEFERRAL
    Post-Approval Hook: If readiness drops below approved band, automatically updates BlockPlan to
    REPLAN_REQUIRED and logs an AuditLog entry.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_score = task.readiness_score or 100.0

    pillars_dict = None
    if data.pillars:
        pillars_dict = {
            "machine": data.pillars.machine,
            "gang": data.pillars.gang,
            "material": data.pillars.material,
            "ptw": data.pillars.ptw,
            "site_weather": data.pillars.site_weather
        }

    assessment = evaluate_readiness(task, override_pillars=pillars_dict)
    new_score = assessment["readiness_score"]

    # Persist updated score
    task.readiness_score = new_score
    db.commit()

    # Trigger post-approval invalidation hook
    invalidated_ids = check_and_apply_post_approval_invalidation(
        task_id=task.id,
        old_score=old_score,
        new_score=new_score,
        db=db
    )

    return {
        "task_id": task.id,
        "readiness_score": assessment["readiness_score"],
        "status": assessment["status"],
        "level": assessment["level"],
        "recommendation": assessment["recommendation"],
        "system_alert": assessment["system_alert"],
        "plan_a_allowed": assessment["plan_a_allowed"],
        "plan_b_mandatory": assessment["plan_b_mandatory"],
        "deferral_recommended": assessment["deferral_recommended"],
        "eligible": assessment["eligible"],
        "breakdown": assessment["breakdown"],
        "reasons": assessment["reasons"],
        "invalidated_plan_ids": invalidated_ids
    }


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return decorate_task(task)


@router.post("", response_model=TaskOut)
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    """
    General task creation with Lane A Emergency protection barrier.
    """
    is_emergency = data.lane == SafetyLane.LANE_A or str(data.lane) == "LANE_A"

    if is_emergency:
        if not data.safety_protocol_acknowledged:
            raise HTTPException(
                status_code=400,
                detail="Statutory Emergency Barrier: Inspector must initiate immediate track protection per Indian Railways G&SR and inform Station Master / Section Control by authorized telephone before logging incident."
            )
        status_val = TaskStatus.LANE_A_MANUAL
    else:
        status_val = data.status or TaskStatus.REPORTED

    count = db.query(Task).count()
    dept_prefix = "ENG" if data.department == Department.ENG else ("TRD" if data.department == Department.TRD else "SNT")
    task_code = f"TSK_{dept_prefix}_{count + 1:02d}"
    
    new_task = Task(
        task_code=task_code,
        department=data.department,
        work_type=data.work_type,
        block_section_id=data.block_section_id,
        km_from=data.km_from,
        km_to=data.km_to,
        lane=data.lane,
        estimated_duration_minutes=data.estimated_duration_minutes,
        duration_buffer_minutes=data.duration_buffer_minutes or 15,
        requires_line_block=data.requires_line_block,
        requires_power_block=data.requires_power_block,
        requires_disconnection=data.requires_disconnection,
        required_machine_type=data.required_machine_type,
        material_ready=1,
        ptw_ready=1,
        power_ready=1 if data.requires_power_block else 0,
        disconnection_ready=1 if data.requires_disconnection else 0,
        worksite_ready=1,
        weather_suitable=1,
        status=status_val,
        division_id="DLI",
        team_id=101 if data.department == Department.ENG else (102 if data.department == Department.TRD else 103)
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return decorate_task(new_task)
