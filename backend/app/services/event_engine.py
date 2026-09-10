from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models import EventLog, StateProjection, Task, BlockPlan

# ==============================================================================
# THREE INDEPENDENT STATE MACHINES TRANSITION RULES (PHASE 2 BLUEPRINT)
# ==============================================================================

TASK_TRANSITIONS = {
    None: {"REPORTED", "LANE_A_MANUAL", "VERIFIED", "ELIGIBLE"},
    "REPORTED": {"VERIFIED", "DEFERRED", "LANE_A_MANUAL", "CANCELLED"},
    "VERIFIED": {"ELIGIBLE", "DEFERRED", "LANE_A_MANUAL", "CANCELLED", "REPORTED"},
    "ELIGIBLE": {"SCHEDULED", "DEFERRED", "VERIFIED", "CANCELLED"},
    "SCHEDULED": {"IN_PROGRESS", "EXECUTED", "ELIGIBLE", "DEFERRED", "CANCELLED"},
    "IN_PROGRESS": {"EXECUTED", "CLOSED", "DEFERRED", "SCHEDULED"},
    "EXECUTED": {"CLOSED", "VERIFIED"},
    "DEFERRED": {"REPORTED", "VERIFIED", "ELIGIBLE", "CANCELLED"},
    "LANE_A_MANUAL": {"EXECUTED", "CLOSED", "REPORTED"},
    "CANCELLED": set(),
    "CLOSED": {"VERIFIED"}
}

BLOCK_REQUEST_TRANSITIONS = {
    None: {"DRAFT", "RECOMMENDED", "PENDING_APPROVAL", "APPROVED", "NOTIFIED"},
    "DRAFT": {"RECOMMENDED", "REPLAN_REQUIRED", "REJECTED"},
    "RECOMMENDED": {"PENDING_APPROVAL", "REPLAN_REQUIRED", "REJECTED", "DRAFT"},
    "PENDING_APPROVAL": {"APPROVED", "REJECTED", "RECOMMENDED", "REPLAN_REQUIRED"},
    "APPROVED": {"NOTIFIED", "ACK_COMPLETE", "SANCTION_READY", "IN_PROGRESS", "REJECTED", "REPLAN_REQUIRED"},
    "NOTIFIED": {"ACK_COMPLETE", "SANCTION_READY", "IN_PROGRESS", "REPLAN_REQUIRED"},
    "ACK_COMPLETE": {"SANCTION_READY", "IN_PROGRESS", "NOTIFIED", "CLOSED", "REPLAN_REQUIRED"},
    "SANCTION_READY": {"IN_PROGRESS", "HANDBACK_READY", "HANDED_BACK", "CLOSED", "REPLAN_REQUIRED", "SUPERSEDED"},
    "IN_PROGRESS": {"HANDBACK_READY", "HANDED_BACK", "CLOSED", "REPLAN_REQUIRED"},
    "HANDBACK_READY": {"HANDED_BACK", "CLOSED", "REPLAN_REQUIRED"},
    "HANDED_BACK": {"CLOSED", "REPLAN_REQUIRED"},
    "REJECTED": {"DRAFT", "RECOMMENDED"},
    "REPLAN_REQUIRED": {"DRAFT", "RECOMMENDED", "APPROVED", "NOTIFIED", "ACK_COMPLETE", "SANCTION_READY", "IN_PROGRESS", "CLOSED"},
    "SUPERSEDED": set(),
    "CLOSED": {"REPLAN_REQUIRED"}
}

COMPENSATION_EVENTS = {"RETURNED", "REJECTED", "REWORK_REQUIRED", "ROLLBACK"}


def validate_transition(ref_type: str, current_stage: Optional[str], new_stage: str, event: str, reason_code: Optional[str]):
    ref_type_upper = ref_type.upper()
    if ref_type_upper == "TASK":
        allowed = TASK_TRANSITIONS.get(current_stage, set())
        if current_stage is not None and new_stage not in allowed and new_stage != current_stage:
            raise ValueError(
                f"Illegal Task transition: Cannot transition from '{current_stage}' to '{new_stage}'. Allowed: {list(allowed)}"
            )
    elif ref_type_upper in ("BLOCK_REQUEST", "BLOCK_PLAN"):
        allowed = BLOCK_REQUEST_TRANSITIONS.get(current_stage, set())
        if current_stage is not None and new_stage not in allowed and new_stage != current_stage:
            raise ValueError(
                f"Illegal Block Request transition: Cannot transition from '{current_stage}' to '{new_stage}'. Allowed: {list(allowed)}"
            )
    else:
        raise ValueError(f"Unknown ref_type '{ref_type}'. Allowed: TASK, BLOCK_REQUEST")

    # Compensation Rule (T10): If event is a rollback/rejection or stage drops, reason_code is mandatory
    if event in COMPENSATION_EVENTS or new_stage in ("REJECTED", "REPLAN_REQUIRED"):
        if not reason_code:
            raise ValueError(f"Compensation event '{event}' requires a non-empty reason_code (Rule T10)")


def append_event(
    db: Session,
    ref_type: str,
    ref_id: str,
    stage: str,
    event: str,
    actor_id: str,
    actor_role: str,
    actor_dept: str,
    plan_version: int = 1,
    reason_code: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None
) -> EventLog:
    """
    Appends an immutable event to event_log and atomically updates state_projection.
    """
    ref_type_clean = ref_type.upper()
    ref_id_clean = str(ref_id).strip()
    stage_clean = stage.upper().strip()
    event_clean = event.upper().strip()

    # Query current projection stage
    current_proj = db.query(StateProjection).filter(
        StateProjection.ref_type == ref_type_clean,
        StateProjection.ref_id == ref_id_clean
    ).first()

    current_stage = current_proj.stage if current_proj else None

    # Validate transition
    validate_transition(ref_type_clean, current_stage, stage_clean, event_clean, reason_code)

    now = datetime.utcnow()

    # 1. Insert immutable EventLog entry
    event_entry = EventLog(
        ref_type=ref_type_clean,
        ref_id=ref_id_clean,
        stage=stage_clean,
        event=event_clean,
        actor_id=actor_id,
        actor_role=actor_role,
        actor_dept=actor_dept,
        plan_version=plan_version,
        reason_code=reason_code,
        payload=payload,
        ts=now
    )
    db.add(event_entry)

    # 2. Upsert StateProjection in same transaction
    if current_proj:
        current_proj.stage = stage_clean
        current_proj.plan_version = plan_version
        current_proj.last_event = event_clean
        current_proj.last_actor_id = actor_id
        current_proj.last_event_ts = now
        current_proj.reason_code = reason_code
    else:
        new_proj = StateProjection(
            ref_type=ref_type_clean,
            ref_id=ref_id_clean,
            stage=stage_clean,
            plan_version=plan_version,
            last_event=event_clean,
            last_actor_id=actor_id,
            last_event_ts=now,
            reason_code=reason_code
        )
        db.add(new_proj)

    # 3. Synchronize underlying model status column for backward-compatibility
    try:
        if ref_type_clean == "TASK":
            task = db.query(Task).filter((Task.task_code == ref_id_clean) | (Task.id == ref_id_clean)).first()
            if task:
                task.status = stage_clean
        elif ref_type_clean in ("BLOCK_REQUEST", "BLOCK_PLAN"):
            plan = db.query(BlockPlan).filter((BlockPlan.plan_code == ref_id_clean) | (BlockPlan.id == ref_id_clean)).first()
            if plan:
                plan.status = stage_clean
    except Exception as e:
        print(f"[event_engine sync warning]: {e}")

    db.commit()
    db.refresh(event_entry)
    return event_entry


def rebuild_projections(db: Session) -> int:
    """
    Truncates state_projection and replays all event_log records in chronological order.
    Ensures 100% reconstructibility of operational state cache.
    """
    # 1. Clear projections
    db.query(StateProjection).delete()

    # 2. Fetch all events ordered by time and id
    all_events = db.query(EventLog).order_by(EventLog.ts.asc(), EventLog.id.asc()).all()

    projections_map: Dict[str, StateProjection] = {}

    for ev in all_events:
        key = f"{ev.ref_type}:{ev.ref_id}"
        if key in projections_map:
            p = projections_map[key]
            p.stage = ev.stage
            p.plan_version = ev.plan_version
            p.last_event = ev.event
            p.last_actor_id = ev.actor_id
            p.last_event_ts = ev.ts
            p.reason_code = ev.reason_code
        else:
            p = StateProjection(
                ref_type=ev.ref_type,
                ref_id=ev.ref_id,
                stage=ev.stage,
                plan_version=ev.plan_version,
                last_event=ev.event,
                last_actor_id=ev.actor_id,
                last_event_ts=ev.ts,
                reason_code=ev.reason_code
            )
            projections_map[key] = p

    for proj in projections_map.values():
        db.add(proj)

    db.commit()
    print(f"[event_engine] Rebuilt {len(projections_map)} state projections from {len(all_events)} events.")
    return len(projections_map)


def get_lifecycle_history(db: Session, ref_type: str, ref_id: str) -> Dict[str, Any]:
    """
    Retrieves full chronological audit trail of all lifecycle events for a given entity.
    """
    ref_type_clean = ref_type.upper().strip()
    ref_id_clean = str(ref_id).strip()
    events = db.query(EventLog).filter(
        EventLog.ref_type == ref_type_clean,
        EventLog.ref_id == ref_id_clean
    ).order_by(EventLog.ts.asc(), EventLog.id.asc()).all()

    current_stage = get_current_stage(db, ref_type_clean, ref_id_clean, default=events[-1].stage if events else "UNKNOWN")

    return {
        "ref_type": ref_type_clean,
        "ref_id": ref_id_clean,
        "current_stage": current_stage,
        "total_events": len(events),
        "events": events
    }


def get_current_stage(db: Session, ref_type: str, ref_id: str, default: str = "REPORTED") -> str:
    """
    Helper to quickly fetch current projected stage for an entity.
    """
    proj = db.query(StateProjection).filter(
        StateProjection.ref_type == ref_type.upper().strip(),
        StateProjection.ref_id == str(ref_id).strip()
    ).first()
    return proj.stage if proj else default
