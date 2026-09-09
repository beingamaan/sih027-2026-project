from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user_optional
from app.models import (
    Task, BlockEvent, FieldEvent, FieldEventType, DelayLossCode,
    BlockPlan, PlannedTask, AuditLog, TaskStatus
)
from app.schemas import (
    ActionResponse, FieldEventSubmission, FieldEventSubmissionResponse, PartnerTaskStatus
)
from datetime import datetime
from typing import List, Optional

router = APIRouter()

# ==============================================================================
# 2. FIELD EXECUTION EVENTS & ACKNOWLEDGEMENT (STEP 4)
# ==============================================================================

@router.post("/events", response_model=FieldEventSubmissionResponse)
def submit_field_event(
    data: FieldEventSubmission,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_optional)
):
    """
    2. FIELD EXECUTION EVENTS & ACKNOWLEDGEMENT:
    - Validates payload.plan_version against the active plan_version on BlockPlan.
    - If payload.plan_version < active_plan.plan_version: raises HTTP 409 Conflict (STALE PLAN).
    - If event_type == "HANDBACK": validates the Integrated Joint Handback Gate.
    - Directly appends to append-only FieldEvent table.
    """
    active_plan = db.query(BlockPlan).filter(BlockPlan.id == data.block_id).first()
    if not active_plan:
        raise HTTPException(status_code=404, detail=f"Block plan #{data.block_id} not found")

    current_version = active_plan.plan_version or 1
    if data.plan_version < current_version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"STALE PLAN: You are attempting to act on plan V{data.plan_version}, "
                f"but latest authorized plan is V{current_version}. Please refresh and re-acknowledge."
            )
        )

    # Normalize event_type
    try:
        fe_type = FieldEventType(data.event_type)
    except Exception:
        fe_type = FieldEventType.ACK

    # Normalize loss_code
    fe_loss = None
    if data.loss_code:
        try:
            fe_loss = DelayLossCode(data.loss_code)
        except Exception:
            fe_loss = DelayLossCode.OTHER

    # ==========================================================================
    # 3. INTEGRATED JOINT HANDBACK GATE
    # ==========================================================================
    disclaimer = None
    if fe_type == FieldEventType.HANDBACK:
        # Find all tasks bundled within this block_id
        planned_tasks = db.query(PlannedTask).filter(PlannedTask.block_plan_id == data.block_id).all()
        bundled_task_ids = [pt.task_id for pt in planned_tasks]
        if data.task_id not in bundled_task_ids:
            bundled_task_ids.append(data.task_id)

        all_tasks = db.query(Task).filter(Task.id.in_(bundled_task_ids)).all()
        departments = {str(getattr(t.department, 'value', t.department)) for t in all_tasks}

        # Multi-department check: if bundled across >= 2 departments (ENG, TRD, SNT)
        if len(departments) >= 2:
            for t in all_tasks:
                if t.id == data.task_id:
                    continue  # current handback candidate
                # Verify that EVERY co-block task in this block has a COMPLETE FieldEvent
                complete_event = db.query(FieldEvent).filter(
                    FieldEvent.block_plan_id == data.block_id,
                    FieldEvent.task_id == t.id,
                    FieldEvent.event_type == FieldEventType.COMPLETE
                ).first()

                if not complete_event:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="Joint Handback Locked: Co-block partner tasks are not yet marked COMPLETE. All bundled departments must finish work before handback."
                    )

        disclaimer = (
            "The app records completion of prototype work package. "
            "Actual Railway line restoration and Line Clear cancellation follow authorized Railway operating rules."
        )

    actor = current_user.get("sub", "FLD_LEAD_01") if isinstance(current_user, dict) else "FLD_LEAD_01"

    # Append row directly into append-only FieldEvent table
    field_event = FieldEvent(
        block_plan_id=data.block_id,
        task_id=data.task_id,
        actor_id=str(actor),
        plan_version=current_version,
        event_type=fe_type,
        loss_code=fe_loss,
        remarks=data.remarks or f"Field lifecycle event: {fe_type.value}"
    )
    db.add(field_event)

    # Update task progress state
    task = db.query(Task).filter(Task.id == data.task_id).first()
    if task:
        if fe_type == FieldEventType.START:
            task.status = TaskStatus.EXECUTED
        elif fe_type == FieldEventType.COMPLETE:
            task.status = TaskStatus.EXECUTED
        elif fe_type == FieldEventType.HANDBACK:
            task.status = TaskStatus.CLOSED

    # Also log to legacy BlockEvent for backward compatibility
    block_event = BlockEvent(
        task_id=data.task_id,
        block_plan_id=data.block_id,
        block_section_id=task.block_section_id if task else 1,
        event_type=fe_type.value,
        event_time=datetime.utcnow(),
        actor_id=1,
        loss_code=data.loss_code,
        notes=data.remarks
    )
    db.add(block_event)

    # If delay loss code is recorded, log an audit trail
    if data.loss_code:
        audit = AuditLog(
            actor_id=str(actor),
            actor_role=current_user.get("role", "FIELD_EXEC_LEAD") if isinstance(current_user, dict) else "FIELD_EXEC_LEAD",
            division_id=current_user.get("division_id", "DLI") if isinstance(current_user, dict) else "DLI",
            action="LOSS_CODE_RECORDED",
            entity_type="FIELD_EVENT",
            entity_id=str(data.task_id),
            reason_code=str(data.loss_code),
            reason_text=f"Delay loss recorded: {data.loss_code}. Remarks: {data.remarks or 'None'}"
        )
        db.add(audit)

    db.commit()
    db.refresh(field_event)

    return {
        "success": True,
        "message": f"Field event {fe_type.value} recorded on plan V{current_version}.",
        "event_id": field_event.id,
        "plan_version": current_version,
        "safety_disclaimer": disclaimer
    }


# ==============================================================================
# 4. CO-BLOCK STATUS READOUT ENDPOINT (STEP 4)
# ==============================================================================

@router.get("/blocks/{block_id}/partner-status", response_model=List[PartnerTaskStatus])
def get_co_block_partner_status(block_id: int, db: Session = Depends(get_db)):
    """
    4. CO-BLOCK STATUS READOUT ENDPOINT:
    Returns real-time status of all tasks associated with this block_id:
    Allows the field client to render the partner status strip and verify completion.
    """
    planned_tasks = (
        db.query(PlannedTask, Task)
        .join(Task, PlannedTask.task_id == Task.id)
        .filter(PlannedTask.block_plan_id == block_id)
        .all()
    )

    out = []
    for pt, t in planned_tasks:
        # Query latest FieldEvent for this task on this block
        latest_fe = (
            db.query(FieldEvent)
            .filter(FieldEvent.block_plan_id == block_id, FieldEvent.task_id == t.id)
            .order_by(FieldEvent.id.desc())
            .first()
        )
        if latest_fe:
            event_name = latest_fe.event_type.value if hasattr(latest_fe.event_type, 'value') else str(latest_fe.event_type)
            status_str = event_name
            last_time = latest_fe.timestamp
        else:
            event_name = None
            status_str = str(t.status.value if hasattr(t.status, 'value') else t.status)
            last_time = t.created_at

        is_complete = (event_name in ["COMPLETE", "HANDBACK"] or status_str in ["CLOSED", "EXECUTED"])

        out.append({
            "department": str(t.department.value if hasattr(t.department, 'value') else t.department),
            "task_id": t.id,
            "task_code": t.task_code,
            "task_name": f"{t.work_type} (KM {t.km_from}–{t.km_to})",
            "status": status_str,
            "is_complete": is_complete,
            "last_event_type": event_name,
            "last_event_time": last_time
        })
    return out


# ==============================================================================
# LEGACY CONVENIENCE ENDPOINTS PRESERVED
# ==============================================================================

def record_field_lifecycle(task_id: int, event_type: str, db: Session):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    plan_id = 1
    pt = db.query(PlannedTask).filter(PlannedTask.task_id == task_id).first()
    if pt:
        plan_id = pt.block_plan_id

    active_plan = db.query(BlockPlan).filter(BlockPlan.id == plan_id).first()
    plan_ver = active_plan.plan_version if active_plan else 1

    try:
        fe_type = FieldEventType(event_type)
    except Exception:
        fe_type = FieldEventType.ACK

    fe = FieldEvent(
        block_plan_id=plan_id,
        task_id=task.id,
        actor_id="FLD_SUPERVISOR_01",
        plan_version=plan_ver,
        event_type=fe_type,
        remarks=f"Recorded via field quick action: {event_type}"
    )
    db.add(fe)
    db.commit()


@router.post("/tasks/{task_id}/acknowledge", response_model=ActionResponse)
def acknowledge_task(task_id: int, db: Session = Depends(get_db)):
    record_field_lifecycle(task_id, "ACK", db)
    return {"success": True, "message": f"Task {task_id} acknowledged by field supervisor"}


@router.post("/tasks/{task_id}/ready", response_model=ActionResponse)
def ready_task(task_id: int, db: Session = Depends(get_db)):
    record_field_lifecycle(task_id, "READY", db)
    return {"success": True, "message": f"Task {task_id} marked READY for block possession"}


@router.post("/tasks/{task_id}/start", response_model=ActionResponse)
def start_task(task_id: int, db: Session = Depends(get_db)):
    record_field_lifecycle(task_id, "START", db)
    return {"success": True, "message": f"Task {task_id} maintenance work commenced"}


@router.post("/tasks/{task_id}/complete", response_model=ActionResponse)
def complete_task(task_id: int, db: Session = Depends(get_db)):
    record_field_lifecycle(task_id, "COMPLETE", db)
    return {"success": True, "message": f"Task {task_id} work completed on site"}


@router.post("/tasks/{task_id}/handback", response_model=ActionResponse)
def handback_task(task_id: int, db: Session = Depends(get_db)):
    record_field_lifecycle(task_id, "HANDBACK", db)
    return {"success": True, "message": f"Task {task_id} track handed back to operating control"}
