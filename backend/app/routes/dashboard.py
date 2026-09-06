from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.dependencies import get_db
from app.models import Task, BlockPlan, BlockWindow

router = APIRouter()

@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    task_count = db.query(Task).count()
    plan_count = db.query(BlockPlan).count()
    return {
        "total_tasks": task_count,
        "total_plans": plan_count,
        "status": "Operational"
    }

@router.get("/tasks")
def get_dashboard_tasks(db: Session = Depends(get_db)):
    return db.query(Task).order_by(Task.id.desc()).limit(10).all()

@router.get("/plans")
def get_dashboard_plans(db: Session = Depends(get_db)):
    return db.query(BlockPlan).order_by(BlockPlan.id.desc()).limit(5).all()

@router.get("/block-windows")
def get_dashboard_windows(db: Session = Depends(get_db)):
    return db.query(BlockWindow).order_by(BlockWindow.id.desc()).limit(10).all()

# ── Pydantic model for creating a block window ──
class BlockWindowCreate(BaseModel):
    start_time: str
    end_time: str
    km_start: Optional[float] = 0
    km_end: Optional[float] = 58

@router.post("/block-windows")
def create_block_window(data: BlockWindowCreate, db: Session = Depends(get_db)):
    # Auto-generate a window code
    count = db.query(BlockWindow).count()
    window_code = f"BW-{count + 1:04d}"

    bw = BlockWindow(
        window_code=window_code,
        block_section_id=1,  # default section for prototype
        start_time=datetime.fromisoformat(data.start_time),
        end_time=datetime.fromisoformat(data.end_time),
        line="UP",
        block_type="NON_TRAFFIC",
        valid=1,
    )
    db.add(bw)
    db.commit()
    db.refresh(bw)
    return {"success": True, "message": f"Block window {window_code} created", "id": bw.id}

@router.get("/train-impact")
def get_train_impact(db: Session = Depends(get_db)):
    return {"impact_score": 125.5, "affected_trains": 12}

@router.get("/risks")
def get_dashboard_risks(db: Session = Depends(get_db)):
    return [{"risk_type": "TSR Extension", "severity": "HIGH", "task_id": 1}]
