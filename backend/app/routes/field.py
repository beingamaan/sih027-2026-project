from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models import Task, BlockEvent
from app.schemas import EventSyncRequest, ActionResponse
from datetime import datetime

router = APIRouter()

def get_task(task_id: int, db: Session):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

def record_event(task_id: int, event_type: str, db: Session):
    task = get_task(task_id, db)
    task.status = event_type
    # Mocking event insertion, assumes block_plan_id=1, actor_id=1, block_section_id=task.block_section_id
    event = BlockEvent(
        block_plan_id=1,
        block_section_id=task.block_section_id,
        event_type=event_type,
        event_time=datetime.utcnow(),
        actor_id=1
    )
    db.add(event)
    db.commit()

@router.post("/tasks/{task_id}/acknowledge", response_model=ActionResponse)
def acknowledge_task(task_id: int, db: Session = Depends(get_db)):
    record_event(task_id, "ACKNOWLEDGED", db)
    return {"success": True, "message": f"Task {task_id} acknowledged"}

@router.post("/tasks/{task_id}/ready", response_model=ActionResponse)
def ready_task(task_id: int, db: Session = Depends(get_db)):
    record_event(task_id, "READY", db)
    return {"success": True, "message": f"Task {task_id} ready"}

@router.post("/tasks/{task_id}/start", response_model=ActionResponse)
def start_task(task_id: int, db: Session = Depends(get_db)):
    record_event(task_id, "WORK_STARTED", db)
    return {"success": True, "message": f"Task {task_id} started"}

@router.post("/tasks/{task_id}/complete", response_model=ActionResponse)
def complete_task(task_id: int, db: Session = Depends(get_db)):
    record_event(task_id, "WORK_COMPLETED", db)
    return {"success": True, "message": f"Task {task_id} completed"}

@router.post("/tasks/{task_id}/handback", response_model=ActionResponse)
def handback_task(task_id: int, db: Session = Depends(get_db)):
    record_event(task_id, "LINE_HANDED_BACK", db)
    return {"success": True, "message": f"Task {task_id} handed back"}

@router.post("/events/sync", response_model=ActionResponse)
def sync_events(request: EventSyncRequest, db: Session = Depends(get_db)):
    task = get_task(request.task_id, db)
    event = BlockEvent(
        block_plan_id=1,
        block_section_id=task.block_section_id,
        event_type=request.event_type,
        event_time=datetime.utcnow(),
        actor_id=1,
        loss_code=request.loss_code,
        notes=request.notes
    )
    db.add(event)
    db.commit()
    return {"success": True, "message": "Event synced successfully"}
