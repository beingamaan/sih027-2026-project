from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models import Task, PlannedTask, BlockPlan
from app.schemas import TaskOut, LaneClassificationOut, ReadinessOut
from app.services.classification import classify_lane
from app.services.readiness import evaluate_readiness
from typing import List
from pydantic import BaseModel

router = APIRouter()

@router.get("", response_model=List[TaskOut])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).all()

@router.get("/field", response_model=List[TaskOut])
def get_field_tasks(db: Session = Depends(get_db)):
    """Return only tasks visible in field execution:
    1. Emergency tasks (lane == A_EMERGENCY) that are not completed
    2. All uncompleted tasks scheduled by any approved or pending plan (via PlannedTask table)
    """
    completed_statuses = ['WORK_COMPLETED', 'LINE_HANDED_BACK', 'CLOSED']
    
    # 1. Emergency tasks
    emergency_tasks = db.query(Task).filter(
        Task.lane == 'A_EMERGENCY',
        ~Task.status.in_(completed_statuses)
    ).all()
    emergency_ids = {t.id for t in emergency_tasks}
    
    # 2. Get task IDs from all active (APPROVED or PENDING) plans
    active_plans = db.query(BlockPlan).filter(
        BlockPlan.approval_status.in_(['APPROVED', 'PENDING'])
    ).all()
    
    planned_tasks = []
    if active_plans:
        active_plan_ids = [p.id for p in active_plans]
        planned_rows = db.query(PlannedTask.task_id).filter(
            PlannedTask.block_plan_id.in_(active_plan_ids)
        ).all()
        planned_task_ids = {row.task_id for row in planned_rows} - emergency_ids
        if planned_task_ids:
            planned_tasks = db.query(Task).filter(
                Task.id.in_(planned_task_ids),
                ~Task.status.in_(completed_statuses)
            ).all()
    
    return emergency_tasks + planned_tasks

@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

class TaskCreate(BaseModel):
    description: str
    estimated_duration_minutes: int
    lane: str
    department: str = "ENGINEERING"
    block_section_id: int = 1
    km_from: float = 10.0
    km_to: float = 12.0

@router.post("")
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    count = db.query(Task).count()
    task_code = f"TSK-NEW-{count + 1:04d}"
    
    new_task = Task(
        task_code=task_code,
        department=data.department,
        work_type=data.description,
        block_section_id=data.block_section_id,
        km_from=data.km_from,
        km_to=data.km_to,
        lane=data.lane,
        estimated_duration_minutes=data.estimated_duration_minutes,
        duration_buffer_minutes=15,
        status="PENDING"
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return {"message": f"Task {task_code} created successfully", "id": new_task.id}

@router.put("/{task_id}")
def update_task(task_id: int, db: Session = Depends(get_db)):
    return {"message": "Task update not fully implemented in prototype"}

@router.post("/{task_id}/classify", response_model=LaneClassificationOut)
def classify_task_lane(task_id: int, db: Session = Depends(get_db)):
    task = get_task(task_id, db)
    return classify_lane(task)

@router.get("/{task_id}/readiness", response_model=ReadinessOut)
def get_task_readiness(task_id: int, db: Session = Depends(get_db)):
    task = get_task(task_id, db)
    return evaluate_readiness(task)
