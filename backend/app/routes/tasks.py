from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models import Task
from app.schemas import TaskOut, LaneClassificationOut, ReadinessOut
from app.services.classification import classify_lane
from app.services.readiness import evaluate_readiness
from typing import List

router = APIRouter()

@router.get("", response_model=List[TaskOut])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).all()

@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

from pydantic import BaseModel

class TaskCreate(BaseModel):
    description: str
    estimated_duration_minutes: int
    lane: str

@router.post("")
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    count = db.query(Task).count()
    task_code = f"TSK-NEW-{count + 1:04d}"
    
    new_task = Task(
        task_code=task_code,
        department="ENGINEERING", # Default for now
        work_type=data.description,
        block_section_id=1,
        km_from=0,
        km_to=0,
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
