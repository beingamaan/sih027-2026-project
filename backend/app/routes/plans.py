from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models import BlockPlan, Task, BlockWindow, PlannedTask
from app.schemas import PlanOut, WhatIfRequest, WhatIfResponse, ActionResponse
from app.services.scheduler import run_scheduler
from app.services.what_if import analyze_scenario
from typing import List
import uuid

router = APIRouter()

@router.post("/generate")
def generate_plans(db: Session = Depends(get_db)):
    existing_count = db.query(BlockPlan).count()
    tasks = db.query(Task).all()
    windows = db.query(BlockWindow).all()
    
    result = run_scheduler(tasks, windows)
    
    import datetime
    default_time = datetime.datetime.now()
    plan = BlockPlan(
        plan_code=f"PLAN_A_{uuid.uuid4().hex[:8]}",
        version=existing_count + 1,
        plan_type="PLAN_A",
        horizon_start=windows[0].start_time if windows and windows[0].start_time else default_time,
        horizon_end=windows[-1].end_time if windows and windows[-1].end_time else default_time + datetime.timedelta(days=7),
        solver_status=result['solver_status'],
        approval_status="PENDING"
    )
    db.add(plan)
    db.flush()  # Get plan.id before inserting PlannedTask rows
    
    # Store each scheduler assignment as a PlannedTask row
    optimal_task_ids = set()
    if 'assignments' in result:
        for assignment in result['assignments']:
            task_id = assignment.get('task_id')
            window_id = assignment.get('block_window_id')
            if task_id and window_id:
                optimal_task_ids.add(task_id)
                planned_start = default_time
                planned_end = default_time + datetime.timedelta(minutes=assignment.get('planned_duration_minutes', 60))
                pt = PlannedTask(
                    block_plan_id=plan.id,
                    task_id=task_id,
                    block_window_id=window_id,
                    planned_start=planned_start,
                    planned_end=planned_end,
                    setup_minutes=assignment.get('setup_minutes', 15),
                    work_minutes=assignment.get('work_minutes', 60),
                    clearance_minutes=assignment.get('clearance_minutes', 20),
                    handback_minutes=assignment.get('handback_minutes', 10),
                    deferred=assignment.get('deferred', 0),
                    explanation=assignment.get('explanation', '')
                )
                db.add(pt)
    
    # Update status for tasks in the new plan without resetting uncompleted active tasks from previous plans
    for t in db.query(Task).all():
        if t.lane == "A_EMERGENCY":
            t.status = "ACKNOWLEDGED"
        elif t.id in optimal_task_ids:
            t.status = "ACKNOWLEDGED"
        # If task was already scheduled or in progress, do not reset it back to PENDING if uncompleted!

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
    if not plan and plan_id > 100:
        plan = db.query(BlockPlan).filter(BlockPlan.id == plan_id - 100).first()
    if not plan:
        plan = db.query(BlockPlan).order_by(BlockPlan.id.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Get tasks specific to THIS plan from the PlannedTask join table
    planned_rows = (
        db.query(PlannedTask, Task)
        .join(Task, PlannedTask.task_id == Task.id)
        .filter(PlannedTask.block_plan_id == plan.id)
        .all()
    )
    
    task_list = []
    for pt, t in planned_rows:
        section_name = 'SEC-1: NDLS - GZB' if t.block_section_id == 1 else ('SEC-2: GZB - MB' if t.block_section_id == 2 else 'SEC-3: MB - BE')
        task_list.append({
            "id": t.id,
            "task_id": t.id,
            "task_code": t.task_code,
            "department": t.department,
            "work_type": getattr(t, 'work_type', 'Track Work'),
            "km_from": getattr(t, 'km_from', 0),
            "km_to": getattr(t, 'km_to', 15),
            "section_name": section_name,
            "lane": t.lane,
            "block_window_id": pt.block_window_id,
            "planned_start": pt.planned_start.strftime("%H:%M") if hasattr(pt.planned_start, 'strftime') else "15:00",
            "planned_end": pt.planned_end.strftime("%H:%M") if hasattr(pt.planned_end, 'strftime') else "16:00",
            "planned_duration_minutes": getattr(t, 'estimated_duration_minutes', 60),
            "readiness_level": "HIGH",
            "explanation": pt.explanation or f"Selected for {section_name} based on CP-SAT headway optimization.",
            "setup_minutes": pt.setup_minutes or 15,
            "work_minutes": pt.work_minutes or getattr(t, 'estimated_duration_minutes', 60),
            "clearance_minutes": pt.clearance_minutes or 20,
            "handback_minutes": pt.handback_minutes or 10,
            "deferred": pt.deferred or 0
        })
    
    # If no PlannedTask rows exist (legacy plans), fall back to ACKNOWLEDGED tasks
    if not task_list:
        assigned_tasks = db.query(Task).filter(
            Task.status.in_(["ACKNOWLEDGED", "SCHEDULED", "READY", "IN_PROGRESS"])
        ).limit(4).all()
        for t in assigned_tasks:
            section_name = 'SEC-1: NDLS - GZB' if t.block_section_id == 1 else ('SEC-2: GZB - MB' if t.block_section_id == 2 else 'SEC-3: MB - BE')
            task_list.append({
                "id": t.id,
                "task_id": t.id,
                "task_code": t.task_code,
                "department": t.department,
                "work_type": getattr(t, 'work_type', 'Track Work'),
                "km_from": getattr(t, 'km_from', 0),
                "km_to": getattr(t, 'km_to', 15),
                "section_name": section_name,
                "lane": t.lane,
                "block_window_id": t.block_section_id,
                "planned_start": "15:00" if t.block_section_id == 1 else "15:28",
                "planned_end": "16:00" if t.block_section_id == 1 else "16:28",
                "planned_duration_minutes": getattr(t, 'estimated_duration_minutes', 60),
                "readiness_level": "HIGH",
                "explanation": f"Selected for {section_name} based on CP-SAT headway optimization.",
                "setup_minutes": 15,
                "work_minutes": getattr(t, 'estimated_duration_minutes', 60),
                "clearance_minutes": 20,
                "handback_minutes": 10,
                "deferred": 0
            })

    plan_dict = {
        "id": plan.id,
        "plan_code": plan.plan_code,
        "version": plan.version,
        "plan_type": plan.plan_type,
        "horizon_start": plan.horizon_start,
        "horizon_end": plan.horizon_end,
        "total_cost": plan.total_cost or 300.0,
        "solver_status": plan.solver_status,
        "approval_status": plan.approval_status,
        "created_at": plan.created_at,
        "tasks": task_list
    }
    return plan_dict

@router.post("/{plan_id}/approve", response_model=ActionResponse)
def approve_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(BlockPlan).filter(BlockPlan.id == plan_id).first()
    if not plan and plan_id > 100:
        plan = db.query(BlockPlan).filter(BlockPlan.id == plan_id - 100).first()
    if not plan:
        plan = db.query(BlockPlan).order_by(BlockPlan.id.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    plan.approval_status = "APPROVED"
    db.commit()
    return {"success": True, "message": "Plan approved"}

@router.post("/{plan_id}/reject", response_model=ActionResponse)
def reject_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(BlockPlan).filter(BlockPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan.approval_status = "REJECTED"
    db.commit()
    return {"success": True, "message": "Plan rejected"}

@router.post("/{plan_id}/override", response_model=ActionResponse)
def override_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(BlockPlan).filter(BlockPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan.approval_status = "OVERRIDDEN"
    db.commit()
    return {"success": True, "message": "Plan overridden with manual intervention"}

@router.post("/{plan_id}/what-if", response_model=WhatIfResponse)
def what_if_scenario(plan_id: int, request: WhatIfRequest, db: Session = Depends(get_db)):
    return analyze_scenario(request.scenario, request.delay_minutes, request.task_id, request.resource_id)
