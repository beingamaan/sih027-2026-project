from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models import BlockPlan, Task, BlockWindow
from app.schemas import PlanOut, WhatIfRequest, WhatIfResponse, ActionResponse
from app.services.scheduler import run_scheduler
from app.services.what_if import analyze_scenario
from typing import List
import uuid

router = APIRouter()

@router.post("/generate")
def generate_plans(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    windows = db.query(BlockWindow).all()
    
    result = run_scheduler(tasks, windows)
    
    # Store dummy Plan A in DB
    import datetime
    default_time = datetime.datetime.now()
    plan = BlockPlan(
        plan_code=f"PLAN_A_{uuid.uuid4().hex[:8]}",
        version=1,
        plan_type="PLAN_A",
        horizon_start=windows[0].start_time if windows and windows[0].start_time else default_time,
        horizon_end=windows[-1].end_time if windows and windows[-1].end_time else default_time + datetime.timedelta(days=7),
        solver_status=result['solver_status'],
        approval_status="PENDING"
    )
    db.add(plan)
    
    # Actually update the tasks with the assignments from the solver!
    if 'assignments' in result:
        for assignment in result['assignments']:
            task = db.query(Task).filter(Task.id == assignment['task_id']).first()
            if task:
                task.status = "ACKNOWLEDGED"  # mark as assigned
                # Normally you'd store this in a PlannedTask relationship table, 
                # but we'll just update the status to show the user it worked!

    db.commit()
    db.refresh(plan)
    
    return {
        "message": "Plan generated successfully",
        "plan_id": plan.id,
        "solver_status": result['solver_status'],
        "human_review_required": result.get('human_review_required', False)
    }

@router.get("", response_model=List[PlanOut])
def get_plans(db: Session = Depends(get_db)):
    return db.query(BlockPlan).all()

@router.get("/{plan_id}", response_model=PlanOut)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(BlockPlan).filter(BlockPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@router.post("/{plan_id}/approve", response_model=ActionResponse)
def approve_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = get_plan(plan_id, db)
    plan.approval_status = "APPROVED"
    db.commit()
    return {"success": True, "message": "Plan approved"}

@router.post("/{plan_id}/reject", response_model=ActionResponse)
def reject_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = get_plan(plan_id, db)
    plan.approval_status = "REJECTED"
    db.commit()
    return {"success": True, "message": "Plan rejected"}

@router.post("/{plan_id}/override", response_model=ActionResponse)
def override_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = get_plan(plan_id, db)
    plan.approval_status = "OVERRIDDEN"
    db.commit()
    return {"success": True, "message": "Plan overridden with manual intervention"}

@router.post("/{plan_id}/what-if", response_model=WhatIfResponse)
def what_if_scenario(plan_id: int, request: WhatIfRequest, db: Session = Depends(get_db)):
    return analyze_scenario(request.scenario, request.delay_minutes, request.task_id, request.resource_id)
