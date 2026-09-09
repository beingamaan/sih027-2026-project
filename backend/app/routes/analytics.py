from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models import Task, BlockEvent, Resource

router = APIRouter()

@router.get("")
def get_analytics_overview(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    events = db.query(BlockEvent).all()
    total = len(tasks)
    completed = len([t for t in tasks if t.status in ('WORK_COMPLETED', 'LINE_HANDED_BACK', 'CLOSED')])
    completion_rate = round((completed / total * 100), 1) if total > 0 else 0.0

    # Group loss reasons
    loss_counts = {}
    for ev in events:
        if ev.loss_code:
            loss_counts[ev.loss_code] = loss_counts.get(ev.loss_code, 0) + 1

    return {
        "task_completion_rate": f"{completion_rate}%",
        "total_tasks": total,
        "completed_tasks": completed,
        "active_field_events_count": len(events),
        "loss_reason_breakdown": loss_counts,
        "resource_utilization": {
            "TAMPING_MACHINE_01": "88%",
            "OHE_TOWER_WAGON_01": "82%",
            "TRACK_GANGS_ACTIVE": "92%"
        },
        "average_block_handback_punctuality": "96.4%"
    }
