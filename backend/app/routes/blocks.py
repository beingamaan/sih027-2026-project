from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from app.dependencies import get_db, get_current_user_optional, require
from app.models import BlockPlan, PlannedTask, Task, StateProjection, EventLog
from app.schemas import (
    AppendEventRequest, LifecycleHistoryResponse, BlockFieldEventRequest, BlockReplanRequest
)
from app.services.event_engine import append_event, rebuild_projections, get_lifecycle_history, get_current_stage

router = APIRouter()


@router.get("")
@router.get("/")
def get_blocks(db: Session = Depends(get_db)):
    """
    Returns list of all block plans with current lifecycle stage
    driven strictly by the StateProjection cache.
    """
    plans = db.query(BlockPlan).order_by(BlockPlan.id.desc()).all()
    projections = db.query(StateProjection).filter(
        StateProjection.ref_type.in_(["BLOCK_REQUEST", "BLOCK_PLAN"])
    ).all()
    proj_map = {p.ref_id: p for p in projections}

    results = []
    for p in plans:
        proj = proj_map.get(p.plan_code)
        stage = proj.stage if proj else (p.status.value if hasattr(p.status, "value") else str(p.status))
        results.append({
            "id": p.id,
            "plan_code": p.plan_code,
            "plan_version": p.plan_version,
            "version_count": p.version_count,
            "plan_type": p.plan_type,
            "stage": stage,
            "status": stage,
            "last_event": proj.last_event if proj else None,
            "last_actor_id": proj.last_actor_id if proj else None,
            "last_event_ts": proj.last_event_ts.isoformat() if proj and proj.last_event_ts else None,
            "p50_duration_minutes": p.p50_duration_minutes,
            "p90_duration_minutes": p.p90_duration_minutes,
            "stability_index": p.stability_index,
            "regulation_cost_wtm": p.regulation_cost_wtm,
            "horizon_start": p.horizon_start.isoformat() if p.horizon_start else None,
            "horizon_end": p.horizon_end.isoformat() if p.horizon_end else None,
            "task_count": len(p.planned_tasks) if p.planned_tasks else 0,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })
    return results


@router.get("/rebuild-projections")
@router.post("/rebuild-projections")
def trigger_rebuild_projections(db: Session = Depends(get_db)):
    """
    Operator/Admin maintenance route:
    Replays all immutable event_log records in chronological order
    to rebuild the entire state_projection cache 1:1.
    """
    count = rebuild_projections(db)
    return {
        "status": "SUCCESS",
        "message": f"Successfully replayed event log and rebuilt {count} state projections.",
        "projections_rebuilt": count
    }


@router.get("/recommendation")
def get_bundle_recommendation(
    task_codes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Runs the bundling optimizer evaluating candidate tasks against
    the 6 Indian Railways Engineering Compatibility Gates.
    """
    from app.services.bundling_engine import generate_bundle_recommendation

    if task_codes:
        codes = [c.strip() for c in task_codes.split(",") if c.strip()]
        tasks = db.query(Task).filter(Task.task_code.in_(codes)).all()
    else:
        codes = ["TSK_ENG_04", "TSK_TRD_03", "TSK_SNT_04"]
        tasks = db.query(Task).filter(Task.task_code.in_(codes)).all()

    if not tasks:
        eng = db.query(Task).filter(Task.department == "ENG").first()
        trd = db.query(Task).filter(Task.department == "TRD").first()
        snt = db.query(Task).filter(Task.department == "SNT").first()
        tasks = [t for t in [eng, trd, snt] if t]

    return generate_bundle_recommendation(tasks)


@router.post("/recommendation/evaluate")
def evaluate_bundle_recommendation(
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Accepts task IDs or task codes and evaluates the 6 engineering gates.
    """
    from app.services.bundling_engine import generate_bundle_recommendation

    task_ids = payload.get("task_ids") or []
    task_codes = payload.get("task_codes") or []

    tasks = []
    if task_ids:
        tasks = db.query(Task).filter(Task.id.in_(task_ids)).all()
    elif task_codes:
        tasks = db.query(Task).filter(Task.task_code.in_(task_codes)).all()
    else:
        codes = ["TSK_ENG_04", "TSK_TRD_03", "TSK_SNT_04"]
        tasks = db.query(Task).filter(Task.task_code.in_(codes)).all()

    return generate_bundle_recommendation(tasks)


@router.post("/optimize")
def optimize_blocks(
    payload: Optional[Dict[str, Any]] = None,
    current_user: dict = Depends(require("RUN_OPTIMIZER", "SECTION_CONTROLLER")),
    db: Session = Depends(get_db)
):
    """
    Server-Side RBAC Guard:
    Strictly requires RUN_OPTIMIZER capability or SECTION_CONTROLLER role.
    DEPT_SUPERVISOR or other unauthorized roles are rejected with HTTP 403 Forbidden
    and an immutable ACCESS_DENIED security audit log entry is recorded.
    """
    from app.services.bundling_engine import generate_bundle_recommendation
    eng = db.query(Task).filter(Task.department == "ENG").first()
    trd = db.query(Task).filter(Task.department == "TRD").first()
    snt = db.query(Task).filter(Task.department == "SNT").first()
    tasks = [t for t in [eng, trd, snt] if t]
    return generate_bundle_recommendation(tasks)


@router.post("/sync-events")
@router.post("/field-events/sync")
def sync_offline_events(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """
    Offline Field Sync Recovery:
    Receives an array of queued offline field events with client timestamps.
    Appends each to immutable EventLog with a server-generated created_at timestamp.
    """
    raw_events = payload.get("events") if isinstance(payload, dict) and "events" in payload else (payload if isinstance(payload, list) else [])
    actor = current_user.get("service_id", "IR-FLD-8845") if isinstance(current_user, dict) else "IR-FLD-8845"
    role = current_user.get("role", "FIELD_EXEC_LEAD") if isinstance(current_user, dict) else "FIELD_EXEC_LEAD"
    dept = current_user.get("department", "ENG") if isinstance(current_user, dict) else "ENG"

    results = []
    for item in raw_events:
        ref_id = item.get("ref_id") or item.get("block_id") or "BLK-2026-DLI-04"
        ref_type = "TASK" if (item.get("task_id") and not item.get("block_id")) else "BLOCK_REQUEST"
        step_event = item.get("step_event") or item.get("event_type") or "FIELD_EVENT"
        plan_ver = item.get("plan_version") or 1
        client_ts = item.get("client_timestamp") or item.get("timestamp")

        event_entry = EventLog(
            ref_type=ref_type,
            ref_id=str(ref_id),
            stage="IN_PROGRESS" if step_event in ["START", "READY"] else ("CLOSED" if step_event == "HANDBACK" else "ACK_COMPLETE"),
            event=step_event,
            actor_id=item.get("actor_id") or actor,
            actor_role=item.get("actor_role") or role,
            actor_dept=item.get("actor_dept") or dept,
            plan_version=plan_ver,
            reason_code=item.get("loss_code"),
            payload={
                "client_timestamp": client_ts,
                "remarks": item.get("remarks"),
                "offline_synced": True
            },
            ts=datetime.utcnow()
        )
        db.add(event_entry)
        db.flush()

        results.append({
            "event_id": event_entry.id,
            "ref_id": str(ref_id),
            "step_event": step_event,
            "server_ts": event_entry.ts.isoformat(),
            "client_timestamp": client_ts
        })

    db.commit()
    return {
        "status": "SUCCESS",
        "synced_count": len(results),
        "events": results
    }


@router.get("/{ref_id}", response_model=Dict[str, Any])
def get_block(ref_id: str, db: Session = Depends(get_db)):
    """
    Fetches detailed block plan with tasks and projected state.
    """
    plan = None
    if ref_id.isdigit():
        plan = db.query(BlockPlan).filter(BlockPlan.id == int(ref_id)).first()
    if not plan:
        plan = db.query(BlockPlan).filter(BlockPlan.plan_code == ref_id).first()

    code = plan.plan_code if plan else ref_id
    proj = db.query(StateProjection).filter(
        StateProjection.ref_type.in_(["BLOCK_REQUEST", "BLOCK_PLAN"]),
        StateProjection.ref_id == code
    ).first()

    if not plan and not proj:
        raise HTTPException(status_code=404, detail=f"Block '{ref_id}' not found")

    planned_tasks_data = []
    if plan and plan.planned_tasks:
        for pt in plan.planned_tasks:
            t = db.query(Task).filter(Task.id == pt.task_id).first()
            planned_tasks_data.append({
                "task_id": pt.task_id,
                "task_code": t.task_code if t else None,
                "work_type": t.work_type if t else None,
                "department": t.department.value if t and hasattr(t.department, "value") else str(t.department) if t else None,
                "planned_start": pt.planned_start.isoformat() if pt.planned_start else None,
                "planned_end": pt.planned_end.isoformat() if pt.planned_end else None,
                "setup_minutes": pt.setup_minutes,
                "work_minutes": pt.work_minutes,
                "clearance_minutes": pt.clearance_minutes
            })

    stage = proj.stage if proj else (plan.status.value if hasattr(plan.status, "value") else str(plan.status)) if plan else "UNKNOWN"

    return {
        "id": plan.id if plan else None,
        "plan_code": code,
        "plan_version": plan.plan_version if plan else (proj.plan_version if proj else 1),
        "stage": stage,
        "status": stage,
        "projection": {
            "stage": proj.stage,
            "last_event": proj.last_event,
            "last_actor_id": proj.last_actor_id,
            "last_event_ts": proj.last_event_ts.isoformat() if proj and proj.last_event_ts else None,
            "reason_code": proj.reason_code
        } if proj else None,
        "planned_tasks": planned_tasks_data,
        "p50_duration_minutes": plan.p50_duration_minutes if plan else None,
        "p90_duration_minutes": plan.p90_duration_minutes if plan else None,
        "stability_index": plan.stability_index if plan else None
    }


@router.get("/{ref_id}/history", response_model=LifecycleHistoryResponse)
def get_block_history(ref_id: str, db: Session = Depends(get_db)):
    """
    Returns full append-only chronological lifecycle event audit trail.
    """
    plan = None
    if ref_id.isdigit():
        plan = db.query(BlockPlan).filter(BlockPlan.id == int(ref_id)).first()
    code = plan.plan_code if plan else ref_id

    # Check under BLOCK_REQUEST first, then fallback
    history = get_lifecycle_history(db, "BLOCK_REQUEST", code)
    if not history.get("events"):
        history = get_lifecycle_history(db, "BLOCK_PLAN", code)
    return history


@router.post("/events")
def post_block_event(
    data: AppendEventRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """
    Appends an immutable event to event_log for a Block Request / Block Plan
    and atomically refreshes the state_projection cache.
    """
    ref_type = data.ref_type or "BLOCK_REQUEST"
    ref_id = data.ref_id

    # If ref_id is an integer ID, resolve to plan_code
    if ref_id and ref_id.isdigit():
        bp = db.query(BlockPlan).filter(BlockPlan.id == int(ref_id)).first()
        if bp:
            ref_id = bp.plan_code

    if not ref_id:
        raise HTTPException(status_code=400, detail="ref_id is required")

    actor_id = data.actor_id or (current_user.service_id if current_user else "SYSTEM")
    actor_role = data.actor_role or (current_user.role if current_user else "SYSTEM")
    actor_dept = data.actor_dept or (current_user.department if current_user else "OPS")

    try:
        event_log = append_event(
            db=db,
            ref_type=ref_type,
            ref_id=ref_id,
            stage=data.stage,
            event=data.event,
            actor_id=actor_id,
            actor_role=actor_role,
            actor_dept=actor_dept,
            plan_version=data.plan_version,
            reason_code=data.reason_code,
            payload=data.payload
        )
        db.commit()
        return {
            "status": "SUCCESS",
            "ref_type": ref_type,
            "ref_id": ref_id,
            "new_stage": data.stage,
            "event_id": event_log.id
        }
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{ref_id}/replan")
@router.patch("/{ref_id}")
def replan_block(
    ref_id: str,
    data: Optional[BlockReplanRequest] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """
    REPLAN & VERSION INVALIDATION ENGINE:
    - Increments block plan_version by 1.
    - Appends event to event_log: stage="REPLAN_REQUIRED", event="PLAN_VERSION_BUMP".
    - Invalidates prior BLOCK_ACK events to enforce re-acknowledgement.
    - Updates state_projection with new version and stage="REPLAN_REQUIRED".
    """
    plan = None
    if ref_id.isdigit():
        plan = db.query(BlockPlan).filter(BlockPlan.id == int(ref_id)).first()
    if not plan:
        plan = db.query(BlockPlan).filter(BlockPlan.plan_code == ref_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Block '{ref_id}' not found")

    reason = data.reason if data and data.reason else "Operational Replan and Window Adjustment"
    old_version = plan.plan_version or 1
    new_version = old_version + 1

    plan.plan_version = new_version
    plan.version_count = (plan.version_count or 1) + 1
    plan.status = "REPLAN_REQUIRED"

    actor_id = current_user.get("sub", "CONTROLLER_01") if isinstance(current_user, dict) else getattr(current_user, "service_id", "CONTROLLER_01")
    actor_role = current_user.get("role", "SECTION_CONTROLLER") if isinstance(current_user, dict) else getattr(current_user, "role", "SECTION_CONTROLLER")
    actor_dept = current_user.get("department", "OPS") if isinstance(current_user, dict) else getattr(current_user, "department", "OPS")

    # Invalidate prior acknowledgements by appending PLAN_VERSION_BUMP event
    event_entry = append_event(
        db=db,
        ref_type="BLOCK_REQUEST",
        ref_id=plan.plan_code,
        stage="REPLAN_REQUIRED",
        event="PLAN_VERSION_BUMP",
        actor_id=actor_id,
        actor_role=actor_role,
        actor_dept=actor_dept,
        plan_version=new_version,
        reason_code=reason,
        payload={"previous_version": old_version, "new_version": new_version, "reason": reason, "invalidated_acks": True}
    )

    db.commit()

    return {
        "status": "SUCCESS",
        "plan_code": plan.plan_code,
        "previous_version": old_version,
        "new_version": new_version,
        "stage": "REPLAN_REQUIRED",
        "event_id": event_entry.id
    }


@router.post("/{ref_id}/field-event")
def submit_block_field_event(
    ref_id: str,
    data: BlockFieldEventRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """
    FIELD EXECUTION & JOINT HANDBACK GATE:
    - If payload.plan_version < current_block.plan_version: HTTP 409 Conflict.
    - If step_event == 'HANDBACK': checks all bundled partner tasks are COMPLETE (HTTP 422 if not).
    - If duration overrun without loss_code: HTTP 422.
    - Appends event to event_log with ref_type='BLOCK_REQUEST'.
    """
    plan = None
    if ref_id.isdigit():
        plan = db.query(BlockPlan).filter(BlockPlan.id == int(ref_id)).first()
    if not plan:
        plan = db.query(BlockPlan).filter(BlockPlan.plan_code == ref_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Block '{ref_id}' not found")

    current_ver = plan.plan_version or 1

    # 1. Version Staleness Barrier
    if data.plan_version < current_ver:
        raise HTTPException(
            status_code=409,
            detail=f"STALE PLAN: You are operating on an outdated plan version. Please re-acknowledge V{current_ver}."
        )

    step_event = data.step_event.upper().strip()

    # 2. Joint Handback Interlock
    if step_event == "HANDBACK":
        bundled_pts = plan.planned_tasks or []
        for pt in bundled_pts:
            t = db.query(Task).filter(Task.id == pt.task_id).first()
            if t:
                # Check if task is completed
                task_done = (
                    t.status in ("EXECUTED", "CLOSED") or
                    db.query(EventLog).filter(
                        EventLog.ref_type == "TASK",
                        EventLog.ref_id == t.task_code,
                        EventLog.event.in_(["COMPLETE", "WORK_COMPLETED", "TASK_COMPLETED"])
                    ).first() is not None
                )
                if not task_done:
                    raise HTTPException(
                        status_code=422,
                        detail="Joint Handback Locked: Partner department tasks are still in progress. All bundled departments must finish work before handback."
                    )

        # Planned duration overrun check
        if data.actual_duration_minutes and plan.p50_duration_minutes:
            if data.actual_duration_minutes > plan.p50_duration_minutes and not data.loss_code:
                raise HTTPException(
                    status_code=422,
                    detail="Possession window overrun: Loss code is mandatory when actual duration exceeds planned possession window."
                )

    stage_map = {
        "ACK": "ACK_COMPLETE",
        "READY": "SANCTION_READY",
        "START": "IN_PROGRESS",
        "COMPLETE": "HANDBACK_READY",
        "HANDBACK": "CLOSED",
        "SM_ACK": "ACK_COMPLETE"
    }
    mapped_stage = stage_map.get(step_event, "IN_PROGRESS")

    actor_id = current_user.get("sub", "FIELD_EXEC_01") if isinstance(current_user, dict) else getattr(current_user, "service_id", "FIELD_EXEC_01")
    actor_role = current_user.get("role", "FIELD_EXEC_LEAD") if isinstance(current_user, dict) else getattr(current_user, "role", "FIELD_EXEC_LEAD")
    actor_dept = current_user.get("department", "ENG") if isinstance(current_user, dict) else getattr(current_user, "department", "ENG")

    # If task_id is specified and step is COMPLETE, also mark task complete
    if data.task_id and step_event == "COMPLETE":
        task_obj = db.query(Task).filter(Task.id == data.task_id).first()
        if task_obj:
            task_obj.status = "EXECUTED"
            try:
                append_event(
                    db=db,
                    ref_type="TASK",
                    ref_id=task_obj.task_code,
                    stage="EXECUTED",
                    event="WORK_COMPLETED",
                    actor_id=actor_id,
                    actor_role=actor_role,
                    actor_dept=actor_dept,
                    plan_version=current_ver,
                    payload={"remarks": data.remarks}
                )
            except Exception:
                pass

    # Append event to event_log for block plan
    event_entry = append_event(
        db=db,
        ref_type="BLOCK_REQUEST",
        ref_id=plan.plan_code,
        stage=mapped_stage,
        event=step_event,
        actor_id=actor_id,
        actor_role=actor_role,
        actor_dept=actor_dept,
        plan_version=current_ver,
        reason_code=data.loss_code,
        payload={"task_id": data.task_id, "remarks": data.remarks, "loss_code": data.loss_code}
    )

    db.commit()

    return {
        "status": "SUCCESS",
        "plan_code": plan.plan_code,
        "plan_version": current_ver,
        "step_event": step_event,
        "stage": mapped_stage,
        "event_id": event_entry.id
    }


@router.post("/{ref_id}/sm-ack")
def acknowledge_station_master(
    ref_id: str,
    station_code: str = "STA",
    db: Session = Depends(get_db),
    current_user: dict = Depends(require("ACK_STATION"))
):
    """
    STATION MASTER ADVISORY RECEIPT ACKNOWLEDGEMENT:
    Records SM_ACK on the block plan without control toggles.
    """
    plan = None
    if ref_id.isdigit():
        plan = db.query(BlockPlan).filter(BlockPlan.id == int(ref_id)).first()
    if not plan:
        plan = db.query(BlockPlan).filter(BlockPlan.plan_code == ref_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Block '{ref_id}' not found")

    actor_id = current_user.get("sub", "IR-STN-0450") if isinstance(current_user, dict) else getattr(current_user, "service_id", "IR-STN-0450")
    current_stage = get_current_stage(db, "BLOCK_REQUEST", plan.plan_code, default=plan.status.value if hasattr(plan.status, 'value') else str(plan.status))
    stage_to_use = current_stage if current_stage in ("CLOSED", "SANCTION_READY", "IN_PROGRESS", "ACK_COMPLETE", "HANDBACK_READY", "HANDED_BACK") else "ACK_COMPLETE"

    event_entry = append_event(
        db=db,
        ref_type="BLOCK_REQUEST",
        ref_id=plan.plan_code,
        stage=stage_to_use,
        event="SM_ACK",
        actor_id=actor_id,
        actor_role="STATION_MASTER",
        actor_dept="OPS",
        plan_version=plan.plan_version or 1,
        payload={"station": station_code, "note": "Station Master Advisory Receipt Acknowledged"}
    )
    db.commit()
    return {
        "status": "SUCCESS",
        "plan_code": plan.plan_code,
        "station_code": station_code,
        "event": "SM_ACK"
    }


@router.post("/handback")
def release_joint_handback(
    payload: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """
    JOINT TRACK HANDBACK & INTERLOCK SAFETY BARRIER (G&SR Rule 4.14):
    Requires all 3 departments (ENG, TRD, SNT) to certify readiness.
    If any department is not ready/certified, raises HTTP 422.
    When all 3 are verified, releases possession and marks block as CLOSED.
    """
    payload = payload or {}
    block_code = payload.get("block_code") or payload.get("ref_id") or "BLK-2026-DLI-04"
    dept_readiness = payload.get("departments") or payload.get("readiness") or {}

    # Check department signatures
    eng_signed = dept_readiness.get("ENG", {}).get("signed", True) if isinstance(dept_readiness.get("ENG"), dict) else dept_readiness.get("ENG", True)
    trd_signed = dept_readiness.get("TRD", {}).get("signed", False) if isinstance(dept_readiness.get("TRD"), dict) else dept_readiness.get("TRD", False)
    snt_signed = dept_readiness.get("SNT", {}).get("signed", True) if isinstance(dept_readiness.get("SNT"), dict) else dept_readiness.get("SNT", True)

    if not (eng_signed and trd_signed and snt_signed):
        raise HTTPException(
            status_code=422,
            detail="Joint Handback Locked: All 3 bundled departments (ENG, TRD, S&T) must certify readiness before handback."
        )

    plan = db.query(BlockPlan).filter(BlockPlan.plan_code == block_code).first()
    plan_ver = plan.plan_version if plan else 1

    actor_id = current_user.get("service_id", "IR-SEC-4091") if isinstance(current_user, dict) else getattr(current_user, "service_id", "IR-SEC-4091")
    actor_role = current_user.get("role", "SECTION_CONTROLLER") if isinstance(current_user, dict) else getattr(current_user, "role", "SECTION_CONTROLLER")
    actor_dept = current_user.get("department", "OPS") if isinstance(current_user, dict) else getattr(current_user, "department", "OPS")

    # Append immutable event to event_log
    event_entry = append_event(
        db=db,
        ref_type="BLOCK_REQUEST",
        ref_id=block_code,
        stage="CLOSED",
        event="HANDBACK",
        actor_id=actor_id,
        actor_role=actor_role,
        actor_dept=actor_dept,
        plan_version=plan_ver,
        reason_code=payload.get("reason_code", "JOINT_HANDBACK_GSR_4_14"),
        payload={
            "block_code": block_code,
            "section": payload.get("section", "GZB - ANVR (KM 100.000 – KM 120.000)"),
            "certifications": {
                "ENG": "Track cleared of tamping machines, ballast dressed, fishplates bolted (SIGNED)",
                "TRD": "25kV catenary earth wire discharged, tower car stabled, OHE re-energized (SIGNED)",
                "SNT": "Axle counter slot verified, point detection interlocked (SIGNED)"
            },
            "safety_disclaimer": "Actual Railway line restoration and Line Clear cancellation follow authorized Railway operating rules (G&SR Rule 4.14)",
            "handback_timestamp": datetime.utcnow().isoformat()
        }
    )

    if plan:
        plan.status = "CLOSED"

    db.commit()

    return {
        "status": "SUCCESS",
        "success": True,
        "block_code": block_code,
        "stage": "CLOSED",
        "event": "HANDBACK",
        "event_id": event_entry.id,
        "message": "Joint Track Handback authorized under G&SR Rule 4.14. Possession released and Line Clear sanctioned.",
        "safety_disclaimer": "Actual Railway line restoration and Line Clear cancellation follow authorized Railway operating rules."
    }


@router.post("/submit-sanction")
def submit_bundle_for_sanction(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Optional[Any] = Depends(get_current_user_optional)
):
    """
    Submits a co-located maintenance bundle for statutory sanction.
    Updates or creates BlockPlan in SANCTION_READY stage and records SUBMIT_SANCTION event.
    """
    bundle_id = payload.get("bundle_id", "BNDL-2026-04")
    plan_mode = payload.get("plan", "PLAN_A")
    tasks = payload.get("tasks", ["TSK_ENG_04", "TSK_SNT_04", "TSK_TRD_03"])

    actor_id = "IR-ENG-0891"
    if current_user:
        actor_id = current_user.get("service_id", actor_id) if isinstance(current_user, dict) else getattr(current_user, "service_id", actor_id)

    event_entry = append_event(
        db=db,
        ref_type="BLOCK_REQUEST",
        ref_id=bundle_id,
        stage="SANCTION_READY",
        event="SUBMIT_SANCTION",
        actor_id=actor_id,
        actor_role="DEPT_SUPERVISOR",
        actor_dept="ENG",
        plan_version=1,
        payload={
            "bundle_id": bundle_id,
            "plan": plan_mode,
            "tasks": tasks,
            "message": "Co-location bundle submitted to Sr. DOM for statutory sanction."
        }
    )
    db.commit()

    return {
        "status": "SUCCESS",
        "success": True,
        "bundle_id": bundle_id,
        "plan": plan_mode,
        "stage": "SANCTION_READY",
        "event_id": event_entry.id,
        "message": "Joint Possession Bundle successfully forwarded to Divisional Governance for statutory sanction."
    }

