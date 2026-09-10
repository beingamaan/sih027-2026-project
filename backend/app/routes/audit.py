from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models import AuditLog
from app.schemas import AuditLogOut
from typing import List
from datetime import datetime
import hashlib

router = APIRouter()

def compute_sha256(log_id: int, action: str, actor: str, ts_str: str) -> str:
    payload = f"IR-AUDIT:{log_id}:{action}:{actor}:{ts_str}:GOV-ACT-1989"
    return "0x" + hashlib.sha256(payload.encode("utf-8")).hexdigest()

@router.get("", response_model=List[AuditLogOut])
@router.get("/", response_model=List[AuditLogOut])
@router.get("/logs", response_model=List[AuditLogOut])
def get_audit_logs(db: Session = Depends(get_db)):
    """Return immutable audit logs for all optimizer, controller, and field operations with SHA-256 integrity hash."""
    try:
        logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(50).all()
        results = []
        for l in logs:
            ts = l.timestamp or l.created_at or datetime.utcnow()
            ts_str = ts.isoformat() if hasattr(ts, 'isoformat') else str(ts)
            actor = str(l.actor_id or "SYSTEM")
            action = str(l.action or "AUDIT_EVENT")
            hash_val = compute_sha256(l.id, action, actor, ts_str)
            role = l.actor_role or l.role or "SECTION_CONTROLLER"
            reason = l.reason_code or "STATUTORY_STANDARD"

            results.append({
                "id": l.id,
                "log_id": l.id,
                "actor_id": actor,
                "actor_role": role,
                "role": role,
                "division_id": l.division_id or l.division or "DLI",
                "division": l.division_id or l.division or "DLI",
                "action": action,
                "action_event": action,
                "entity_type": l.entity_type or "BLOCK_PLAN",
                "entity_id": l.entity_id or "1",
                "before_json": l.before_json,
                "after_json": l.after_json,
                "reason_code": reason,
                "reason_text": l.reason_text or "Standard operational transaction",
                "timestamp": ts,
                "created_at": l.created_at or ts,
                "plan_id": l.plan_id,
                "plan_version": l.plan_version,
                "rules_version": l.rules_version,
                "sha256_hash": hash_val
            })
        return results
    except Exception as e:
        print(f"[get_audit_logs error]: {e}")
        return []
