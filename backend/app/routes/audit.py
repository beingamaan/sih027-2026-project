from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models import AuditLog
from app.schemas import AuditLogOut
from typing import List

router = APIRouter()

@router.get("", response_model=List[AuditLogOut])
@router.get("/", response_model=List[AuditLogOut])
@router.get("/logs", response_model=List[AuditLogOut])
def get_audit_logs(db: Session = Depends(get_db)):
    """Return immutable audit logs for all optimizer, controller, and field operations."""
    try:
        logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(50).all()
        return logs if logs is not None else []
    except Exception:
        return []
