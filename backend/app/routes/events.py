from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models import (
    BlockEvent, Task, AuditLog, FieldEvent, FieldEventType, DelayLossCode, TaskStatus
)
from app.schemas import BlockEventCreate, FieldEventCreate, FieldEventOut, ActionResponse
from datetime import datetime
from typing import List

router = APIRouter()

@router.post("", response_model=ActionResponse)
def create_block_event(data: BlockEventCreate, db: Session = Depends(get_db)):
    """Unified field event dispatcher for recording lifecycle actions:
    ACKNOWLEDGE -> READY -> START -> COMPLETE -> HANDBACK with loss codes.
    Logs both backward-compatible BlockEvent and append-only FieldEvent.
    """
    task = None
    if data.task_id:
        task = db.query(Task).filter(Task.id == data.task_id).first()
        if task:
            try:
                task.status = TaskStatus(data.event_type)
            except Exception:
                pass

    event = BlockEvent(
        task_id=data.task_id,
        block_plan_id=data.block_plan_id or 1,
        block_section_id=data.block_section_id or (task.block_section_id if task else 1),
        event_type=data.event_type,
        event_time=datetime.utcnow(),
        actor_id=1,
        loss_code=data.loss_code,
        notes=data.notes,
        client_event_uuid=data.client_event_uuid
    )
    db.add(event)

    # Record append-only FieldEvent (State Machine 3)
    try:
        fe_type = FieldEventType(data.event_type)
    except Exception:
        fe_type = FieldEventType.ACK

    fe_loss = None
    if data.loss_code:
        try:
            fe_loss = DelayLossCode(data.loss_code)
        except Exception:
            fe_loss = DelayLossCode.OTHER

    field_event = FieldEvent(
        block_plan_id=data.block_plan_id or 1,
        task_id=data.task_id,
        actor_id="FLD_SUPERVISOR_01",
        plan_version=1,
        event_type=fe_type,
        loss_code=fe_loss,
        remarks=data.notes or f"Event {data.event_type} recorded from field interface"
    )
    db.add(field_event)

    # If delay loss code is recorded, log an audit trail
    if data.loss_code:
        audit = AuditLog(
            actor_id="FLD_SUPERVISOR_01",
            actor_role="FIELD_SUPERVISOR",
            division_id="DLI",
            action="LOSS_CODE_RECORDED",
            entity_type="FIELD_EVENT",
            entity_id=str(field_event.id if field_event.id else data.task_id or 1),
            reason_code=data.loss_code,
            reason_text=f"Delay loss recorded: {data.loss_code}. Notes: {data.notes or 'None'}"
        )
        db.add(audit)

    db.commit()
    return {"success": True, "message": f"Block event {data.event_type} recorded successfully."}


@router.get("/field-events", response_model=List[FieldEventOut])
def get_field_events(db: Session = Depends(get_db)):
    """Fetch append-only field events chronological log."""
    return db.query(FieldEvent).order_by(FieldEvent.timestamp.desc()).limit(100).all()


@router.post("/field-events", response_model=FieldEventOut)
def record_field_event(data: FieldEventCreate, db: Session = Depends(get_db)):
    """Direct ingestion for append-only FieldEvent (State Machine 3)."""
    fe = FieldEvent(
        block_plan_id=data.block_plan_id,
        task_id=data.task_id,
        actor_id=data.actor_id,
        plan_version=data.plan_version,
        event_type=data.event_type,
        loss_code=data.loss_code,
        remarks=data.remarks
    )
    db.add(fe)
    db.commit()
    db.refresh(fe)
    return fe
