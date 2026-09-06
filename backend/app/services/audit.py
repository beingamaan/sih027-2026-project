from datetime import datetime
from sqlalchemy.orm import Session
from app.models import AuditLog

def create_audit_record(db: Session, actor_id: int, role: str, division: str, action: str, plan_id: int, plan_version: int, reason_code: str = None, reason_text: str = None):
    audit = AuditLog(
        actor_id=actor_id,
        role=role,
        division=division,
        action=action,
        plan_id=plan_id,
        plan_version=plan_version,
        reason_code=reason_code,
        reason_text=reason_text,
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit
